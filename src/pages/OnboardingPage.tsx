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
    <main className="onboarding-page">
      <section className="onboarding-card">
        <h1 className="onboarding-title">Welcome to Work Hours</h1>

        <p className="onboarding-intro">
          Let's get started by telling us a little about yourself.
        </p>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="onboarding-field">
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

          <div className="onboarding-field">
            <fieldset className="onboarding-options" disabled={saving}>
              <legend>Do you have a work-hour limit?</legend>

              <div className="onboarding-radio-group">
                <label className="onboarding-radio">
                  <input
                    type="radio"
                    name="work-hour-limit"
                    checked={!hasWorkHourLimit}
                    onChange={() => setHasWorkHourLimit(false)}
                  />
                  No
                </label>

                <label className="onboarding-radio">
                  <input
                    type="radio"
                    name="work-hour-limit"
                    checked={hasWorkHourLimit}
                    onChange={() => setHasWorkHourLimit(true)}
                  />
                  Yes
                </label>
              </div>
            </fieldset>
          </div>

          {hasWorkHourLimit && (
            <div className="onboarding-field">
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

          {error && (
            <p className="onboarding-error" role="alert">
              {error}
            </p>
          )}

          <button className="onboarding-submit" type="submit" disabled={saving}>
            {saving ? "Setting up..." : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default OnboardingPage;
