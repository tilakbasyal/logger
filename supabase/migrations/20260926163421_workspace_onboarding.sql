create or replace function public.create_workspace_with_owner_and_person(
    workspace_name text,
    person_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    new_workspace_id uuid;
    current_user_id uuid;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if workspace_name is null
       or length(trim(workspace_name)) = 0 then
        raise exception 'Workspace name cannot be empty';
    end if;

    if person_name is null
       or length(trim(person_name)) = 0 then
        raise exception 'Person name cannot be empty';
    end if;

    insert into public.workspaces (
        name,
        owner_user_id
    )
    values (
        trim(workspace_name),
        current_user_id
    )
    returning id into new_workspace_id;

    insert into public.workspace_memberships (
        workspace_id,
        user_id,
        role
    )
    values (
        new_workspace_id,
        current_user_id,
        'owner'
    );

    insert into public.people (
        workspace_id,
        user_id,
        name
    )
    values (
        new_workspace_id,
        current_user_id,
        trim(person_name)
    );

    return new_workspace_id;
end;
$$;

revoke execute
on function public.create_workspace_with_owner_and_person(
    text,
    text
)
from public;

grant execute
on function public.create_workspace_with_owner_and_person(
    text,
    text
)
to authenticated;