/* ===== TaskFlow script.js ===== */
const KEY = 'taskflow_v2';
let tasks = [];
try { tasks = JSON.parse(localStorage.getItem(KEY)) || []; } catch(e) { tasks = []; }

let editId = null;

/* ── DOM ── */
const overlay     = document.getElementById('overlay');
const modal       = document.getElementById('modal');
const modalTitle  = document.getElementById('modalTitle');
const openModalBtn= document.getElementById('openModal');
const closeModal  = document.getElementById('closeModal');
const cancelModal = document.getElementById('cancelModal');
const saveTask    = document.getElementById('saveTask');
const grid        = document.getElementById('grid');
const empty       = document.getElementById('empty');
const toast       = document.getElementById('toast');
const progFill    = document.getElementById('progFill');

const fTitle      = document.getElementById('fTitle');
const fCat        = document.getElementById('fCat');
const fPri        = document.getElementById('fPri');
const fStatus     = document.getElementById('fStatus');
const editId_el   = document.getElementById('editId');
const togPending  = document.getElementById('togPending');
const togDone     = document.getElementById('togDone');
const fCatFilter  = document.getElementById('fCatFilter');
const fStatusFilter=document.getElementById('fStatusFilter');

/* ── Init ── */
render();

/* ── Events ── */
openModalBtn.addEventListener('click', () => openMod(null));
closeModal.addEventListener('click', closeMod);
cancelModal.addEventListener('click', closeMod);
overlay.addEventListener('click', e => { if(e.target === overlay) closeMod(); });
saveTask.addEventListener('click', doSave);
fCatFilter.addEventListener('change', render);
fStatusFilter.addEventListener('change', render);

togPending.addEventListener('click', () => setStatus('Pending'));
togDone.addEventListener('click',    () => setStatus('Completed'));

document.addEventListener('keydown', e => {
  if(e.key === 'Escape') closeMod();
  if((e.ctrlKey||e.metaKey) && e.key === 'n'){ e.preventDefault(); openMod(null); }
});

/* ── Modal open/close ── */
function openMod(task) {
  editId = task ? task.id : null;
  modalTitle.textContent = task ? 'Edit Task' : 'New Task';
  fTitle.value    = task ? task.title : '';
  fCat.value      = task ? task.category : 'Work';
  fPri.value      = task ? task.priority : 'Medium';
  setStatus(task ? task.status : 'Pending');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('show'));
  setTimeout(() => fTitle.focus(), 80);
}

function closeMod() {
  overlay.classList.remove('show');
  setTimeout(() => overlay.classList.add('hidden'), 300);
  editId = null;
}

function setStatus(val) {
  fStatus.value = val;
  togPending.classList.toggle('active', val === 'Pending');
  togDone.classList.toggle('active', val === 'Completed');
}

/* ── Save ── */
function doSave() {
  const title = fTitle.value.trim();
  if(!title){ showToast('⚠ Please enter a title'); fTitle.focus(); return; }

  if(editId) {
    const i = tasks.findIndex(t => t.id === editId);
    if(i !== -1) tasks[i] = { ...tasks[i], title, category:fCat.value, priority:fPri.value, status:fStatus.value };
    showToast('✓ Task updated');
  } else {
    tasks.unshift({ id: uid(), title, category:fCat.value, priority:fPri.value, status:fStatus.value, created:Date.now() });
    showToast('✓ Task added');
  }
  save(); closeMod(); render();
}

/* ── Render ── */
function render() {
  const cat = fCatFilter.value;
  const sta = fStatusFilter.value;
  const filtered = tasks.filter(t =>
    (cat === 'All' || t.category === cat) &&
    (sta === 'All' || t.status === sta)
  );

  /* stats always from full list */
  const tot  = tasks.length;
  const done = tasks.filter(t => t.status === 'Completed').length;
  document.getElementById('sTot').textContent  = tot;
  document.getElementById('sDone').textContent = done;
  document.getElementById('sPend').textContent = tot - done;
  progFill.style.width = tot ? Math.round(done/tot*100)+'%' : '0%';

  /* remove existing cards */
  grid.querySelectorAll('.card').forEach(el => el.remove());
  empty.style.display = filtered.length ? 'none' : 'block';

  filtered.forEach((task, i) => {
    const card = document.createElement('div');
    card.className = 'card' + (task.status === 'Completed' ? ' done' : '');
    card.dataset.cat = task.category;
    card.style.animationDelay = (i * 0.05) + 's';

    const priIcon = { Low:'↓', Medium:'→', High:'↑' }[task.priority] || '';

    card.innerHTML = `
      <div class="card-top">
        <div class="ctitle">${esc(task.title)}</div>
        <div class="card-btns">
          <button class="cbtn edit" title="Edit">✎</button>
          <button class="cbtn del" title="Delete">✕</button>
        </div>
      </div>
      <div class="tags">
        <span class="tag tag-${task.category}">${task.category}</span>
        <span class="tag tag-${task.priority}">${priIcon} ${task.priority}</span>
      </div>
      <div class="card-foot">
        <div class="status-tog">
          <div class="chk">${task.status === 'Completed' ? '✓' : ''}</div>
          <span>${task.status}</span>
        </div>
      </div>`;

    card.querySelector('.edit').addEventListener('click', () => openMod(task));
    card.querySelector('.del').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      save(); render(); showToast('✕ Task deleted');
    });
    card.querySelector('.status-tog').addEventListener('click', () => {
      const t = tasks.find(x => x.id === task.id);
      if(t){ t.status = t.status === 'Completed' ? 'Pending' : 'Completed'; save(); render(); }
    });

    grid.appendChild(card);
  });
}

/* ── Helpers ── */
function save() { localStorage.setItem(KEY, JSON.stringify(tasks)); }
function uid()  { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}
