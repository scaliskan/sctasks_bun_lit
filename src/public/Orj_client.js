import { html, render } from "lit";
import { timelineTemplate, modalTemplate } from "./templates.js";

console.log("Client script starting...");

const appContainer = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const initialDataElement = document.getElementById("initial-data");

let state = [];
try {
  if (initialDataElement) {
    state = JSON.parse(initialDataElement.textContent);
    console.log("Initial state successfully parsed:", state);
  }
} catch (err) {
  console.error("Failed to parse initial data:", err);
}

// Global action handler
window.handleAction = async (action, task) => {
  console.log(`Action Triggered: ${action}`, task);

  if (action === "toggle") {
    try {
      const res = await fetch("/api/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprint_id: task.blueprint_id,
          scheduled_date: task.scheduled_date,
          is_completed: task.is_completed,
        }),
      });
      if (res.ok) await window.refreshTimeline();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  } else if (action === "delete") {
    window.openModal(
      "Delete Task",
      html`
        <div class="space-y-4">
          <p class="text-slate-600">Are you sure you want to delete <span class="font-bold text-slate-800">"${task.title}"</span>?</p>
          <div class="flex justify-end space-x-3 mt-6">
            <button @click=${() => window.closeModal()} class="px-4 py-2 text-slate-500 font-semibold">Cancel</button>
            <button
              @click=${async () => {
                const res = await fetch("/api/blueprints/delete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: task.blueprint_id }),
                });
                if (res.ok) {
                  window.closeModal();
                  await window.refreshTimeline();
                }
              }}
              class="px-6 py-2 bg-red-600 text-white rounded-lg font-bold"
            >
              Delete
            </button>
          </div>
        </div>
      `,
    );
  } else if (action === "edit") {
    window.openModal(
      "Edit Task",
      html`
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Task Title</label>
            <input type="text" id="edit-task-title" class="w-full px-4 py-2 rounded-lg border border-gray-300" .value="${task.title}" />
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
            <input type="date" id="edit-task-date" class="w-full px-4 py-2 rounded-lg border border-gray-300" .value="${task.start_date}" />
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Recurrence (RRule)</label>
            <input
              type="text"
              id="edit-task-rrule"
              class="w-full px-4 py-2 rounded-lg border border-gray-300"
              .value="${task.rrule_string}"
            />
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button @click=${() => window.closeModal()} class="px-4 py-2 text-slate-500 font-semibold">Cancel</button>
            <button
              @click=${async () => {
                const title = document.getElementById("edit-task-title").value;
                const start_date = document.getElementById("edit-task-date").value;
                const rrule_string = document.getElementById("edit-task-rrule").value || "FREQ=DAILY;COUNT=1";
                const res = await fetch("/api/blueprints/update", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: task.blueprint_id, title, start_date, rrule_string }),
                });
                if (res.ok) {
                  window.closeModal();
                  await window.refreshTimeline();
                }
              }}
              class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold"
            >
              Save
            </button>
          </div>
        </div>
      `,
    );
  } else if (action === "log") {
    const logEntries = task.logs
      ? task.logs
          .split("\n")
          .filter((line) => line.trim())
          .reverse()
      : [];

    window.openModal(
      "Task Information",
      html`
        <div class="space-y-4">
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="text-sm font-bold text-slate-700">${task.title}</div>
            <div class="text-xs text-slate-500 mt-1">${task.rrule_string}</div>
          </div>
          ${logEntries.length > 0
            ? html`
                <div class="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  ${logEntries.map(
                    (log) => html`
                      <div
                        class="text-[11px] p-1 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed text-slate-600 font-medium"
                      >
                        ${log}
                      </div>
                    `,
                  )}
                </div>
              `
            : ""}
          <textarea
            id="log-entry"
            rows="2"
            placeholder="Add a note..."
            class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 bg-slate-50/50"
          ></textarea>
          <div class="flex justify-end space-x-3 pt-2">
            <button
              @click=${() => window.closeModal()}
              class="px-5 py-2.5 text-slate-500 font-semibold hover:text-slate-800 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              @click=${async () => {
                const entry = document.getElementById("log-entry").value.trim();
                if (!entry) return;
                const timestamp = new Date().toLocaleString();
                const logLine = `[${timestamp}] ${entry}`;
                const newLog = task.logs ? `${task.logs}\n${logLine}` : logLine;
                const res = await fetch("/api/logs", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ blueprint_id: task.blueprint_id, scheduled_date: task.scheduled_date, logs: newLog }),
                });
                if (res.ok) {
                  window.closeModal();
                  await window.refreshTimeline();
                }
              }}
              class="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] text-sm"
            >
              Save Log
            </button>
          </div>
        </div>
      `,
    );
  }
};

window.openModal = (title, content) => {
  if (modalRoot) {
    render(modalTemplate(title, content, true), modalRoot);
    document.body.classList.add("modal-open");
  }
};

window.closeModal = () => {
  if (modalRoot) {
    render(modalTemplate("", html``, false), modalRoot);
    document.body.classList.remove("modal-open");
  }
};

window.refreshTimeline = async () => {
  console.log("Refreshing data...");
  try {
    const timelineRes = await fetch("/api/timeline");
    state = await timelineRes.json();
    updateUI();
  } catch (err) {
    console.error("Refresh failed:", err);
  }
};

function updateUI() {
  console.log("Rendering UI...");
  if (appContainer) {
    render(timelineTemplate(state), appContainer);
  }
}

// CRITICAL: Clear the container before first client-side render
// to avoid any mismatch with SSR markers.
if (appContainer) {
  appContainer.innerHTML = "";
  updateUI();
}

// Wire FAB buttons
document.getElementById("btn-add")?.addEventListener("click", () => {
  const today = new Date().toISOString().split("T")[0];
  window.openModal(
    "Add New Task",
    html`
      <div class="space-y-4">
        <input type="text" id="new-task-title" placeholder="Task Title" class="w-full px-4 py-2 rounded-lg border" />
        <input type="date" id="new-task-date" .value="${today}" class="w-full px-4 py-2 rounded-lg border" />
        <input type="text" id="new-task-rrule" placeholder="FREQ=DAILY;INTERVAL=1" class="w-full px-4 py-2 rounded-lg border" />
        <div class="flex justify-end space-x-3">
          <button @click=${() => window.closeModal()} class="px-4 py-2 text-slate-500 font-semibold">Cancel</button>
          <button
            @click=${async () => {
              const title = document.getElementById("new-task-title").value;
              const start_date = document.getElementById("new-task-date").value;
              const rrule_string = document.getElementById("new-task-rrule").value || "FREQ=DAILY;COUNT=1";

              if (!title || !start_date) {
                alert("Title and Start Date are required");
                return;
              }

              const res = await fetch("/api/blueprints", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, start_date, rrule_string }),
              });
              if (res.ok) {
                window.closeModal();
                await window.refreshTimeline();
              }
            }}
            class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold"
          >
            Create
          </button>
        </div>
      </div>
    `,
  );
});

document.getElementById("btn-today")?.addEventListener("click", () => {
  document.getElementById("current-week")?.scrollIntoView({ behavior: "smooth", block: "center" });
});

// ESC key listener to close modals
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    window.closeModal();
  }
});

console.log("Client script initialized.");
