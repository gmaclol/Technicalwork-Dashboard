import { db, doc, onSnapshot } from './firebase.js';

// ── Shared mutable state ──

// Fallback hardcoded, sovrascritto dopo fetch config.json
export let APPALTI = ['Elecnor', 'Sertori', 'Sirti'];

let initialDate = 'live';
try {
  initialDate = localStorage.getItem('tw_snapshot_date') || 'live';
} catch(e) {}

export let currentUser = null;
export let currentAppalto = APPALTI[0];
export let currentDate = initialDate;

// ── GLOBAL DEVICES NAMES LISTENER (Pub/Sub) ──
let _globalDevicesUnsub = null;
let _globalDevicesCache = {};
const _devicesSubscribers = new Map();

export function subscribeToDevicesNames(key, callback) {
  _devicesSubscribers.set(key, callback);
  if (Object.keys(_globalDevicesCache).length > 0) {
    try { callback(_globalDevicesCache); } catch(e) { console.error(e); }
  }
}

export function unsubscribeFromDevicesNames(key) {
  _devicesSubscribers.delete(key);
}

function startGlobalDevicesNamesListener() {
  if (_globalDevicesUnsub) return;
  _globalDevicesUnsub = onSnapshot(doc(db, 'settings', 'devices_names'), (snap) => {
    _globalDevicesCache = snap.exists() ? snap.data() : {};
    _devicesSubscribers.forEach((callback) => {
      try { callback(_globalDevicesCache); } catch(e) { console.error(e); }
    });
  }, (err) => {
    console.warn("Errore caricamento devices_names globale:", err);
  });
}

function stopGlobalDevicesNamesListener() {
  if (_globalDevicesUnsub) {
    _globalDevicesUnsub();
    _globalDevicesUnsub = null;
  }
  _globalDevicesCache = {};
}

export function setCurrentUser(u) {
  currentUser = u;
  if (u) {
    startGlobalDevicesNamesListener();
  } else {
    stopGlobalDevicesNamesListener();
  }
}
export function setCurrentAppalto(a) { currentAppalto = a; }
export function setCurrentDate(d) {
  currentDate = d;
  try {
    localStorage.setItem('tw_snapshot_date', d);
  } catch(e) {}
}

// ── CONFIG DA GITHUB (come ConfigManager.kt dell'app Android) ──
const CONFIG_URL = 'https://raw.githubusercontent.com/gmaclol/Technicalwork-Materiali/master/lists/config.json';
const CONFIG_CACHE_KEY = 'tw_config';
const CONFIG_TIME_KEY = 'tw_config_time';

export async function loadConfig(globalTimestamp = 0) {
  let cachedData, cachedTime;
  try { cachedData = localStorage.getItem(CONFIG_CACHE_KEY); } catch(e) {}
  try { cachedTime = localStorage.getItem(CONFIG_TIME_KEY); } catch(e) {}
  const now = Date.now();

  const isExpired = !cachedTime || (now - parseInt(cachedTime) > 86400000); // 24h
  const isInvalidated = parseInt(cachedTime || 0) < globalTimestamp;

  // Usa cache valida
  if (cachedData && !isExpired && !isInvalidated) {
    try {
      const config = JSON.parse(cachedData);
      if (config.companies && config.companies.length > 0) {
        APPALTI = config.companies;
        return config;
      }
    } catch(e) {}
  }

  // Fetch da GitHub
  try {
    const res = await fetch(`${CONFIG_URL}?t=${Date.now()}`);
    if (res.ok) {
      const text = await res.text();
      const config = JSON.parse(text);
      if (config.companies && config.companies.length > 0) {
        APPALTI = config.companies;
        try { localStorage.setItem(CONFIG_CACHE_KEY, text); } catch(e) {}
        try { localStorage.setItem(CONFIG_TIME_KEY, now.toString()); } catch(e) {}
        return config;
      }
    }
  } catch(e) {
    console.warn('Config fetch fallito, uso cache/fallback');
  }

  // Fallback su cache scaduta
  if (cachedData) {
    try {
      const config = JSON.parse(cachedData);
      if (config.companies && config.companies.length > 0) {
        APPALTI = config.companies;
        return config;
      }
    } catch(e) {}
  }

  // Fallback hardcoded (APPALTI già inizializzato)
  return { companies: APPALTI, pfs_areas: [] };
}

export function invalidateConfigCache() {
  try { localStorage.removeItem(CONFIG_CACHE_KEY); } catch(e) {}
  try { localStorage.removeItem(CONFIG_TIME_KEY); } catch(e) {}
}
