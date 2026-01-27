const API_URL = 'http://localhost:5000/api';
const firebaseUid = localStorage.getItem('firebaseUid');
const mongoUserId = localStorage.getItem('mongoUserId') || localStorage.getItem('userId');
// Backwards compatibility so we don't touch 94 places
const userId = mongoUserId;

let tasks = [], classes = [], exams = [], notes = [], sessions = [];
let currentTime = 25 * 60;
let isRunning = false;
let timerInterval = null;
let studyTopics = {};
let currentExamId = null;

// Check authentication immediately
if (!userId || userId === 'null' || userId === null) {
  console.warn('No valid userId found, redirecting to login');
  window.location.href = 'login.html';
} else {
  document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupModals();
    setupFormSubmissions();
    setupLogout();
    setupPasswordStrength();
    updateGreeting();
    loadData();
    setupTimer();
    setupCalendar();
    setupNoteEditor();
    setupGoogleDocs();
    setupTheme();
  setupSidebarToggle();
  //detectAndSaveTimezone();
  setupDeleteAccount();
  // setupProfilePicture(); // Removed profile picture
  // setupAITutor(); // Removed AI tutor
  });
}

function setupPasswordStrength() {
  const passwordInput = document.getElementById('modal-new-password');
  const confirmInput = document.getElementById('modal-confirm-password');
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');

  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      const strength = calculatePasswordStrength(password);
      updateStrengthMeter(strength, strengthBar, strengthText);
    });
  }

  if (confirmInput) {
    confirmInput.addEventListener('input', validatePasswordMatch);
  }
}

function calculatePasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score < 2) return 'weak';
  if (score < 3) return 'fair';
  if (score < 4) return 'good';
  return 'strong';
}

function updateStrengthMeter(strength, bar, text) {
  if (!bar || !text) return;

  bar.className = `strength-bar ${strength}`;
  text.className = `strength-text ${strength}`;

  const messages = {
    weak: 'Weak password',
    fair: 'Fair password',
    good: 'Good password',
    strong: 'Strong password'
  };

  text.textContent = messages[strength];
}

function validatePasswordMatch() {
  const newPassword = document.getElementById('modal-new-password').value;
  const confirmPassword = document.getElementById('modal-confirm-password').value;

  if (confirmPassword && newPassword !== confirmPassword) {
    document.getElementById('modal-confirm-password').setCustomValidity('Passwords do not match');
  } else {
    document.getElementById('modal-confirm-password').setCustomValidity('');
  }
}

function updateGreeting() {
  const hour = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (hour >= 12 && hour < 18) timeGreeting = 'Good afternoon';
  if (hour >= 18) timeGreeting = 'Good evening';

  // Try to get user name from multiple sources
  const userName = localStorage.getItem('userName') ||
                   localStorage.getItem('name') ||
                   'there';

  document.getElementById('greeting').textContent = `${timeGreeting}, ${userName}!`;
  document.getElementById('greeting-time').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById(section).classList.add('active');
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Show/hide greeting based on section
      const dashboardTopBar = document.getElementById('dashboard-top-bar');
      const otherTopBar = document.getElementById('other-top-bar');

      if (section === 'dashboard') {
        dashboardTopBar.style.display = 'flex';
        otherTopBar.style.display = 'none';
      } else {
        dashboardTopBar.style.display = 'none';
        otherTopBar.style.display = 'flex';
      }

      // Load Google Docs when notes section is accessed
      if (section === 'notes') {
        if (typeof window.loadGoogleDocs === 'function') {
          window.loadGoogleDocs();
        }
      }

      // Ensure data is loaded for analytics section
      if (section === 'stats') {
        // Re-load data to ensure analytics have fresh data
        loadData();
      }
    });
  });
}

