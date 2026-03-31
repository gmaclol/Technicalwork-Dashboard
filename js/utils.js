// ── Utility functions ──

// ── ESCAPE HTML (XSS prevention) ──
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── DATE HELPERS ──
export function isToday(dateStr) {
  if (!dateStr || dateStr === '—') return false;
  try {
    const parts = dateStr.split(' ');
    if (parts.length < 2) return false;
    const dmy = parts[1];
    const t = new Date();
    const todayStr = String(t.getDate()).padStart(2, '0') + '/' + String(t.getMonth() + 1).padStart(2, '0') + '/' + t.getFullYear();
    return dmy === todayStr;
  } catch { return false; }
}

export function parseTimestamp(timeStr) {
  if (!timeStr || timeStr === '—') return null;
  try {
    const [time, date] = timeStr.split(' ');
    const [hh, mm] = time.split(':');
    const [dd, mo, yyyy] = date.split('/');
    return new Date(yyyy, mo - 1, dd, hh, mm);
  } catch { return null; }
}

export function relativeTime(timeStr) {
  if (!timeStr || timeStr === '—') return '—';
  try {
    const [time, date] = timeStr.split(' ');
    const [hh, mm] = time.split(':');
    const [dd, mo, yyyy] = date.split('/');
    const then = new Date(yyyy, mo - 1, dd, hh, mm);
    const diff = (Date.now() - then.getTime()) / 1000 / 60;
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const dayName = days[then.getDay()];

    if (diff < 2) return 'adesso';
    if (diff < 60) return `${Math.round(diff)} min fa`;
    if (diff < 60 * 24) return `${Math.round(diff / 60)} ore fa`;
    if (diff < 60 * 24 * 7) return `${dayName} ${dd}/${mo}`;
    return 'tempo fa';
  } catch { return timeStr; }
}

export function techStatus(timeStr) {
  if (!timeStr || timeStr === '—') return 'status-red status-circle';
  try {
    const [time, date] = timeStr.split(' ');
    const [hh, mm] = time.split(':');
    const [dd, mo, yyyy] = date.split('/');
    const then = new Date(yyyy, mo - 1, dd, hh, mm);
    const diffH = (Date.now() - then.getTime()) / 1000 / 3600;
    if (diffH < 4) return 'status-green status-circle';
    if (diffH < 24) return 'status-yellow status-circle';
    return 'status-red status-circle';
  } catch { return 'status-red status-circle'; }
}

export function formatDateLabel(dateStr) {
  if (dateStr === 'live') return '📡 Oggi (live)';
  const [yyyy, mm, dd] = dateStr.split('-');
  const d = new Date(yyyy, mm - 1, dd);
  const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  return `${days[d.getDay()]} ${dd}/${mm}/${yyyy}`;
}

// ── TOAST ──
export function showToast(msg, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${escapeHtml(msg)}</span>`;
  el.addEventListener('click', () => dismissToast(el));
  container.appendChild(el);
  const timer = setTimeout(() => dismissToast(el), duration);
  el._timer = timer;
}

function dismissToast(el) {
  clearTimeout(el._timer);
  el.classList.add('hide');
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

// ── FOCUS TRAP (Step 10) ──
export function trapFocus(container) {
  const getFocusable = () => container.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const handler = (e) => {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(getFocusable());
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first || !container.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || !container.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}

// ── CONFIRM MODAL ──
export function showConfirm({ title, msg, icon = '⚠️', okLabel = 'Conferma', okAccent = false } = {}) {
  return new Promise(resolve => {
    document.getElementById('confirm-icon').textContent = icon;
    document.getElementById('confirm-title').textContent = title || '';
    document.getElementById('confirm-msg').textContent = msg || '';
    const btnOk = document.getElementById('confirm-ok');
    btnOk.textContent = okLabel;
    btnOk.className = 'confirm-btn-ok' + (okAccent ? ' btn-accent' : '');
    const overlay = document.getElementById('confirm-overlay');
    overlay.classList.add('show');

    // Focus trap
    const box = overlay.querySelector('.confirm-box');
    const removeTrap = trapFocus(box);

    const close = (result) => {
      overlay.classList.remove('show');
      removeTrap();
      btnOk.replaceWith(btnOk.cloneNode(true));
      document.getElementById('confirm-cancel').replaceWith(document.getElementById('confirm-cancel').cloneNode(true));
      resolve(result);
    };
    document.getElementById('confirm-ok').addEventListener('click', () => close(true), { once: true });
    document.getElementById('confirm-cancel').addEventListener('click', () => close(false), { once: true });
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); }, { once: true });
  });
}

// ── RENAME MODAL ──
export function showRenameModal({ title, defaultValue = '', icon = '✏️' } = {}) {
  return new Promise(resolve => {
    document.getElementById('rename-icon').textContent = icon;
    document.getElementById('rename-title').textContent = title || '';
    const inp = document.getElementById('rename-input');
    inp.value = defaultValue;
    const overlay = document.getElementById('rename-overlay');
    overlay.classList.add('show');
    requestAnimationFrame(() => { inp.focus(); inp.select(); });

    // Focus trap
    const box = overlay.querySelector('.confirm-box');
    const removeTrap = trapFocus(box);

    const close = (result) => {
      overlay.classList.remove('show');
      removeTrap();
      document.getElementById('rename-ok').replaceWith(document.getElementById('rename-ok').cloneNode(true));
      document.getElementById('rename-cancel').replaceWith(document.getElementById('rename-cancel').cloneNode(true));
      inp.removeEventListener('keydown', onKey);
      resolve(result);
    };

    const onKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); close(inp.value.trim() || null); }
      if (e.key === 'Escape') { e.preventDefault(); close(null); }
    };
    inp.addEventListener('keydown', onKey);
    document.getElementById('rename-ok').addEventListener('click', () => close(inp.value.trim() || null), { once: true });
    document.getElementById('rename-cancel').addEventListener('click', () => close(null), { once: true });
    overlay.addEventListener('click', e => { if (e.target === overlay) close(null); }, { once: true });
  });
}
