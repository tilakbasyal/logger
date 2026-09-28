import { useState } from "react";
import type { FormEvent } from "react";

import { workspaceService } from "../application/workspace/workspace-service";

interface OnboardingPageProps {
  onCompleted: () => void;
}

function OnboardingPage({
  onCompleted,
}: OnboardingPageProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(
    null,
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await workspaceService.createWorkspaceWithOwnerAndPerson(
        "Work Hours",
        trimmedName,
      );

      onCompleted();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while setting up your workspace.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <section>
        <h1>Welcome to Work Hours</h1>

        <p>
          Let's get started by telling us your name.
        </p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="person-name">
              Your name
            </label>

            <input
              id="person-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter your name"
              autoComplete="name"
              disabled={saving}
              autoFocus
            />
          </div>

          {error && (
            <p role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Setting up..."
              : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default OnboardingPage;