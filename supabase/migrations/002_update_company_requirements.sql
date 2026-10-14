-- ปรับข้อมูลเดิมให้ตรงกับชื่อบริษัท สถานะ และประเภทคำร้องล่าสุด
begin;

-- รองรับฐานข้อมูลเดิมที่สร้างไว้ก่อนมีคอลัมน์สำหรับประวัติและคิวส่ง LINE
alter table public.employees
  add column if not exists status text not null default 'active',
  add column if not exists created_at timestamptz not null default now();

alter table public.employees
  alter column role set default 'employee',
  alter column status set default 'active',
  drop constraint if exists employees_line_user_id_check,
  drop constraint if exists employees_first_name_check,
  drop constraint if exists employees_last_name_check,
  drop constraint if exists employees_role_check,
  drop constraint if exists employees_status_check;

alter table public.employees
  add constraint employees_line_user_id_check check (line_user_id ~ '^U[0-9a-f]{32}$'),
  add constraint employees_first_name_check check (length(trim(first_name)) between 1 and 100),
  add constraint employees_last_name_check check (length(trim(last_name)) between 1 and 100),
  add constraint employees_role_check check (role in ('employee','admin')),
  add constraint employees_status_check check (status in ('active','inactive'));

alter table public.attendance_logs
  add column if not exists work_date date,
  add column if not exists gps_accuracy double precision;

update public.attendance_logs
set work_date = coalesce(work_date, (timestamp at time zone 'Asia/Bangkok')::date),
    gps_accuracy = coalesce(gps_accuracy, 0)
where work_date is null or gps_accuracy is null;

alter table public.attendance_logs
  alter column work_date set default ((now() at time zone 'Asia/Bangkok')::date),
  alter column work_date set not null,
  alter column gps_accuracy set not null;

