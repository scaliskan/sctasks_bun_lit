import { Temporal } from "@js-temporal/polyfill";

export function getToday() {
  // Use user's local timezone if known, or system default. For simplicity, we use system timezone.
  return Temporal.Now.plainDateISO();
}

export function getStartOfWeek(date) {
  // ISO day of week (1 = Monday, 7 = Sunday)
  const daysSinceMonday = date.dayOfWeek - 1;
  return date.subtract({ days: daysSinceMonday });
}

export function getDatesForViewWindow(weeksPast = 0, weeksFuture = 3) {
  const today = getToday();
  const startOfCurrentWeek = getStartOfWeek(today);
  
  const windowStart = startOfCurrentWeek.subtract({ weeks: weeksPast });
  const windowEnd = startOfCurrentWeek.add({ weeks: weeksFuture + 1 }).subtract({ days: 1 });
  
  return {
    windowStart,
    windowEnd,
    windowStartStr: windowStart.toString(),
    windowEndStr: windowEnd.toString(),
  };
}

export function getWeekRange(dateIso, offsetWeeks = 0) {
  const date = Temporal.PlainDate.from(dateIso);
  const startOfTargetWeek = getStartOfWeek(date).add({ weeks: offsetWeeks });
  const endOfTargetWeek = startOfTargetWeek.add({ days: 6 });
  
  return {
    startStr: startOfTargetWeek.toString(),
    endStr: endOfTargetWeek.toString()
  };
}

// Helper to format date strings to JavaScript Date objects needed for rrule
export function parseDateToJSDate(dateStr) {
  // Temporal PlainDate from YYYY-MM-DD
  const plainDate = Temporal.PlainDate.from(dateStr);
  // RRule works with UTC JS Date objects conceptually, so we map the date to UTC to avoid timezone shifts
  return new Date(Date.UTC(plainDate.year, plainDate.month - 1, plainDate.day));
}

export function formatJSDateToIso(jsDate) {
  const year = jsDate.getUTCFullYear();
  const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jsDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
