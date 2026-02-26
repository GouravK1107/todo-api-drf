/* ═════════════════════════════════════════
   FETCH CURRENT USER DATA
═════════════════════════════════════════ */
async function fetchCurrentUser() {
  try {
    const response = await fetch('/useraccounts/api/user/me/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.authenticated) {
        updateUserUI(data.user);
        return data.user;
      }
    }
    
    window.location.href = '/useraccounts/user/login/';
    return null;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    window.location.href = '/useraccounts/user/login/';
    return null;
  }
}

function updateUserUI(user) {
  const userPill = document.querySelector('.user-pill');
  if (userPill) {
    const avatarDiv = userPill.querySelector('.user-ava');
    const nameSpan = userPill.querySelector('span');
    
    if (avatarDiv) {
      avatarDiv.textContent = user.initials || 'U';
    }
    if (nameSpan) {
      nameSpan.textContent = user.full_name || user.email || 'User';
    }
  }
  
  const welcomeElement = document.getElementById('welcomeMessage');
  if (welcomeElement) {
    welcomeElement.textContent = `Welcome back, ${user.first_name || 'User'}!`;
  }
}

async function logout() {
  try {
    const response = await fetch('/useraccounts/api/user/logout/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'same-origin',
    });

    if (response.ok) {
      window.location.href = '/useraccounts/user/login/';
    }
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

/* ═════════════════════════════════════════
   NOTIFICATION FUNCTIONS
═════════════════════════════════════════ */

// Add a new notification to the list
function addNotification(notification) {
  // Add to beginning of array
  notifications.unshift(notification);
  
  // Keep only last 50 notifications to prevent memory issues
  if (notifications.length > 50) {
    notifications = notifications.slice(0, 50);
  }
  
  renderNotifPanel();
  updateNotifBadge();
  
  // Also show a toast for immediate feedback
  showToast(notification.desc, notification.notification_type);
}

// Enhanced toast function with types
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.getElementById('toast');
  const toastTxt = document.getElementById('toastTxt');
  
  // Set icon and color based on type
  let icon = '📋';
  let bgColor = 'linear-gradient(135deg, #4F46E5, #6d28d9)';
  
  switch(type) {
    case 'task_created':
    case 'task_completed':
      icon = '✅';
      bgColor = 'linear-gradient(135deg, #10B981, #059669)';
      break;
    case 'task_updated':
      icon = '📝';
      bgColor = 'linear-gradient(135deg, #3B82F6, #2563EB)';
      break;
    case 'task_deleted':
      icon = '🗑️';
      bgColor = 'linear-gradient(135deg, #EF4444, #DC2626)';
      break;
    case 'task_uncompleted':
      icon = '🔄';
      bgColor = 'linear-gradient(135deg, #F59E0B, #D97706)';
      break;
    case 'task_important':
      icon = '⭐';
      bgColor = 'linear-gradient(135deg, #FBBF24, #F59E0B)';
      break;
    case 'task_unimportant':
      icon = '⭐';
      bgColor = 'linear-gradient(135deg, #9CA3AF, #6B7280)';
      break;
    case 'project_assigned':
    case 'project_changed':
      icon = '📁';
      bgColor = 'linear-gradient(135deg, #8B5CF6, #7C3AED)';
      break;
    case 'overdue':
      icon = '⚠️';
      bgColor = 'linear-gradient(135deg, #EF4444, #B91C1C)';
      break;
    case 'due_soon':
      icon = '⏰';
      bgColor = 'linear-gradient(135deg, #F59E0B, #B45309)';
      break;
  }
  
  toast.style.background = bgColor;
  toastTxt.innerHTML = `${icon} ${message}`;
  toast.classList.add('show');
  
  // Clear any existing timer
  if (toast.timer) {
    clearTimeout(toast.timer);
  }
  
  // Auto-hide after duration
  toast.timer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Update existing toast function
function toast(msg) {
  showToast(msg, 'info');
}

function updateNotifBadge() {
  const unread = notifications.filter((n) => !n.read).length;
  const pip = document.getElementById("notifPip");
  if (unread > 0) {
    pip.classList.add("active");
    pip.style.backgroundColor = "var(--danger)";
  } else {
    pip.classList.remove("active");
    pip.style.backgroundColor = "";
  }
}

function renderNotifPanel() {
  const list = document.getElementById("notifList");
  if (!list) return;
  
  if (notifications.length === 0) {
    list.innerHTML = `<div class="notif-empty"><div class="e-ico">🔔</div><p>No notifications</p></div>`;
    return;
  }
  
  list.innerHTML = notifications
    .map(
      (n) => `
    <div class="notif-item ${n.read ? "" : "unread"}" data-id="${n.id}" onclick="markNotificationRead(${n.id})">
      <div class="notif-ico">${n.icon || '🔔'}</div>
      <div class="notif-content">
        <div class="notif-title">${n.title} ${n.read ? "" : '<span class="notif-badge">new</span>'}</div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-time">🕒 ${n.time || 'Just now'}</div>
      </div>
    </div>
  `,
    )
    .join("");
}

function toggleNotifPanel(force) {
  const panel = document.getElementById("notifPanel");
  if (!panel) return;
  const isOpen = panel.classList.contains("open");
  if (force === false || (force === undefined && isOpen)) {
    panel.classList.remove("open");
  } else {
    panel.classList.add("open");
  }
}

// Mark notification as read
async function markNotificationRead(id) {
  try {
    const response = await fetch(`/tasko/api/notifications/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'same-origin',
      body: JSON.stringify({ read: true }),
    });

    if (response.ok) {
      const notif = notifications.find(n => n.id === id);
      if (notif) notif.read = true;
      renderNotifPanel();
      updateNotifBadge();
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}

// Mark all notifications as read
async function markAllNotificationsRead() {
  try {
    const response = await fetch('/tasko/api/notifications/mark_all_read/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'same-origin',
    });

    if (response.ok) {
      notifications.forEach((n) => (n.read = true));
      renderNotifPanel();
      updateNotifBadge();
      showToast("All notifications marked as read", 'info');
    }
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
  }
}

// Clear all notifications
async function clearAllNotifications() {
  try {
    const response = await fetch('/tasko/api/notifications/clear_all/', {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'same-origin',
    });

    if (response.ok) {
      notifications = [];
      renderNotifPanel();
      updateNotifBadge();
      showToast("All notifications cleared", 'info');
    }
  } catch (error) {
    console.error('Failed to clear notifications:', error);
  }
}

// Fetch notifications from API
async function fetchNotifications() {
  try {
    const response = await fetch('/tasko/api/notifications/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (response.ok) {
      notifications = await response.json();
      renderNotifPanel();
      updateNotifBadge();
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }
}

/* ═════════════════════════════════════════
   API FUNCTIONS - TASKS
═════════════════════════════════════════ */

// Show/hide loading state
function setLoading(isLoading) {
  const tasksOut = document.getElementById("tasksOut");
  if (isLoading) {
    tasksOut.innerHTML = `<div class="task-grid"><div class="empty"><div class="e-ico">⏳</div><h3>Loading tasks...</h3><p>Please wait a moment.</p></div></div>`;
  }
}

// Fetch ALL tasks for stats
async function fetchAllTasks() {
  try {
    const response = await fetch('/tasko/api/tasks/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (response.ok) {
      const data = await response.json();
      allTasks = data;
      updateAllCounters(); // Update counters with full data
      return data;
    }
  } catch (error) {
    console.error('Failed to fetch all tasks:', error);
  }
  return [];
}

// Fetch filtered tasks for display
async function fetchFilteredTasks() {
  try {
    setLoading(true);
    
    // Build query string based on current filters
    const params = new URLSearchParams();
    if (fView !== 'all') params.append('done', fView === 'completed' ? 'true' : 'false');
    if (fPri !== 'all') params.append('priority', fPri);
    if (fProject) params.append('project', fProject);
    if (query) params.append('search', query);
    
    const url = `/tasko/api/tasks/?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (response.ok) {
      const data = await response.json();
      filteredTasks = data;
      render(); // Render only the filtered tasks
    } else if (response.status === 401) {
      window.location.href = '/useraccounts/user/login/';
    }
  } catch (error) {
    console.error('Failed to fetch filtered tasks:', error);
    showToast('Failed to load tasks', 'error');
  } finally {
    setLoading(false);
  }
}

// Fetch dashboard stats
async function fetchStats() {
  try {
    const response = await fetch('/tasko/api/stats/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (response.ok) {
      const stats = await response.json();
      updateStatsUI(stats);
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
}

// Create or update task
async function saveTask(taskData, isEdit = false) {
  try {
    const url = isEdit ? `/tasko/api/tasks/${taskData.id}/` : '/tasko/api/tasks/';
    const method = isEdit ? 'PUT' : 'POST';
    
    if (!isEdit && taskData.id) {
      delete taskData.id;
    }
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'same-origin',
      body: JSON.stringify(taskData),
    });

    if (response.ok) {
      const savedTask = await response.json();
      
      // Create a client-side notification
      const projectDisplay = taskData.project ? 
        taskData.project.charAt(0).toUpperCase() + taskData.project.slice(1) : 'No project';
      
      if (isEdit) {
        // Check what changed (simplified - in real app you'd get this from API)
        const notification = {
          id: Date.now() + Math.random(),
          title: 'Task Updated',
          desc: `You updated task "${taskData.title}"`,
          notification_type: 'task_updated',
          icon: '📝',
          read: false,
          time: 'Just now',
          created_at: new Date().toISOString()
        };
        addNotification(notification);
      } else {
        const notification = {
          id: Date.now() + Math.random(),
          title: 'Task Created',
          desc: `You created task "${taskData.title}" in ${projectDisplay}`,
          notification_type: 'task_created',
          icon: '✅',
          read: false,
          time: 'Just now',
          created_at: new Date().toISOString()
        };
        addNotification(notification);
      }
      
      // Refresh all data
      await Promise.all([
        fetchAllTasks(),
        fetchFilteredTasks(),
        fetchStats()
      ]);
      
      return savedTask;
    } else if (response.status === 401) {
      window.location.href = '/useraccounts/user/login/';
    } else {
      const error = await response.json();
      console.error('Save task error:', error);
      showToast('Failed to save task', 'error');
    }
  } catch (error) {
    console.error('Failed to save task:', error);
    showToast('Network error', 'error');
  }
  return null;
}

// Delete task
async function deleteTaskFromAPI(id) {
  try {
    // Find task before deleting for notification
    const task = allTasks.find(t => t.id === id);
    
    const response = await fetch(`/tasko/api/tasks/${id}/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'same-origin',
    });

    if (response.ok) {
      if (task) {
        const notification = {
          id: Date.now() + Math.random(),
          title: 'Task Deleted',
          desc: `You deleted task "${task.title}"`,
          notification_type: 'task_deleted',
          icon: '🗑️',
          read: false,
          time: 'Just now',
          created_at: new Date().toISOString()
        };
        addNotification(notification);
      }
      
      // Refresh all data
      await Promise.all([
        fetchAllTasks(),
        fetchFilteredTasks(),
        fetchStats()
      ]);
      return true;
    } else if (response.status === 401) {
      window.location.href = '/useraccounts/user/login/';
    }
  } catch (error) {
    console.error('Failed to delete task:', error);
    showToast('Failed to delete task', 'error');
  }
  return false;
}

// Toggle task done status
async function toggleDone(id) {
  const t = allTasks.find((x) => x.id === id);
  if (!t) return;
  
  const wasDone = t.done;
  t.done = !t.done;
  
  const saved = await saveTask(t, true);
  if (saved) {
    // Add notification for toggle
    const notification = {
      id: Date.now() + Math.random(),
      title: wasDone ? 'Task Reopened' : 'Task Completed',
      desc: wasDone ? `You reopened task "${t.title}"` : `You completed task "${t.title}"`,
      notification_type: wasDone ? 'task_uncompleted' : 'task_completed',
      icon: wasDone ? '🔄' : '✅',
      read: false,
      time: 'Just now',
      created_at: new Date().toISOString()
    };
    addNotification(notification);
    
    // Update allTasks
    const index = allTasks.findIndex(x => x.id === id);
    if (index !== -1) {
      allTasks[index] = saved;
    }
    // Update filteredTasks if needed
    const filteredIndex = filteredTasks.findIndex(x => x.id === id);
    if (filteredIndex !== -1) {
      filteredTasks[filteredIndex] = saved;
    }
    render();
  }
}

async function deleteTask(id) {
  const success = await deleteTaskFromAPI(id);
  if (success) {
    // Task already deleted and notification added
  }
}

function openEdit(id) {
  const t = allTasks.find((x) => x.id === id);
  if (!t) return;
  editId = id;
  document.getElementById("mhd").textContent = "Edit Task";
  document.getElementById("mTitle").value = t.title;
  document.getElementById("mDesc").value = t.desc;
  document.getElementById("mDate").value = t.date || "";
  document.getElementById("mPri").value = t.priority;
  document.getElementById("mProj").value = t.project || "";
  document.getElementById("mImp").checked = t.important;
  openModal();
}

/* ═════════════════════════════════════════
   STATE
═════════════════════════════════════════ */
let allTasks = [];        // Complete unfiltered task list (for counters)
let filteredTasks = [];   // Filtered task list (for display)
let fView = "all";        // sidebar filter
let fPri = "all";         // priority chip filter
let fProject = null;      // project filter
let isList = false;
let editId = null;
let query = "";

let notifications = [];

/* ═════════════════════════════════════════
   HELPERS
═════════════════════════════════════════ */
const esc = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
    
const isOver = (d) =>
  d && new Date(d + "T00:00:00") < new Date(new Date().toDateString());
  
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const PW = { high: 3, medium: 2, low: 1 };

function getFiltered() {
  // Sort filtered tasks locally
  let t = [...filteredTasks];
  
  const s = document.getElementById("sortSel").value;
  if (s === "priority") t.sort((a, b) => PW[b.priority] - PW[a.priority]);
  else if (s === "title") t.sort((a, b) => a.title.localeCompare(b.title));
  else
    t.sort((a, b) =>
      !a.date && !b.date
        ? 0
        : !a.date
          ? 1
          : !b.date
            ? -1
            : a.date.localeCompare(b.date),
    );
  return t;
}

/* ═════════════════════════════════════════
   CARD TEMPLATE
═════════════════════════════════════════ */
function cardHTML(t, delay) {
  const od = isOver(t.date) && !t.done;
  const pCls =
    t.priority === "high" ? "ph" : t.priority === "medium" ? "pm" : "pl";
  return `
<article class="task-card ${pCls}${t.done ? " done" : ""}" data-id="${t.id}" style="animation-delay:${delay}s">
  <div class="tc-top">
    <div class="cb${t.done ? " checked" : ""}"
         role="checkbox" aria-checked="${t.done}" tabindex="0"
         onclick="toggleDone(${t.id})"
         onkeydown="if(event.key==='Enter'||event.key===' ')toggleDone(${t.id})">
      ${t.done ? `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>` : ""}
    </div>
    <div class="tc-body">
      <p class="tc-title">${esc(t.title)}</p>
      <p class="tc-desc">${esc(t.desc)}</p>
    </div>
    <div class="tc-acts">
      <button class="tc-btn" onclick="openEdit(${t.id})" title="Edit" aria-label="Edit task">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="tc-btn del" onclick="deleteTask(${t.id})" title="Delete" aria-label="Delete task">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
  </div>
  <div class="tc-foot">
    <span class="badge ${t.priority}">${t.priority}</span>
    ${t.important ? '<span class="badge imp">★ important</span>' : ""}
    ${
      t.date
        ? `<span class="tc-date${od ? " od" : ""}">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      ${od ? "Overdue · " : ""}${fmtDate(t.date)}
    </span>`
        : ""
    }
  </div>
</article>`;
}

/* ═════════════════════════════════════════
   RENDER
═════════════════════════════════════════ */
function render() {
  const out = document.getElementById("tasksOut");
  
  // Safety check - if no filtered tasks, show empty state
  if (!filteredTasks || filteredTasks.length === 0) {
    out.innerHTML = `<div class="task-grid"><div class="empty"><div class="e-ico">✨</div><h3>No tasks found</h3><p>Try a different filter or add something new.</p></div></div>`;
    // Still update counters even when no filtered tasks
    updateAllCounters();
    return;
  }

  const ft = getFiltered();
  const todo = ft.filter((t) => !t.done);
  const done = ft.filter((t) => t.done);
  let html = "";

  if (todo.length) {
    html += `<div class="tasks-group">
      <div class="section-row"><h2>To Do</h2><div class="section-line"></div><span class="section-count">${todo.length}</span></div>
      <div class="task-grid${isList ? " list" : ""}">${todo.map((t, i) => cardHTML(t, i * 0.04)).join("")}</div>
    </div>`;
  }
  if (done.length && fView !== "pending") {
    html += `<div class="tasks-group">
      <div class="section-row"><h2>Completed</h2><div class="section-line"></div><span class="section-count">${done.length}</span></div>
      <div class="task-grid${isList ? " list" : ""}">${done.map((t, i) => cardHTML(t, i * 0.04)).join("")}</div>
    </div>`;
  }
  out.innerHTML = html;
  
  // Always update counters after rendering
  updateAllCounters();
}

// Update counters using ALL tasks (not filtered)
function updateAllCounters() {
  // Safety check - if no allTasks, set everything to 0
  if (!allTasks || allTasks.length === 0) {
    // Update overview badges
    document.getElementById("ct-all").textContent = 0;
    document.getElementById("ct-dn").textContent = 0;
    document.getElementById("ct-pd").textContent = 0;
    document.getElementById("ct-im").textContent = 0;
    
    // Update stats tiles
    document.getElementById("s-all").textContent = 0;
    document.getElementById("s-dn").textContent = 0;
    document.getElementById("s-pd").textContent = 0;
    document.getElementById("s-od").textContent = 0;

    // Update project badges
    document.getElementById("proj-Work").textContent = 0;
    document.getElementById("proj-Personal").textContent = 0;
    document.getElementById("proj-Health").textContent = 0;

    // Progress ring
    document.getElementById("progPct").textContent = "0%";
    document.getElementById("progSub").textContent = "0 of 0 done";
    document.getElementById("progBar").style.width = "0%";
    document.getElementById("progDone").textContent = "0 done";
    document.getElementById("progLeft").textContent = "0 left";
    
    const ringFill = document.getElementById("ringFill");
    if (ringFill) {
      ringFill.style.strokeDashoffset = 138.2;
    }
    return;
  }

  const all = allTasks.length;
  const dn = allTasks.filter((t) => t.done).length;
  const pd = allTasks.filter((t) => !t.done).length;
  const im = allTasks.filter((t) => t.important).length;
  const od = allTasks.filter((t) => !t.done && isOver(t.date)).length;

  // Update overview badges
  document.getElementById("ct-all").textContent = all;
  document.getElementById("ct-dn").textContent = dn;
  document.getElementById("ct-pd").textContent = pd;
  document.getElementById("ct-im").textContent = im;
  
  // Update stats tiles
  document.getElementById("s-all").textContent = all;
  document.getElementById("s-dn").textContent = dn;
  document.getElementById("s-pd").textContent = pd;
  document.getElementById("s-od").textContent = od;

  // Update project badges using ALL tasks
  const projMap = {
    work: 0,
    personal: 0,
    health: 0
  };
  
  allTasks.forEach((t) => {
    if (t.project && projMap.hasOwnProperty(t.project)) {
      projMap[t.project]++;
    }
  });

  const workBadge = document.getElementById("proj-Work");
  const personalBadge = document.getElementById("proj-Personal");
  const healthBadge = document.getElementById("proj-Health");

  if (workBadge) workBadge.textContent = projMap.work;
  if (personalBadge) personalBadge.textContent = projMap.personal;
  if (healthBadge) healthBadge.textContent = projMap.health;

  // Progress ring
  const pct = all ? Math.round((dn / all) * 100) : 0;
  const circ = 138.2;
  const ringFill = document.getElementById("ringFill");
  if (ringFill) {
    ringFill.style.strokeDashoffset = circ - (circ * pct) / 100;
  }
  
  document.getElementById("progPct").textContent = pct + "%";
  document.getElementById("progSub").textContent = `${dn} of ${all} done`;
  document.getElementById("progBar").style.width = pct + "%";
  document.getElementById("progDone").textContent = `${dn} done`;
  document.getElementById("progLeft").textContent = `${pd} left`;
}

// Update stats UI
function updateStatsUI(stats) {
  if (stats) {
    document.getElementById('s-all').textContent = stats.total_tasks || 0;
    document.getElementById('s-dn').textContent = stats.completed_tasks || 0;
    document.getElementById('s-pd').textContent = stats.pending_tasks || 0;
    document.getElementById('s-od').textContent = stats.overdue_tasks || 0;
  }
}

/* ═════════════════════════════════════════
   MODAL
═════════════════════════════════════════ */
function openModal() {
  document.getElementById("modalWrap").classList.add("open");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("mTitle").focus(), 120);
  
  // Update project dropdown with available projects
  const projectSelect = document.getElementById("mProj");
  if (projectSelect) {
    projectSelect.innerHTML = '<option value="">— No project —</option>';
    ['work', 'personal', 'health'].forEach(proj => {
      const option = document.createElement('option');
      option.value = proj;
      option.textContent = proj.charAt(0).toUpperCase() + proj.slice(1);
      projectSelect.appendChild(option);
    });
  }
}

function closeModal() {
  document.getElementById("modalWrap").classList.remove("open");
  document.body.style.overflow = "";
  editId = null;
  document.getElementById("mhd").textContent = "Add New Task";
  ["mTitle", "mDesc", "mDate"].forEach((id) => {
    document.getElementById(id).value = "";
    document.getElementById(id).classList.remove("err");
  });
  document.getElementById("mPri").value = "medium";
  document.getElementById("mProj").value = "";
  document.getElementById("mImp").checked = false;
}

/* ═════════════════════════════════════════
   SIDEBAR MOBILE FUNCTION
═════════════════════════════════════════ */
function toggleSidebar(force) {
  const sb = document.getElementById("sidebar"),
    ov = document.getElementById("sbOv");
  const open = force !== undefined ? force : !sb.classList.contains("open");
  sb.classList.toggle("open", open);
  ov.classList.toggle("open", open);
}

/* ═════════════════════════════════════════
   INITIALIZE DASHBOARD
═════════════════════════════════════════ */
function initializeDashboard() {
  // Modal buttons
  document.getElementById("openModal").addEventListener("click", openModal);
  document.getElementById("mClose").addEventListener("click", closeModal);
  document.getElementById("mCancel").addEventListener("click", closeModal);
  document.getElementById("modalWrap").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modalWrap")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  document.getElementById("mSave").addEventListener("click", async () => {
    const titleEl = document.getElementById("mTitle");
    const title = titleEl.value.trim();
    if (!title) {
      titleEl.classList.add("err");
      titleEl.focus();
      return;
    }
    titleEl.classList.remove("err");

    const data = {
      title,
      desc: document.getElementById("mDesc").value.trim(),
      date: document.getElementById("mDate").value || null,
      priority: document.getElementById("mPri").value,
      project: document.getElementById("mProj").value || null,
      important: document.getElementById("mImp").checked,
    };
    
    if (editId) {
      data.id = editId;
      const saved = await saveTask(data, true);
      if (saved) {
        showToast("Task updated successfully", 'task_updated');
      }
    } else {
      const saved = await saveTask(data, false);
      if (saved) {
        showToast("Task added successfully", 'task_created');
      }
    }
    closeModal();
  });

  // Sidebar filters (Overview)
  document.querySelectorAll(".sb-link[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".sb-link")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      fView = btn.dataset.filter;
      fProject = null;
      
      const map = {
        all: "All Tasks",
        pending: "Pending Tasks",
        completed: "Completed Tasks",
        important: "Important Tasks",
      };
      document.getElementById("pageTitle").textContent = map[fView] || "Tasks";
      
      fetchFilteredTasks(); // Fetch filtered tasks for display
      if (window.innerWidth < 768) toggleSidebar(false);
    });
  });

  // Project filters
  document.querySelectorAll(".sb-link[data-project]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const projValue = btn.dataset.project;
      
      if (fProject === projValue) {
        return;
      }

      fProject = projValue;

      document
        .querySelectorAll(".sb-link[data-filter]")
        .forEach((b) => b.classList.remove("active"));

      const projName = projValue.charAt(0).toUpperCase() + projValue.slice(1) + " Tasks";
      document.getElementById("pageTitle").textContent = projName;

      fetchFilteredTasks(); // Fetch filtered tasks for display
      if (window.innerWidth < 768) toggleSidebar(false);
    });
  });

  // Priority chips
  document.querySelectorAll(".pf-chip").forEach((c) => {
    c.addEventListener("click", () => {
      document
        .querySelectorAll(".pf-chip")
        .forEach((x) => x.classList.remove("on"));
      c.classList.add("on");
      fPri = c.dataset.p;
      fetchFilteredTasks();
    });
  });

  // Sort
  document.getElementById("sortSel").addEventListener("change", render);

  // Search
  let searchTimeout;
  document.getElementById("searchInp").addEventListener("input", (e) => {
    query = e.target.value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchFilteredTasks();
    }, 300);
  });

  // View toggle
  document.getElementById("vGrid").addEventListener("click", () => {
    isList = false;
    document.getElementById("vGrid").classList.add("on");
    document.getElementById("vList").classList.remove("on");
    render();
  });
  document.getElementById("vList").addEventListener("click", () => {
    isList = true;
    document.getElementById("vList").classList.add("on");
    document.getElementById("vGrid").classList.remove("on");
    render();
  });

  // Sidebar mobile
  document
    .getElementById("hbg")
    .addEventListener("click", () => toggleSidebar());
  document
    .getElementById("sbOv")
    .addEventListener("click", () => toggleSidebar(false));

  // Theme
  const root = document.documentElement;
  const SUN = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  const MOON = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
  let dark =
    localStorage.getItem("tasko-theme") === "dark" ||
    (!localStorage.getItem("tasko-theme") &&
      window.matchMedia("(prefers-color-scheme:dark)").matches);

  function applyTheme(d) {
    root.setAttribute("data-theme", d ? "dark" : "light");
    document.getElementById("themeIco").innerHTML = d ? SUN : MOON;
    localStorage.setItem("tasko-theme", d ? "dark" : "light");
    dark = d;
  }
  applyTheme(dark);
  document
    .getElementById("themeBtn")
    .addEventListener("click", () => applyTheme(!dark));

  // Add logout handler
  const logoutBtn = document.querySelector('.logout-link');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Notification listeners
  document.getElementById("notifBell").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleNotifPanel(true);
  });

  document
    .getElementById("closeNotif")
    .addEventListener("click", () => toggleNotifPanel(false));

  document.getElementById("markAllRead")?.addEventListener("click", markAllNotificationsRead);
  document.getElementById("clearNotif")?.addEventListener("click", clearAllNotifications);

  document.addEventListener("click", (e) => {
    const panel = document.getElementById("notifPanel");
    const bell = document.getElementById("notifBell");
    if (
      panel &&
      panel.classList.contains("open") &&
      !panel.contains(e.target) &&
      !bell.contains(e.target)
    ) {
      toggleNotifPanel(false);
    }
  });

  // Initialize
  document.getElementById("pageDate").textContent =
    new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // Load data sequentially to ensure proper state
  setLoading(true);
  Promise.all([
    fetchAllTasks(),
    fetchStats(),
    fetchNotifications()
  ]).then(() => {
    return fetchFilteredTasks();
  }).catch(error => {
    console.error('Error loading initial data:', error);
  }).finally(() => {
    setLoading(false);
  });
}

/* ═════════════════════════════════════════
   DOCUMENT READY
═════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", function () {
  fetchCurrentUser().then(user => {
    if (user) {
      console.log('User authenticated:', user);
      initializeDashboard();
    }
  });
});