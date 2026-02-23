let tasks = JSON.parse(localStorage.getItem("kanbanTasks") || "[]");
let dragged = null;
let editingId = null;

/* ==========================
   TRANSLATIONS
========================== */
const translations = {
  pt: {
    add: "Nova tarefa",
    todo: "Tarefas a Fazer",
    doing: "Tarefas em andamento",
    done: "Tarefas concluídas",
    modalCreate: "Criar Tarefa",
    modalEdit: "Editar Tarefa",
    placeholderName: "Nome da tarefa",
    placeholderOwner: "Responsável",
    deadline: "Prazo de conclusão:",
    save: "Salvar",
    cancel: "Cancelar",
    start: "Iniciar",
    finish: "Concluir",
    edit: "Editar",
    del: "Excluir",
  },
  en: {
    add: "New Task",
    todo: "To Do",
    doing: "In Progress",
    done: "Completed",
    modalCreate: "Create Task",
    modalEdit: "Edit Task",
    placeholderName: "Task name",
    placeholderOwner: "Owner",
    deadline: "Deadline:",
    save: "Save",
    cancel: "Cancel",
    start: "Start",
    finish: "Finish",
    edit: "Edit",
    del: "Delete",
  },
};

let currentLang = localStorage.getItem("kanbanLang") || "pt";

/* ==========================
   STORAGE
========================== */
function saveToStorage() {
  localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
  localStorage.setItem("kanbanLang", currentLang);
}

/* ==========================
   MODAL
========================== */
function openModal(edit = false, task = {}) {
  document.getElementById("task-modal").style.display = "flex";

  const t = translations[currentLang];
  document.getElementById("modal-title").innerText = edit ? t.modalEdit : t.modalCreate;

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
    alert(currentLang === "pt" ? "A data não pode ser anterior a hoje." : "Date cannot be before today.");
    return false;
  }

  if (selectedDay.getTime() === today.getTime() && selected <= now) {
    alert(currentLang === "pt" ? "Selecione um horário futuro." : "Select a future time.");
    return false;
  }

  return true;
}

function closeModal() {
  document.getElementById("task-modal").style.display = "none";
  editingId = null;
}

/* ==========================
   LANGUAGE
========================== */
function applyLanguage() {
  const t = translations[currentLang];

  document.getElementById("add-task-btn").innerHTML = `<i class="fa fa-plus"></i> ${t.add}`;
  document.querySelector("#todo-column .col-title").innerText = t.todo;
  document.querySelector("#doing-column .col-title").innerText = t.doing;
  document.querySelector("#done-column .col-title").innerText = t.done;

  document.getElementById("task-name").placeholder = t.placeholderName;
  document.getElementById("task-owner").placeholder = t.placeholderOwner;
  document.querySelector("label").innerText = t.deadline;
  document.getElementById("save-task-btn").innerText = t.save;
  document.getElementById("cancel-task-btn").innerText = t.cancel;

  // Troca por texto (EN/BR) conforme você pediu antes
  document.getElementById("lang-toggle").innerText = currentLang === "pt" ? "EN" : "BR";

  /* CORREÇÃO: atualiza modal aberto */
  const modal = document.getElementById("task-modal");
  if (modal.style.display === "flex") {
    if (editingId) {
      document.getElementById("modal-title").innerText = t.modalEdit;
    } else {
      document.getElementById("modal-title").innerText = t.modalCreate;
    }

    document.getElementById("task-name").placeholder = t.placeholderName;
    document.getElementById("task-owner").placeholder = t.placeholderOwner;
    document.querySelector("label").innerText = t.deadline;
    document.getElementById("save-task-btn").innerText = t.save;
    document.getElementById("cancel-task-btn").innerText = t.cancel;
  }

  loadBoard();
}

document.getElementById("lang-toggle").onclick = () => {
  currentLang = currentLang === "pt" ? "en" : "pt";
  applyLanguage();
  saveToStorage();
};

