import { html } from "lit";

// --- Helpers & Icons ---

export const icons = {
  log: html`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>`,
  edit: html`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
    />
  </svg>`,
  delete: html`<svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="2"
    stroke="currentColor"
    class="w-4 h-4"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>`,
  close: html`<svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="2"
    stroke="currentColor"
    class="w-5 h-5"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>`,
  today: html`<svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="2"
    stroke="currentColor"
    class="w-6 h-6"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </svg>`,
  add: html`<svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="2.5"
    stroke="currentColor"
    class="w-7 h-7"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>`,
};

const btnClass = "p-1 text-slate-400 transition-colors";

// --- Main Templates ---

export const taskTemplate = (task) => html`
  <div class="flex items-center group py-0.5 w-full">
    <label class="flex items-center space-x-2 cursor-pointer select-none flex-1 min-w-0">
      <input
        type="checkbox"
        class="task-checkbox h-4 w-4 rounded border-gray-300 focus:ring-blue-500 shrink-0 transition-all ${task.is_completed
          ? "text-slate-400 opacity-30 grayscale"
          : "text-blue-600"}"
        ?checked=${task.is_completed}
        @change=${(e) => window.handleAction && window.handleAction("toggle", { ...task, is_completed: e.target.checked })}
      />
      <span
        class="truncate ${task.is_completed ? "line-through text-slate-400" : "text-slate-700 font-semibold group-hover:text-slate-900"}"
      >
        ${task.title}
      </span>
    </label>
    <div class="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
      <button @click=${() => window.handleAction("log", task)} class="${btnClass} hover:text-blue-600" title="Log info">
        ${icons.log}
      </button>
      <button @click=${() => window.handleAction("edit", task)} class="${btnClass} hover:text-emerald-600" title="Edit task">
        ${icons.edit}
      </button>
      <button @click=${() => window.handleAction("delete", task)} class="${btnClass} hover:text-red-600" title="Delete task">
        ${icons.delete}
      </button>
    </div>
  </div>
`;

export const dayTemplate = (day) => {
  const isWeekend = day.dayOfWeek === "SUN" || day.dayOfWeek === "SAT";
  const accentClass = day.isToday ? "text-amber-700" : isWeekend ? "text-red-400" : "";

  return html`
    <li
      class="flex border-b border-gray-100 last:border-0 ${day.isToday
        ? "bg-amber-50"
        : "hover:bg-slate-50"} transition-colors min-h-[32px]"
    >
      <div class="w-24 p-2 flex justify-between text-slate-500 text-sm font-bold border-r border-gray-100 shrink-0">
        <span class="${accentClass}">${day.dayOfWeek}</span>
        <span class="${day.isToday ? "text-amber-700" : ""}">${day.dayOfMonth}</span>
      </div>
      <div class="flex-1 p-2 flex flex-col space-y-0.5">${day.tasks.map(taskTemplate)}</div>
    </li>
  `;
};

export const weekTemplate = (week) => {
  const baseClass = "bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow mb-4 overflow-hidden flex";
  const currentClass = week.isCurrentWeek ? "border-2 border-blue-400 ring-4 ring-blue-400 ring-opacity-10" : "border border-gray-200";
  const sideBg = week.isCurrentWeek ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-slate-100 text-slate-500 border-gray-200";
  const headBg = week.isCurrentWeek ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-500 border-gray-200";

  return html`
    <div id="${week.isCurrentWeek ? "current-week" : ""}" class="${baseClass} ${currentClass}">
      <div class="w-8 flex-shrink-0 flex items-center justify-center border-r ${sideBg}">
        <div class="rotate-[-90deg] whitespace-nowrap font-black text-[10px] tracking-widest uppercase">${week.monthName}</div>
      </div>
      <div class="flex-1">
        <div class="${headBg} p-2 font-bold text-xs tracking-wider uppercase">${week.weekStr}</div>
        <ul>
          ${week.days.map(dayTemplate)}
        </ul>
      </div>
    </div>
  `;
};

export const timelineTemplate = (groupedData) =>
  groupedData.length === 0 ? html`<div class="text-center p-8 text-slate-500">No data available</div>` : groupedData.map(weekTemplate);

export const modalTemplate = (title, content, isOpen) => html`
  <div
    id="modal-container"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen
      ? "opacity-100"
      : "opacity-0 pointer-events-none"}"
  >
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click=${() => window.closeModal()}></div>
    <div
      class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 ${isOpen
        ? "scale-100 translate-y-0"
        : "scale-95 translate-y-4"}"
    >
      <div class="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 class="text-lg font-bold text-slate-800">${title}</h3>
        <button @click=${() => window.closeModal()} class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
          ${icons.close}
        </button>
      </div>
      <div class="p-6">${content}</div>
    </div>
  </div>
`;

