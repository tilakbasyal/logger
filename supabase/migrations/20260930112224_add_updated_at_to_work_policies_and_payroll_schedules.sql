alter table public.work_policies
add column updated_at timestamptz not null default now();

alter table public.payroll_schedules
add column updated_at timestamptz not null default now();