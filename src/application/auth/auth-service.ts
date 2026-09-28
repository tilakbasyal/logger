import { supabase } from "../../infrastructure/supabase/client";

export interface AuthUser {
  id: string;
  email: string | null;
}

export class AuthService {
  async signUp(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("Sign-up did not return a user.");
    }

    return {
      id: data.user.id,
      email: data.user.email ?? null,
    };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("Sign-in did not return a user.");
    }

    return {
      id: data.user.id,
      email: data.user.email ?? null,
    };
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email ?? null,
    };
  }
}

export const authService = new AuthService();