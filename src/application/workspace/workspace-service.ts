import { supabase } from "../../infrastructure/supabase/client";

export class WorkspaceService {
  async createWorkspaceWithOwnerAndPerson(
    workspaceName: string,
    personName: string,
    maxWorkHoursPerMonth?: number,
  ): Promise<string> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error("Authentication required.");
    }

    const { data, error } = await supabase.rpc(
      "create_workspace_with_owner_and_person",
      {
        workspace_name: workspaceName,
        person_name: personName,
        max_work_hours_per_month: maxWorkHoursPerMonth ?? null,
      },
    );

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Workspace creation did not return an ID.");
    }

    return data;
  }

  async hasWorkspace(): Promise<boolean> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from("workspace_memberships")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (error) {
      throw error;
    }

    return data.length > 0;
  }

  async getCurrentWorkspaceId(): Promise<string | null> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.workspace_id ?? null;
  }

  async acceptInvitation(invitationToken: string): Promise<string> {
    const token = invitationToken.trim();

    if (!token) {
      throw new Error("Invitation token is required.");
    }

    const { data, error } = await supabase.rpc("accept_workspace_invitation", {
      invitation_token: token,
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        "Accepting the invitation did not return a workspace ID.",
      );
    }

    return data;
  }

  async createInvitation(
    personId: string,
    invitedEmail: string,
  ): Promise<string> {
    const email = invitedEmail.trim();

    if (!personId) {
      throw new Error("Person is required.");
    }

    if (!email) {
      throw new Error("Invitation email is required.");
    }

    const { data, error } = await supabase.rpc("create_workspace_invitation", {
      target_person_id: personId,
      invited_email: email,
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        "Creating the invitation did not return an invitation token.",
      );
    }

    return data;
  }
}

export const workspaceService = new WorkspaceService();