alter table public.leave_requests
  add column if not exists request_date date,
  add column if not exists approved_by uuid references public.employees(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

update public.leave_requests
set request_date = coalesce(request_date, (created_at at time zone 'Asia/Bangkok')::date);

alter table public.leave_requests
  alter column request_date set not null;

create table if not exists public.line_notifications (
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

create index if not exists attendance_date_idx
  on public.attendance_logs(work_date desc, timestamp desc);
create index if not exists requests_date_idx
  on public.leave_requests(request_date desc);
create index if not exists notifications_pending_idx
  on public.line_notifications(status, created_at);
create unique index if not exists attendance_one_action_per_day_idx
  on public.attendance_logs(line_user_id, work_date, check_type);
create unique index if not exists request_one_type_per_day_idx
  on public.leave_requests(line_user_id, request_date, request_type);

alter table public.attendance_logs drop constraint if exists attendance_logs_status_label_check;
alter table public.attendance_logs drop constraint if exists attendance_logs_location_name_check;
alter table public.attendance_logs drop constraint if exists attendance_logs_check;
alter table public.leave_requests drop constraint if exists leave_requests_request_type_check;
alter table public.leave_requests drop constraint if exists leave_requests_check;

update public.attendance_logs
set status_label = case status_label
  when 'เข้างานปกติ' then 'เข้างาน'
  when 'เลิกงานปกติ' then 'เลิกงาน'
  else status_label
end,
location_name = 'บริษัท เคียวเออิ พรีซิชั่น จำกัด'
where status_label in ('เข้างานปกติ','เลิกงานปกติ')
   or location_name is distinct from 'บริษัท เคียวเออิ พรีซิชั่น จำกัด';

update public.leave_requests
set request_type = 'ลางาน'
where request_type = 'ลางงาน';

alter table public.attendance_logs
  add constraint attendance_logs_status_label_check
    check (status_label in ('เข้างาน','เข้าสาย','เลิกงาน','เลิกงาน OT')),
  add constraint attendance_logs_location_name_check
    check (location_name = 'บริษัท เคียวเออิ พรีซิชั่น จำกัด'),
  add constraint attendance_logs_check
    check ((check_type = 'CHECK_IN' and status_label in ('เข้างาน','เข้าสาย')) or
      (check_type = 'CHECK_OUT' and status_label in ('เลิกงาน','เลิกงาน OT')));

alter table public.leave_requests
  add constraint leave_requests_request_type_check
    check (request_type in ('ลางาน','ขอ OT')),
  add constraint leave_requests_check
    check ((request_type = 'ลางาน' and leave_type is not null and leave_reason is not null
      and length(trim(leave_reason)) between 1 and 2000 and ot_reason is null)
      or (request_type = 'ขอ OT' and leave_type is null and leave_reason is null
      and ot_reason is not null and length(trim(ot_reason)) between 1 and 2000));

create or replace function public.record_attendance(
  p_user text,
  p_type text,
  p_lat double precision,
  p_lon double precision,
  p_accuracy double precision
)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  emp public.employees;
  entry public.attendance_logs;
  v_now timestamptz := clock_timestamp();
  v_date date := (v_now at time zone 'Asia/Bangkok')::date;
  v_time time := (v_now at time zone 'Asia/Bangkok')::time;
  label text;
begin
  select * into emp from public.employees where line_user_id = p_user for update;
  if emp.id is null or emp.status <> 'active' then raise exception 'EMPLOYEE_INACTIVE'; end if;
  if p_type not in ('CHECK_IN','CHECK_OUT') then raise exception 'INVALID_TYPE'; end if;
  if exists (
    select 1 from public.attendance_logs
    where line_user_id = p_user and work_date = v_date and check_type = p_type
  ) then raise exception 'ALREADY_RECORDED'; end if;

  if p_type = 'CHECK_IN' then
    if v_time < time '07:00' then raise exception 'TOO_EARLY'; end if;
    label := case when v_time <= time '08:30' then 'เข้างาน' else 'เข้าสาย' end;
  else
    if v_time < time '17:30' then raise exception 'TOO_EARLY'; end if;
    if not exists (
      select 1 from public.attendance_logs
      where line_user_id = p_user and work_date = v_date and check_type = 'CHECK_IN'
    ) then raise exception 'CHECK_IN_REQUIRED'; end if;
    label := case when v_time <= time '21:30' then 'เลิกงาน' else 'เลิกงาน OT' end;
  end if;

  insert into public.attendance_logs(
    line_user_id, check_type, timestamp, work_date, status_label,
    location_name, latitude, longitude, gps_accuracy
  ) values (
    p_user, p_type, v_now, v_date, label,
    'บริษัท เคียวเออิ พรีซิชั่น จำกัด', p_lat, p_lon, p_accuracy
  ) returning * into entry;

  insert into public.line_notifications(attendance_id,line_user_id,details)
  values(entry.id,p_user,to_jsonb(entry) || jsonb_build_object(
    'first_name',emp.first_name,'last_name',emp.last_name
  ));
  return to_jsonb(entry);
end $$;

revoke all on function public.record_attendance(text,text,double precision,double precision,double precision)
from public, anon, authenticated;
grant execute on function public.record_attendance(text,text,double precision,double precision,double precision)
to service_role;

create or replace function public.claim_notification(p_id uuid)
returns setof public.line_notifications language sql security invoker set search_path = public as $$
  update public.line_notifications
  set status = 'sending', attempts = attempts + 1, locked_until = now() + interval '1 minute'
  where id = p_id and status <> 'sent' and attempts < 10
    and created_at > now() - interval '23 hours'
    and (locked_until is null or locked_until < now())
  returning *;
$$;

alter table public.employees enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.leave_requests enable row level security;
alter table public.line_notifications enable row level security;

revoke all on public.employees, public.attendance_logs, public.leave_requests,
  public.line_notifications from anon, authenticated;
grant all on public.employees, public.attendance_logs, public.leave_requests,
  public.line_notifications to service_role;

revoke all on function public.claim_notification(uuid) from public, anon, authenticated;
grant execute on function public.claim_notification(uuid) to service_role;

-- สั่งให้ PostgREST อ่านตาราง ฟังก์ชัน และสิทธิ์ล่าสุดทันที
notify pgrst, 'reload schema';

commit;