function setupModals() {
  const modals = document.querySelectorAll('.modal');

  modals.forEach(modal => {
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');

    closeBtn?.addEventListener('click', () => modal.classList.remove('show'));
    cancelBtn?.addEventListener('click', () => modal.classList.remove('show'));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('show');
    });
  });

  document.getElementById('add-task-modal-btn')?.addEventListener('click', () => {
    document.getElementById('task-form').reset();
    document.getElementById('task-modal').classList.add('show');
  });

  document.getElementById('add-class-modal-btn')?.addEventListener('click', () => {
    document.getElementById('class-form').reset();
    document.getElementById('class-modal').classList.add('show');
  });

  document.getElementById('add-exam-modal-btn')?.addEventListener('click', () => {
    document.getElementById('exam-form').reset();
    document.getElementById('exam-modal').classList.add('show');
  });

  document.getElementById('add-note-modal-btn')?.addEventListener('click', () => {
    document.getElementById('note-form').reset();
    document.getElementById('note-content').innerHTML = '';
    document.getElementById('note-form').removeAttribute('data-edit-id');
    document.getElementById('note-modal').classList.add('show');
  });

  document.getElementById('change-password-btn')?.addEventListener('click', () => {
    document.getElementById('password-form').reset();
    document.getElementById('password-modal').classList.add('show');
  });

  document.getElementById('import-gdocs-header-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('gdocs-import-modal');
    modal.classList.add('show');

    // Load Google Docs in the import modal
    const docsBrowser = document.getElementById('docs-browser');
    const docsLoading = modal.querySelector('#docs-loading');

    docsLoading.style.display = 'flex';
    docsBrowser.innerHTML = '';

    // Use existing Google Docs loading function
    window.searchGoogleDrive().then(docs => {
      docsLoading.style.display = 'none';

      if (docs.length === 0) {
        docsBrowser.innerHTML = '<p>No Google Docs found. Create some documents first.</p>';
        return;
      }

      docs.forEach(doc => {
        const docItem = document.createElement('div');
        docItem.className = 'drive-file';
        docItem.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${doc.name}</strong><br>
              <small>Modified ${new Date(doc.modifiedTime).toLocaleDateString()}</small>
            </div>
            <button class="btn-primary" onclick="importGoogleDoc('${doc.id}', '${doc.name}'); document.getElementById('gdocs-import-modal').classList.remove('show');">Import</button>
          </div>
        `;
        docsBrowser.appendChild(docItem);
      });
    }).catch(error => {
      docsLoading.style.display = 'none';
      docsBrowser.innerHTML = '<p>Error loading Google Docs. Please check your connection and try again.</p>';
      showNotification('Failed to load Google Docs', 'error');
    });
  });
}

function setupFormSubmissions() {
  document.getElementById('task-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addTask();
    document.getElementById('task-modal').classList.remove('show');
  });

  document.getElementById('class-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addClass();
    document.getElementById('class-modal').classList.remove('show');
  });

  document.getElementById('exam-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addExam();
    document.getElementById('exam-modal').classList.remove('show');
  });

  document.getElementById('note-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addNote();
    document.getElementById('note-modal').classList.remove('show');
  });

  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await changePassword();
    document.getElementById('password-modal').classList.remove('show');
  });
}

function setupLogout() {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
  });
}

async function loadData() {
  try {
    const headers = { 'x-user-id': userId };

    const [tasksRes, classesRes, examsRes, notesRes, sessionsRes] = await Promise.all([
      fetch(`${API_URL}/tasks/user/${userId}`, { headers }),
      fetch(`${API_URL}/classes/user/${userId}`, { headers }),
      fetch(`${API_URL}/exams/user/${userId}`, { headers }),
      fetch(`${API_URL}/notes/user/${userId}`, { headers }),
      fetch(`${API_URL}/sessions/user/${userId}`, { headers })
    ]);



    if (!tasksRes.ok) {
      throw new Error(`Failed to load tasks: ${tasksRes.status}`);
    }

    tasks = await tasksRes.json();
    classes = await classesRes.json();
    exams = await examsRes.json();
    notes = await notesRes.json();
    sessions = await sessionsRes.json();

    renderDashboard();
    renderTasks();
    renderClasses();
    renderExams();
    renderNotes();
    renderSessions();
    updateClassSelects();
  } catch (err) {
    console.error('Load data error:', err);
    showNotification('Error loading data. Please check your connection and try logging in again.', 'error');

    // If authentication fails, redirect to login
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  }
}

function updateClassSelects() {
  const classSelects = ['task-class', 'exam-class', 'note-class', 'session-class'];
  classSelects.forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = '<option value="">Select class (optional)</option>';
      classes.forEach(cls => {
        select.innerHTML += `<option value="${cls._id}">${cls.name}</option>`;
      });
    }
  });

  const examSelect = document.getElementById('session-exam');
  if (examSelect) {
    examSelect.innerHTML = '<option value="">Select exam (optional)</option>';
    exams.forEach(exam => {
      examSelect.innerHTML += `<option value="${exam._id}">${exam.name}</option>`;
    });
  }
}

function renderDashboard() {
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.length - completed;

  document.getElementById('total-tasks').textContent = tasks.length;
  document.getElementById('completed-tasks').textContent = completed;
  document.getElementById('pending-tasks').textContent = pending;
  document.getElementById('total-classes').textContent = classes.length;

  const upcoming = exams.filter(e => new Date(e.date) > new Date()).slice(0, 3);
  document.getElementById('upcoming-list').innerHTML = upcoming.map(e =>
    `<div class="upcoming-item">${e.name} - ${new Date(e.date).toLocaleDateString()}</div>`
  ).join('') || '<div class="no-activity">No upcoming exams</div>';

  // Recent activity - get ALL activities and sort by date
  const recentActivities = [];

  // Add recent task completions
  tasks.filter(t => t.completed && (t.updatedAt || t.createdAt))
    .map(task => ({
      type: 'task',
      text: `Completed "${task.name}"`,
      time: new Date(t.updatedAt || t.createdAt),
      displayTime: new Date(t.updatedAt || t.createdAt).toLocaleDateString()
    }))
    .forEach(activity => recentActivities.push(activity));

  // Add recent notes
  notes.filter(n => n.createdAt)
    .map(note => ({
      type: 'note',
      text: `Created note "${note.title}"`,
      time: new Date(n.createdAt),
      displayTime: new Date(n.createdAt).toLocaleDateString()
    }))
    .forEach(activity => recentActivities.push(activity));

  // Add recent sessions
  sessions.filter(s => s.createdAt)
    .map(session => ({
      type: 'session',
      text: `Study session (${Math.floor(session.duration / 60)}min)`,
      time: new Date(s.createdAt),
      displayTime: new Date(s.createdAt).toLocaleDateString()
    }))
    .forEach(activity => recentActivities.push(activity));

  // Sort by most recent and take top 4
  recentActivities.sort((a, b) => b.time - a.time);

  document.getElementById('recent-list').innerHTML = recentActivities
    .slice(0, 4)
    .map(activity => `
      <div class="recent-item">
        <span class="activity-icon ${activity.type}">
          ${activity.type === 'task' ? '✅' : activity.type === 'note' ? '📝' : '⏱️'}
        </span>
        <div class="activity-text">
          <span>${activity.text}</span>
          <small>${activity.displayTime}</small>
        </div>
      </div>
    `).join('') || '<div class="no-activity">No recent activity</div>';

  updateAnalytics();
}

function renderTasks() {
  const container = document.getElementById('tasks-list');
  container.innerHTML = tasks.map(task => `
    <div class="task-card glass ${task.completed ? 'completed' : ''}" data-task-id="${task._id}">
      <div class="task-header">
        <div class="task-checkbox-wrapper">
          <input type="checkbox" class="modern-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task._id}')">
          <span class="checkmark"></span>
        </div>
        <div class="task-content">
          <h4 class="task-title ${task.completed ? 'completed' : ''}">${task.name}</h4>
          <div class="task-meta">
            <span class="task-priority priority-${task.priority}">${task.priority}</span>
            <span class="task-category">${task.category}</span>
            ${task.due ? `<span class="task-due">${new Date(task.due).toLocaleDateString()}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button onclick="deleteTask('${task._id}')" class="btn-icon btn-delete" title="Delete task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
      ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
    </div>
  `).join('');
}

function renderClasses() {
  const container = document.getElementById('classes-list');
  container.innerHTML = classes.map(cls => `
    <div class="class-card glass">
      <div class="class-header">
        <div class="class-color" style="background: ${cls.color || '#5352ed'}"></div>
        <h4>${cls.name}</h4>
      </div>
      <div class="class-content">
        <p class="class-subject">${cls.subject}</p>
        ${cls.teacher ? `<p class="class-teacher">👨‍🏫 ${cls.teacher}</p>` : ''}
      </div>
      <div class="class-actions">
        <button onclick="deleteClass('${cls._id}')" class="btn-delete btn-small">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderExams() {
  const container = document.getElementById('exams-list');
  container.innerHTML = exams.map(exam => `
    <div class="exam-card glass">
      <div class="exam-header">
        <div class="exam-icon">📝</div>
        <div class="exam-info">
          <h4>${exam.name}</h4>
          <p class="exam-subject">${exam.subject || 'General'}</p>
        </div>
      </div>
      <div class="exam-details">
        <div class="exam-date">
          <span class="detail-icon">📅</span>
          <span>${new Date(exam.date).toLocaleDateString()}</span>
        </div>
        ${exam.time ? `
          <div class="exam-time">
            <span class="detail-icon">⏰</span>
            <span>${exam.time}</span>
          </div>
        ` : ''}
      </div>
      <div class="exam-actions">
        <button onclick="showStudyTopics('${exam._id}')" class="btn-primary btn-small">Study Topics</button>
        <button onclick="deleteExam('${exam._id}')" class="btn-delete btn-small">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderNotes() {
  const container = document.getElementById('notes-list');
  container.innerHTML = notes.map(note => `
    <div class="note-card glass">
      <h4>${note.title}</h4>
      <div class="note-preview">${note.content.substring(0, 100)}...</div>
      <div class="note-actions">
        <button onclick="readNote('${note._id}')" class="btn-small btn-secondary">Read</button>
        <button onclick="editNote('${note._id}')" class="btn-small btn-primary">Edit</button>
        <button onclick="deleteNote('${note._id}')" class="btn-small btn-danger">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderSessions() {
  const container = document.getElementById('sessions-list');
  container.innerHTML = sessions.slice(0, 5).map(session => `
    <div class="session-item">
      <span>${Math.floor(session.duration / 60)} min</span>
      <span>${new Date(session.createdAt).toLocaleDateString()}</span>
    </div>
  `).join('');
}

async function addTask() {
  const task = {
    userId,
    name: document.getElementById('task-name').value,
    category: document.getElementById('task-category').value,
    priority: document.getElementById('task-priority').value,
    due: document.getElementById('task-due').value || null,
    classId: document.getElementById('task-class').value || null,
    description: document.getElementById('task-description').value
  };

  try {
    const res = await fetch(`${API_URL}/tasks/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (res.ok) {
      loadData();
      showNotification('Task added!', 'success');
    }
  } catch (err) {
    showNotification('Error adding task', 'error');
  }
}

async function addClass() {
  const cls = {
    userId,
    name: document.getElementById('class-name').value,
    subject: document.getElementById('class-subject').value,
    teacher: document.getElementById('class-teacher').value,
    color: document.getElementById('class-color').value
  };

  try {
    const res = await fetch(`${API_URL}/classes/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cls)
    });
    if (res.ok) {
      loadData();
      showNotification('Class added!', 'success');
    }
  } catch (err) {
    showNotification('Error adding class', 'error');
  }
}

async function addExam() {
  const exam = {
    userId,
    name: document.getElementById('exam-name').value,
    subject: document.getElementById('exam-class').value,
    date: document.getElementById('exam-date').value,
    time: document.getElementById('exam-time').value,
    description: document.getElementById('exam-description').value
  };

  try {
    const res = await fetch(`${API_URL}/exams/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam)
    });

    const data = await res.json();

    if (res.ok) {
      loadData();
      showNotification('Exam added!', 'success');
    } else if (res.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
      showNotification('Please verify your email address to add exams. Check your inbox for the verification link.', 'error');
    } else {
      showNotification(data.error || 'Error adding exam', 'error');
    }
  } catch (err) {
    showNotification('Error adding exam', 'error');
  }
}

async function addNote() {
  const editId = document.getElementById('note-form').dataset.editId;
  const noteData = {
    userId,
    title: document.getElementById('note-title').value,
    content: document.getElementById('note-content').innerHTML,
    classId: document.getElementById('note-class').value || null
  };

  try {
    const url = editId ? `${API_URL}/notes/${editId}` : `${API_URL}/notes/add`;
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData)
    });

    if (res.ok) {
      loadData();
      showNotification(editId ? 'Note updated!' : 'Note saved!', 'success');
      document.getElementById('note-form').removeAttribute('data-edit-id');
    }
  } catch (err) {
    showNotification('Error saving note', 'error');
  }
}

function readNote(id) {
  const note = notes.find(n => n._id === id);
  if (!note) return;

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content glass note-reader">
      <div class="modal-header">
        <h3>${note.title}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="note-content-reader">${note.content}</div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

function editNote(id) {
  const note = notes.find(n => n._id === id);
  if (!note) return;

  document.getElementById('note-title').value = note.title;
  document.getElementById('note-content').innerHTML = note.content;
  document.getElementById('note-class').value = note.classId || '';

  document.getElementById('note-form').dataset.editId = id;
  document.getElementById('note-modal').classList.add('show');
}

async function changePassword() {
  const currentPassword = document.getElementById('modal-current-password').value;
  const newPassword = document.getElementById('modal-new-password').value;
  const confirmPassword = document.getElementById('modal-confirm-password').value;

  if (newPassword !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }

  const strength = calculatePasswordStrength(newPassword);
  if (strength === 'weak') {
    showNotification('Password is too weak. Please use a stronger password.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        currentPassword,
        newPassword
      })
    });

    const data = await res.json();

    if (res.ok) {
      showNotification('Password changed successfully!', 'success');
    } else {
      showNotification(data.error || 'Invalid current password', 'error');
    }
  } catch (err) {
    showNotification('Error changing password', 'error');
  }
}

