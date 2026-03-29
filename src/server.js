import { Elysia } from "elysia";
import { rrulestr } from "rrule";
import { generateTimelineData } from "./services/timeline.js";
import { renderLayout, timelineTemplate } from "./views/templates.js";
import { renderToString } from "./utils/ssr.js";
import { 
  toggleTask, 
  getBlueprints, 
  addBlueprint, 
  updateTaskLogs, 
  updateBlueprint, 
  deleteBlueprint,
  importBlueprints
} from "./db.js";

const app = new Elysia()
  // 1. Static Files (Optimized using Bun.file)
  .get("/client.js", () => Bun.file("./src/public/client.js"))
  .get("/templates.js", () => Bun.file("./src/views/templates.js"))

  // 2. SSR Main Page
  .get("/", () => {
    const timelineData = generateTimelineData();
    const timelineHtml = renderToString(timelineTemplate(timelineData));
    return new Response(renderLayout(timelineHtml, timelineData), {
      headers: { "Content-Type": "text/html" },
    });
  })

  // 3. API Group
  .group("/api", (app) => 
    app
      .get("/timeline", ({ query }) => {
        const { start, end } = query;
        return generateTimelineData(start, end);
      })
      .get("/blueprints", () => getBlueprints())
      .post("/blueprints", ({ body, set }) => {
        const { title, start_date, rrule_string } = body;
        if (!title || !start_date || !rrule_string) {
          set.status = 400;
          return { error: "Missing parameters" };
        }
        try {
          rrulestr(rrule_string);
        } catch (e) {
          set.status = 400;
          return { error: "Invalid RRule string" };
        }
        addBlueprint(title, start_date, rrule_string);
        return { success: true };
      })
      .post("/blueprints/import", async ({ body, set }) => {
        const { file } = body;
        if (!file) {
          set.status = 400;
          return { error: "No file uploaded" };
        }

        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        
        // Skip header
        const dataRows = lines.slice(1);
        const blueprints = dataRows.map(line => {
          // Simple CSV parse: title, start_date, rrule_string
          // Handles cases where there might be commas in RRule or Title if we're careful.
          // For now, assume title, date, and then the rest is rrule.
          const parts = line.split(",").map(p => p.trim());
          if (parts.length < 3) return null;
          
          return {
            title: parts[0],
            start_date: parts[1],
            rrule_string: parts.slice(2).join(",") // Join back in case RRule had commas
          };
        }).filter(b => b !== null);

        if (blueprints.length === 0) {
          set.status = 400;
          return { error: "No valid data found" };
        }

        importBlueprints(blueprints);
        return { success: true, count: blueprints.length };
      })
      .post("/blueprints/update", ({ body, set }) => {
        const { id, title, rrule_string, start_date } = body;
        if (!id || !title || !rrule_string || !start_date) {
          set.status = 400;
          return { error: "Missing parameters" };
        }
        try {
          rrulestr(rrule_string);
        } catch (e) {
          set.status = 400;
          return { error: "Invalid RRule string" };
        }
        updateBlueprint(id, title, rrule_string, start_date);
        return { success: true };
      })
      .post("/blueprints/delete", ({ body, set }) => {
        const { id } = body;
        if (!id) {
          set.status = 400;
          return { error: "Missing ID" };
        }
        deleteBlueprint(id);
        return { success: true };
      })
      .post("/logs", ({ body, set }) => {
        const { blueprint_id, scheduled_date, logs } = body;
        if (!blueprint_id || !scheduled_date || logs === undefined) {
          set.status = 400;
          return { error: "Missing parameters" };
        }
        updateTaskLogs(blueprint_id, scheduled_date, logs);
        return { success: true };
      })
      .post("/toggle", ({ body, set }) => {
        const { blueprint_id, scheduled_date, is_completed } = body;
        if (!blueprint_id || !scheduled_date || is_completed === undefined) {
          set.status = 400;
          return { error: "Missing parameters" };
        }
        toggleTask(blueprint_id, scheduled_date, is_completed);
        return { success: true };
      })
  )
  .listen(3000);

console.log(`Server is running at http://localhost:3000`);