// --- Modal Content Templates ---

export const deleteModalTemplate = (task, onConfirm) => html`
  <div class="space-y-4">
    <p class="text-slate-600">Are you sure you want to delete <span class="font-bold text-slate-800">"${task.title}"</span>?</p>
    <div class="flex justify-end space-x-3 mt-6">
      <button @click=${() => window.closeModal()} class="px-4 py-2 text-slate-500 font-semibold">Cancel</button>
      <button @click=${onConfirm} class="px-6 py-2 bg-red-600 text-white rounded-lg font-bold">Delete</button>
    </div>
  </div>
`;

export const taskFormTemplate = (task, onSave) => {
  const isNew = !task.blueprint_id;
  const today = new Date().toISOString().split("T")[0];

  return html`
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-bold text-slate-700 mb-1">Task Title</label>
        <input
          type="text"
          id="task-title"
          class="w-full px-4 py-2 rounded-lg border border-gray-300"
          .value="${task.title || ""}"
          placeholder="Task Title"
        />
      </div>
      <div>
        <label class="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
        <input type="date" id="task-date" class="w-full px-4 py-2 rounded-lg border border-gray-300" .value="${task.start_date || today}" />
      </div>
      <div>
        <label class="block text-sm font-bold text-slate-700 mb-1">Recurrence (RRule)</label>
        <input
          type="text"
          id="task-rrule"
          class="w-full px-4 py-2 rounded-lg border border-gray-300"
          .value="${task.rrule_string || "FREQ=DAILY;COUNT=1"}"
          placeholder="FREQ=DAILY;COUNT=1"
        />
      </div>
      <div class="flex justify-end space-x-3 mt-6">
        <button @click=${() => window.closeModal()} class="px-4 py-2 text-slate-500 font-semibold">Cancel</button>
        <button @click=${onSave} class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">${isNew ? "Create" : "Save"}</button>
      </div>
    </div>
  `;
};

export const logModalTemplate = (task, onSave) => {
  const logEntries = task.logs
    ? task.logs
        .split("\n")
        .filter((l) => l.trim())
        .reverse()
    : [];

  return html`
    <div class="space-y-4">
      <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div class="text-sm font-bold text-slate-700">${task.title}</div>
        <div class="text-xs text-slate-500 mt-1">${task.rrule_string}</div>
      </div>
      ${logEntries.length > 0
        ? html` <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 mt-1 max-h-40 overflow-y-auto">
            ${logEntries.map((log) => html`<div>${log}</div>`)}
          </div>`
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
          @click=${onSave}
          class="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] text-sm"
        >
          Save Log
        </button>
      </div>
    </div>
  `;
};

// --- Layout ---

export const renderLayout = (timelineHtml, data) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <title>Timeline Task Manager</title>
      <script type="importmap">
        {
          "imports": {
            "lit": "https://esm.sh/lit@3",
            "lit/": "https://esm.sh/lit@3/",
            "lit-html": "https://esm.sh/lit-html@3",
            "lit-html/": "https://esm.sh/lit-html@3/"
          }
        }
      </script>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        [v-cloak] { display: none; }
        .modal-open { overflow: hidden; }
        .toast-container {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          pointer-events: none;
        }
        .toast {
          padding: 0.75rem 1.25rem;
          border-radius: 0.75rem;
          background: white;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
          font-weight: 600;
          font-size: 0.875rem;
          transform: translateX(120%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: auto;
          max-width: 20rem;
        }
        .toast.show { transform: translateX(0); }
        .toast-success { border-left: 4px solid #10b981; color: #065f46; }
        .toast-error { border-left: 4px solid #ef4444; color: #991b1b; }
        .toast-info { border-left: 4px solid #3b82f6; color: #1e40af; }
      </style>
    </head>
    <body class="bg-slate-100 text-slate-800 min-h-screen p-4 pb-24 md:p-8 md:pb-24 font-sans transition-colors duration-500">
      <div class="max-w-4xl mx-auto" id="app">${timelineHtml}</div>
      <div id="modal-root"></div>
      <div id="toast-root" class="toast-container"></div>

      <!-- Floating Action Buttons -->
      <div class="fixed bottom-6 right-6 flex flex-col space-y-4 z-50">
        <button id="btn-today" class="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-700 flex items-center justify-center transition-all active:scale-95" title="Today">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
        </button>
        <button id="btn-add" class="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-emerald-700 flex items-center justify-center transition-all active:scale-95" title="Add New Task">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
      </div>

      <script id="initial-data" type="application/json">${JSON.stringify(data)}</script>
      <script type="module" src="/client.js"></script>
    </body>
  </html>
`;