async function toggleTask(id) {
  const task = tasks.find(t => t._id === id);
  const taskCard = document.querySelector(`[data-task-id="${id}"]`);

  if (!task) {
    showNotification('Task not found', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ completed: !task.completed })
    });

    if (response.ok) {
      // Update local task object
      task.completed = !task.completed;
      task.updatedAt = new Date().toISOString();

      if (task.completed) {
        taskCard.classList.add('completing');
        showConfetti();
        setTimeout(() => {
          taskCard.classList.add('completed');
          taskCard.classList.remove('completing');
        }, 300);
      } else {
        taskCard.classList.remove('completed');
      }

      const checkbox = taskCard.querySelector('.modern-checkbox');
      const title = taskCard.querySelector('.task-title');
      if (checkbox) checkbox.checked = task.completed;
      if (title) title.classList.toggle('completed', task.completed);

      updateDashboardStats();
      updateAnalytics(); // Update analytics immediately
      showNotification(task.completed ? 'Task completed! 🎉' : 'Task marked as pending', 'success');
    } else {
      const error = await response.json();
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        showNotification('Please verify your email to update tasks.', 'error');
      } else {
        showNotification(error.error || 'Error updating task', 'error');
      }
    }
  } catch (err) {
    showNotification('Error updating task', 'error');
  }
}

