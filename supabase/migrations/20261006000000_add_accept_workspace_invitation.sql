create or replace function public.accept_workspace_invitation(
    invitation_token text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    current_user_id uuid;
    current_user_email text;

    invitation_record public.workspace_invitations%rowtype;
    existing_membership_id uuid;
begin
    current_user_id := auth.uid();
    current_user_email := auth.jwt() ->> 'email';

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if current_user_email is null
       or trim(current_user_email) = '' then
        raise exception 'Authenticated email is required';
    end if;

    if invitation_token is null
       or trim(invitation_token) = '' then
        raise exception 'Invitation token is required';
    end if;

    select *
    into invitation_record
    from public.workspace_invitations
    where token_hash = encode(
        digest(trim(invitation_token), 'sha256'),
        'hex'
    )
      and accepted_at is null
      and expires_at > now()
    for update;

    if not found then
        raise exception 'Invalid or expired invitation';
    end if;

    if lower(trim(invitation_record.invited_email))
       <> lower(trim(current_user_email)) then
        raise exception 'Invitation email does not match authenticated account';
    end if;

    if exists (
        select 1
        from public.people p
        where p.id = invitation_record.person_id
          and p.user_id is not null
          and p.user_id <> current_user_id
    ) then
        raise exception 'This person is already linked to another account';
    end if;

    if not exists (
        select 1
        from public.people p
        where p.id = invitation_record.person_id
          and p.workspace_id = invitation_record.workspace_id
    ) then
        raise exception 'Invitation person does not belong to the invitation workspace';
    end if;

    select wm.id
    into existing_membership_id
    from public.workspace_memberships wm
    where wm.workspace_id = invitation_record.workspace_id
      and wm.user_id = current_user_id;

    if existing_membership_id is null then
        insert into public.workspace_memberships (
            workspace_id,
            user_id,
            role
        )
        values (
            invitation_record.workspace_id,
            current_user_id,
            'member'
        );
    end if;

    update public.people
    set
        user_id = current_user_id,
        updated_at = now()
    where id = invitation_record.person_id;

    update public.workspace_invitations
    set accepted_at = now()
    where id = invitation_record.id;

    return invitation_record.workspace_id;
end;
$$;


revoke execute
on function public.accept_workspace_invitation(text)
from public;


grant execute
on function public.accept_workspace_invitation(text)
to authenticated;