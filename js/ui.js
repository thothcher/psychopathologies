import { icon } from './icons.js';
import { esc } from './util.js';
import { chapters, chapterById } from './data/chapters.js';

export const tone = (c) => `tone-${c.tone || 'sage'}`;

/** Turns chapter content blocks into HTML and collects the section outline. */
export function renderBlocks(blocks) {
  const toc = [];
  let sec = 0;
  const html = blocks
    .map((b) => {
      switch (b.t) {
        case 'h': {
          const id = `s${++sec}`;
          toc.push({ id, text: b.x });
          return `<h2 id="${id}">${esc(b.x)}</h2>`;
        }
        case 'h3':
          return `<h3>${esc(b.x)}</h3>`;
        case 'p':
          return `<p>${esc(b.x)}</p>`;
        case 'ul':
          return `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
        case 'ol':
          return `<ol>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>`;
        case 'note':
          return `<div class="note">${icon('lightbulb', 22)}<div><div class="note-title">${esc(b.title)}</div><p>${esc(b.x)}</p></div></div>`;
        case 'quote':
          return `<blockquote class="quote"><p>${esc(b.x)}</p>${b.by ? `<cite>${esc(b.by)}</cite>` : ''}</blockquote>`;
        case 'defs':
          return `<dl class="defs">${b.items.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`;
        case 'table': {
          const head = b.head.map((h) => `<th scope="col">${esc(h)}</th>`).join('');
          const rows = b.rows
            .map((r) => `<tr>${r.map((c, i) => `<td data-label="${esc(b.head[i] || '')}">${esc(c)}</td>`).join('')}</tr>`)
            .join('');
          return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
        }
        case 'link':
          return `<p class="link-block"><a class="btn btn-soft" href="${esc(b.href)}">${icon(b.icon || 'arrow-right', 18)}${esc(b.label)}</a></p>`;
        default:
          return '';
      }
    })
    .join('');
  return { html, toc };
}

export function chapterCard(c, studied) {
  return `
  <a class="ch-card ${tone(c)}" href="#/chapter/${c.id}">
    <div class="ch-thumb">
      <img src="img/${c.img}-sm.jpg" alt="" loading="lazy" decoding="async" width="700" height="394">
      <span class="ch-num">${c.n}</span>
      ${studied ? `<span class="ch-done" title="ნასწავლია">${icon('check', 18)}</span>` : ''}
    </div>
    <div class="ch-body">
      <h3>${esc(c.title)}</h3>
      <p>${esc(c.lead)}</p>
    </div>
  </a>`;
}

export const chapterChip = (id) => {
  const c = chapterById[id];
  return c ? `<span class="chip ${tone(c)}">${c.n}. ${esc(c.short)}</span>` : '';
};

export const chapterOptions = (selected, counts) =>
  chapters
    .map((c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.n}. ${esc(c.short)}${counts ? ` (${counts[c.id] || 0})` : ''}</option>`)
    .join('');

/** Small inline notification at the bottom of the screen. */
export function toast(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    el.style.cssText =
      'position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);opacity:0;z-index:90;padding:12px 20px;border-radius:999px;background:#27312f;color:#fff;font-size:14.5px;box-shadow:0 10px 30px rgba(0,0,0,.2);transition:all .35s cubic-bezier(.22,.61,.36,1);pointer-events:none;max-width:90vw;text-align:center';
    document.body.appendChild(el);
  }
  el.textContent = message;
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%,0)';
  });
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%,20px)';
  }, 2200);
}
