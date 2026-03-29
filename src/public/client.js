import { html, render } from "lit";
import { 
  timelineTemplate, 
  modalTemplate, 
  deleteModalTemplate, 
  taskFormTemplate, 
  logModalTemplate 
} from "./templates.js";

const appContainer = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const toastRoot = document.getElementById("toast-root");
const initialDataElement = document.getElementById("initial-data");

let state = [];
let isLoading = false;

// --- State Management ---

const getFirstWeekDate = () => state[0]?.weekStr;
const getLastWeekDate = () => state[state.length - 1]?.weekStr;

// --- UI Helpers ---

const showToast = (message, type = "success") => {
  if (!toastRoot) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastRoot.appendChild(toast);
  
  // Force reflow
  toast.offsetHeight;
  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// --- API Helpers ---

const api = {
  async fetchTimeline(start, end) {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const res = await fetch(`/api/timeline?${params}`);
    return res.json();
  },

  async post(url, body) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await window.refreshTimeline();
        return true;
      } else {
        showToast(data.error || "Operation failed", "error");
        return false;
      }
    } catch (err) {
      console.error(`API Error (${url}):`, err);
      showToast("Network error occurred", "error");
      return false;
    }
  },
  async toggle(task) {
    return this.post("/api/toggle", {
      blueprint_id: task.blueprint_id,
      scheduled_date: task.scheduled_date,
      is_completed: task.is_completed,
    });
  },
  async delete(id) {
    const ok = await this.post("/api/blueprints/delete", { id });
    if (ok) showToast("Task deleted");
    return ok;
  },
  async upsert(task) {
    const url = task.id ? "/api/blueprints/update" : "/api/blueprints";
    const ok = await this.post(url, task);
    if (ok) showToast(task.id ? "Task updated" : "Task created");
    return ok;
  },
  async saveLog(blueprint_id, scheduled_date, logs) {
    const ok = await this.post("/api/logs", { blueprint_id, scheduled_date, logs });
    if (ok) showToast("Log saved");
    return ok;
  }
};

// --- Action Handlers ---

const actions = {
  async toggle(task) {
    await api.toggle(task);
  },
  
  delete(task) {
    window.openModal("Delete Task", deleteModalTemplate(task, async () => {
      if (await api.delete(task.blueprint_id)) window.closeModal();
    }));
  },

  edit(task) {
    window.openModal("Edit Task", taskFormTemplate(task, async () => {
      const data = {
        id: task.blueprint_id,
        title: document.getElementById("task-title").value,
        start_date: document.getElementById("task-date").value,
        rrule_string: document.getElementById("task-rrule").value || "FREQ=DAILY;COUNT=1"
      };
      if (await api.upsert(data)) window.closeModal();
    }));
  },

  log(task) {
    window.openModal("Task Information", logModalTemplate(task, async () => {
      const entry = document.getElementById("log-entry").value.trim();
      if (!entry) return;
      const timestamp = new Date().toLocaleString();
      const newLog = task.logs ? `${task.logs}\n[${timestamp}] ${entry}` : `[${timestamp}] ${entry}`;
      if (await api.saveLog(task.blueprint_id, task.scheduled_date, newLog)) window.closeModal();
    }));
  }
};

window.handleAction = (action, task) => actions[action]?.(task);

// --- Modal Management ---

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

// --- UI Rendering ---

window.refreshTimeline = async () => {
  try {
    const start = getFirstWeekDate();
    const end = getLastWeekDate();
    const updatedData = await api.fetchTimeline(start, end);
    state = updatedData;
    updateUI();
  } catch (err) {
    console.error("Refresh failed:", err);
  }
};

const loadMore = async (direction) => {
  if (isLoading) return;
  isLoading = true;
  
  try {
    if (direction === "future") {
      const lastDate = getLastWeekDate();
      const nextWeekStart = new Date(lastDate);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const startIso = nextWeekStart.toISOString().split("T")[0];
      
      const newData = await api.fetchTimeline(startIso, startIso);
      state = [...state, ...newData];
      updateUI();
    } else if (direction === "past") {
      const firstDate = getFirstWeekDate();
      const prevWeekStart = new Date(firstDate);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const startIso = prevWeekStart.toISOString().split("T")[0];
      
      const newData = await api.fetchTimeline(startIso, startIso);
      
      // Save scroll position relative to the first element
      const firstElement = appContainer.firstElementChild;
      const firstElementTop = firstElement ? firstElement.getBoundingClientRect().top : 0;

      state = [...newData, ...state];
      updateUI();

      // Restore scroll position
      if (firstElement) {
        const newFirstElementTop = firstElement.getBoundingClientRect().top;
        window.scrollBy(0, newFirstElementTop - firstElementTop);
      }
    }
  } catch (err) {
    console.error("Failed to load more:", err);
  } finally {
    isLoading = false;
  }
};

function updateUI() {
  if (!appContainer) return;
  
  // Ensure sentinels exist
  let topSentinel = document.getElementById("sentinel-top");
  if (!topSentinel) {
    topSentinel = document.createElement("div");
    topSentinel.id = "sentinel-top";
    topSentinel.className = "h-4 w-full";
    appContainer.before(topSentinel);
    observer.observe(topSentinel);
  }

  render(timelineTemplate(state), appContainer);

  let bottomSentinel = document.getElementById("sentinel-bottom");
  if (!bottomSentinel) {
    bottomSentinel = document.createElement("div");
    bottomSentinel.id = "sentinel-bottom";
    bottomSentinel.className = "h-4 w-full";
    appContainer.after(bottomSentinel);
    observer.observe(bottomSentinel);
  }
}

// --- Intersection Observer ---

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (entry.target.id === "sentinel-bottom") {
        loadMore("future");
      } else if (entry.target.id === "sentinel-top") {
        loadMore("past");
      }
    }
  });
}, { rootMargin: "200px" });

// Initial setup
if (appContainer) {
  try {
    if (initialDataElement) {
      state = JSON.parse(initialDataElement.textContent);
    }
  } catch (err) {
    console.error("Failed to parse initial data:", err);
  }
  
  appContainer.innerHTML = "";
  updateUI();
  
  setTimeout(() => {
    document.getElementById("current-week")?.scrollIntoView({ behavior: 'auto', block: 'center' });
  }, 100);
}

// --- Event Listeners ---

document.getElementById("btn-add")?.addEventListener("click", () => {
  window.openModal("Add New Task", taskFormTemplate({}, async () => {
    const title = document.getElementById("task-title").value;
    const start_date = document.getElementById("task-date").value;
    const rrule_string = document.getElementById("task-rrule").value || "FREQ=DAILY;COUNT=1";

    if (!title || !start_date) return alert("Title and Start Date are required");
    if (await api.upsert({ title, start_date, rrule_string })) window.closeModal();
  }));
});

document.getElementById("btn-today")?.addEventListener("click", () => {
  document.getElementById("current-week")?.scrollIntoView({ behavior: "smooth", block: "center" });
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") window.closeModal();
});
