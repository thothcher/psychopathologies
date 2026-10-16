import { timeline, periods } from '../data/timeline.js';
import { icon } from '../icons.js';
import { esc, $, $$, shuffle } from '../util.js';
import { store } from '../store.js';

const PERIOD_TONE = { early: 'sand', lab: 'sky', first: 'lilac', mid: 'sage' };

const tabs = (current) => `
  <nav class="tabs" aria-label="ქრონოლოგიის რეჟიმები">
    <a class="tab" href="#/timeline" ${current === 'list' ? 'aria-current="page"' : ''}>ქრონოლოგია</a>
    <a class="tab" href="#/quiz/years">რომელ წელს?</a>
    <a class="tab" href="#/timeline/order" ${current === 'order' ? 'aria-current="page"' : ''}>დაალაგე</a>
  </nav>`;

export function mount(el, params) {
  return params[0] === 'order' ? orderGame(el) : list(el);
}

/* ───────── timeline list ───────── */
function list(el) {
  let filter = 'all';

  function render() {
    const groups = periods.filter((p) => filter === 'all' || p.id === filter);
    el.innerHTML = `
      <div class="page-head">
        <div>
          <span class="eyebrow">${icon('history', 18)}ივარჯიშე</span>
          <h1>ქრონოლოგია</h1>
          <p>ფსიქოკონსულტირების ისტორიის მთავარი მოვლენები წლების მიხედვით — ლექციის კონსპექტის მიხედვით.</p>
        </div>
      </div>
      ${tabs('list')}
      <div class="filter-chips" role="group" aria-label="პერიოდი">
        <button class="filter-chip" aria-pressed="${filter === 'all'}" data-f="all">ყველა</button>
        ${periods.map((p) => `<button class="filter-chip" aria-pressed="${filter === p.id}" data-f="${p.id}">${esc(p.range)}</button>`).join('')}
      </div>
      ${groups
        .map((p) => {
          const items = timeline.filter((e) => e.period === p.id);
          return `
          <section class="tl-group" aria-label="${esc(p.label)}">
            <div class="tl-group-head"><h2>${esc(p.label)}</h2><span>${esc(p.range)}</span></div>
            ${items
              .map(
                (e) => `
              <article class="tl-item tone-${PERIOD_TONE[p.id]}">
                <div class="tl-year">${esc(e.year)}</div>
                <div class="tl-node" aria-hidden="true"></div>
                <div class="tl-card">
                  <h3>${esc(e.title)}</h3>
                  <p>${esc(e.text)}</p>
                  ${e.note ? `<div class="tl-note">${icon('info', 16)}<span>${esc(e.note)}</span></div>` : ''}
                </div>
              </article>`
              )
              .join('')}
          </section>`;
        })
        .join('')}
      <div class="tl-disclaimer">${icon('info', 20)}<span>თარიღები მოცემულია ლექციის კონსპექტის მიხედვით — გამოცდაზე ამ ვერსიას მიყევი. რამდენიმე თარიღი სხვა წყაროებში განსხვავებულია (ასეთ შემთხვევებში ჩანს შენიშვნა). თუ ეჭვი გაქვს, გადაამოწმე ლექტორთან.</span></div>`;

    $$('.filter-chip', el).forEach((b) =>
      b.addEventListener('click', () => {
        filter = b.dataset.f;
        render();
      })
    );
  }
  render();
  return { title: 'ქრონოლოგია' };
}