/* ==========================
   CREATE CARD
========================== */
function createCard(task) {
  const t = translations[currentLang];
  const card = document.createElement("div");
  card.classList.add("card", `${task.status}-card`);
  card.draggable = true;
  card.dataset.id = task.id;

  const showProgress = task.status !== "done";

  card.innerHTML = `
    <div class="card-header">
      <strong>${task.name}</strong><br>
      ${currentLang === "pt" ? "Resp:" : "Owner:"} ${task.owner}<br>
      ${currentLang === "pt" ? "Prazo:" : "Deadline:"} ${new Date(task.deadline).toLocaleString()}
      ${showProgress ? `<div class="progress-bar"><div class="progress-fill" data-bar></div></div>` : ""}
      <i class="fa fa-chevron-down toggle-icon"></i>
    </div>

    <div class="extra">
      <button class="edit-btn"><i class="fa fa-pen"></i> ${t.edit}</button>
      <button class="delete-btn"><i class="fa fa-trash"></i> ${t.del}</button>
      ${
        task.status === "todo"
          ? `<button class="start-btn"><i class="fa fa-play"></i> ${t.start}</button>`
          : task.status === "doing"
          ? `<button class="finish-btn"><i class="fa fa-check"></i> ${t.finish}</button>`
          : ""
      }
    </div>
  `;

  card.addEventListener("dragstart", () => (dragged = card));
  card.addEventListener("dragend", () => (dragged = null));

  card.querySelector(".edit-btn").onclick = () => editTask(task.id);
  card.querySelector(".delete-btn").onclick = () => deleteTask(task.id);

  if (card.querySelector(".start-btn")) card.querySelector(".start-btn").onclick = () => moveTask(task.id, "doing");
  if (card.querySelector(".finish-btn")) card.querySelector(".finish-btn").onclick = () => moveTask(task.id, "done");

  const header = card.querySelector(".card-header");
  const icon = card.querySelector(".toggle-icon");

  header.onclick = () => card.classList.toggle("expanded");
  icon.onclick = () => card.classList.toggle("expanded");

  return card;
}

/* ==========================
   LOAD BOARD
========================== */
function loadBoard() {
  document.querySelectorAll(".column").forEach((c) => {
    c.querySelectorAll(".card").forEach((card) => card.remove());
  });

  tasks.forEach((task) => {
    document.querySelector(`[data-status="${task.status}"]`).appendChild(createCard(task));
  });
}

/* ==========================
   CRUD
========================== */
function addTask() {
  const name = document.getElementById("task-name").value;
  const owner = document.getElementById("task-owner").value;
  const deadline = document.getElementById("task-deadline").value;

  if (!validateDeadline(deadline)) return;

  tasks.push({ id: Date.now(), name, owner, deadline, status: "todo" });

  saveToStorage();
  loadBoard();
  closeModal();
}

function editTask(id) {
  editingId = id;
  openModal(true, tasks.find((t) => t.id === id));
}

function updateTask() {
  const t = tasks.find((x) => x.id === editingId);

  const newDeadline = document.getElementById("task-deadline").value;
  if (!validateDeadline(newDeadline)) return;

  t.name = document.getElementById("task-name").value;
  t.owner = document.getElementById("task-owner").value;
  t.deadline = newDeadline;

  saveToStorage();
  loadBoard();
  closeModal();
}

function deleteTask(id) {
  tasks = tasks.filter((x) => x.id !== id);
  saveToStorage();
  loadBoard();
}

function moveTask(id, newStatus) {
  const t = tasks.find((x) => x.id === id);
  t.status = newStatus;
  saveToStorage();
  loadBoard();
}

/* ==========================
   DRAG & DROP
========================== */
document.querySelectorAll(".column").forEach((col) => {
  col.addEventListener("dragover", (e) => e.preventDefault());
  col.addEventListener("drop", () => {
    if (!dragged) return;
    const id = parseInt(dragged.dataset.id);
    const t = tasks.find((x) => x.id === id);
    t.status = col.dataset.status;
    saveToStorage();
    loadBoard();
  });
});

/* ==========================
   PROGRESS BAR
========================== */
function updateProgress() {
  const now = Date.now();

  tasks.forEach((task) => {
    if (task.status === "done") return;

    const start = task.id;
    const deadline = new Date(task.deadline).getTime();
    const total = deadline - start;
    const spent = now - start;
    const ratio = Math.min(spent / total, 1);

    const card = document.querySelector(`[data-id="${task.id}"]`);
    if (!card) return;

    const bar = card.querySelector("[data-bar]");
    if (bar) bar.style.width = ratio * 100 + "%";

    card.classList.remove("warning", "danger");

    if (ratio >= 1) card.classList.add("danger");
    else if (ratio >= 0.8) card.classList.add("warning");
  });
}

setInterval(updateProgress, 1500);

/* ==========================
   UI BUTTONS
========================== */
document.getElementById("add-task-btn").onclick = () => openModal();
document.getElementById("cancel-task-btn").onclick = () => closeModal();
document.getElementById("save-task-btn").onclick = () => (editingId ? updateTask() : addTask());

/* ==========================
   THEME
========================== */
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

/* ==========================
   MOBILE COLUMN EXPAND
========================== */
document.querySelectorAll(".col-title").forEach((title) => {
  title.onclick = () => {
    if (window.innerWidth > 768) return;

    const col = title.parentElement;
    const fullscreen = col.classList.toggle("fullscreen");

    // ✅ CORREÇÃO: não force "flex" no inline style ao voltar
    // Isso evita o bug de cards ficarem em "linha" depois de fechar.
    document.querySelectorAll(".column").forEach((c) => {
      if (c !== col) {
        c.style.display = fullscreen ? "none" : "";
      } else {
        c.style.display = "";
      }
    });
  };
});

/* ==========================
   INIT
========================== */
applyLanguage();
loadBoard();
updateProgress();