import { useEffect, useState, type FormEvent } from "react";
import type { Person } from "../domain/person/person";
import type { Employer } from "../domain/employer/employer";
import type { WorkLocation } from "../domain/employer/work-location";
import type { ShiftPreset } from "../domain/shift/shift-preset";
import {
  configurationService,
  shiftPresetService,
  shiftService,
} from "../application/services";

function getToday(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) {
    return 0;
  }

  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  let duration =
    endHours * 60 +
    endMinutes -
    (startHours * 60 + startMinutes);

  if (duration < 0) {
    duration += 24 * 60;
  }

  return duration;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

function addOneDay(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AddShiftPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [allLocations, setAllLocations] = useState<WorkLocation[]>([]);
  const [presets, setPresets] = useState<ShiftPreset[]>([]);

  const [personId, setPersonId] = useState("");
  const [employerId, setEmployerId] = useState("");
  const [workLocationId, setWorkLocationId] = useState("");

  const [date, setDate] = useState(getToday());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const duration = calculateDuration(startTime, endTime);

  /*
   * Initial configuration loading.
   */
  useEffect(() => {
    async function loadConfiguration() {
      const [loadedPeople, loadedEmployers] =
        await Promise.all([
          configurationService.getPeople(),
          configurationService.getEmployers(),
        ]);

      setPeople(loadedPeople);
      setEmployers(loadedEmployers);

      if (loadedPeople.length > 0) {
        setPersonId(loadedPeople[0].id);
      }

      const locationGroups = await Promise.all(
        loadedEmployers.map((employer) =>
          configurationService.getLocationsForEmployer(employer.id)
        )
      );

      setAllLocations(locationGroups.flat());
    }

    loadConfiguration();
  }, []);

  /*
   * Load presets whenever the selected person changes.
   */
  useEffect(() => {
    async function loadPresets() {
      if (!personId) {
        setPresets([]);
        return;
      }

      const loadedPresets =
        await shiftPresetService.getPersonPresets(personId);

      setPresets(loadedPresets);
    }

    loadPresets();
  }, [personId]);

  /*
   * Load locations whenever the employer changes.
   *
   * If the currently selected location still belongs to the new
   * employer, keep it. This is important when applying a preset.
   */
  useEffect(() => {
    async function loadLocations() {
      if (!employerId) {
        setLocations([]);
        setWorkLocationId("");
        return;
      }

      const loadedLocations =
        await configurationService.getLocationsForEmployer(
          employerId
        );

      setLocations(loadedLocations);

      setWorkLocationId((currentLocationId) => {
        const currentStillExists = loadedLocations.some(
          (location) => location.id === currentLocationId
        );

        if (currentStillExists) {
          return currentLocationId;
        }

        return loadedLocations[0]?.id ?? "";
      });
    }

    loadLocations();
  }, [employerId]);

  function handlePresetSelect(preset: ShiftPreset) {
    setError("");
    setMessage("");

    const location = allLocations.find(
      (item) => item.id === preset.workLocationId
    );

    if (!location) {
      setError(
        "The location for this preset could not be found."
      );
      return;
    }

    setEmployerId(location.employerId);
    setWorkLocationId(location.id);

    setStartTime(preset.startTime);
    setEndTime(preset.endTime);

    setMessage(`Preset loaded: ${preset.label}`);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!personId) {
      setError("Please select a person.");
      return;
    }

    if (!employerId) {
      setError("Please select an employer.");
      return;
    }

    if (!workLocationId) {
      setError("Please select a work location.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (!startTime || !endTime) {
      setError("Please enter both start and end time.");
      return;
    }

    if (duration <= 0) {
      setError("The shift duration must be greater than zero.");
      return;
    }

    const crossesMidnight = endTime < startTime;

    const endDate = crossesMidnight
      ? addOneDay(date)
      : date;

    await shiftService.createShift({
      personId,
      workLocationId,
      startAt: `${date}T${startTime}`,
      endAt: `${endDate}T${endTime}`,
    });

    setMessage(
      `Work shift saved — ${formatDuration(duration)}.`
    );

    setStartTime("");
    setEndTime("");
  }

  return (
    <main>
      <div className="page-container">
        <header>
          <h1>Add Work</h1>
          <p>Record a completed work shift.</p>
        </header>

        {presets.length > 0 && (
          <section className="quick-presets">
            <h2>Quick Shifts</h2>

            <div className="preset-buttons">
              {presets.map((preset) => {
                const location = allLocations.find(
                  (item) =>
                    item.id === preset.workLocationId
                );

                const employer = employers.find(
                  (item) =>
                    item.id === location?.employerId
                );

                return (
                  <button
                    key={preset.id}
                    type="button"
                    className="preset-button"
                    onClick={() =>
                      handlePresetSelect(preset)
                    }
                  >
                    <strong>{preset.label}</strong>

                    <span>
                      {employer?.name ?? "Unknown employer"}{" "}
                      ·{" "}
                      {location?.name ?? "Unknown location"}
                    </span>

                    <span>
                      {preset.startTime} →{" "}
                      {preset.endTime}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <form
          className="shift-form"
          onSubmit={handleSubmit}
        >
          <div className="form-section">
            <label>Person</label>

            <div className="person-buttons">
              {people.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className={
                    personId === person.id
                      ? "person-button active"
                      : "person-button"
                  }
                  onClick={() => setPersonId(person.id)}
                >
                  {person.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label htmlFor="employer">
              Employer
            </label>

            <select
              id="employer"
              value={employerId}
              onChange={(event) =>
                setEmployerId(event.target.value)
              }
            >
              <option value="">
                Select employer
              </option>

              {employers.map((employer) => (
                <option
                  key={employer.id}
                  value={employer.id}
                >
                  {employer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label htmlFor="location">
              Work location
            </label>

            <select
              id="location"
              value={workLocationId}
              onChange={(event) =>
                setWorkLocationId(event.target.value)
              }
              disabled={!employerId}
            >
              <option value="">
                Select location
              </option>

              {locations.map((location) => (
                <option
                  key={location.id}
                  value={location.id}
                >
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label htmlFor="date">
              Date
            </label>

            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />
          </div>

          <div className="time-row">
            <div className="form-section">
              <label htmlFor="startTime">
                Start
              </label>

              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(event) =>
                  setStartTime(event.target.value)
                }
              />
            </div>

            <div className="form-section">
              <label htmlFor="endTime">
                End
              </label>

              <input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(event) =>
                  setEndTime(event.target.value)
                }
              />
            </div>
          </div>

          {duration > 0 && (
            <div className="duration-preview">
              <strong>
                {formatDuration(duration)}
              </strong>

              {endTime < startTime && (
                <span>
                  Overnight shift — ends the next day
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="form-message error">
              {error}
            </div>
          )}

          {message && (
            <div className="form-message success">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="primary-button"
          >
            Save Work
          </button>
        </form>
      </div>
    </main>
  );
}