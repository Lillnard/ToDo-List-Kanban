let tasks = JSON.parse(localStorage.getItem("kanbanTasks") || "[]");
let dragged = null;
let editingId = null;

function saveToStorage() {
  localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
}

function openModal(editing = false, task = {}) {
  document.getElementById("task-modal").style.display = "flex";
  document.getElementById("modal-title").innerText = editing ? "Editar Tarefa" : "Criar Tarefa";

  document.getElementById("task-name").value = task.name || "";
  document.getElementById("task-owner").value = task.owner || "";
  document.getElementById("task-deadline").value = task.deadline || "";
}

function closeModal() {
  document.getElementById("task-modal").style.display = "none";
  editingId = null;
}

function createCard(task) {
  const card = document.createElement("div");
  card.classList.add("card", `${task.status}-card`);
  card.draggable = true;
  card.dataset.id = task.id;

  card.innerHTML = `
    <strong>${task.name}</strong><br>
    Resp: ${task.owner}<br>
    Prazo: ${new Date(task.deadline).toLocaleString()}<br>
    <button class="edit-btn">Editar</button>
    <button class="delete-btn">Excluir</button>
  `;

  if (task.status === "todo") {
    card.innerHTML += `<button class="start-btn">Iniciar</button>`;
  }

  if (task.status === "doing") {
    card.innerHTML += `<button class="finish-btn">Concluir</button>`;
  }

  card.addEventListener("dragstart", () => dragged = card);
  card.addEventListener("dragend", () => dragged = null);

  card.querySelector(".edit-btn").onclick = () => editTask(task.id);
  card.querySelector(".delete-btn").onclick = () => deleteTask(task.id);

  if (task.status === "todo" && card.querySelector(".start-btn")) {
    card.querySelector(".start-btn").onclick = () => moveTask(task.id, "doing");
  }

  if (task.status === "doing" && card.querySelector(".finish-btn")) {
    card.querySelector(".finish-btn").onclick = () => moveTask(task.id, "done");
  }

  return card;
}

function loadBoard() {
  document.querySelectorAll(".column").forEach(col => {
    col.querySelectorAll(".card").forEach(c => c.remove());
  });

  tasks.forEach(task => {
    const col = document.querySelector(`[data-status="${task.status}"]`);
    col.appendChild(createCard(task));
  });
}

function addTask() {
  const name = document.getElementById("task-name").value;
  const owner = document.getElementById("task-owner").value;
  const deadline = document.getElementById("task-deadline").value;

  const id = Date.now();

  tasks.push({ id, name, owner, deadline, status: "todo" });
  saveToStorage();
  loadBoard();
  closeModal();
}

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

function deleteTask(id) {
  tasks = tasks.filter(x => x.id !== id);
  saveToStorage();
  loadBoard();
}

function moveTask(id, newStatus) {
  const t = tasks.find(x => x.id === id);
  t.status = newStatus;
  saveToStorage();
  loadBoard();
}

/* Drag e drop */
document.querySelectorAll(".column").forEach(col => {
  col.addEventListener("dragover", e => e.preventDefault());

  col.addEventListener("drop", () => {
    if (!dragged) return;

    const id = parseInt(dragged.dataset.id);
    const t = tasks.find(x => x.id === id);

    if (t.status === "todo") {
      if (col.dataset.status !== "todo") t.status = col.dataset.status;
    } else {
      t.status = col.dataset.status;
    }

    saveToStorage();
    loadBoard();
  });
});

/* Atualização da cor conforme o prazo */
setInterval(() => {
  const now = Date.now();

  tasks.forEach(task => {
    const deadline = new Date(task.deadline).getTime();
    const start = task.id;
    const total = deadline - start;
    const spent = now - start;
    const ratio = spent / total;

    const card = document.querySelector(`[data-id="${task.id}"]`);
    if (!card) return;

    card.classList.remove("warning", "danger");

    if (ratio >= 1) card.classList.add("danger");
    else if (ratio >= 0.8) card.classList.add("warning");
  });
}, 2000);

document.getElementById("add-task-btn").onclick = () => openModal();
document.getElementById("cancel-task-btn").onclick = () => closeModal();
document.getElementById("save-task-btn").onclick = () => editingId ? updateTask() : addTask();

loadBoard();