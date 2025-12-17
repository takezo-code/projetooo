const API_URL = 'http://localhost:3000/api';

// State
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// Elements
const authSection = document.getElementById('auth-section');
const kanbanSection = document.getElementById('kanban-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authError = document.getElementById('auth-error');
const tabs = document.querySelectorAll('.tab');
const createTaskSection = document.getElementById('create-task-section');
const createTaskForm = document.getElementById('create-task-form');

// ==================== AUTH ====================

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    if (tab.dataset.tab === 'login') {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    }
    authError.textContent = '';
  });
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      })
    });
    
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.message);
    
    saveAuth(data.data);
    showKanban();
  } catch (err) {
    authError.textContent = err.message;
  }
});

// Register
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value,
        role: document.getElementById('register-role').value
      })
    });
    
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.message);
    
    saveAuth(data.data);
    showKanban();
  } catch (err) {
    authError.textContent = err.message;
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
  } catch (err) {}
  
  clearAuth();
  showAuth();
});

function saveAuth(data) {
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
  currentUser = data.user;
  
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(currentUser));
}

function clearAuth() {
  accessToken = null;
  refreshToken = null;
  currentUser = null;
  
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

// ==================== API CALLS ====================

async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers
    }
  });
  
  // Token expirado - tenta refresh
  if (res.status === 401 && refreshToken) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiFetch(endpoint, options);
    }
    clearAuth();
    showAuth();
    throw new Error('Sessão expirada');
  }
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  
  return data;
}

async function tryRefreshToken() {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!res.ok) return false;
    
    const data = await res.json();
    accessToken = data.data.accessToken;
    refreshToken = data.data.refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return true;
  } catch {
    return false;
  }
}

// ==================== KANBAN ====================

function showAuth() {
  authSection.classList.remove('hidden');
  kanbanSection.classList.add('hidden');
}

function showKanban() {
  authSection.classList.add('hidden');
  kanbanSection.classList.remove('hidden');
  
  // Update user info
  document.getElementById('user-name').textContent = currentUser.name;
  const roleBadge = document.getElementById('user-role');
  roleBadge.textContent = currentUser.role;
  roleBadge.className = `badge ${currentUser.role}`;
  
  // Show create task for ADMIN
  if (currentUser.role === 'ADMIN') {
    createTaskSection.classList.remove('hidden');
    loadUsers();
  }
  
  loadTasks();
}

async function loadTasks() {
  try {
    const data = await apiFetch('/tasks');
    renderTasks(data.data);
  } catch (err) {
    console.error('Erro ao carregar tasks:', err);
  }
}

async function loadUsers() {
  try {
    const data = await apiFetch('/users');
    const select = document.getElementById('task-assigned');
    select.innerHTML = '<option value="">Sem atribuição</option>';
    
    data.data.forEach(user => {
      select.innerHTML += `<option value="${user.id}">${user.name}</option>`;
    });
  } catch (err) {
    console.error('Erro ao carregar usuários:', err);
  }
}

function renderTasks(tasks) {
  // Clear columns
  document.getElementById('backlog-tasks').innerHTML = '';
  document.getElementById('in_progress-tasks').innerHTML = '';
  document.getElementById('review-tasks').innerHTML = '';
  document.getElementById('done-tasks').innerHTML = '';
  
  tasks.forEach(task => {
    const card = createTaskCard(task);
    const column = document.getElementById(`${task.status.toLowerCase()}-tasks`);
    if (column) column.appendChild(card);
  });
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.innerHTML = `
    <h4>${task.title}</h4>
    <p>${task.description || 'Sem descrição'}</p>
    <div class="meta">
      ${task.assignedToName ? `👤 ${task.assignedToName}` : '👤 Não atribuída'}
    </div>
    <div class="actions">
      ${getTaskActions(task)}
    </div>
  `;
  
  // Add event listeners
  card.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleTaskAction(task.id, btn.dataset.action));
  });
  
  return card;
}

function getTaskActions(task) {
  const isAdmin = currentUser.role === 'ADMIN';
  const isAssigned = task.assignedTo === currentUser.id;
  let actions = '';
  
  // Move actions based on status and role
  if (task.status === 'BACKLOG' && (isAdmin || isAssigned)) {
    actions += `<button data-action="IN_PROGRESS">▶ Iniciar</button>`;
  }
  if (task.status === 'IN_PROGRESS' && (isAdmin || isAssigned)) {
    actions += `<button data-action="REVIEW">👀 Review</button>`;
  }
  if (task.status === 'REVIEW' && isAdmin) {
    actions += `<button data-action="DONE">✅ Aprovar</button>`;
    actions += `<button data-action="IN_PROGRESS">↩ Rejeitar</button>`;
  }
  
  // Admin actions
  if (isAdmin) {
    actions += `<button data-action="delete" class="delete">🗑</button>`;
  }
  
  return actions;
}

async function handleTaskAction(taskId, action) {
  try {
    if (action === 'delete') {
      await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
    } else {
      await apiFetch(`/tasks/${taskId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ newStatus: action })
      });
    }
    loadTasks();
  } catch (err) {
    alert(err.message);
  }
}

// Create task
createTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const assignedTo = document.getElementById('task-assigned').value;
    await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        assignedTo: assignedTo ? parseInt(assignedTo) : undefined
      })
    });
    
    createTaskForm.reset();
    loadTasks();
  } catch (err) {
    alert(err.message);
  }
});

// ==================== INIT ====================

if (accessToken && currentUser) {
  showKanban();
} else {
  showAuth();
}

