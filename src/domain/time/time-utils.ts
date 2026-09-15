/**
 * Parse a local date/time string such as:
 *
 * 2026-09-15T17:00
 *
 * The application currently operates in Denmark,
 * so date/time values are interpreted in the browser's
 * local timezone.
 */
export function parseLocalDateTime(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date/time: ${value}`);
  }

  return date;
}

/**
 * Convert a Date to an ISO-like local date/time string:
 *
 * 2026-09-15T17:00
 *
 * No timezone suffix is included because our domain currently
 * represents Danish local work times.
 */
export function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get the start of the calendar day containing the given date.
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

/**
 * Get the start of the next calendar day.
 */
export function startOfNextDay(date: Date): Date {
  const result = startOfDay(date);

  result.setDate(result.getDate() + 1);

  return result;
}

/**
 * Calculate elapsed minutes between two dates.
 */
export function differenceInMinutes(
  start: Date,
  end: Date,
): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}