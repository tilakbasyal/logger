import { useState } from "react";
import type { FormEvent } from "react";

import { workspaceService } from "../application/workspace/workspace-service";

interface OnboardingPageProps {
  onCompleted: () => void;
}

function OnboardingPage({ onCompleted }: OnboardingPageProps) {
  const [name, setName] = useState("");
  const [hasWorkHourLimit, setHasWorkHourLimit] = useState(false);
  const [maxHoursPerMonth, setMaxHoursPerMonth] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (hasWorkHourLimit) {
      const maxHours = Number(maxHoursPerMonth);

      if (!maxHoursPerMonth || !Number.isFinite(maxHours) || maxHours <= 0) {
        setError("Please enter a valid maximum number of hours per month.");
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      await workspaceService.createWorkspaceWithOwnerAndPerson(
        "Work Hours",
        trimmedName,
        hasWorkHourLimit ? Number(maxHoursPerMonth) : undefined,
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

        <p>Let's get started by telling us a little about yourself.</p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="person-name">Your name</label>

            <input
              id="person-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
              disabled={saving}
              autoFocus
            />
          </div>

          <div>
            <fieldset disabled={saving}>
              <legend>Do you have a work-hour limit?</legend>

              <label>
                <input
                  type="radio"
                  name="work-hour-limit"
                  checked={!hasWorkHourLimit}
                  onChange={() => setHasWorkHourLimit(false)}
                />
                No
              </label>

              <label>
                <input
                  type="radio"
                  name="work-hour-limit"
                  checked={hasWorkHourLimit}
                  onChange={() => setHasWorkHourLimit(true)}
                />
                Yes
              </label>
            </fieldset>
          </div>

          {hasWorkHourLimit && (
            <div>
              <label htmlFor="max-hours-per-month">
                Maximum hours per month
              </label>

              <input
                id="max-hours-per-month"
                type="number"
                min="0.1"
                step="0.1"
                value={maxHoursPerMonth}
                onChange={(event) => setMaxHoursPerMonth(event.target.value)}
                placeholder="e.g. 90"
                disabled={saving}
              />
            </div>
          )}

          {error && <p role="alert">{error}</p>}

          <button type="submit" disabled={saving}>
            {saving ? "Setting up..." : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default OnboardingPage;
