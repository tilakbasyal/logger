import { supabase } from "../../infrastructure/supabase/client";

export class WorkspaceService {
  async createWorkspaceWithOwnerAndPerson(
    workspaceName: string,
    personName: string,
  ): Promise<string> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error(
        "Authentication required.",
      );
    }

    const { data, error } =
      await supabase.rpc(
        "create_workspace_with_owner_and_person",
        {
          workspace_name: workspaceName,
          person_name: personName,
        },
      );

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        "Workspace creation did not return an ID.",
      );
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

    const {
      data,
      error,
    } = await supabase
      .from("workspace_memberships")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (error) {
      throw error;
    }

    return data.length > 0;
  }
}

export const workspaceService =
  new WorkspaceService();