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

export function dateOnlyRelativeTime(timeStr) {
  if (!timeStr || timeStr === '—') return '—';
  try {
    const [time, date] = timeStr.split(' ');
    const [dd, mo, yyyy] = date.split('/');
    
    // Normalize to midnight
    const tDate = new Date(yyyy, mo - 1, dd, 0, 0, 0);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    
    const diffDays = Math.round((today.getTime() - tDate.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 0) return 'Oggi';
    
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const dayName = days[tDate.getDay()];
    return `${dayName} ${dd}/${mo}`;
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
export function showToast(msg, type = 'info', duration = 3500, asHtml = false) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const safeMsg = asHtml ? msg : escapeHtml(msg);
  el.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${safeMsg}</span>`;
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
export function showConfirm({ title, msg, icon = '⚠️', okLabel = 'Conferma', okAccent = false, extraLabel = null, asHtml = false } = {}) {
  return new Promise(resolve => {
    document.getElementById('confirm-icon').textContent = icon;
    document.getElementById('confirm-title').textContent = title || '';
    const msgEl = document.getElementById('confirm-msg');
    if (msg) {
      if (asHtml) {
        msgEl.innerHTML = msg;
      } else {
        msgEl.textContent = msg;
      }
    } else {
      msgEl.textContent = '';
    }
    
    const btnOk = document.getElementById('confirm-ok');
    btnOk.textContent = okLabel;
    btnOk.className = 'confirm-btn-ok' + (okAccent ? ' btn-accent' : '');
    
    const btnExtra = document.getElementById('confirm-extra');
    if (extraLabel) {
      btnExtra.textContent = extraLabel;
      btnExtra.style.display = 'inline-block';
    } else {
      btnExtra.style.display = 'none';
    }

    const overlay = document.getElementById('confirm-overlay');
    overlay.classList.add('show');
    if (typeof window.lockScroll === 'function') window.lockScroll();

    // Focus trap
    const box = overlay.querySelector('.confirm-box');
    const removeTrap = trapFocus(box);

    // Focus the cancel button for immediate keyboard use
    const cancelBtn = document.getElementById('confirm-cancel');
    requestAnimationFrame(() => { if (cancelBtn) cancelBtn.focus(); });

    const close = (result) => {
      overlay.classList.remove('show');
      removeTrap();
      document.removeEventListener('keydown', onEsc);
      if (typeof window.unlockScroll === 'function') window.unlockScroll();
      btnOk.replaceWith(btnOk.cloneNode(true));
      btnExtra.replaceWith(btnExtra.cloneNode(true));
      document.getElementById('confirm-cancel').replaceWith(document.getElementById('confirm-cancel').cloneNode(true));
      resolve(result);
    };

    // Escape key closes modal
    const onEsc = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
    };
    document.addEventListener('keydown', onEsc);

    document.getElementById('confirm-ok').addEventListener('click', () => close(true), { once: true });
    document.getElementById('confirm-extra').addEventListener('click', () => close('extra'), { once: true });
    document.getElementById('confirm-cancel').addEventListener('click', () => close(false), { once: true });
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); }, { once: true });
  });
}

// ── RENAME MODAL ──
export function showRenameModal(options = {}) {
  let title = 'Rinomina';
  let defaultValue = '';
  let icon = '✏️';

  if (typeof options === 'string') {
    defaultValue = options;
  } else if (options && typeof options === 'object') {
    title = options.title || title;
    defaultValue = options.defaultValue || defaultValue;
    icon = options.icon || icon;
  }

  return new Promise(resolve => {
    document.getElementById('rename-icon').textContent = icon;
    document.getElementById('rename-title').textContent = title || '';
    const inp = document.getElementById('rename-input');
    inp.value = defaultValue;
    const overlay = document.getElementById('rename-overlay');
    overlay.classList.add('show');
    if (typeof window.lockScroll === 'function') window.lockScroll();
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
      document.removeEventListener('keydown', onEsc);
      if (typeof window.unlockScroll === 'function') window.unlockScroll();
      resolve(result);
    };

    const onKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); close(inp.value.trim() || null); }
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(null); }
    };
    inp.addEventListener('keydown', onKey);
    document.addEventListener('keydown', onEsc);
    document.getElementById('rename-ok').addEventListener('click', () => close(inp.value.trim() || null), { once: true });
    document.getElementById('rename-cancel').addEventListener('click', () => close(null), { once: true });
    overlay.addEventListener('click', e => { if (e.target === overlay) close(null); }, { once: true });
  });
}

// ── QUANTITY PARSING (Intelligente per Sparati) ──
export function parseQuantity(val) {
  val = String(val || '').trim().toLowerCase();
  if (!val || val === '0') return { free: 0, used: 0, raw: val };
  
  let free = 0;
  let used = 0;
  
  if (val.includes('+') || val.includes('sp') || val.includes('us')) {
    const parts = val.split('+');
    parts.forEach(p => {
      p = p.trim();
      const numMatch = p.match(/(\d+)/);
      const n = numMatch ? parseInt(numMatch[1], 10) : 0;
      if (p.includes('sp') || p.includes('us')) {
        used += n;
      } else {
        free += n;
      }
    });
    // Se non c'è il + ma solo "1 spa"
    if (!val.includes('+')) {
      const numMatch = val.match(/(\d+)/);
      if (numMatch) {
         if (val.includes('sp') || val.includes('us')) {
            used = parseInt(numMatch[1], 10);
            free = 0; // reset because it was matched in loop above without +
         }
      }
    }
  } else {
    free = parseInt(val, 10) || 0;
  }
  
  return { free, used, raw: val };
}

export function formatQuantityTotal(free, used) {
  if (free === 0 && used === 0) return '';
  if (used === 0) return String(free);
  if (free === 0) return `${used} sparati`;
  return `${free} + ${used} sparati`;
}
