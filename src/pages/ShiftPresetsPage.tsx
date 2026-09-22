import {
  useEffect,
  useState,
} from "react";

import type { Person } from "../domain/person/person";
import type { Employer } from "../domain/employer/employer";
import type { WorkLocation } from "../domain/employer/work-location";
import type { ShiftPreset } from "../domain/shift/shift-preset";

import {
  configurationService,
  shiftPresetService,
} from "../application/services";

function formatTime(time: string): string {
  return time;
}

export default function ShiftPresetsPage() {
  const [people, setPeople] =
    useState<Person[]>([]);

  const [employers, setEmployers] =
    useState<Employer[]>([]);

  // Locations currently available for
  // the selected employer.
  const [locations, setLocations] =
    useState<WorkLocation[]>([]);

  // All locations are needed when
  // displaying existing presets.
  const [allLocations, setAllLocations] =
    useState<WorkLocation[]>([]);

  const [presets, setPresets] =
    useState<ShiftPreset[]>([]);

  const [personId, setPersonId] =
    useState("");

  const [employerId, setEmployerId] =
    useState("");

  const [workLocationId, setWorkLocationId] =
    useState("");

  const [label, setLabel] =
    useState("");

  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function loadPresets() {
    const loaded =
      await shiftPresetService.getAllPresets();

    setPresets(
      loaded.filter(
        (preset) => preset.isActive,
      ),
    );
  }

  useEffect(() => {
    async function load() {
      const [
        loadedPeople,
        loadedEmployers,
      ] = await Promise.all([
        configurationService.getPeople(),
        configurationService.getEmployers(),
      ]);

      setPeople(loadedPeople);
      setEmployers(loadedEmployers);

      if (loadedPeople.length > 0) {
        setPersonId(
          loadedPeople[0].id,
        );
      }

      /*
       * Load every location once.
       *
       * This is used only when displaying
       * existing presets.
       */
      const locationResults =
        await Promise.all(
          loadedEmployers.map(
            (employer) =>
              configurationService
                .getLocationsForEmployer(
                  employer.id,
                ),
          ),
        );

      setAllLocations(
        locationResults.flat(),
      );

      await loadPresets();
    }

    load();
  }, []);

  /*
   * Load locations for the currently
   * selected employer.
   */
  useEffect(() => {
    async function loadLocations() {
      if (!employerId) {
        setLocations([]);
        setWorkLocationId("");
        return;
      }

      const loaded =
        await configurationService
          .getLocationsForEmployer(
            employerId,
          );

      setLocations(loaded);

      if (loaded.length > 0) {
        setWorkLocationId(
          loaded[0].id,
        );
      } else {
        setWorkLocationId("");
      }
    }

    loadLocations();
  }, [employerId]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!personId) {
      setError(
        "Please select a person.",
      );
      return;
    }

    if (!employerId) {
      setError(
        "Please select an employer.",
      );
      return;
    }

    if (!workLocationId) {
      setError(
        "Please select a location.",
      );
      return;
    }

    if (!label.trim()) {
      setError(
        "Please enter a preset name.",
      );
      return;
    }

    if (!startTime || !endTime) {
      setError(
        "Please enter both start and end time.",
      );
      return;
    }

    if (startTime === endTime) {
      setError(
        "Start and end time cannot be the same.",
      );
      return;
    }

    try {
      await shiftPresetService.createPreset({
        personId,
        workLocationId,
        label: label.trim(),
        startTime,
        endTime,
      });

      await loadPresets();

      setLabel("");
      setStartTime("");
      setEndTime("");

      setMessage(
        "Preset created successfully.",
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Could not create preset.";

      setError(errorMessage);
    }
  }

  async function handleDelete(
    id: string,
  ) {
    setError("");
    setMessage("");

    try {
      await shiftPresetService.deletePreset(
        id,
      );

      await loadPresets();

      setMessage(
        "Preset deleted.",
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Could not delete preset.";

      setError(errorMessage);
    }
  }

  function getPersonName(
    id: string,
  ): string {
    return (
      people.find(
        (person) => person.id === id,
      )?.name ?? "Unknown person"
    );
  }

  function getLocation(
    id: string,
  ): WorkLocation | undefined {
    return allLocations.find(
      (location) => location.id === id,
    );
  }

  function getEmployerName(
    locationId: string,
  ): string {
    const location =
      getLocation(locationId);

    if (!location) {
      return "Unknown employer";
    }

    return (
      employers.find(
        (employer) =>
          employer.id ===
          location.employerId,
      )?.name ?? "Unknown employer"
    );
  }

  return (
    <main className="app-shell">
      <div className="page-container">
        <header className="page-header">
          <h1>Shift Presets</h1>

          <p>
            Create reusable shifts for
            faster work entry.
          </p>
        </header>

        <section className="form-section">
          <h2>Create preset</h2>

          <form
            className="shift-form"
            onSubmit={handleSubmit}
          >
            <label>
              Who?
            </label>

            <div className="person-buttons">
              {people.map(
                (person) => (
                  <button
                    key={person.id}
                    type="button"
                    className={
                      personId ===
                      person.id
                        ? "choice-button selected"
                        : "choice-button"
                    }
                    onClick={() =>
                      setPersonId(
                        person.id,
                      )
                    }
                  >
                    {person.name}
                  </button>
                ),
              )}
            </div>

            <label htmlFor="preset-employer">
              Employer
            </label>

            <select
              id="preset-employer"
              value={employerId}
              onChange={(event) =>
                setEmployerId(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select employer
              </option>

              {employers.map(
                (employer) => (
                  <option
                    key={employer.id}
                    value={employer.id}
                  >
                    {employer.name}
                  </option>
                ),
              )}
            </select>

            <label htmlFor="preset-location">
              Location
            </label>

            <select
              id="preset-location"
              value={workLocationId}
              onChange={(event) =>
                setWorkLocationId(
                  event.target.value,
                )
              }
              disabled={!employerId}
            >
              <option value="">
                Select location
              </option>

              {locations.map(
                (location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.name}
                  </option>
                ),
              )}
            </select>

            <label htmlFor="preset-label">
              Preset name
            </label>

            <input
              id="preset-label"
              type="text"
              value={label}
              placeholder="e.g. TV2 Evening"
              onChange={(event) =>
                setLabel(
                  event.target.value,
                )
              }
            />

            <div className="time-label">
              <label htmlFor="preset-start">
                Start
              </label>

              <label htmlFor="preset-end">
                End
              </label>
            </div>

            <div className="time-inputs">
              <input
                id="preset-start"
                type="time"
                value={startTime}
                onChange={(event) =>
                  setStartTime(
                    event.target.value,
                  )
                }
              />

              <span>→</span>

              <input
                id="preset-end"
                type="time"
                value={endTime}
                onChange={(event) =>
                  setEndTime(
                    event.target.value,
                  )
                }
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {message && (
              <div className="success-message">
                {message}
              </div>
            )}

            <button
              className="save-button"
              type="submit"
            >
              Save Preset
            </button>
          </form>
        </section>

        <section className="dashboard-person">
          <h2>Your presets</h2>

          {presets.length === 0 ? (
            <p>
              No presets created yet.
            </p>
          ) : (
            <div className="employer-list">
              {presets.map(
                (preset) => (
                  <div
                    className="employer-card"
                    key={preset.id}
                  >
                    <div className="employer-header">
                      <div>
                        <strong>
                          {preset.label}
                        </strong>

                        <div>
                          {getPersonName(
                            preset.personId,
                          )}
                        </div>
                      </div>

                      <strong>
                        {formatTime(
                          preset.startTime,
                        )}{" "}
                        →{" "}
                        {formatTime(
                          preset.endTime,
                        )}
                      </strong>
                    </div>

                    <div className="location-list">
                      <div className="location-row">
                        <span>
                          {getEmployerName(
                            preset.workLocationId,
                          )}
                        </span>

                        <span>
                          {getLocation(
                            preset.workLocationId,
                          )?.name ??
                            "Unknown location"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        handleDelete(
                          preset.id,
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}