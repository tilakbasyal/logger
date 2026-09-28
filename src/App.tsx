import {
  useEffect,
  useState,
} from "react";

import AddShiftPage from "./pages/AddShiftPage";
import ShiftHistoryPage from "./pages/ShiftHistoryPage";
import DashboardPage from "./pages/DashboardPage";
import ShiftPresetsPage from "./pages/ShiftPresetsPage";
import LoginPage from "./pages/LoginPage";
import AccountMenu from "./components/AccountMenu";
import { authService } from "./application/auth/auth-service";
import { supabase } from "./infrastructure/supabase/client";
import type { AuthUser } from "./application/auth/auth-service";

type Page =
  | "dashboard"
  | "add"
  | "history"
  | "presets";

function App() {
  const [page, setPage] =
    useState<Page>("dashboard");

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (session) {
          const currentUser =
            await authService.getCurrentUser();

          if (mounted) {
            setUser(currentUser);
          }
        } else {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!session) {
            setUser(null);
            return;
          }

          const currentUser =
            await authService.getCurrentUser();

          if (mounted) {
            setUser(currentUser);
          }
        },
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <LoginPage
        onAuthenticated={(authenticatedUser) =>
          setUser(authenticatedUser)
        }
      />
    );
  }

  return (
    <>
      <nav className="app-navigation">
        <button
          type="button"
          className={
            page === "dashboard"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setPage("dashboard")
          }
        >
          Dashboard
        </button>

        <button
          type="button"
          className={
            page === "add"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setPage("add")
          }
        >
          Add Work
        </button>

        <button
          type="button"
          className={
            page === "history"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setPage("history")
          }
        >
          History
        </button>

        <button
          type="button"
          className={
            page === "presets"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setPage("presets")
          }
        >
          Presets
        </button>

        <AccountMenu user={user} />
      </nav>

      {page === "dashboard" && (
        <DashboardPage />
      )}

      {page === "add" && (
        <AddShiftPage />
      )}

      {page === "history" && (
        <ShiftHistoryPage />
      )}

      {page === "presets" && (
        <ShiftPresetsPage />
      )}
    </>
  );
}

export default App;