function updateDashboardStats() {
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.length - completed;

  document.getElementById('total-tasks').textContent = tasks.length;
  document.getElementById('completed-tasks').textContent = completed;
  document.getElementById('pending-tasks').textContent = pending;
}

function showConfetti() {
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  document.body.appendChild(confettiContainer);

  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.animationDelay = Math.random() * 2 + 's';
    confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
    confetti.style.width = Math.random() * 10 + 5 + 'px';
    confetti.style.height = confetti.style.width;
    confetti.style.borderRadius = '50%';
    confettiContainer.appendChild(confetti);
  }

  setTimeout(() => {
    document.body.removeChild(confettiContainer);
  }, 5000);
}

async function deleteTask(id) {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content glass">
      <div class="modal-header">
        <h3>Delete Task</h3>
        <button class="modal-close">&times;</button>
      </div>
      <p>Are you sure you want to delete this task?</p>
      <div class="modal-actions">
        <button class="btn-secondary modal-cancel">Cancel</button>
        <button class="btn-danger" id="confirm-delete">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => document.body.removeChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector('#confirm-delete').addEventListener('click', async () => {
    try {
      await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
      loadData();
      showNotification('Task deleted', 'success');
      closeModal();
    } catch (err) {
      showNotification('Error deleting task', 'error');
    }
  });
}

async function deleteClass(id) {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content glass">
      <div class="modal-header">
        <h3>Delete Class</h3>
        <button class="modal-close">&times;</button>
      </div>
      <p>Are you sure you want to delete this class?</p>
      <div class="modal-actions">
        <button class="btn-secondary modal-cancel">Cancel</button>
        <button class="btn-danger" id="confirm-delete">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => document.body.removeChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector('#confirm-delete').addEventListener('click', async () => {
    try {
      await fetch(`${API_URL}/classes/${id}`, { method: 'DELETE' });
      loadData();
      showNotification('Class deleted', 'success');
      closeModal();
    } catch (err) {
      showNotification('Error deleting class', 'error');
    }
  });
}

async function deleteExam(id) {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content glass">
      <div class="modal-header">
        <h3>Delete Exam</h3>
        <button class="modal-close">&times;</button>
      </div>
      <p>Are you sure you want to delete this exam?</p>
      <div class="modal-actions">
        <button class="btn-secondary modal-cancel">Cancel</button>
        <button class="btn-danger" id="confirm-delete">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => document.body.removeChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector('#confirm-delete').addEventListener('click', async () => {
    try {
      await fetch(`${API_URL}/exams/${id}`, { method: 'DELETE' });
      loadData();
      showNotification('Exam deleted', 'success');
      closeModal();
    } catch (err) {
      showNotification('Error deleting exam', 'error');
    }
  });
}

async function deleteNote(id) {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content glass">
      <div class="modal-header">
        <h3>Delete Note</h3>
        <button class="modal-close">&times;</button>
      </div>
      <p>Are you sure you want to delete this note?</p>
      <div class="modal-actions">
        <button class="btn-secondary modal-cancel">Cancel</button>
        <button class="btn-danger" id="confirm-delete">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => document.body.removeChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector('#confirm-delete').addEventListener('click', async () => {
    try {
      await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE' });
      loadData();
      showNotification('Note deleted', 'success');
      closeModal();
    } catch (err) {
      showNotification('Error deleting note', 'error');
    }
  });
}

function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 4000);
}

function setupTimer() {
  document.getElementById('start-timer').addEventListener('click', startTimer);
  document.getElementById('pause-timer').addEventListener('click', pauseTimer);
  document.getElementById('reset-timer').addEventListener('click', resetTimer);
}

function startTimer() {
  if (!isRunning) {
    isRunning = true;
    timerInterval = setInterval(() => {
      currentTime--;
      updateTimerDisplay();
      if (currentTime <= 0) {
        pauseTimer();
        showNotification('Time is up!', 'success');
        saveSession();
      }
    }, 1000);
  }
}

