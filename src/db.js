import { Database } from "bun:sqlite";

const db = new Database("tasks.db");

// Initialize schema if not exists
function initDb() {
  db.run(`
    CREATE TABLE IF NOT EXISTS blueprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      start_date TEXT NOT NULL,
      rrule_string TEXT NOT NULL,
      is_trashed INTEGER DEFAULT 0,
      logs TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS active_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blueprint_id INTEGER NOT NULL,
      scheduled_date TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      is_trashed INTEGER DEFAULT 0,
      logs TEXT,
      UNIQUE(blueprint_id, scheduled_date)
    );
  `);

  // Indexing for performance on date-range queries
  db.run("CREATE INDEX IF NOT EXISTS idx_active_tasks_date ON active_tasks(scheduled_date)");
  db.run("CREATE INDEX IF NOT EXISTS idx_blueprints_trashed ON blueprints(is_trashed)");
}

initDb();

function getTimestamp() {
  return new Date().toISOString();
}

export function getBlueprints() {
  const query = db.query("SELECT * FROM blueprints WHERE is_trashed = 0");
  return query.all();
}

export function getActiveTasks(startDate, endDate) {
  const query = db.query(
    "SELECT * FROM active_tasks WHERE scheduled_date >= ? AND scheduled_date <= ? AND is_trashed = 0"
  );
  return query.all(startDate, endDate);
}

export function toggleTask(blueprintId, scheduledDate, isCompleted) {
  const timestamp = getTimestamp();
  const action = isCompleted ? "Completed" : "Uncompleted";
  const logEntry = `[${timestamp}] ${action}\n`;

  const query = db.query(`
    INSERT INTO active_tasks (blueprint_id, scheduled_date, is_completed, logs, is_trashed)
    VALUES (?, ?, ?, ?, 0)
    ON CONFLICT(blueprint_id, scheduled_date) DO UPDATE SET 
      is_completed = excluded.is_completed,
      logs = COALESCE(active_tasks.logs, '') || excluded.logs;
  `);
  query.run(blueprintId, scheduledDate, isCompleted, logEntry);
}

export function addBlueprint(title, startDate, rruleString) {
  const timestamp = getTimestamp();
  const logEntry = `[${timestamp}] Created (Start: ${startDate}, RRule: ${rruleString})\n`;
  
  const query = db.query(`
    INSERT INTO blueprints (title, start_date, rrule_string, logs, is_trashed)
    VALUES (?, ?, ?, ?, 0)
  `);
  return query.run(title, startDate, rruleString, logEntry);
}

export function importBlueprints(blueprints) {
  const timestamp = getTimestamp();
  const insert = db.prepare(`
    INSERT INTO blueprints (title, start_date, rrule_string, logs, is_trashed)
    VALUES ($title, $start_date, $rrule_string, $logs, 0)
  `);

  const transaction = db.transaction((items) => {
    for (const item of items) {
      const logEntry = `[${timestamp}] Imported (Start: ${item.start_date}, RRule: ${item.rrule_string})\n`;
      insert.run({
        $title: item.title,
        $start_date: item.start_date,
        $rrule_string: item.rrule_string,
        $logs: logEntry
      });
    }
    return items.length;
  });

  return transaction(blueprints);
}

export function updateBlueprint(id, title, rruleString, startDate) {
  const timestamp = getTimestamp();
  const logEntry = `[${timestamp}] Edited (Title: ${title}, RRule: ${rruleString}, Start: ${startDate})\n`;

  const query = db.query(`
    UPDATE blueprints 
    SET title = ?, rrule_string = ?, start_date = ?, logs = COALESCE(logs, '') || ?
    WHERE id = ?
  `);
  return query.run(title, rruleString, startDate, logEntry, id);
}

export function deleteBlueprint(id) {
  const timestamp = getTimestamp();
  const logEntry = `[${timestamp}] Deleted (Trashed)\n`;

  const query = db.query(`
    UPDATE blueprints 
    SET is_trashed = 1, logs = COALESCE(logs, '') || ?
    WHERE id = ?
  `);
  return query.run(logEntry, id);
}

export function updateTaskLogs(blueprintId, scheduledDate, logs) {
  const query = db.query(`
    INSERT INTO active_tasks (blueprint_id, scheduled_date, logs, is_completed, is_trashed)
    VALUES (?, ?, ?, 0, 0)
    ON CONFLICT(blueprint_id, scheduled_date) DO UPDATE SET logs = excluded.logs;
  `);
  query.run(blueprintId, scheduledDate, logs);
}

export default db;
