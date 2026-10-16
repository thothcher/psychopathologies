// Small helpers for writing chapter content as data.
export const h = (x) => ({ t: 'h', x });
export const h3 = (x) => ({ t: 'h3', x });
export const p = (x) => ({ t: 'p', x });
export const ul = (...items) => ({ t: 'ul', items });
export const ol = (...items) => ({ t: 'ol', items });
export const note = (title, x) => ({ t: 'note', title, x });
export const quote = (x, by) => ({ t: 'quote', x, by });
export const defs = (...items) => ({ t: 'defs', items });
export const table = (head, ...rows) => ({ t: 'table', head, rows });
export const link = (href, label, icon) => ({ t: 'link', href, label, icon });