function pauseTimer() {
  isRunning = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  pauseTimer();
  currentTime = parseInt(document.getElementById('work-minutes').value) * 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  document.getElementById('timer-text').textContent =
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

async function saveSession() {
  const duration = parseInt(document.getElementById('work-minutes').value) * 60;
  const classId = document.getElementById('session-class').value || null;
  const examId = document.getElementById('session-exam').value || null;

  try {
    await fetch(`${API_URL}/sessions/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, duration, classId, examId })
    });
    loadData();
  } catch (err) {
    showNotification('Error saving study session', 'error');
  }
}

function setupCalendar() {
  const today = new Date();
  renderCalendar(today.getFullYear(), today.getMonth());

  document.getElementById('prev-month').addEventListener('click', () => {
    const month = parseInt(document.getElementById('current-month').dataset.month) - 1;
    const year = parseInt(document.getElementById('current-month').dataset.year);
    if (month < 0) {
      renderCalendar(year - 1, 11);
    } else {
      renderCalendar(year, month);
    }
  });

  document.getElementById('next-month').addEventListener('click', () => {
    const month = parseInt(document.getElementById('current-month').dataset.month) + 1;
    const year = parseInt(document.getElementById('current-month').dataset.year);
    if (month > 11) {
      renderCalendar(year + 1, 0);
    } else {
      renderCalendar(year, month);
    }
  });
}

function renderCalendar(year, month) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const monthEl = document.getElementById('current-month');
  monthEl.textContent = `${monthNames[month]} ${year}`;
  monthEl.dataset.month = month;
  monthEl.dataset.year = year;

  const grid = document.getElementById('calendar-grid');
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  let html = '';
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = new Date().toDateString() === date.toDateString();
    const dayEvents = getDayEvents(date);

    html += `
      <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${date.toISOString().split('T')[0]}">
        <div class="day-number">${day}</div>
        <div class="day-events">
          ${dayEvents.map(event => `
            <div class="mini-${event.type}">
              <span class="event-dot ${event.type}"></span>
              ${event.name.length > 8 ? event.name.substring(0, 8) + '...' : event.name}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;

  // Add click listeners to calendar days
  grid.querySelectorAll('.calendar-day').forEach(day => {
    day.addEventListener('click', (e) => {
      if (!day.classList.contains('empty')) {
        showDayEvents(day.dataset.date);
      }
    });
  });
}



function getDayEvents(date) {
  const dateStr = date.toISOString().split('T')[0];
  const events = [];

  tasks.filter(task => {
    if (!task.due) return false;
    const taskDate = new Date(task.due).toISOString().split('T')[0];
    return taskDate === dateStr;
  }).forEach(task => {
    events.push({ type: 'task', name: task.name, data: task });
  });

  exams.filter(exam => {
    if (!exam.date) return false;
    const examDate = new Date(exam.date).toISOString().split('T')[0];
    return examDate === dateStr;
  }).forEach(exam => {
    events.push({ type: 'exam', name: exam.name, data: exam });
  });

  sessions.filter(session => {
    if (!session.createdAt) return false;
    const sessionDate = new Date(session.createdAt).toISOString().split('T')[0];
    return sessionDate === dateStr;
  }).forEach(session => {
    events.push({ type: 'session', name: `Study Session (${Math.floor(session.duration / 60)}min)`, data: session });
  });

  return events;
}

function showDayEvents(dateStr) {
  const date = new Date(dateStr + 'T00:00:00'); // Ensure we get the correct date
  const events = getDayEvents(date);

  if (events.length === 0) {
    showNotification('No events on this day', 'info');
    return;
  }

  const eventsList = events.map(event => `
    <div class="event-item ${event.type}">
      <strong>${event.name}</strong>
      <div class="event-details">
        ${event.type === 'task' ? `Priority: ${event.data.priority}` : ''}
        ${event.type === 'exam' ? `Time: ${event.data.time || 'Not set'}` : ''}
        ${event.type === 'session' ? `Duration: ${Math.floor(event.data.duration / 60)}min` : ''}
      </div>
    </div>
  `).join('');

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content glass">
      <div class="modal-header">
        <h3>Events for ${date.toLocaleDateString()}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="day-events-content">
        ${eventsList}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

function setupNoteEditor() {
  document.querySelectorAll('.editor-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const command = btn.dataset.command;
      const color = btn.dataset.color;

      if (command) {
        if (document.queryCommandSupported(command)) {
          document.execCommand(command, false, null);
        }
      } else if (color) {
        if (document.queryCommandSupported('backColor')) {
          document.execCommand('backColor', false, color);
        }
      }
    });
  });
}

async function importGoogleDocs(url) {
  try {
    showNotification('Importing from Google Docs...', 'info');

    if (!url || !url.includes('docs.google.com')) {
      showNotification('Please enter a valid Google Docs URL', 'error');
      return;
    }

    const response = await fetch(`${API_URL}/notes/import-gdocs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ url, userId })
    });

    if (response.ok) {
      const data = await response.json();
      const noteContent = document.getElementById('note-content');
      const titleInput = document.getElementById('note-title');

      noteContent.innerHTML = data.content;

      if (data.title && !titleInput.value) {
        titleInput.value = data.title;
      }

      if (data.success) {
        showNotification('Google Docs imported successfully! ✅', 'success');
      } else {
        showNotification(data.message || 'Document linked - configure API for full import', 'info');
      }
    } else {
      const error = await response.json();
      showNotification(error.error || 'Failed to import Google Docs', 'error');
    }

  } catch (err) {
    console.error('Import error:', err);
    showNotification('Error connecting to server', 'error');
  }
}

// Study Topics Functions
function showStudyTopics(examId) {
  currentExamId = examId;
  const exam = exams.find(e => e._id === examId);
  if (!exam) return;

  document.getElementById('current-exam-name').textContent = exam.name;
  document.getElementById('current-exam-date').textContent = `Due: ${new Date(exam.date).toLocaleDateString()}`;

  const section = document.getElementById('study-topics-section');
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth' });

  if (!studyTopics[examId]) {
    studyTopics[examId] = [];
  }

  renderStudyTopics();
  setupStudyTopicsEvents();
}

function setupStudyTopicsEvents() {
  document.getElementById('add-topic-btn').onclick = addStudyTopic;
  document.getElementById('new-topic-input').onkeypress = (e) => {
    if (e.key === 'Enter') addStudyTopic();
  };
}

function addStudyTopic() {
  const input = document.getElementById('new-topic-input');
  const topic = input.value.trim();

  if (!topic || !currentExamId) return;

  if (!studyTopics[currentExamId]) {
    studyTopics[currentExamId] = [];
  }

  studyTopics[currentExamId].push({
    id: Date.now(),
    text: topic,
    completed: false
  });

  input.value = '';
  renderStudyTopics();
  updateTopicsProgress();
}

