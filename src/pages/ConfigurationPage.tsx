import { useEffect, useState } from "react";

import type { Person } from "../domain/person/person";
import type { WorkPolicy } from "../domain/work-policy/work-policy";
import type { Employer } from "../domain/employer/employer";
import type { WorkLocation } from "../domain/employer/work-location";
import { configurationService } from "../application/services";

function formatMonthlyLimit(maxMinutes: number): string {
  const hours = maxMinutes / 60;

  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h / month`;
}

function ConfigurationPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [policies, setPolicies] = useState<WorkPolicy[]>([]);
  const [personName, setPersonName] = useState("");
  const [personMaxHours, setPersonMaxHours] = useState("");
  const [savingPerson, setSavingPerson] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingPersonName, setEditingPersonName] = useState("");

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
  const [addingLocationEmployerId, setAddingLocationEmployerId] = useState<
    string | null
  >(null);
  const [openLocationFormEmployerId, setOpenLocationFormEmployerId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function loadConfiguration() {
    try {
      setLoading(true);
      setError(null);

      const [peopleData, policyData, employerData] = await Promise.all([
        configurationService.getPeople(),
        configurationService.getWorkPolicies(),
        configurationService.getEmployers(),
      ]);

      setPeople(peopleData);
      setPolicies(policyData);
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

  async function handleAddPerson() {
    const trimmedName = personName.trim();

    if (!trimmedName) {
      setError("Please enter a person name.");
      return;
    }

    const trimmedMaxHours = personMaxHours.trim();
    const maxHours = trimmedMaxHours ? Number(trimmedMaxHours) : undefined;

    if (maxHours !== undefined && !(maxHours > 0)) {
      setError("Maximum hours per month must be a number greater than zero.");
      return;
    }

    try {
      setSavingPerson(true);
      setError(null);

      await configurationService.addPerson(trimmedName, maxHours);

      setPersonName("");
      setPersonMaxHours("");

      await loadConfiguration();
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Failed to add person.");
    } finally {
      setSavingPerson(false);
    }
  }

  async function handleRenamePerson(person: Person) {
    try {
      setSavingPerson(true);
      setError(null);

      const updatedPerson = await configurationService.renamePerson(
        person,
        editingPersonName,
      );

      setPeople((current) =>
        current.map((item) =>
          item.id === updatedPerson.id ? updatedPerson : item,
        ),
      );
      setEditingPersonId(null);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Failed to rename person.");
    } finally {
      setSavingPerson(false);
    }
  }

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
      setAddingLocationEmployerId(employerId);
      setError(null);

      const newLocation = await configurationService.addLocation(
        employerId,
        name,
      );

      setLocations((current) => ({
        ...current,
        [employerId]: [...(current[employerId] ?? []), newLocation],
      }));

      setLocationNames((current) => ({
        ...current,
        [employerId]: "",
      }));
      setOpenLocationFormEmployerId(null);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Failed to add location.");
    } finally {
      setAddingLocationEmployerId(null);
    }
  }

  return (
    <main className="configuration-page">
      <section className="configuration-content">
        <header className="configuration-header">
          <h1>Configuration</h1>
          <p>Manage the people you track, employers and work locations.</p>
        </header>

        <section className="configuration-section">
          <h2>People</h2>

          {loading ? (
            <p className="configuration-muted">Loading people...</p>
          ) : people.length === 0 ? (
            <div className="configuration-empty">
              <p>No people added yet.</p>
            </div>
          ) : (
            <ul className="people-list">
              {people.map((person) => {
                const policy = policies
                  .filter((item) => item.personId === person.id)
                  .sort((a, b) =>
                    b.effectiveFrom.localeCompare(a.effectiveFrom),
                  )[0];

                const isEditing = editingPersonId === person.id;

                return (
                  <li className="person-card" key={person.id}>
                    {isEditing ? (
                      <div className="configuration-input-row">
                        <input
                          type="text"
                          value={editingPersonName}
                          onChange={(event) =>
                            setEditingPersonName(event.target.value)
                          }
                          aria-label={`New name for ${person.name}`}
                          disabled={savingPerson}
                          autoFocus
                        />

                        <button
                          className="configuration-button"
                          type="button"
                          onClick={() => void handleRenamePerson(person)}
                          disabled={savingPerson}
                        >
                          Save
                        </button>

                        <button
                          className="add-location-trigger"
                          type="button"
                          onClick={() => setEditingPersonId(null)}
                          disabled={savingPerson}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="person-card-details">
                          <strong>{person.name}</strong>

                          <span className="configuration-muted">
                            {policy
                              ? formatMonthlyLimit(policy.maxMinutes)
                              : "No monthly limit"}
                          </span>
                        </div>

                        <button
                          className="add-location-trigger"
                          type="button"
                          onClick={() => {
                            setEditingPersonId(person.id);
                            setEditingPersonName(person.name);
                          }}
                        >
                          Rename
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="add-employer-card">
          <h2>Add person</h2>

          <p>
            Add someone else whose hours you want to track, like a partner or
            family member.
          </p>

          <div className="add-employer-form">
            <label htmlFor="person-name">Name</label>

            <div className="configuration-input-row">
              <input
                id="person-name"
                type="text"
                value={personName}
                onChange={(event) => setPersonName(event.target.value)}
                placeholder="Enter name"
                disabled={savingPerson}
              />
            </div>

            <label htmlFor="person-max-hours">
              Max hours per month (optional)
            </label>

            <div className="configuration-input-row">
              <input
                id="person-max-hours"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                value={personMaxHours}
                onChange={(event) => setPersonMaxHours(event.target.value)}
                placeholder="e.g. 90"
                disabled={savingPerson}
              />

              <button
                className="configuration-button"
                type="button"
                onClick={() => void handleAddPerson()}
                disabled={savingPerson}
              >
                {savingPerson ? "Adding..." : "Add person"}
              </button>
            </div>
          </div>
        </section>

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

                    <div className="add-location-action">
                      <button
                        className="add-location-trigger"
                        type="button"
                        onClick={() =>
                          setOpenLocationFormEmployerId((current) =>
                            current === employer.id ? null : employer.id,
                          )
                        }
                        aria-expanded={
                          openLocationFormEmployerId === employer.id
                        }
                      >
                        {openLocationFormEmployerId === employer.id
                          ? "− Cancel"
                          : "+ Add location"}
                      </button>

                      {openLocationFormEmployerId === employer.id && (
                        <div className="add-location-form">
                          <label htmlFor={`location-${employer.id}`}>
                            Location name
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
                              disabled={
                                addingLocationEmployerId === employer.id
                              }
                            />

                            <button
                              className="configuration-button"
                              type="button"
                              onClick={() =>
                                void handleAddLocation(employer.id)
                              }
                              disabled={
                                addingLocationEmployerId === employer.id
                              }
                            >
                              {addingLocationEmployerId === employer.id
                                ? "Adding..."
                                : "Add location"}
                            </button>
                          </div>
                        </div>
                      )}
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
