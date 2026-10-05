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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [user, setUser] = useState<AuthUser | null>(null);

  const [authLoading, setAuthLoading] = useState(true);

  const [workspaceLoading, setWorkspaceLoading] = useState(true);

  const [hasWorkspace, setHasWorkspace] = useState(false);

  const [invitationToken, setInvitationToken] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("invite"),
  );

  const [invitationError, setInvitationError] = useState<string | null>(null);

  const [invitationLoading, setInvitationLoading] = useState(false);

  async function loadWorkspaceStatus() {
    setInvitationError(null);

    if (invitationToken) {
      try {
        setInvitationLoading(true);

        await workspaceService.acceptInvitation(invitationToken);

        window.history.replaceState({}, "", window.location.pathname);

        setInvitationToken(null);
      } catch (err) {
        setInvitationError(
          err instanceof Error
            ? err.message
            : "Unable to accept the invitation.",
        );
      } finally {
        setInvitationLoading(false);
      }
    }

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
  if (invitationLoading) {
    return <div>Accepting invitation...</div>;
  }

  if (invitationError) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1 className="auth-brand">Work Hours Tracker</h1>

          <h2>Invitation unavailable</h2>

          <p className="auth-error" role="alert">
            {invitationError}
          </p>
        </section>
      </main>
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
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          aria-expanded={isMobileMenuOpen}
          aria-label={
            isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>

        <span className="mobile-app-brand">Work Hours</span>

        <div className={isMobileMenuOpen ? "nav-links open" : "nav-links"}>
          <button
            type="button"
            className={
              page === "dashboard" ? "nav-button active" : "nav-button"
            }
            onClick={() => {
              setPage("dashboard");
              setIsMobileMenuOpen(false);
            }}
          >
            Dashboard
          </button>

          <button
            type="button"
            className={page === "add" ? "nav-button active" : "nav-button"}
            onClick={() => {
              setPage("add");
              setIsMobileMenuOpen(false);
            }}
          >
            Add Work
          </button>

          <button
            type="button"
            className={page === "history" ? "nav-button active" : "nav-button"}
            onClick={() => {
              setPage("history");
              setIsMobileMenuOpen(false);
            }}
          >
            History
          </button>

          <button
            type="button"
            className={page === "presets" ? "nav-button active" : "nav-button"}
            onClick={() => {
              setPage("presets");
              setIsMobileMenuOpen(false);
            }}
          >
            Presets
          </button>

          <button
            type="button"
            className={
              page === "configuration" ? "nav-button active" : "nav-button"
            }
            onClick={() => {
              setPage("configuration");
              setIsMobileMenuOpen(false);
            }}
          >
            Configuration
          </button>
        </div>

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
