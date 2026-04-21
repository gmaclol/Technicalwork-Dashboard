// ── Shared mutable state ──

// Fallback hardcoded, sovrascritto dopo fetch config.json
export let APPALTI = ['Elecnor', 'Sertori', 'Sirti'];

export const USERS = {
  'Stefano': { hash: '6cf6ea93e6f6aea4b693ef7fb643686b01bbf00e6d38bab620008e074a895349', role: 'admin' },
  'Piero':   { hash: '83e3b78f14e08cc5e0bf037b1668b27bcde446cb05f04f86845deaf7812be71d', role: 'viewer' }
};

export let currentUser = null;
export let currentAppalto = APPALTI[0];
export let currentDate = 'live';

export function setCurrentUser(u) { currentUser = u; }
export function setCurrentAppalto(a) { currentAppalto = a; }
export function setCurrentDate(d) { currentDate = d; }

// ── CONFIG DA GITHUB (come ConfigManager.kt dell'app Android) ──
const CONFIG_URL = 'https://raw.githubusercontent.com/gmaclol/Technicalwork-Materiali/master/lists/config.json';
const CONFIG_CACHE_KEY = 'tw_config';
const CONFIG_TIME_KEY = 'tw_config_time';

export async function loadConfig(globalTimestamp = 0) {
  const cachedData = localStorage.getItem(CONFIG_CACHE_KEY);
  const cachedTime = localStorage.getItem(CONFIG_TIME_KEY);
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
    const res = await fetch(CONFIG_URL);
    if (res.ok) {
      const text = await res.text();
      const config = JSON.parse(text);
      if (config.companies && config.companies.length > 0) {
        APPALTI = config.companies;
        localStorage.setItem(CONFIG_CACHE_KEY, text);
        localStorage.setItem(CONFIG_TIME_KEY, now.toString());
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
  localStorage.removeItem(CONFIG_CACHE_KEY);
  localStorage.removeItem(CONFIG_TIME_KEY);
}
