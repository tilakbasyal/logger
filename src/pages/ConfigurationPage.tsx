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
    <main className="page">
      <section>
        <h1>Configuration</h1>

        <h2>Employers</h2>

        {loading ? (
          <p>Loading configuration...</p>
        ) : employers.length === 0 ? (
          <p>No employers configured yet.</p>
        ) : (
          <div>
            {employers.map((employer) => {
              const employerLocations = locations[employer.id] ?? [];

              return (
                <article key={employer.id}>
                  <h3>{employer.name}</h3>

                  <h4>Locations</h4>

                  {employerLocations.length === 0 ? (
                    <p>No locations configured yet.</p>
                  ) : (
                    <ul>
                      {employerLocations.map((location) => (
                        <li key={location.id}>{location.name}</li>
                      ))}
                    </ul>
                  )}

                  <div>
                    <label htmlFor={`location-${employer.id}`}>
                      Location name
                    </label>

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
                      type="button"
                      onClick={() => void handleAddLocation(employer.id)}
                      disabled={saving}
                    >
                      {saving ? "Adding..." : "Add location"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div>
          <h3>Add employer</h3>

          <label htmlFor="employer-name">Employer name</label>

          <input
            id="employer-name"
            type="text"
            value={employerName}
            onChange={(event) => setEmployerName(event.target.value)}
            placeholder="Enter employer name"
            disabled={saving}
          />

          <button
            type="button"
            onClick={() => void handleAddEmployer()}
            disabled={saving}
          >
            {saving ? "Adding..." : "Add employer"}
          </button>
        </div>

        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  );
}

export default ConfigurationPage;
