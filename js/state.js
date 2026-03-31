// ── Shared mutable state ──
export const APPALTI = ['Elecnor', 'Sertori', 'Sirti'];

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
