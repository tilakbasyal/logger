create extension if not exists "pgcrypto";


-- =========================================================
-- WORKSPACES
-- =========================================================

create table public.workspaces (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    owner_user_id uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- WORKSPACE MEMBERSHIPS
-- =========================================================

create table public.workspace_memberships (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'member'
        check (role in ('owner', 'member')),
    created_at timestamptz not null default now(),

    unique (workspace_id, user_id)
);


-- =========================================================
-- PEOPLE
-- =========================================================

create table public.people (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    name text not null,
    user_id uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- EMPLOYERS
-- =========================================================

create table public.employers (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    name text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (workspace_id, name)
);


-- =========================================================
-- WORK LOCATIONS
-- =========================================================

create table public.work_locations (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    employer_id uuid not null references public.employers(id) on delete cascade,
    name text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (employer_id, name)
);


-- =========================================================
-- PAYROLL SCHEDULES
-- =========================================================

create table public.payroll_schedules (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    employer_id uuid not null references public.employers(id) on delete cascade,

    type text not null
        check (type in ('calendar_month', 'monthly_cutoff')),

    cutoff_day integer
        check (cutoff_day between 1 and 31),

    effective_from date not null,
    effective_to date,

    created_at timestamptz not null default now(),

    check (
        (type = 'calendar_month' and cutoff_day is null)
        or
        (type = 'monthly_cutoff' and cutoff_day is not null)
    ),

    check (
        effective_to is null
        or effective_to >= effective_from
    )
);


-- =========================================================
-- WORK POLICIES
-- =========================================================

create table public.work_policies (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    person_id uuid not null references public.people(id) on delete cascade,

    period_type text not null
        check (period_type = 'calendar_month'),

    max_minutes integer not null
        check (max_minutes >= 0),

    effective_from date not null,
    effective_to date,

    created_at timestamptz not null default now(),

    check (
        effective_to is null
        or effective_to >= effective_from
    )
);


-- =========================================================
-- SHIFT PRESETS
-- =========================================================

create table public.shift_presets (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    person_id uuid not null references public.people(id) on delete cascade,
    work_location_id uuid not null references public.work_locations(id) on delete restrict,

    label text not null,
    start_time time not null,
    end_time time not null,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- SHIFTS
-- =========================================================

create table public.shifts (
    id uuid primary key default gen_random_uuid(),

    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    person_id uuid not null references public.people(id) on delete cascade,
    work_location_id uuid not null references public.work_locations(id) on delete restrict,

    start_at timestamptz not null,
    end_at timestamptz not null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    check (end_at > start_at)
);


-- =========================================================
-- INDEXES
-- =========================================================

create index workspace_memberships_user_id_idx
    on public.workspace_memberships(user_id);

create index workspace_memberships_workspace_id_idx
    on public.workspace_memberships(workspace_id);

create index people_workspace_id_idx
    on public.people(workspace_id);

create index people_user_id_idx
    on public.people(user_id);

create index employers_workspace_id_idx
    on public.employers(workspace_id);

create index work_locations_workspace_id_idx
    on public.work_locations(workspace_id);

create index work_locations_employer_id_idx
    on public.work_locations(employer_id);

create index payroll_schedules_workspace_id_idx
    on public.payroll_schedules(workspace_id);

create index payroll_schedules_employer_id_idx
    on public.payroll_schedules(employer_id);

create index work_policies_workspace_id_idx
    on public.work_policies(workspace_id);

create index work_policies_person_id_idx
    on public.work_policies(person_id);

create index shift_presets_workspace_id_idx
    on public.shift_presets(workspace_id);

create index shift_presets_person_id_idx
    on public.shift_presets(person_id);

create index shifts_workspace_id_idx
    on public.shifts(workspace_id);

create index shifts_person_id_start_at_idx
    on public.shifts(person_id, start_at);

create index shifts_work_location_id_start_at_idx
    on public.shifts(work_location_id, start_at);


-- =========================================================
-- RLS HELPER
-- =========================================================

create or replace function public.is_workspace_member(
    target_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.workspace_memberships wm
        where wm.workspace_id = target_workspace_id
          and wm.user_id = auth.uid()
    );
$$;


-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.people enable row level security;
alter table public.employers enable row level security;
alter table public.work_locations enable row level security;
alter table public.payroll_schedules enable row level security;
alter table public.work_policies enable row level security;
alter table public.shift_presets enable row level security;
alter table public.shifts enable row level security;


-- =========================================================
-- WORKSPACES
-- =========================================================

create policy "members can view their workspaces"
on public.workspaces
for select
to authenticated
using (
    public.is_workspace_member(id)
);


create policy "users can create workspaces"
on public.workspaces
for insert
to authenticated
with check (
    owner_user_id = auth.uid()
);


-- =========================================================
-- WORKSPACE MEMBERSHIPS
-- =========================================================

create policy "members can view workspace memberships"
on public.workspace_memberships
for select
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


create policy "workspace owners can add members"
on public.workspace_memberships
for insert
to authenticated
with check (
    exists (
        select 1
        from public.workspaces w
        where w.id = workspace_id
          and w.owner_user_id = auth.uid()
    )
);


-- =========================================================
-- PEOPLE
-- =========================================================

create policy "members can view people"
on public.people
for select
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


create policy "members can create people"
on public.people
for insert
to authenticated
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can update people"
on public.people
for update
to authenticated
using (
    public.is_workspace_member(workspace_id)
)
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can delete people"
on public.people
for delete
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


-- =========================================================
-- EMPLOYERS
-- =========================================================

create policy "members can view employers"
on public.employers
for select
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


create policy "members can create employers"
on public.employers
for insert
to authenticated
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can update employers"
on public.employers
for update
to authenticated
using (
    public.is_workspace_member(workspace_id)
)
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can delete employers"
on public.employers
for delete
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


-- =========================================================
-- WORK LOCATIONS
-- =========================================================

create policy "members can view work locations"
on public.work_locations
for select
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


create policy "members can create work locations"
on public.work_locations
for insert
to authenticated
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can update work locations"
on public.work_locations
for update
to authenticated
using (
    public.is_workspace_member(workspace_id)
)
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can delete work locations"
on public.work_locations
for delete
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


-- =========================================================
-- PAYROLL SCHEDULES
-- =========================================================

create policy "members can view payroll schedules"
on public.payroll_schedules
for select
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


create policy "members can create payroll schedules"
on public.payroll_schedules
for insert
to authenticated
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can update payroll schedules"
on public.payroll_schedules
for update
to authenticated
using (
    public.is_workspace_member(workspace_id)
)
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can delete payroll schedules"
on public.payroll_schedules
for delete
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


-- =========================================================
-- WORK POLICIES
-- =========================================================

create policy "members can view work policies"
on public.work_policies
for select
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


create policy "members can create work policies"
on public.work_policies
for insert
to authenticated
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can update work policies"
on public.work_policies
for update
to authenticated
using (
    public.is_workspace_member(workspace_id)
)
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can delete work policies"
on public.work_policies
for delete
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


-- =========================================================
-- SHIFT PRESETS
-- =========================================================

create policy "members can view shift presets"
on public.shift_presets
for select
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


create policy "members can create shift presets"
on public.shift_presets
for insert
to authenticated
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can update shift presets"
on public.shift_presets
for update
to authenticated
using (
    public.is_workspace_member(workspace_id)
)
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can delete shift presets"
on public.shift_presets
for delete
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


-- =========================================================
-- SHIFTS
-- =========================================================

create policy "members can view shifts"
on public.shifts
for select
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


create policy "members can create shifts"
on public.shifts
for insert
to authenticated
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can update shifts"
on public.shifts
for update
to authenticated
using (
    public.is_workspace_member(workspace_id)
)
with check (
    public.is_workspace_member(workspace_id)
);


create policy "members can delete shifts"
on public.shifts
for delete
to authenticated
using (
    public.is_workspace_member(workspace_id)
);