// ── Page switching ──────────────────────────────────────────
function showPage(pageId) {

  // logout
  if (pageId === 'logout') {
    sessionStorage.removeItem('loggedIn');
    document.getElementById('loginNavBtn').textContent = 'Login';
    document.getElementById('loginNavBtn').setAttribute('data-page', 'login');
    pageId = 'home';
  }

  // block messages if not logged in
  if (pageId === 'messages' && sessionStorage.getItem('loggedIn') !== 'true') {
    pageId = 'login';
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');

  document.querySelectorAll(`.nav-link[data-page="${pageId}"]`).forEach(l => l.classList.add('active'));

  window.scrollTo(0, 0);

  if (pageId === 'messages') loadMessages();
}

// nav click handler
document.addEventListener('click', (e) => {
  const link = e.target.closest('.nav-link');
  if (link) {
    e.preventDefault();
    const page = link.getAttribute('data-page');
    if (page) showPage(page);
  }
});

// ── Login form ───────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  const status   = document.getElementById('loginStatus');

  status.textContent = 'Logging in...';
  status.style.color = '#64748b';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const result = await res.json();

    if (res.ok && result.success) {
      sessionStorage.setItem('loggedIn', 'true');
      status.textContent = '';
      // change Login → Logout in nav
      const btn = document.getElementById('loginNavBtn');
      btn.textContent = 'Logout';
      btn.setAttribute('data-page', 'logout');
      showPage('messages');
    } else {
      status.textContent = result.error || 'Invalid credentials.';
      status.style.color = '#dc2626';
    }
  } catch {
    status.textContent = 'Server error. Make sure server is running.';
    status.style.color = '#dc2626';
  }
});

// ── Contact form ─────────────────────────────────────────────
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    name:    document.getElementById('name').value,
    email:   document.getElementById('email').value,
    message: document.getElementById('message').value,
  };

  const status = document.getElementById('formStatus');
  status.textContent = 'Sending...';
  status.style.color = '#64748b';

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (res.ok) {
      status.textContent = 'Message sent successfully!';
      status.style.color = '#16a34a';
      e.target.reset();
    } else {
      status.textContent = result.error || 'Something went wrong.';
      status.style.color = '#dc2626';
    }
  } catch {
    status.textContent = 'Server error. Please try again.';
    status.style.color = '#dc2626';
  }
});

// ── Load messages ────────────────────────────────────────────
async function loadMessages() {
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '<p style="text-align:center;color:#64748b;">Loading messages...</p>';

  try {
    const res = await fetch('/api/messages');
    const messages = await res.json();

    if (!messages.length) {
      container.innerHTML = '<p class="no-messages">No messages received yet.</p>';
      return;
    }

    container.innerHTML = messages.map(m => `
      <div class="message-card">
        <div class="msg-header">
          <div>
            <span class="msg-name">${m.name}</span>
            &nbsp;
            <span class="msg-email">${m.email}</span>
          </div>
          <span class="msg-date">${new Date(m.createdAt).toLocaleString()}</span>
        </div>
        <div class="msg-body">${m.message}</div>
      </div>
    `).join('');

  } catch {
    container.innerHTML = '<p class="no-messages">Failed to load messages.</p>';
  }
}
