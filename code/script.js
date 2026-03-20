/* ========================== */
/*  TaskFlow — script.js       */
/* ========================== */

const STORAGE_KEY = 'taskflow_tasks';

/* ---------- State ---------- */
let tasks = loadTasks();
let editingId = null;

/* ---------- DOM refs ---------- */
const taskGrid       = document.getElementById('taskGrid');
const emptyState     = document.getElementById('emptyState');
const totalCount     = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');
const pendingCount   = document.getElementById('pendingCount');
const progressBar    = document.getElementById('progressBar');

const filterCategory = document.getElementById('filterCategory');
const filterStatus   = document.getElementById('filterStatus');

const modalOverlay   = document.getElementById('modalOverlay');
const openModalBtn   = document.getElementById('openModal');
const closeModalBtn  = document.getElementById('closeModal');
const cancelModalBtn = document.getElementById('cancelModal');
const saveTaskBtn    = document.getElementById('saveTask');
const modalTitle     = document.getElementById('modalTitle');

const taskId         = document.getElementById('taskId');
const taskTitle      = document.getElementById('taskTitle');
const taskCategory   = document.getElementById('taskCategory');
const taskPriority   = document.getElementById('taskPriority');
const taskStatus     = document.getElementById('taskStatus');
const togglePending  = document.getElementById('togglePending');
const toggleCompleted= document.getElementById('toggleCompleted');

const toast          = document.getElementById('toast');

/* ---------- Init ---------- */
renderAll();

/* ---------- Event Listeners ---------- */
openModalBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);
saveTaskBtn.addEventListener('click', saveTask);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

filterCategory.addEventListener('change', renderAll);
filterStatus.addEventListener('change', renderAll);

// Status toggle in modal
togglePending.addEventListener('click', () => setModalStatus('Pending'));
toggleCompleted.addEventListener('click', () => setModalStatus('Completed'));

// Keyboard shortcut: Escape closes modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openModal(); }
});

/* ---------- Functions ---------- */

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function openModal(task = null) {
  if (task) {
    editingId = task.id;
    modalTitle.textContent = 'Edit Task';
    taskId.value       = task.id;
    taskTitle.value    = task.title;
    taskCategory.value = task.category;
    taskPriority.value = task.priority;
    setModalStatus(task.status);
  } else {
    editingId = null;
    modalTitle.textContent = 'New Task';
    taskId.value       = '';
    taskTitle.value    = '';
    taskCategory.value = 'Work';
    taskPriority.value = 'Medium';
    setModalStatus('Pending');
  }
  modalOverlay.classList.add('active');
  setTimeout(() => taskTitle.focus(), 100);
}

function closeModal() {
  modalOverlay.classList.remove('active');
  editingId = null;
}

function setModalStatus(val) {
  taskStatus.value = val;
  if (val === 'Pending') {
    togglePending.classList.add('active');
    toggleCompleted.classList.remove('active');
  } else {
    toggleCompleted.classList.add('active');
    togglePending.classList.remove('active');
  }
}

function saveTask() {
  const title = taskTitle.value.trim();
  if (!title) {
    showToast('⚠ Please enter a task title.');
    taskTitle.focus();
    return;
  }

  if (editingId) {
    const idx = tasks.findIndex(t => t.id === editingId);
    if (idx !== -1) {
      tasks[idx] = {
        ...tasks[idx],
        title,
        category: taskCategory.value,
        priority: taskPriority.value,
        status: taskStatus.value,
      };
      showToast('✓ Task updated successfully!');
    }
  } else {
    tasks.unshift({
      id:       generateId(),
      title,
      category: taskCategory.value,
      priority: taskPriority.value,
      status:   taskStatus.value,
      createdAt: Date.now(),
    });
    showToast('✓ Task created!');
  }

  saveTasks();
  closeModal();
  renderAll();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderAll();
  showToast('✕ Task deleted.');
}

function toggleStatus(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
  saveTasks();
  renderAll();
  showToast(task.status === 'Completed' ? '✓ Marked as complete!' : '↩ Marked as pending.');
}

function getFiltered() {
  const cat = filterCategory.value;
  const sta = filterStatus.value;
  return tasks.filter(t => {
    const catOk = cat === 'All' || t.category === cat;
    const staOk = sta === 'All' || t.status === sta;
    return catOk && staOk;
  });
}

function renderAll() {
  updateStats();
  const filtered = getFiltered();

  // Clear grid (keep emptyState element)
  Array.from(taskGrid.querySelectorAll('.task-card')).forEach(el => el.remove());

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach((task, i) => {
      const card = createCard(task, i);
      taskGrid.appendChild(card);
    });
  }
}

function createCard(task, index) {
  const card = document.createElement('div');
  card.className = `task-card ${task.status === 'Completed' ? 'completed' : ''}`;
  card.dataset.category = task.category;
  card.style.animationDelay = `${index * 0.06}s`;

  card.innerHTML = `
    <div class="card-top">
      <div class="task-title">${escapeHtml(task.title)}</div>
      <div class="card-actions">
        <button class="card-btn edit" title="Edit task" aria-label="Edit">✎</button>
        <button class="card-btn delete" title="Delete task" aria-label="Delete">✕</button>
      </div>
    </div>
    <div class="card-meta">
      <span class="tag tag-${task.category}">${task.category}</span>
      <span class="tag tag-${task.priority}">${priorityIcon(task.priority)} ${task.priority}</span>
    </div>
    <div class="card-footer">
      <div class="status-toggle" title="Toggle status">
        <div class="status-check">${task.status === 'Completed' ? '✓' : ''}</div>
        <span>${task.status}</span>
      </div>
    </div>
  `;

  card.querySelector('.edit').addEventListener('click', () => openModal(task));
  card.querySelector('.delete').addEventListener('click', () => deleteTask(task.id));
  card.querySelector('.status-toggle').addEventListener('click', () => toggleStatus(task.id));

  return card;
}

function priorityIcon(p) {
  return { Low: '↓', Medium: '→', High: '↑' }[p] || '';
}

function updateStats() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const pending   = total - completed;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  totalCount.textContent     = total;
  completedCount.textContent = completed;
  pendingCount.textContent   = pending;
  progressBar.style.width    = pct + '%';
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
}
