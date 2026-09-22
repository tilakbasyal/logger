import {
  useEffect,
  useState,
} from "react";

import {
  shiftHistoryService,
} from "../application/services";

import type {
  ShiftHistoryItem,
} from "../application/shifts/shift-history-service";

function formatDuration(
  minutes: number,
): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  return date.toLocaleDateString(
    "en-DK",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

export default function ShiftHistoryPage() {
  const [items, setItems] =
    useState<ShiftHistoryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function loadHistory() {
    setLoading(true);

    const history =
      await shiftHistoryService.getAll();

    setItems(history);

    setLoading(false);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleDelete(
    item: ShiftHistoryItem,
  ) {
    const confirmed =
      window.confirm(
        `Delete this ${formatDuration(
          item.durationMinutes,
        )} shift?`,
      );

    if (!confirmed) {
      return;
    }

    await shiftHistoryService.delete(
      item.shift.id,
    );

    await loadHistory();
  }

  if (loading) {
    return (
      <main className="app-shell">
        <div className="page-container">
          <p>Loading shifts...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="page-container">
        <header className="page-header">
          <h1>Shift History</h1>
          <p>
            All recorded work shifts.
          </p>
        </header>

        {items.length === 0 ? (
          <div className="empty-state">
            No shifts recorded yet.
          </div>
        ) : (
          <div className="shift-list">
            {items.map((item) => (
              <article
                className="shift-card"
                key={item.shift.id}
              >
                <div className="shift-card-top">
                  <strong>
                    {item.personName}
                  </strong>

                  <span>
                    {formatDate(
                      item.shift.startAt,
                    )}
                  </span>
                </div>

                <div className="shift-location">
                  {item.employerName}
                  {" · "}
                  {item.locationName}
                </div>

                <div className="shift-time">
                  <span>
                    {new Date(
                      item.shift.startAt,
                    ).toLocaleTimeString(
                      "en-DK",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>

                  <span>→</span>

                  <span>
                    {new Date(
                      item.shift.endAt,
                    ).toLocaleTimeString(
                      "en-DK",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>

                  <strong>
                    {formatDuration(
                      item.durationMinutes,
                    )}
                  </strong>
                </div>

                <div className="shift-actions">
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      handleDelete(item)
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}