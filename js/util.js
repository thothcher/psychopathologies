export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const sample = (arr, n) => shuffle(arr).slice(0, n);

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// Georgian letters used as option keys
export const LETTERS = ['ა', 'ბ', 'გ', 'დ', 'ე', 'ვ'];

export const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Georgian plural-agnostic helper: just joins number and noun.
export const n = (count, noun) => `${count} ${noun}`;
