create table public.workspace_invitations (
    id uuid primary key default gen_random_uuid(),

    workspace_id uuid not null
        references public.workspaces(id) on delete cascade,

    person_id uuid not null
        references public.people(id) on delete cascade,

    invited_email text not null,

    token_hash text not null,

    invited_by_user_id uuid not null
        references auth.users(id) on delete restrict,

    expires_at timestamptz not null,

    accepted_at timestamptz,

    created_at timestamptz not null default now()
);


create index workspace_invitations_workspace_id_idx
    on public.workspace_invitations(workspace_id);

create index workspace_invitations_person_id_idx
    on public.workspace_invitations(person_id);

create index workspace_invitations_token_hash_idx
    on public.workspace_invitations(token_hash);


alter table public.workspace_invitations enable row level security;


create policy "workspace owners can view invitations"
on public.workspace_invitations
for select
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


create policy "workspace owners can create invitations"
on public.workspace_invitations
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
    and invited_by_user_id = auth.uid()
);


create policy "workspace owners can update invitations"
on public.workspace_invitations
for update
to authenticated
using (
    exists (
        select 1
        from public.workspace_memberships wm
        where wm.workspace_id = workspace_id
          and wm.user_id = auth.uid()
          and wm.role = 'owner'
    )
)
with check (
    exists (
        select 1
        from public.workspace_memberships wm
        where wm.workspace_id = workspace_id
          and wm.user_id = auth.uid()
          and wm.role = 'owner'
    )
);


create policy "workspace owners can delete invitations"
on public.workspace_invitations
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


grant select, insert, update, delete
on public.workspace_invitations
to authenticated;