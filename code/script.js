/* ===== TaskFlow script.js ===== */
const KEY = 'taskflow_v2';
let tasks = [];
try { tasks = JSON.parse(localStorage.getItem(KEY)) || []; } catch(e) { tasks = []; }

let editId = null;

/* -- DOM -- */
const overlay = document.getElementById('overlay');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const openModalBtn = document.getElementById('openModal');
const closeModal = document.getElementById('closeModal');
const cancelModal = document.getElementById('cancelModal');
const saveTask = document.getElementById('saveTask');
const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const toast = document.getElementById('toast');
const progFill = document.getElementById('progFill');

const fTitle = document.getElementById('fTitle');
const fCat = document.getElementById('fCat');
const fPri = document.getElementById('fPri');
const fDue = document.getElementById('fDue');
const fStatus = document.getElementById('fStatus');
const togPending = document.getElementById('togPending');
const togProgress = document.getElementById('togProgress');
const togDone = document.getElementById('togDone');
const fCatFilter = document.getElementById('fCatFilter');
const fPriFilter = document.getElementById('fPriFilter');
const fStatusFilter = document.getElementById('fStatusFilter');
const fSortFilter = document.getElementById('fSortFilter');
const searchInput = document.getElementById('searchInput');

/* -- Init -- */
render();

/* -- Events -- */
openModalBtn.addEventListener('click', () => openMod(null));
closeModal.addEventListener('click', closeMod);
cancelModal.addEventListener('click', closeMod);
overlay.addEventListener('click', e => { if(e.target === overlay) closeMod(); });
saveTask.addEventListener('click', doSave);
fCatFilter.addEventListener('change', render);
fPriFilter.addEventListener('change', render);
fStatusFilter.addEventListener('change', render);
fSortFilter.addEventListener('change', render);
searchInput.addEventListener('input', render);

togPending.addEventListener('click', () => setStatus('Pending'));
togProgress.addEventListener('click', () => setStatus('In Progress'));
togDone.addEventListener('click', () => setStatus('Completed'));

document.addEventListener('keydown', e => {
  if(e.key === 'Escape') closeMod();
  if((e.ctrlKey||e.metaKey) && e.key === 'n'){ e.preventDefault(); openMod(null); }
  if((e.ctrlKey||e.metaKey) && e.key === 'f'){ e.preventDefault(); searchInput.focus(); }
});

/* -- Modal open/close -- */
function openMod(task) {
  editId = task ? task.id : null;
  modalTitle.textContent = task ? 'Edit Task' : 'New Task';
  fTitle.value = task ? task.title : '';
  fCat.value = task ? task.category : 'Work';
  fPri.value = task ? task.priority : 'Medium';
  fDue.value = task ? (task.due || '') : '';
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
  togProgress.classList.toggle('active', val === 'In Progress');
  togDone.classList.toggle('active', val === 'Completed');
}

/* -- Due date helpers -- */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(task) {
  if(!task.due || task.status === 'Completed') return false;
  return task.due < todayStr();
}

function isDueToday(task) {
  if(!task.due || task.status === 'Completed') return false;
  return task.due === todayStr();
}

function isDueSoon(task) {
  if(!task.due || task.status === 'Completed') return false;
  const diffDays = (new Date(task.due) - new Date(todayStr())) / 86400000;
  return diffDays > 0 && diffDays <= 3;
}

