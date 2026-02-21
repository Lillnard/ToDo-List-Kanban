let tasks = JSON.parse(localStorage.getItem("kanbanTasks") || "[]");
let dragged = null;
let editingId = null;

/* Salvar */
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
}
function closeModal() {
  document.getElementById("task-modal").style.display = "none";
  editingId = null;
}

/* Criar card */
function createCard(task) {
  const card = document.createElement("div");
  card.classList.add("card", `${task.status}-card`);
  card.draggable = true;
  card.dataset.id = task.id;

  card.innerHTML = `
    <div class="card-header">
      <strong>${task.name}</strong><br>
      Resp: ${task.owner}<br>
      Prazo: ${new Date(task.deadline).toLocaleString()}
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>

    <i class="fa fa-chevron-down expand-toggle"></i>

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

  if (card.querySelector(".start-btn")) {
    card.querySelector(".start-btn").onclick = () => moveTask(task.id, "doing");
  }
  if (card.querySelector(".finish-btn")) {
    card.querySelector(".finish-btn").onclick = () => moveTask(task.id, "done");
  }

  /* Expandir */
  const toggle = card.querySelector(".expand-toggle");
  toggle.onclick = () => {
    card.classList.toggle("expanded");
  };

  return card;
}

/* Renderizar */
function loadBoard() {
  document.querySelectorAll(".column").forEach(c => {
    c.querySelectorAll(".card").forEach(card => card.remove());
  });

  tasks.forEach(task => {
    const col = document.querySelector(`[data-status="${task.status}"]`);
    col.appendChild(createCard(task));
  });
}

/* Criar */
function addTask() {
  const name = document.getElementById("task-name").value;
  const owner = document.getElementById("task-owner").value;
  const deadline = document.getElementById("task-deadline").value;

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

/* Editar */
function editTask(id) {
  const t = tasks.find(x => x.id === id);
  editingId = id;
  openModal(true, t);
}
function updateTask() {
  const t = tasks.find(x => x.id === editingId);
  t.name = document.getElementById("task-name").value;
  t.owner = document.getElementById("task-owner").value;
  t.deadline = document.getElementById("task-deadline").value;

  saveToStorage();
  loadBoard();
  closeModal();
}

/* Excluir */
function deleteTask(id) {
  tasks = tasks.filter(x => x.id !== id);
  saveToStorage();
  loadBoard();
}

/* Mover */
function moveTask(id, newStatus) {
  const t = tasks.find(x => x.id === id);
  t.status = newStatus;
  saveToStorage();
  loadBoard();
}

/* Drag & Drop */
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

/* Barra de progresso + alerta */
function updateProgress() {
  const now = Date.now();

  tasks.forEach(task => {
    const start = task.id;
    const deadline = new Date(task.deadline).getTime();
    const total = deadline - start;
    const spent = now - start;

    const ratio = Math.min(spent / total, 1);

    const card = document.querySelector(`[data-id="${task.id}"]`);
    if (!card) return;

    const bar = card.querySelector(".progress-fill");
    bar.style.width = (ratio * 100) + "%";

    card.classList.remove("warning", "danger");

    if (ratio >= 1) {
      card.classList.add("danger");
      notify("Prazo encerrado!", `${task.name} expirou.`);
    } else if (ratio >= 0.8) {
      card.classList.add("warning");
      notify("Tarefa quase no fim!", `${task.name} está prestes a vencer.`);
    }
  });
}
setInterval(updateProgress, 1500);

/* Notificações */
function notify(title, text) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body: text });
  }
}
Notification.requestPermission();

/* Botões */
document.getElementById("add-task-btn").onclick = () => openModal();
document.getElementById("cancel-task-btn").onclick = () => closeModal();
document.getElementById("save-task-btn").onclick = () =>
  editingId ? updateTask() : addTask();

/* Tema */
const themeBtn = document.getElementById("theme-toggle");

themeBtn.onclick = () => {
  const isDark = document.body.classList.toggle("dark");

  const icon = themeBtn.querySelector("i");
  icon.className = isDark ? "fa fa-sun" : "fa fa-moon";

  localStorage.setItem("kanbanTheme", isDark);
};

if (localStorage.getItem("kanbanTheme") === "true") {
  document.body.classList.add("dark");
  const icon = themeBtn.querySelector("i");
  icon.className = "fa fa-sun";
}

/* Inicializar */
loadBoard();
updateProgress();