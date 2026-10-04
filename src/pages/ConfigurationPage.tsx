import { useEffect, useState } from "react";

import type { Employer } from "../domain/employer/employer";
import type { WorkLocation } from "../domain/employer/work-location";
import { configurationService } from "../application/services";

function ConfigurationPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [locations, setLocations] = useState<Record<string, WorkLocation[]>>(
    {},
  );

  const [employerName, setEmployerName] = useState("");
  const [locationNames, setLocationNames] = useState<Record<string, string>>(
    {},
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadConfiguration() {
    try {
      setLoading(true);
      setError(null);

      const employerData = await configurationService.getEmployers();

      setEmployers(employerData);

      const locationEntries = await Promise.all(
        employerData.map(async (employer) => {
          const employerLocations =
            await configurationService.getLocationsForEmployer(employer.id);

          return [employer.id, employerLocations] as const;
        }),
      );

      setLocations(Object.fromEntries(locationEntries));
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to load configuration.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConfiguration();
  }, []);

  async function handleAddEmployer() {
    const trimmedName = employerName.trim();

    if (!trimmedName) {
      setError("Please enter an employer name.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await configurationService.addEmployer(trimmedName);

      setEmployerName("");

      await loadConfiguration();
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Failed to add employer.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLocation(employerId: string) {
    const name = locationNames[employerId]?.trim() ?? "";

    if (!name) {
      setError("Please enter a location name.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await configurationService.addLocation(employerId, name);

      setLocationNames((current) => ({
        ...current,
        [employerId]: "",
      }));

      await loadConfiguration();
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Failed to add location.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="configuration-page">
      <section className="configuration-content">
        <header className="configuration-header">
          <h1>Configuration</h1>
          <p>Manage your employers and work locations.</p>
        </header>

        <section className="configuration-section">
          <h2>Employers</h2>

          {loading ? (
            <p className="configuration-muted">Loading configuration...</p>
          ) : employers.length === 0 ? (
            <div className="configuration-empty">
              <p>No employers configured yet.</p>
            </div>
          ) : (
            <div className="employer-list">
              {employers.map((employer) => {
                const employerLocations = locations[employer.id] ?? [];

                return (
                  <article className="employer-card" key={employer.id}>
                    <div className="employer-card-header">
                      <h3>{employer.name}</h3>
                    </div>

                    <div className="employer-locations">
                      <h4>Locations</h4>

                      {employerLocations.length === 0 ? (
                        <p className="configuration-muted">
                          No locations configured yet.
                        </p>
                      ) : (
                        <ul>
                          {employerLocations.map((location) => (
                            <li key={location.id}>{location.name}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="add-location-form">
                      <label htmlFor={`location-${employer.id}`}>
                        Add location
                      </label>

                      <div className="configuration-input-row">
                        <input
                          id={`location-${employer.id}`}
                          type="text"
                          value={locationNames[employer.id] ?? ""}
                          onChange={(event) =>
                            setLocationNames((current) => ({
                              ...current,
                              [employer.id]: event.target.value,
                            }))
                          }
                          placeholder="Enter location name"
                          disabled={saving}
                        />

                        <button
                          className="configuration-button"
                          type="button"
                          onClick={() => void handleAddLocation(employer.id)}
                          disabled={saving}
                        >
                          {saving ? "Adding..." : "Add location"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="add-employer-card">
          <h2>Add employer</h2>

          <p>Add a new employer to your workspace.</p>

          <div className="add-employer-form">
            <label htmlFor="employer-name">Employer name</label>

            <div className="configuration-input-row">
              <input
                id="employer-name"
                type="text"
                value={employerName}
                onChange={(event) => setEmployerName(event.target.value)}
                placeholder="Enter employer name"
                disabled={saving}
              />

              <button
                className="configuration-button"
                type="button"
                onClick={() => void handleAddEmployer()}
                disabled={saving}
              >
                {saving ? "Adding..." : "Add employer"}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <p className="configuration-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}

export default ConfigurationPage;
