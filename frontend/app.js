const API = window.APP_CONFIG.API_BASE_URL;
const form = document.getElementById("todo-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const count = document.getElementById("task-count");
const statusText = document.getElementById("status");

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

function status(message, error = false) {
  statusText.textContent = message;
  statusText.className = error ? "error" : "success";
}

function render(tasks) {
  list.replaceChildren();
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = task.completed ? "task completed" : "task";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(task.completed);
    checkbox.setAttribute("aria-label", `Complete ${task.title}`);
    checkbox.addEventListener("change", async () => {
      try {
        await request(`/tasks/${task.id}`, {
          method: "PATCH", body: JSON.stringify({ completed: checkbox.checked })
        });
        await loadTasks();
      } catch (e) { status(e.message, true); }
    });

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      try {
        await request(`/tasks/${task.id}`, { method: "DELETE" });
        status("Task deleted.");
        await loadTasks();
      } catch (e) { status(e.message, true); }
    });

    li.append(checkbox, title, remove);
    list.append(li);
  });
  emptyState.hidden = tasks.length > 0;
  count.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
}

async function loadTasks() {
  try { render(await request("/tasks")); }
  catch (e) { status(`Could not load tasks: ${e.message}`, true); }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  try {
    await request("/tasks", { method: "POST", body: JSON.stringify({ title }) });
    input.value = "";
    status("Task added.");
    await loadTasks();
    input.focus();
  } catch (e) { status(e.message, true); }
});

loadTasks();
