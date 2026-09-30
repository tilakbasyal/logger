import { useEffect, useState } from "react";

import AddShiftPage from "./pages/AddShiftPage";
import ShiftHistoryPage from "./pages/ShiftHistoryPage";
import DashboardPage from "./pages/DashboardPage";
import ShiftPresetsPage from "./pages/ShiftPresetsPage";
import LoginPage from "./pages/LoginPage";
import AccountMenu from "./components/AccountMenu";
import { authService } from "./application/auth/auth-service";
import { supabase } from "./infrastructure/supabase/client";
import type { AuthUser } from "./application/auth/auth-service";
import OnboardingPage from "./pages/OnboardingPage";
import { workspaceService } from "./application/workspace/workspace-service";
import ConfigurationPage from "./pages/ConfigurationPage";

type Page = "dashboard" | "add" | "history" | "presets" | "configuration";

function App() {
  const [page, setPage] = useState<Page>("dashboard");

  const [user, setUser] = useState<AuthUser | null>(null);

  const [authLoading, setAuthLoading] = useState(true);

  const [workspaceLoading, setWorkspaceLoading] = useState(true);

  const [hasWorkspace, setHasWorkspace] = useState(false);

  async function loadWorkspaceStatus() {
    const workspaceExists = await workspaceService.hasWorkspace();

    setHasWorkspace(workspaceExists);
  }

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (session) {
          const currentUser = await authService.getCurrentUser();

          if (mounted) {
            setUser(currentUser);

            if (currentUser) {
              await loadWorkspaceStatus();
            }
          }
        } else {
          setUser(null);
          setHasWorkspace(false);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
          setWorkspaceLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
        setHasWorkspace(false);
        setWorkspaceLoading(false);
        return;
      }

      const currentUser = await authService.getCurrentUser();

      if (mounted) {
        setUser(currentUser);

        if (currentUser) {
          try {
            await loadWorkspaceStatus();
          } finally {
            if (mounted) {
              setWorkspaceLoading(false);
            }
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authLoading || workspaceLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <LoginPage
        onAuthenticated={(authenticatedUser) => setUser(authenticatedUser)}
      />
    );
  }

  if (!hasWorkspace) {
    return (
      <OnboardingPage
        onCompleted={async () => {
          await loadWorkspaceStatus();
        }}
      />
    );
  }

  return (
    <>
      <nav className="app-navigation">
        <button
          type="button"
          className={page === "dashboard" ? "nav-button active" : "nav-button"}
          onClick={() => setPage("dashboard")}
        >
          Dashboard
        </button>

        <button
          type="button"
          className={page === "add" ? "nav-button active" : "nav-button"}
          onClick={() => setPage("add")}
        >
          Add Work
        </button>

        <button
          type="button"
          className={page === "history" ? "nav-button active" : "nav-button"}
          onClick={() => setPage("history")}
        >
          History
        </button>

        <button
          type="button"
          className={page === "presets" ? "nav-button active" : "nav-button"}
          onClick={() => setPage("presets")}
        >
          Presets
        </button>

        <button
          type="button"
          className={
            page === "configuration" ? "nav-button active" : "nav-button"
          }
          onClick={() => setPage("configuration")}
        >
          Configuration
        </button>

        <AccountMenu user={user} />
      </nav>

      {page === "dashboard" && <DashboardPage />}

      {page === "add" && <AddShiftPage />}

      {page === "history" && <ShiftHistoryPage />}

      {page === "presets" && <ShiftPresetsPage />}

      {page === "configuration" && <ConfigurationPage />}
    </>
  );
}

export default App;