/* ───────── ordering game ───────── */
function orderGame(el) {
  const exact = timeline.filter((e) => e.exact);
  let items = [];
  let checked = false;
  let focusKey = null;

  const year = (e) => Math.floor(e.sort);

  function newRound() {
    // five events with distinct years, spread across the period
    const pool = shuffle(exact);
    const picked = [];
    const seen = new Set();
    for (const e of pool) {
      if (!seen.has(year(e))) {
        seen.add(year(e));
        picked.push(e);
      }
      if (picked.length === 5) break;
    }
    const sorted = [...picked].sort((a, b) => a.sort - b.sort);
    let mixed = shuffle(picked);
    while (mixed.every((e, i) => e === sorted[i])) mixed = shuffle(picked);
    items = mixed;
    checked = false;
    focusKey = null;
    render();
  }

  function render() {
    const sorted = [...items].sort((a, b) => a.sort - b.sort);
    const okCount = checked ? items.filter((e, i) => e === sorted[i]).length : 0;
    const perfect = checked && okCount === items.length;
    el.innerHTML = `
      <div class="page-head">
        <div>
          <span class="eyebrow">${icon('history', 18)}ივარჯიშე</span>
          <h1>ქრონოლოგია</h1>
          <p>დაალაგე მოვლენები ძველიდან ახალისკენ. გამოიყენე ისრები, შემდეგ დააჭირე „შემოწმებას“.</p>
        </div>
      </div>
      ${tabs('order')}
      <div class="order-wrap">
        <div class="match-help">${icon('arrow-left-right', 18)}<span>ზემოთ — უფრო ადრე, ქვემოთ — უფრო გვიან.</span></div>
        <div class="order-list" role="list">
          ${items
            .map((e, i) => {
              const ok = checked && e === sorted[i];
              const bad = checked && e !== sorted[i];
              return `
            <div class="order-item ${ok ? 'is-ok' : ''} ${bad ? 'is-bad' : ''}" role="listitem">
              <span class="pos">${i + 1}</span>
              <div class="txt"><b>${esc(e.title)}</b><small>${esc(e.text.length > 110 ? e.text.slice(0, 108) + '…' : e.text)}</small></div>
              ${checked ? `<span class="yr">${esc(String(year(e)))}</span>` : ''}
              <div class="mv">
                <button type="button" data-i="${i}" data-dir="-1" aria-label="ზემოთ გადატანა: ${esc(e.title)}" ${i === 0 || perfect ? 'disabled' : ''}>${icon('chevron-up', 18)}</button>
                <button type="button" data-i="${i}" data-dir="1" aria-label="ქვემოთ გადატანა: ${esc(e.title)}" ${i === items.length - 1 || perfect ? 'disabled' : ''}>${icon('chevron-down', 18)}</button>
              </div>
            </div>`;
            })
            .join('')}
        </div>
        <div class="match-actions">
          ${perfect ? `<button class="btn btn-primary" id="o-new">${icon('arrow-right', 18)}შემდეგი რაუნდი</button>` : `<button class="btn btn-primary" id="o-check">${icon('check', 18)}შემოწმება</button>`}
          ${perfect ? '' : `<button class="btn btn-ghost" id="o-new">${icon('shuffle', 18)}ახალი რაუნდი</button>`}
          ${checked ? `<span class="match-score ${perfect ? 'perfect' : ''}">${okCount} / ${items.length} სწორ ადგილზეა${perfect ? ' — შესანიშნავია' : ''}</span>` : ''}
        </div>
      </div>`;

    $$('.mv button', el).forEach((b) =>
      b.addEventListener('click', () => {
        const i = +b.dataset.i;
        const j = i + +b.dataset.dir;
        [items[i], items[j]] = [items[j], items[i]];
        checked = false;
        focusKey = `${j}:${b.dataset.dir}`;
        render();
      })
    );
    $('#o-check', el)?.addEventListener('click', () => {
      checked = true;
      const s = [...items].sort((a, b) => a.sort - b.sort);
      const ok = items.filter((e, i) => e === s[i]).length;
      store.update((st) => {
        st.order = { best: Math.max(st.order?.best || 0, ok === items.length ? 100 : Math.round((ok / items.length) * 100)), plays: (st.order?.plays || 0) + 1 };
      });
      render();
    });
    $('#o-new', el).addEventListener('click', newRound);

    if (focusKey) {
      const [j, dir] = focusKey.split(':');
      const target = $(`.mv button[data-i="${j}"][data-dir="${dir}"]`, el);
      (target && !target.disabled ? target : $(`.mv button[data-i="${j}"]:not([disabled])`, el))?.focus();
      focusKey = null;
    }
  }

  newRound();
  return { title: 'ქრონოლოგია · დაალაგე' };
}
