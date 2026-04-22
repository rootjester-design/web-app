/* ═══════════════════════════════════════════════════════
   MyClassRoom.LK  —  Global JS Utilities
════════════════════════════════════════════════════════ */
'use strict';

/* ── Custom Cursor ──────────────────────────────────── */
(function initCursor() {
  const dot  = document.getElementById('cur');
  const ring = document.getElementById('cur-ring');
  if (!dot || !ring) return;
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; dot.style.cssText=`left:${mx}px;top:${my}px`; });
  (function loop() {
    rx += (mx-rx)*.12; ry += (my-ry)*.12;
    ring.style.cssText = `left:${rx}px;top:${ry}px`;
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a,button,.btn,.glass-card,.course-card').forEach(el => {
    el.addEventListener('mouseenter', () => { dot.style.width='16px';dot.style.height='16px';ring.style.width='50px';ring.style.height='50px';ring.style.borderColor='rgba(232,0,14,.7)'; });
    el.addEventListener('mouseleave', () => { dot.style.width='10px';dot.style.height='10px';ring.style.width='34px';ring.style.height='34px';ring.style.borderColor='rgba(232,0,14,.4)'; });
  });
})();

/* ── Navbar ─────────────────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive:true });

  const ham  = document.getElementById('nav-ham');
  const menu = document.getElementById('mobile-menu');
  if (ham && menu) {
    ham.addEventListener('click', () => { ham.classList.toggle('open'); menu.classList.toggle('open'); });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { ham.classList.remove('open'); menu.classList.remove('open'); }));
  }

  // Active link highlight
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    if (a.getAttribute('href') === path || (path === '/' && a.getAttribute('href') === '/')) a.classList.add('active');
  });
})();

/* ── Auth Nav State ─────────────────────────────────── */
(function updateNavAuth() {
  const token = getToken();
  const loginBtn  = document.getElementById('nav-login');
  const logoutBtn = document.getElementById('nav-logout');
  const dashBtn   = document.getElementById('nav-dash');
  if (token) {
    loginBtn  && (loginBtn.style.display  = 'none');
    logoutBtn && (logoutBtn.style.display = 'inline-flex');
    dashBtn   && (dashBtn.style.display   = 'inline-flex');
  } else {
    logoutBtn && (logoutBtn.style.display = 'none');
    dashBtn   && (dashBtn.style.display   = 'none');
  }
  logoutBtn && logoutBtn.addEventListener('click', async () => {
    await api.post('/api/auth/logout');
    clearToken();
    window.location.href = '/';
  });
})();

/* ── Toast ──────────────────────────────────────────── */
window.toast = function(msg, type='info', duration=4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]||'💬'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, duration);
};

/* ── Token helpers ──────────────────────────────────── */
window.getToken = () => localStorage.getItem('mcl_token');
window.setToken = (t) => localStorage.setItem('mcl_token', t);
window.clearToken = () => localStorage.removeItem('mcl_token');

/* ── API wrapper ────────────────────────────────────── */
window.api = {
  async _req(method, url, body) {
    const token = getToken();
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
      credentials: 'include',
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    return res.json();
  },
  get:    (url)       => window.api._req('GET',    url),
  post:   (url, body) => window.api._req('POST',   url, body),
  patch:  (url, body) => window.api._req('PATCH',  url, body),
  put:    (url, body) => window.api._req('PUT',    url, body),
  delete: (url)       => window.api._req('DELETE', url),
};

/* ── Reveal on scroll ───────────────────────────────── */
(function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: .1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ── Button ripple ──────────────────────────────────── */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    this.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
});

/* ── Password strength ──────────────────────────────── */
window.checkPasswordStrength = function(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label:'Weak',   color:'#ef4444', pct:25  };
  if (score <= 3) return { label:'Medium', color:'#f59e0b', pct:60  };
  return              { label:'Strong',  color:'#22c55e', pct:100 };
};

/* ── Guard: redirect if not logged in ───────────────── */
window.requireLogin = function(redirectTo='/login') {
  if (!getToken()) window.location.href = redirectTo;
};

/* ── Guard: redirect if already logged in ──────────── */
window.redirectIfLoggedIn = function(to='/dashboard') {
  if (getToken()) window.location.href = to;
};
