create table public.workspace_member_permissions (
    id uuid primary key default gen_random_uuid(),

    workspace_id uuid not null
        references public.workspaces(id) on delete cascade,

    user_id uuid not null
        references auth.users(id) on delete cascade,

    permission text not null
        check (
            permission in (
                'manage_own_hours',
                'manage_other_people_hours',
                'manage_people',
                'manage_workspace'
            )
        ),

    created_at timestamptz not null default now(),

    unique (workspace_id, user_id, permission)
);


create index workspace_member_permissions_workspace_user_idx
    on public.workspace_member_permissions(workspace_id, user_id);


alter table public.workspace_member_permissions enable row level security;

create or replace function public.has_workspace_permission(
    target_workspace_id uuid,
    target_permission text
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
          and (
              wm.role = 'owner'
              or exists (
                  select 1
                  from public.workspace_member_permissions p
                  where p.workspace_id = target_workspace_id
                    and p.user_id = auth.uid()
                    and p.permission = target_permission
              )
          )
    );
$$;

revoke execute
on function public.has_workspace_permission(uuid, text)
from public;

grant execute
on function public.has_workspace_permission(uuid, text)
to authenticated;

create policy "members can view workspace permissions"
on public.workspace_member_permissions
for select
to authenticated
using (
    public.is_workspace_member(workspace_id)
);


create policy "owners can create workspace permissions"
on public.workspace_member_permissions
for insert
to authenticated
with check (
    exists (
        select 1
        from public.workspace_memberships wm
        where wm.workspace_id = workspace_id
          and wm.user_id = auth.uid()
          and wm.role = 'owner'
    )
);


create policy "owners can delete workspace permissions"
on public.workspace_member_permissions
for delete
to authenticated
using (
    exists (
        select 1
        from public.workspace_memberships wm
        where wm.workspace_id = workspace_id
          and wm.user_id = auth.uid()
          and wm.role = 'owner'
    )
);

grant select, insert, delete
on public.workspace_member_permissions
to authenticated;