function formatDue(dateStr) {
  if(!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return d + '/' + m + '/' + y;
}

/* -- Sort helpers -- */
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

function sortTasks(list, mode) {
  const copy = [...list];
  if(mode === 'oldest') return copy.sort((a,b) => a.created - b.created);
  if(mode === 'priority') return copy.sort((a,b) => (PRIORITY_ORDER[a.priority]||1) - (PRIORITY_ORDER[b.priority]||1));
  if(mode === 'duedate') return copy.sort((a,b) => {
    if(!a.due && !b.due) return 0;
    if(!a.due) return 1;
    if(!b.due) return -1;
    return a.due.localeCompare(b.due);
  });
  // default: newest
  return copy.sort((a,b) => b.created - a.created);
}

/* -- Save -- */
function doSave() {
  const title = fTitle.value.trim();
  if(!title){ showToast('Please enter a title'); fTitle.focus(); return; }

  if(editId) {
    const i = tasks.findIndex(t => t.id === editId);
    if(i !== -1) tasks[i] = { ...tasks[i], title, category:fCat.value, priority:fPri.value, due:fDue.value, status:fStatus.value };
    showToast('Task updated');
  } else {
    tasks.unshift({ id: uid(), title, category:fCat.value, priority:fPri.value, due:fDue.value, status:fStatus.value, created:Date.now() });
    showToast('Task added');
  }
  save(); closeMod(); render();
}

/* -- Render -- */
function render() {
  const cat = fCatFilter.value;
  const pri = fPriFilter.value;
  const sta = fStatusFilter.value;
  const sort = fSortFilter.value;
  const query = searchInput.value.trim().toLowerCase();

  let filtered = tasks.filter(t => {
    if(cat !== 'All' && t.category !== cat) return false;
    if(pri !== 'All' && t.priority !== pri) return false;
    if(sta === 'Overdue') { if(!isOverdue(t)) return false; }
    else if(sta !== 'All' && t.status !== sta) return false;
    if(query && !t.title.toLowerCase().includes(query)) return false;
    return true;
  });

  filtered = sortTasks(filtered, sort);

  /* stats from full list */
  const tot = tasks.length;
  const done = tasks.filter(t => t.status === 'Completed').length;
  const inprog = tasks.filter(t => t.status === 'In Progress').length;
  const over = tasks.filter(t => isOverdue(t)).length;
  document.getElementById('sTot').textContent = tot;
  document.getElementById('sDone').textContent = done;
  document.getElementById('sPend').textContent = tasks.filter(t => t.status === 'Pending').length;
  document.getElementById('sInProg').textContent = inprog;
  document.getElementById('sOver').textContent = over;
  progFill.style.width = tot ? Math.round(done/tot*100)+'%' : '0%';

  /* rebuild cards */
  grid.querySelectorAll('.card').forEach(el => el.remove());
  empty.style.display = filtered.length ? 'none' : 'block';

  filtered.forEach((task, i) => {
    const overdue = isOverdue(task);
    const dueToday = isDueToday(task);
    const dueSoon = isDueSoon(task);

    const card = document.createElement('div');
    let cls = 'card';
    if(task.status === 'Completed') cls += ' done';
    if(task.status === 'In Progress') cls += ' in-progress';
    if(overdue) cls += ' overdue';
    if(dueToday) cls += ' due-today';
    card.className = cls;
    card.dataset.cat = task.category;
    card.dataset.pri = task.priority;
    card.style.animationDelay = (i * 0.05) + 's';

    const priIcon = { Low:'\u2193', Medium:'\u2192', High:'\u2191' }[task.priority] || '';

    let dueBadge = '';
    if(task.due) {
      let badgeCls = 'due-badge';
      let badgeLabel = formatDue(task.due);
      if(overdue) { badgeCls += ' due-overdue'; badgeLabel = 'Overdue: ' + badgeLabel; }
      else if(dueToday) { badgeCls += ' due-today-badge'; badgeLabel = 'Due today'; }
      else if(dueSoon) { badgeCls += ' due-soon'; badgeLabel = 'Soon: ' + badgeLabel; }
      dueBadge = '<span class="' + badgeCls + '">' + badgeLabel + '</span>';
    }

    const statusLabel = task.status === 'In Progress' ? '&#9654; In Progress' :
                        task.status === 'Completed'   ? '&#10003; Completed'  :
                                                        'Pending';
    const checkIcon   = task.status === 'Completed'   ? '&#10003;' :
                        task.status === 'In Progress' ? '&#9654;'  : '';

    card.innerHTML =
      '<div class="card-top">' +
        '<div class="ctitle">' + esc(task.title) + '</div>' +
        '<div class="card-btns">' +
          '<button class="cbtn edit" title="Edit">&#9998;</button>' +
          '<button class="cbtn del" title="Delete">&#10005;</button>' +
        '</div>' +
      '</div>' +
      '<div class="tags">' +
        '<span class="tag tag-' + task.category + '">' + task.category + '</span>' +
        '<span class="tag tag-' + task.priority + '">' + priIcon + ' ' + task.priority + '</span>' +
        dueBadge +
      '</div>' +
      '<div class="card-foot">' +
        '<div class="status-tog">' +
          '<div class="chk">' + checkIcon + '</div>' +
          '<span>' + statusLabel + '</span>' +
        '</div>' +
      '</div>';

    card.querySelector('.edit').addEventListener('click', () => openMod(task));
    card.querySelector('.del').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      save(); render(); showToast('Task deleted');
    });
    card.querySelector('.status-tog').addEventListener('click', () => {
      const t = tasks.find(x => x.id === task.id);
      if(t){
        // Cycle: Pending -> In Progress -> Completed -> Pending
        if(t.status === 'Pending') t.status = 'In Progress';
        else if(t.status === 'In Progress') t.status = 'Completed';
        else t.status = 'Pending';
        save(); render();
      }
    });

    grid.appendChild(card);
  });
}

/* -- Helpers -- */
function save() { localStorage.setItem(KEY, JSON.stringify(tasks)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}
