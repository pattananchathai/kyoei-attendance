-- รันใน Supabase SQL Editor ครั้งแรก ตารางนี้ใช้ผ่าน API เซิร์ฟเวอร์เท่านั้น
begin;
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null unique check (line_user_id ~ '^U[0-9a-f]{32}$'),
  first_name text not null check (length(trim(first_name)) between 1 and 100),
  last_name text not null check (length(trim(last_name)) between 1 and 100),
  role text not null default 'employee' check (role in ('employee','admin')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);
create table public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null references public.employees(line_user_id) on delete cascade,
  check_type text not null check (check_type in ('CHECK_IN','CHECK_OUT')),
  timestamp timestamptz not null default now(),
  work_date date not null default ((now() at time zone 'Asia/Bangkok')::date),
  status_label text not null check (status_label in ('เข้างานปกติ','เข้าสาย','เลิกงานปกติ','เลิกงาน OT')),
  location_name text not null check (location_name = 'บริษัท เคียวเอิ พรีซิชั่น จำกัด'),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  gps_accuracy double precision not null check (gps_accuracy >= 0),
  unique (line_user_id, work_date, check_type),
  check ((check_type = 'CHECK_IN' and status_label in ('เข้างานปกติ','เข้าสาย')) or
    (check_type = 'CHECK_OUT' and status_label in ('เลิกงานปกติ','เลิกงาน OT')))
);
create index attendance_date_idx on public.attendance_logs(work_date desc, timestamp desc);
create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null references public.employees(line_user_id) on delete cascade,
  request_type text not null check (request_type in ('ลางงาน','ขอ OT')),
  leave_type text check (leave_type in ('ลาป่วย','ลาพักร้อน','ลากิจ')),
  leave_reason text,
  ot_reason text,
  request_date date not null,
  is_approved boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (line_user_id, request_date, request_type),
  check ((request_type = 'ลางงาน' and leave_type is not null and leave_reason is not null and length(trim(leave_reason)) between 1 and 2000 and ot_reason is null)
    or (request_type = 'ขอ OT' and leave_type is null and leave_reason is null and ot_reason is not null and length(trim(ot_reason)) between 1 and 2000)),
  check ((is_approved and approved_at is not null) or (not is_approved and approved_at is null))
);
create index requests_date_idx on public.leave_requests(request_date desc);
-- บันทึกงานส่ง LINE ใน transaction เดียวกับการลงเวลา ป้องกันข้อมูลหายเมื่อ LINE ล่ม
create table public.line_notifications (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid not null unique references public.attendance_logs(id) on delete cascade,
  line_user_id text not null references public.employees(line_user_id) on delete cascade,
  details jsonb not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts integer not null default 0,
  locked_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index notifications_pending_idx on public.line_notifications(status, created_at);

alter table public.employees enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.leave_requests enable row level security;
alter table public.line_notifications enable row level security;
revoke all on public.employees, public.attendance_logs, public.leave_requests, public.line_notifications from anon, authenticated;
grant all on public.employees, public.attendance_logs, public.leave_requests, public.line_notifications to service_role;

create function public.record_attendance(p_user text, p_type text, p_lat double precision, p_lon double precision, p_accuracy double precision)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  emp public.employees;
  entry public.attendance_logs;
  v_now timestamptz := clock_timestamp();
  v_date date := (v_now at time zone 'Asia/Bangkok')::date;
  v_time time := (v_now at time zone 'Asia/Bangkok')::time;
  label text;
begin
  -- ล็อกรายพนักงาน ทำให้คำขอพร้อมกันและการลบพนักงานไม่ชนกัน
  select * into emp from public.employees where line_user_id = p_user for update;
  if emp.id is null or emp.status <> 'active' then raise exception 'EMPLOYEE_INACTIVE'; end if;
  if p_type not in ('CHECK_IN','CHECK_OUT') then raise exception 'INVALID_TYPE'; end if;
  if exists (select 1 from public.attendance_logs where line_user_id = p_user and work_date = v_date and check_type = p_type) then raise exception 'ALREADY_RECORDED'; end if;
  if p_type = 'CHECK_IN' then
    if v_time < time '07:00' then raise exception 'TOO_EARLY'; end if;
    label := case when v_time <= time '08:30' then 'เข้างานปกติ' else 'เข้าสาย' end;
  else
    if v_time < time '17:30' then raise exception 'TOO_EARLY'; end if;
    if not exists (select 1 from public.attendance_logs where line_user_id = p_user and work_date = v_date and check_type = 'CHECK_IN') then raise exception 'CHECK_IN_REQUIRED'; end if;
    label := case when v_time <= time '21:30' then 'เลิกงานปกติ' else 'เลิกงาน OT' end;
  end if;
  insert into public.attendance_logs(line_user_id,check_type,timestamp,work_date,status_label,location_name,latitude,longitude,gps_accuracy)
    values (p_user,p_type,v_now,v_date,label,'บริษัท เคียวเอิ พรีซิชั่น จำกัด',p_lat,p_lon,p_accuracy) returning * into entry;
  insert into public.line_notifications(attendance_id,line_user_id,details)
    values(entry.id,p_user,to_jsonb(entry) || jsonb_build_object('first_name',emp.first_name,'last_name',emp.last_name));
  return to_jsonb(entry);
end $$;

create function public.claim_notification(p_id uuid)
returns setof public.line_notifications language sql security invoker set search_path = public as $$
  update public.line_notifications set status = 'sending', attempts = attempts + 1, locked_until = now() + interval '1 minute'
  where id = p_id and status <> 'sent' and attempts < 10 and created_at > now() - interval '23 hours'
    and (locked_until is null or locked_until < now()) returning *;
$$;
revoke all on function public.record_attendance(text,text,double precision,double precision,double precision) from public, anon, authenticated;
revoke all on function public.claim_notification(uuid) from public, anon, authenticated;
grant execute on function public.record_attendance(text,text,double precision,double precision,double precision) to service_role;
grant execute on function public.claim_notification(uuid) to service_role;
commit;
