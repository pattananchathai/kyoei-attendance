begin;

-- แยกสถานะรอพิจารณา อนุมัติ และไม่อนุมัติให้บันทึกได้ชัดเจน
alter table public.leave_requests
  add column if not exists approval_status text not null default 'pending',
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_by uuid references public.employees(id) on delete set null;

-- ย้ายสถานะอนุมัติเดิมให้ตรงกับคอลัมน์ใหม่ ส่วนคำร้องที่ยังไม่อนุมัติเป็นรายการรอพิจารณา
update public.leave_requests
set approval_status = case when is_approved then 'approved' else 'pending' end,
    rejected_at = null,
    rejected_by = null;

alter table public.leave_requests
  drop constraint if exists leave_requests_approval_status_check,
  drop constraint if exists leave_requests_decision_consistency_check,
  add constraint leave_requests_approval_status_check
    check (approval_status in ('pending', 'approved', 'rejected')),
  add constraint leave_requests_decision_consistency_check
    check (
      (approval_status = 'approved' and is_approved and approved_at is not null and rejected_at is null)
      or (approval_status = 'pending' and not is_approved and approved_at is null and rejected_at is null)
      or (approval_status = 'rejected' and not is_approved and approved_at is null and rejected_at is not null)
    );

create index if not exists leave_requests_decision_date_idx
  on public.leave_requests(approval_status, request_date desc);

commit;