function renderStudyTopics() {
  if (!currentExamId || !studyTopics[currentExamId]) return;

  const container = document.getElementById('study-topics-list');
  const topics = studyTopics[currentExamId];

  container.innerHTML = topics.map(topic => `
    <div class="topic-item ${topic.completed ? 'completed' : ''}" data-topic-id="${topic.id}">
      <input type="checkbox" class="topic-checkbox" ${topic.completed ? 'checked' : ''}
             onchange="toggleTopic('${topic.id}')">
      <span class="topic-text">${topic.text}</span>
      <button class="topic-remove" onclick="removeTopic('${topic.id}')">×</button>
    </div>
  `).join('');

  updateTopicsProgress();
}

function toggleTopic(topicId) {
  if (!currentExamId || !studyTopics[currentExamId]) return;

  const topic = studyTopics[currentExamId].find(t => t.id == topicId);
  if (!topic) return;

  topic.completed = !topic.completed;
  renderStudyTopics();

  // Check if all topics completed before due date
  const allCompleted = studyTopics[currentExamId].every(t => t.completed);
  const exam = exams.find(e => e._id === currentExamId);

  if (allCompleted && exam && new Date(exam.date) > new Date()) {
    showConfetti();
    showNotification('🎉 All topics completed before due date! Great job!', 'success');
  }
}

function removeTopic(topicId) {
  if (!currentExamId || !studyTopics[currentExamId]) return;

  studyTopics[currentExamId] = studyTopics[currentExamId].filter(t => t.id != topicId);
  renderStudyTopics();
}

function updateTopicsProgress() {
  if (!currentExamId || !studyTopics[currentExamId]) return;

  const topics = studyTopics[currentExamId];
  const completed = topics.filter(t => t.completed).length;
  const total = topics.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById('topics-progress-bar').style.width = percentage + '%';
  document.getElementById('topics-progress-text').textContent = `${percentage}% Complete (${completed}/${total})`;
}
// Toggle study topics section
function toggleStudyTopics() {
  const content = document.getElementById('topics-content');
  const toggle = document.getElementById('topics-toggle');

  if (content.style.display === 'none') {
    content.style.display = 'block';
    toggle.textContent = '▼';
  } else {
    content.style.display = 'none';
    toggle.textContent = '▶';
  }
}

// Delete account functionality
function setupDeleteAccount() {
  document.getElementById('delete-account-btn')?.addEventListener('click', async () => {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content glass">
        <div class="modal-header">
          <h3>Delete Account</h3>
          <button class="modal-close">&times;</button>
        </div>
        <p>Are you sure you want to delete your account? This action cannot be undone.</p>
        <div class="modal-actions">
          <button class="btn-secondary modal-cancel">Cancel</button>
          <button class="btn-danger" id="confirm-delete-account">Delete Account</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => document.body.removeChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    modal.querySelector('#confirm-delete-account').addEventListener('click', async () => {
      const confirmModal = document.createElement('div');
      confirmModal.className = 'modal show';
      confirmModal.innerHTML = `
        <div class="modal-content glass">
          <div class="modal-header">
            <h3>Final Confirmation</h3>
            <button class="modal-close">&times;</button>
          </div>
          <p>This will permanently delete all your data. Are you absolutely sure?</p>
          <div class="modal-actions">
            <button class="btn-secondary modal-cancel">Cancel</button>
            <button class="btn-danger" id="final-confirm">Yes, Delete Everything</button>
          </div>
        </div>
      `;

      document.body.appendChild(confirmModal);

      const closeConfirmModal = () => {
        document.body.removeChild(confirmModal);
        closeModal();
      };

      confirmModal.querySelector('.modal-close').addEventListener('click', closeConfirmModal);
      confirmModal.querySelector('.modal-cancel').addEventListener('click', closeConfirmModal);
      confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) closeConfirmModal();
      });

      confirmModal.querySelector('#final-confirm').addEventListener('click', async () => {
        const deleteBtn = confirmModal.querySelector('#final-confirm');
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Deleting...';

        try {
          const response = await fetch(`${API_URL}/auth/delete-account`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': localStorage.getItem('mongoUserId')
            }
          });

          if (response.ok) {
            showNotification('Account deleted successfully', 'success');
            localStorage.clear();
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 1500);
          } else {
            const data = await response.json();
            showNotification(data.error || 'Error deleting account', 'error');
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Yes, Delete Everything';
          }
        } catch (err) {
          console.error('Delete account error:', err);
          showNotification('Error deleting account', 'error');
          deleteBtn.disabled = false;
          deleteBtn.textContent = 'Yes, Delete Everything';
        }
        document.body.removeChild(confirmModal);
        closeModal();
      });
    });
  });
}

