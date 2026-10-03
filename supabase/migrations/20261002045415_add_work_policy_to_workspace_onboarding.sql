create or replace function public.create_workspace_with_owner_and_person(
    workspace_name text,
    person_name text,
    max_work_hours_per_month numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    new_workspace_id uuid;
    new_person_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Not authenticated';
    end if;

    if trim(workspace_name) = '' then
        raise exception 'Workspace name cannot be empty';
    end if;

    if trim(person_name) = '' then
        raise exception 'Person name cannot be empty';
    end if;

    if max_work_hours_per_month is not null
       and max_work_hours_per_month <= 0 then
        raise exception 'Maximum work hours must be greater than zero';
    end if;

    insert into public.workspaces (
        name,
        owner_user_id
    )
    values (
        trim(workspace_name),
        auth.uid()
    )
    returning id into new_workspace_id;

    insert into public.workspace_memberships (
        workspace_id,
        user_id,
        role
    )
    values (
        new_workspace_id,
        auth.uid(),
        'owner'
    );

    insert into public.people (
        workspace_id,
        user_id,
        name
    )
    values (
        new_workspace_id,
        auth.uid(),
        trim(person_name)
    )
    returning id into new_person_id;

    if max_work_hours_per_month is not null then
        insert into public.work_policies (
            workspace_id,
            person_id,
            period_type,
            max_minutes,
            effective_from
        )
        values (
            new_workspace_id,
            new_person_id,
            'calendar_month',
            round(max_work_hours_per_month * 60),
            current_date
        );
    end if;

    return new_workspace_id;
end;
$$;