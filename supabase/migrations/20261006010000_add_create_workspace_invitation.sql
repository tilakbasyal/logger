create or replace function public.create_workspace_invitation(
    target_person_id uuid,
    invited_email text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    current_user_id uuid;
    target_workspace_id uuid;
    invitation_token text;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if invited_email is null
       or trim(invited_email) = '' then
        raise exception 'Invitation email is required';
    end if;

    /*
     * Find the workspace owned by the current user
     * that contains the target Person.
     */
    select p.workspace_id
    into target_workspace_id
    from public.people p
    join public.workspace_memberships wm
        on wm.workspace_id = p.workspace_id
       and wm.user_id = current_user_id
       and wm.role = 'owner'
    where p.id = target_person_id;

    if target_workspace_id is null then
        raise exception 'Person does not belong to a workspace owned by the current user';
    end if;

    /*
     * A Person can only be linked to one authenticated account.
     */
    if exists (
        select 1
        from public.people p
        where p.id = target_person_id
          and p.user_id is not null
    ) then
        raise exception 'This person is already linked to an account';
    end if;

    /*
     * Do not create another active invitation for the same
     * Person and email address.
     */
    if exists (
        select 1
        from public.workspace_invitations wi
        where wi.person_id = target_person_id
          and lower(trim(wi.invited_email)) = lower(trim(invited_email))
          and wi.accepted_at is null
          and wi.expires_at > now()
    ) then
        raise exception 'An active invitation already exists for this person and email';
    end if;

    /*
     * Generate a cryptographically random invitation token.
     */
    invitation_token := encode(
        gen_random_bytes(32),
        'hex'
    );

    insert into public.workspace_invitations (
        workspace_id,
        person_id,
        invited_email,
        token_hash,
        invited_by_user_id,
        expires_at
    )
    values (
        target_workspace_id,
        target_person_id,
        lower(trim(invited_email)),
        encode(
            digest(invitation_token, 'sha256'),
            'hex'
        ),
        current_user_id,
        now() + interval '7 days'
    );

    return invitation_token;
end;
$$;


revoke execute
on function public.create_workspace_invitation(uuid, text)
from public;


grant execute
on function public.create_workspace_invitation(uuid, text)
to authenticated;