// Update analytics with real data
function updateAnalytics() {
  // Task completion rate
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0;
  document.getElementById('completion-rate').textContent = completionRate + '%';

  // Study time calculations
  const totalMinutes = sessions.reduce((sum, session) => sum + Math.floor(session.duration / 60), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const avgSession = sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0;

  document.getElementById('total-study-time').textContent = totalHours + 'h';
  document.getElementById('avg-session').textContent = avgSession + 'min';

  // Productivity insights
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const tasksByDay = {};

  tasks.forEach(task => {
    if (task.completed && task.updatedAt) {
      const day = new Date(task.updatedAt).getDay();
      tasksByDay[day] = (tasksByDay[day] || 0) + 1;
    }
  });

  const mostProductiveDay = Object.keys(tasksByDay).reduce((a, b) =>
    tasksByDay[a] > tasksByDay[b] ? a : b, 0);

  document.getElementById('most-productive-day').textContent = days[mostProductiveDay] || 'Monday';

  // Calculate streak
  const completedTasks = tasks.filter(t => t.completed).sort((a, b) =>
    new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  let streak = 0;
  let currentDate = new Date();

  for (let task of completedTasks) {
    const taskDate = new Date(task.updatedAt || task.createdAt);
    const daysDiff = Math.floor((currentDate - taskDate) / (1000 * 60 * 60 * 24));

    if (daysDiff <= streak + 1) {
      streak++;
    } else {
      break;
    }
  }

  document.getElementById('streak-count').textContent = streak + ' days';

  // Best focus time (most common session duration)
  const sessionDurations = sessions.map(s => Math.floor(s.duration / 60));
  const durationCounts = {};

  sessionDurations.forEach(duration => {
    durationCounts[duration] = (durationCounts[duration] || 0) + 1;
  });

  const bestFocusTime = Object.keys(durationCounts).reduce((a, b) =>
    durationCounts[a] > durationCounts[b] ? a : b, 25);

  document.getElementById('best-focus-time').textContent = bestFocusTime + 'min';
}

// Google Docs Setup
//function detectAndSaveTimezone() {
  //const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  //fetch(`${API_URL}/userSettings/update-timezone`, {
    //method: 'POST',
    //headers: { 'Content-Type': 'application/json' },
    //body: JSON.stringify({
      //userId: localStorage.getItem('userId'),
      //timezone: timezone
    //})
  //}).catch(err => console.log('Timezone update failed:', err));
//}

function setupTheme() {
  const themeBtn = document.getElementById('theme-btn');
  const themeSelect = document.getElementById('theme-select');

  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'pink';
  document.body.setAttribute('data-theme', savedTheme);
  if (themeSelect) themeSelect.value = savedTheme;

  // Theme button toggle
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-theme');
      const newTheme = currentTheme === 'pink' ? 'babyblue' : 'pink';
      document.body.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      if (themeSelect) themeSelect.value = newTheme;
    });
  }

  // Theme select dropdown
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
  }
}

function setupGoogleDocs() {
  // Search functionality
  const searchInput = document.getElementById('docs-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      if (typeof window.searchDocs === 'function') {
        window.searchDocs(e.target.value);
      }
    });
  }

  // Refresh button
  const refreshBtn = document.getElementById('refresh-docs-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (typeof window.loadGoogleDocs === 'function') {
        window.loadGoogleDocs();
      }
    });
  }

  // Create doc button
  const createBtn = document.getElementById('create-doc-btn');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      if (typeof window.createNewGoogleDoc === 'function') {
        window.createNewGoogleDoc();
      }
    });
  }
}

// AI Tutor Functions
let currentConversationId = null;

function setupAITutor() {
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-message-btn');
  const newChatBtn = document.getElementById('new-chat-btn');

  if (chatInput && sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  if (newChatBtn) {
    newChatBtn.addEventListener('click', createNewConversation);
  }

  // Close conversations sidebar
  const closeConversationsBtn = document.getElementById('close-conversations-btn');
  if (closeConversationsBtn) {
    closeConversationsBtn.addEventListener('click', () => {
      const sidebar = document.getElementById('conversations-sidebar');
      sidebar.style.display = 'none';
    });
  }

  // Load conversations when AI tutor section is shown
  document.querySelector('[data-section="ai-tutor"]').addEventListener('click', () => {
    setTimeout(() => {
      loadConversations();
      // Show conversations sidebar
      const sidebar = document.getElementById('conversations-sidebar');
      sidebar.style.display = 'block';
    }, 100);
  });
}

async function sendMessage() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();

  if (!message) return;

  // Add user message to chat
  addMessage(message, 'user');
  chatInput.value = '';

  try {
    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message ai-message typing';
    typingIndicator.innerHTML = `
      <div class="message-avatar">📚</div>
      <div class="message-content">
        <p>Typing...</p>
      </div>
    `;
    document.getElementById('chat-messages').appendChild(typingIndicator);

    // Call direct AI chat API (simpler, no conversation management)
    const response = await fetch(`${API_URL}/ai-tutor/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ message })
    });

    // Remove typing indicator
    document.getElementById('chat-messages').removeChild(typingIndicator);

    if (response.ok) {
      const data = await response.json();
      addMessage(data.response, 'ai');
    } else {
      const error = await response.json();
      addMessage(error.response || 'Sorry, I\'m having trouble right now. Please try again!', 'ai');
    }
  } catch (error) {
    console.error('AI chat error:', error);
    // Remove typing indicator if it exists
    const typingIndicator = document.querySelector('.typing');
    if (typingIndicator) {
      document.getElementById('chat-messages').removeChild(typingIndicator);
    }
    addMessage('Sorry, I\'m having trouble connecting right now. Please try again in a moment! 🤖', 'ai');
  }
}

function addMessage(content, type) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message`;

  // Use profile picture for user avatar, AI avatar stays as book
  let avatar;
  if (type === 'ai') {
    avatar = '📚';
  } else {
    const profilePic = localStorage.getItem('profilePicture');
    if (profilePic) {
      avatar = `<img src="${profilePic}" alt="Profile" class="profile-avatar-img">`;
    } else {
      avatar = '👤';
    }
  }

  // Handle line breaks in AI responses
  const formattedContent = content.replace(/\n/g, '<br>');

  messageDiv.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <p>${formattedContent}</p>
    </div>
  `;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function quickAsk(topic) {
  let message = '';

  switch (topic) {
    case 'study-plan':
      message = 'Help me create a study plan';
      break;
    case 'prioritize':
      message = 'How should I prioritize my tasks?';
      break;
    case 'exam-tips':
      message = 'Give me exam preparation tips';
      break;
    case 'motivation':
      message = 'I need motivation to study';
      break;
  }

  if (message) {
    await sendMessage(message);
  }
}

// Conversation Management Functions
async function loadConversations() {
  try {
    const response = await fetch(`${API_URL}/ai-tutor/conversations`, {
      headers: {
        'x-user-id': userId
      }
    });

    if (response.ok) {
      const conversations = await response.json();
      renderConversationsList(conversations);
    }
  } catch (error) {
    console.error('Load conversations error:', error);
  }
}

function renderConversationsList(conversations) {
  const container = document.getElementById('conversations-list');

  if (conversations.length === 0) {
    container.innerHTML = '<div class="no-conversations">No conversations yet. Start chatting!</div>';
    return;
  }

  container.innerHTML = conversations.map(conv => `
    <div class="conversation-item ${conv._id === currentConversationId ? 'active' : ''}"
         onclick="switchToConversation('${conv._id}')"
         ondblclick="renameConversation('${conv._id}', '${conv.title.replace(/'/g, "\\'")}')">
      <div class="conversation-title">${conv.title}</div>
      <div class="conversation-date">${new Date(conv.updatedAt).toLocaleDateString()}</div>
    </div>
  `).join('');
}

async function createNewConversation() {
  try {
    const response = await fetch(`${API_URL}/ai-tutor/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ title: 'New Chat' })
    });

    if (response.ok) {
      const conversation = await response.json();
      currentConversationId = conversation._id;

      // Clear chat and show welcome message
      document.getElementById('chat-messages').innerHTML = `
        <div class="message ai-message welcome-message">
          <div class="message-avatar">📚</div>
          <div class="message-content">
            <p>Hi! I'm your Taski study tutor. I can help you understand concepts, plan study sessions, and prepare for exams.</p>
            <p>What would you like help with today?</p>
          </div>
        </div>
      `;

      // Reload conversations list
      loadConversations();
    }
  } catch (error) {
    console.error('Create conversation error:', error);
    showNotification('Failed to create new conversation', 'error');
  }
}

