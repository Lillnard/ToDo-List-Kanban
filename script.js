let tasks = JSON.parse(localStorage.getItem("kanbanTasks") || "[]");
let dragged = null;
let editingId = null;

/* STORAGE */
function saveToStorage() {
  localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
}

/* Modal */
function openModal(edit = false, task = {}) {
  document.getElementById("task-modal").style.display = "flex";
  document.getElementById("modal-title").innerText = edit ? "Editar Tarefa" : "Criar Tarefa";

  document.getElementById("task-name").value = task.name || "";
  document.getElementById("task-owner").value = task.owner || "";
  document.getElementById("task-deadline").value = task.deadline || "";

  setMinDate();
}

function setMinDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const localISO = today.toISOString().slice(0, 10);
  document.getElementById("task-deadline").min = localISO + "T00:00";
}

function validateDeadline(deadline) {
  const selected = new Date(deadline);
  const now = new Date();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDay = new Date(selected);
  selectedDay.setHours(0, 0, 0, 0);

  if (selectedDay < today) {
    alert("A data não pode ser anterior a hoje.");
    return false;
  }

  if (selectedDay.getTime() === today.getTime() && selected <= now) {
    alert("Selecione um horário futuro.");
    return false;
  }

  return true;
}

function closeModal() {
  document.getElementById("task-modal").style.display = "none";
  editingId = null;
}

/* Create Card */
function createCard(task) {
  const card = document.createElement("div");
  card.classList.add("card", `${task.status}-card`);
  card.draggable = true;
  card.dataset.id = task.id;

  const showProgress = task.status !== "done";

  card.innerHTML = `
    <div class="card-header">
      <strong>${task.name}</strong><br>
      Resp: ${task.owner}<br>
      Prazo: ${new Date(task.deadline).toLocaleString()}
      ${showProgress ? `
      <div class="progress-bar">
        <div class="progress-fill" data-bar></div>
      </div>` : ""}
      <i class="fa fa-chevron-down toggle-icon"></i>
    </div>

    <div class="extra">
      <button class="edit-btn"><i class="fa fa-pen"></i> Editar</button>
      <button class="delete-btn"><i class="fa fa-trash"></i> Excluir</button>
      ${
        task.status === "todo"
          ? `<button class="start-btn"><i class="fa fa-play"></i> Iniciar</button>`
          : task.status === "doing"
          ? `<button class="finish-btn"><i class="fa fa-check"></i> Concluir</button>`
          : ""
      }
    </div>
  `;

  /* Eventos */
  card.addEventListener("dragstart", () => dragged = card);
  card.addEventListener("dragend", () => dragged = null);

  card.querySelector(".edit-btn").onclick = () => editTask(task.id);
  card.querySelector(".delete-btn").onclick = () => deleteTask(task.id);

  if (card.querySelector(".start-btn"))
    card.querySelector(".start-btn").onclick = () => moveTask(task.id, "doing");

  if (card.querySelector(".finish-btn"))
    card.querySelector(".finish-btn").onclick = () => moveTask(task.id, "done");

  /* Toggle expand/collapse */
  const header = card.querySelector(".card-header");
  const icon = card.querySelector(".toggle-icon");

  header.onclick = () => card.classList.toggle("expanded");
  icon.onclick = () => card.classList.toggle("expanded");

  return card;
}

/* Render */
function loadBoard() {
  document.querySelectorAll(".column").forEach(c => {
    c.querySelectorAll(".card").forEach(card => card.remove());
  });

  tasks.forEach(task => {
    const col = document.querySelector(`[data-status="${task.status}"]`);
    col.appendChild(createCard(task));
  });
}

/* Create */
function addTask() {
  const name = document.getElementById("task-name").value;
  const owner = document.getElementById("task-owner").value;
  const deadline = document.getElementById("task-deadline").value;

  if (!validateDeadline(deadline)) return;

  tasks.push({
    id: Date.now(),
    name,
    owner,
    deadline,
    status: "todo"
  });

  saveToStorage();
  loadBoard();
  closeModal();
}

/* Edit */
function editTask(id) {
  const t = tasks.find(x => x.id === id);
  editingId = id;
  openModal(true, t);
}

function updateTask() {
  const t = tasks.find(x => x.id === editingId);
  const newDeadline = document.getElementById("task-deadline").value;

  if (!validateDeadline(newDeadline)) return;

  t.name = document.getElementById("task-name").value;
  t.owner = document.getElementById("task-owner").value;
  t.deadline = newDeadline;

  saveToStorage();
  loadBoard();
  closeModal();
}

/* Delete */
function deleteTask(id) {
  tasks = tasks.filter(x => x.id !== id);
  saveToStorage();
  loadBoard();
}

/* Move */
function moveTask(id, newStatus) {
  const t = tasks.find(x => x.id === id);
  t.status = newStatus;

  saveToStorage();
  loadBoard();
}

/* Drag */
document.querySelectorAll(".column").forEach(col => {
  col.addEventListener("dragover", e => e.preventDefault());

  col.addEventListener("drop", () => {
    if (!dragged) return;

    const id = parseInt(dragged.dataset.id);
    const t = tasks.find(x => x.id === id);

    t.status = col.dataset.status;
    saveToStorage();
    loadBoard();
  });
});

/* Progress */
function updateProgress() {
  const now = Date.now();

  tasks.forEach(task => {
    if (task.status === "done") return;

    const start = task.id;
    const deadline = new Date(task.deadline).getTime();

    const total = deadline - start;
    const spent = now - start;

    const ratio = Math.min(spent / total, 1);

    const card = document.querySelector(`[data-id="${task.id}"]`);
    if (!card) return;

    const bar = card.querySelector("[data-bar]");
    if (bar) bar.style.width = (ratio * 100) + "%";

    card.classList.remove("warning", "danger");

    if (ratio >= 1) {
      card.classList.add("danger");
    } else if (ratio >= 0.8) {
      card.classList.add("warning");
    }
  });
}

setInterval(updateProgress, 1500);

/* UI Buttons */
document.getElementById("add-task-btn").onclick = () => openModal();
document.getElementById("cancel-task-btn").onclick = () => closeModal();
document.getElementById("save-task-btn").onclick = () =>
  editingId ? updateTask() : addTask();

/* THEME */
const themeBtn = document.getElementById("theme-toggle");
themeBtn.onclick = () => {
  const isDark = document.body.classList.toggle("dark");
  themeBtn.querySelector("i").className = isDark ? "fa fa-sun" : "fa fa-moon";
  localStorage.setItem("kanbanTheme", isDark);
};

if (localStorage.getItem("kanbanTheme") === "true") {
  document.body.classList.add("dark");
  themeBtn.querySelector("i").className = "fa fa-sun";
}

/* Init */
loadBoard();
updateProgress();