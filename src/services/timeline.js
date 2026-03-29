import { rrulestr } from "rrule";
import { getBlueprints, getActiveTasks } from "../db.js";
import { getDatesForViewWindow, parseDateToJSDate, formatJSDateToIso, getToday } from "../utils/dates.js";
import { Temporal } from "@js-temporal/polyfill";

export function generateTimelineData(startDateIso, endDateIso) {
  const todayIso = getToday().toString();
  
  // If no dates provided, fall back to a default window
  if (!startDateIso || !endDateIso) {
    const defaultWindow = getDatesForViewWindow(2, 4);
    startDateIso = defaultWindow.windowStartStr;
    endDateIso = defaultWindow.windowEndStr;
  }

  const windowStart = Temporal.PlainDate.from(startDateIso);
  const windowEnd = Temporal.PlainDate.from(endDateIso);

  const blueprints = getBlueprints();
  const activeTasks = getActiveTasks(startDateIso, endDateIso);
  
  // Index active tasks for quick lookup
  const activeTasksMap = new Map();
  for (const task of activeTasks) {
    activeTasksMap.set(`${task.blueprint_id}_${task.scheduled_date}`, task);
  }

  const jsWindowStartStr = parseDateToJSDate(startDateIso);
  const jsWindowEndStr = parseDateToJSDate(endDateIso);

  const occurrences = [];

  for (const bp of blueprints) {
    if (!bp.rrule_string) continue;
    
    try {
      const rule = rrulestr(bp.rrule_string, {
        dtstart: parseDateToJSDate(bp.start_date)
      });
      
      const dates = rule.between(jsWindowStartStr, jsWindowEndStr, true);
      
      for (const date of dates) {
        const isoDate = formatJSDateToIso(date);
        
        // Check overrides
        const override = activeTasksMap.get(`${bp.id}_${isoDate}`);
        const isCompleted = override ? override.is_completed === 1 : false;
        
        // Combine Blueprint logs with Active Task logs
        const blueprintLogs = bp.logs || '';
        const taskLogs = override ? override.logs || '' : '';
        const combinedLogs = (blueprintLogs + (taskLogs ? '\n' + taskLogs : '')).trim();

        occurrences.push({
          blueprint_id: bp.id,
          title: bp.title,
          rrule_string: bp.rrule_string,
          start_date: bp.start_date,
          scheduled_date: isoDate,
          is_completed: isCompleted,
          logs: combinedLogs || null,
          plainDate: Temporal.PlainDate.from(isoDate)
        });
      }
    } catch (err) {
      console.error(`Failed to parse rrule for blueprint ${bp.id}:`, err);
    }
  }

  // Sort occurrences by date
  occurrences.sort((a, b) => Temporal.PlainDate.compare(a.plainDate, b.plainDate));

  // Group by Week, then by Day
  const groupedData = [];
  const dayMap = new Map();
  let currentWeekStart = windowStart;
  
  // Create all weeks in the window
  while (Temporal.PlainDate.compare(currentWeekStart, windowEnd) <= 0) {
    const nextWeekStart = currentWeekStart.add({ weeks: 1 });
    const lastDayOfWeek = nextWeekStart.subtract({ days: 1 });
    
    const startMonth = currentWeekStart.toLocaleString("en-US", { month: "short" });
    const endMonth = lastDayOfWeek.toLocaleString("en-US", { month: "short" });
    const monthDisplay = startMonth === endMonth ? startMonth : `${endMonth} / ${startMonth}`;

    const weekStr = currentWeekStart.toString();
    const todayPlain = Temporal.PlainDate.from(todayIso);
    const isCurrentWeek = Temporal.PlainDate.compare(currentWeekStart, todayPlain) <= 0 &&
                          Temporal.PlainDate.compare(nextWeekStart, todayPlain) > 0;
    
    const week = {
      weekStr: weekStr,
      monthName: monthDisplay,
      isCurrentWeek: isCurrentWeek,
      days: []
    };
    
    // Create all 7 days for the week
    for (let i = 0; i < 7; i++) {
      const dayDate = currentWeekStart.add({ days: i });
      const dayDateStr = dayDate.toString();
      const day = {
        dateStr: dayDateStr,
        dayOfWeek: dayDate.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
        dayOfMonth: dayDate.day,
        isToday: dayDateStr === todayIso,
        tasks: []
      };
      week.days.push(day);
      dayMap.set(dayDateStr, day);
    }
    
    groupedData.push(week);
    currentWeekStart = nextWeekStart;
  }

  // Populate tasks into the grouped structure efficiently
  for (const task of occurrences) {
    const day = dayMap.get(task.scheduled_date);
    if (day) {
      day.tasks.push(task);
    }
  }

  return groupedData;
}