async function switchToConversation(conversationId) {
  try {
    const response = await fetch(`${API_URL}/ai-tutor/conversations/${conversationId}`, {
      headers: {
        'x-user-id': userId
      }
    });

    if (response.ok) {
      const conversation = await response.json();
      currentConversationId = conversationId;
      renderConversation(conversation);

      // Update active state in sidebar
      document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
      });
      document.querySelector(`[onclick="switchToConversation('${conversationId}')"]`).classList.add('active');
    }
  } catch (error) {
    console.error('Switch conversation error:', error);
    showNotification('Failed to load conversation', 'error');
  }
}

async function renameConversation(conversationId, currentTitle) {
  // Create inline rename modal
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content glass" style="max-width: 400px;">
      <div class="modal-header">
        <h3>Rename Conversation</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-form">
        <input type="text" id="rename-input" value="${currentTitle.replace(/"/g, '"')}" placeholder="Enter new title" style="width: 100%; margin-bottom: 1rem;">
        <div class="modal-actions">
          <button class="btn-secondary modal-cancel">Cancel</button>
          <button class="btn-primary" id="confirm-rename">Rename</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => document.body.removeChild(modal);
  const input = modal.querySelector('#rename-input');
  const confirmBtn = modal.querySelector('#confirm-rename');

  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Focus input and select all text
  setTimeout(() => input.focus(), 100);
  input.select();

  // Handle Enter key
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') confirmBtn.click();
  });

  // Handle rename confirmation
  confirmBtn.addEventListener('click', async () => {
    const newTitle = input.value.trim();
    if (!newTitle || newTitle === currentTitle) {
      closeModal();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/ai-tutor/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (response.ok) {
        loadConversations();
        showNotification('Conversation renamed successfully', 'success');
      } else {
        showNotification('Failed to rename conversation', 'error');
      }
    } catch (error) {
      console.error('Rename conversation error:', error);
      showNotification('Failed to rename conversation', 'error');
    }

    closeModal();
  });
}

function renderConversation(conversation) {
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';

  conversation.messages.forEach(message => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}-message`;

    const avatar = message.role === 'assistant' ? '📚' : '👤';

    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <p>${message.content}</p>
      </div>
    `;

    container.appendChild(messageDiv);
  });

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

function setupSidebarToggle() {
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const mainSidebar = document.getElementById('main-sidebar');
  const mainContent = document.querySelector('.main-content');
  const hamburgerIcon = toggleBtn?.querySelector('.hamburger-icon');

  if (toggleBtn && mainSidebar) {
    toggleBtn.addEventListener('click', () => {
      const isCollapsed = mainSidebar.classList.contains('collapsed');

      if (isCollapsed) {
        // Expand sidebar
        mainSidebar.classList.remove('collapsed');
        mainContent.classList.remove('sidebar-collapsed');
        hamburgerIcon.textContent = '☰';
        localStorage.setItem('sidebarCollapsed', 'false');
      } else {
        // Collapse sidebar
        mainSidebar.classList.add('collapsed');
        mainContent.classList.add('sidebar-collapsed');
        hamburgerIcon.textContent = '☰';
        localStorage.setItem('sidebarCollapsed', 'true');
      }
    });

    // Restore sidebar state from localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      mainSidebar.classList.add('collapsed');
      mainContent.classList.add('sidebar-collapsed');
    }
  }
}

function setupProfilePicture() {
  const changeAvatarBtn = document.getElementById('change-avatar-btn');
  const profilePictureInput = document.getElementById('profile-picture-input');

  // Load existing profile picture for all avatar elements
  const savedPicture = localStorage.getItem('profilePicture');
  const allAvatars = document.querySelectorAll('.user-avatar, .current-avatar');

  allAvatars.forEach(avatar => {
    if (savedPicture) {
      avatar.style.backgroundImage = `url(${savedPicture})`;
      avatar.style.backgroundSize = 'cover';
      avatar.style.backgroundPosition = 'center';
      avatar.textContent = '';
    } else {
      // Reset to default if no picture
      avatar.style.backgroundImage = '';
      avatar.textContent = avatar.classList.contains('current-avatar') ? '👤' : '🌸';
    }
  });

  if (changeAvatarBtn && profilePictureInput) {
    changeAvatarBtn.addEventListener('click', () => {
      profilePictureInput.click();
    });

    profilePictureInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image file too large (max 5MB)', 'error');
        return;
      }

      try {
        // Convert to base64
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Image = event.target.result;

          // Save to localStorage
          localStorage.setItem('profilePicture', base64Image);

          // Update ALL avatar elements immediately
          const allAvatarsAfter = document.querySelectorAll('.user-avatar, .current-avatar');
          allAvatarsAfter.forEach(avatar => {
            avatar.style.backgroundImage = `url(${base64Image})`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
            avatar.textContent = '';
          });

          showNotification('Profile picture updated!', 'success');
        };

        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Profile picture error:', error);
        showNotification('Failed to update profile picture', 'error');
      }
    });
  }
}
