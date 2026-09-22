import {
  useEffect,
  useState,
} from "react";

import {
  dashboardService,
} from "../application/services";

import type {
  DashboardData,
  PersonDashboard,
} from "../application/dashboard/dashboard-service";

function formatHours(
  minutes: number,
): string {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remaining} min`;
}

function formatMonth(
  year: number,
  month: number,
): string {
  return new Date(
    year,
    month - 1,
    1,
  ).toLocaleDateString(
    "en-DK",
    {
      month: "long",
      year: "numeric",
    },
  );
}

function formatPayrollDate(
  value: string,
): string {
  const date = new Date(value);

  return date.toLocaleDateString(
    "en-DK",
    {
      day: "numeric",
      month: "short",
    },
  );
}

function PersonSection({
  data,
}: {
  data: PersonDashboard;
}) {
  return (
    <section className="dashboard-person">
      <h2>{data.person.name}</h2>

      {/* Calendar-month / 90-hour section */}
      {data.limit && (
        <div className="limit-card">
          <div className="limit-header">
            <span>
              Monthly hours
            </span>

            <strong>
              {formatHours(
                data.monthlyMinutes,
              )}{" "}
              /{" "}
              {formatHours(
                data.limit.maxMinutes,
              )}
            </strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(
                  (data.monthlyMinutes /
                    data.limit
                      .maxMinutes) *
                    100,
                  100,
                )}%`,
              }}
            />
          </div>

          <div className="remaining">
            {data.limit.exceeded
              ? "Monthly limit exceeded"
              : `${formatHours(
                  data.limit
                    .remainingMinutes,
                )} remaining`}
          </div>
        </div>
      )}

      {/* Calendar-month employer hours */}
      <div className="employer-list">
        {data.employerHours.map(
          (employer) => (
            <div
              className="employer-card"
              key={employer.employerId}
            >
              <div className="employer-header">
                <strong>
                  {employer.employerName}
                </strong>

                <strong>
                  {formatHours(
                    employer.minutes,
                  )}
                </strong>
              </div>

              <div className="location-list">
                {employer.locations.map(
                  (location) => (
                    <div
                      className="location-row"
                      key={
                        location.locationId
                      }
                    >
                      <span>
                        {
                          location.locationName
                        }
                      </span>

                      <span>
                        {formatHours(
                          location.minutes,
                        )}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </div>

      {/* Payroll-period hours */}
      {data.payrollEmployerHours.length >
        0 && (
        <section className="dashboard-payroll">
          <h3>Payroll period</h3>

          {data.payrollEmployerHours.map(
            (employer) => (
              <div
                className="employer-card payroll-card"
                key={employer.employerId}
              >
                <div className="employer-header">
                  <strong>
                    {employer.employerName}
                  </strong>

                  <strong>
                    {formatHours(
                      employer.minutes,
                    )}
                  </strong>
                </div>

                <div className="dashboard-payroll-period">
                  {formatPayrollDate(
                    employer.periodStart,
                  )}{" "}
                  –{" "}
                  {formatPayrollDate(
                    employer.periodEnd,
                  )}
                </div>

                <div className="location-list">
                  {employer.locations.map(
                    (location) => (
                      <div
                        className="location-row"
                        key={
                          location.locationId
                        }
                      >
                        <span>
                          {
                            location.locationName
                          }
                        </span>

                        <span>
                          {formatHours(
                            location.minutes,
                          )}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ),
          )}
        </section>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const now = new Date();

  const [
    dashboard,
    setDashboard,
  ] = useState<
    DashboardData | undefined
  >();

  useEffect(() => {
    async function load() {
      const result =
        await dashboardService.getDashboardData(
          now.getFullYear(),
          now.getMonth() + 1,
          now,
        );

      setDashboard(result);
    }

    load();
  }, []);

  if (!dashboard) {
    return (
      <main className="app-shell">
        <div className="page-container">
          <p>
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="page-container">
        <header className="page-header">
          <h1>Work Hours</h1>

          <p>
            {formatMonth(
              dashboard.year,
              dashboard.month,
            )}
          </p>
        </header>

        {dashboard.people.map(
          (person) => (
            <PersonSection
              key={person.person.id}
              data={person}
            />
          ),
        )}
      </div>
    </main>
  );
}