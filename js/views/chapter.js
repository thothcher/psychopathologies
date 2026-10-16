import { chapters, chapterById } from '../data/chapters.js';
import { cards } from '../data/cards.js';
import { questions } from '../data/quiz.js';
import { matchSets } from '../data/matching.js';
import { midterm } from '../data/midterm.js';
import { icon } from '../icons.js';
import { esc, $, $$ } from '../util.js';
import { store } from '../store.js';
import { renderBlocks, tone, toast } from '../ui.js';

export function mount(el, params) {
  const c = chapterById[params[0]];
  if (!c) {
    el.innerHTML = `<div class="empty-state"><h1 style="font-size:30px;margin-bottom:12px">თავი ვერ მოიძებნა</h1><a class="btn btn-primary" href="#/chapters">თავების სია</a></div>`;
    return { title: 'თავი ვერ მოიძებნა' };
  }

  const { html, toc } = renderBlocks(c.blocks);
  const idx = chapters.indexOf(c);
  const prev = chapters[idx - 1];
  const nextCh = chapters[idx + 1];
  const nCards = cards.filter((x) => x.ch === c.id).length;
  const nQs = questions.filter((x) => x.ch === c.id).length;
  const sets = matchSets.filter((x) => x.ch === c.id);
  const nMid = midterm.filter((x) => x.ch === c.id).length;
  const isDone = () => !!store.get().studied[c.id];

  el.innerHTML = `
    <article class="${tone(c)}">
      <nav class="crumbs" aria-label="გვერდის მისამართი">
        <a href="#/">მთავარი</a>${icon('chevron-right', 14)}<a href="#/chapters">თავები</a>${icon('chevron-right', 14)}<span>${c.n}. ${esc(c.short)}</span>
      </nav>
      <div class="ch-hero"><img src="img/${c.img}.jpg" alt="" decoding="async" fetchpriority="high"></div>
      <header class="ch-head">
        <span class="chip">${icon(c.icon, 16)}თავი ${c.n} / ${chapters.length}</span>
        <h1>${esc(c.title)}</h1>
        <p class="ch-lead">${esc(c.lead)}</p>
      </header>

      <div class="ch-layout">
        <div>
          <div class="prose">${html}</div>
          ${c.terms?.length ? `<div class="terms"><h4>საკვანძო ტერმინები</h4><div class="chips">${c.terms.map((t) => `<span class="chip chip-outline">${esc(t)}</span>`).join('')}</div></div>` : ''}

          <div class="pager">
            ${prev ? `<a href="#/chapter/${prev.id}"><span class="dir">${icon('arrow-left', 15)}წინა თავი</span><span class="ttl">${esc(prev.title)}</span></a>` : '<span class="empty"></span>'}
            ${nextCh ? `<a class="next" href="#/chapter/${nextCh.id}"><span class="dir">შემდეგი თავი${icon('arrow-right', 15)}</span><span class="ttl">${esc(nextCh.title)}</span></a>` : '<span class="empty"></span>'}
          </div>
        </div>

        <aside class="ch-aside" aria-label="ამ თავის ინსტრუმენტები">
          <div class="card aside-card">
            <button class="btn btn-ghost done-toggle" id="done" aria-pressed="${isDone()}"></button>
          </div>
          ${toc.length ? `<div class="card aside-card toc-card"><h4>${icon('list-checks', 18)}ამ თავში</h4><nav class="toc" aria-label="თავის სარჩევი">${toc.map((t) => `<a href="#/chapter/${c.id}" data-target="${t.id}">${esc(t.text)}</a>`).join('')}</nav></div>` : ''}
          <div class="card aside-card">
            <h4>${icon('sparkles', 18)}გაიმეორე ეს თავი</h4>
            <div class="aside-actions">
              ${nCards ? `<a class="btn btn-soft btn-sm" href="#/flashcards/${c.id}">${icon('layers', 17)}ბარათები (${nCards})</a>` : ''}
              ${nQs ? `<a class="btn btn-soft btn-sm" href="#/quiz/ch-${c.id}">${icon('circle-question-mark', 17)}ტესტი (${nQs})</a>` : ''}
              ${sets.map((s) => `<a class="btn btn-soft btn-sm" href="#/match/${s.id}">${icon('spline', 17)}${esc(s.title)}</a>`).join('')}
              ${c.id === 'history' ? `<a class="btn btn-soft btn-sm" href="#/timeline">${icon('history', 17)}ქრონოლოგია</a>` : ''}
              ${nMid ? `<a class="btn btn-soft btn-sm" href="#/midterm">${icon('file-pen-line', 17)}გამოცდის კითხვები (${nMid})</a>` : ''}
            </div>
          </div>
        </aside>
      </div>
    </article>`;

  // "Mark as studied" toggle
  const doneBtn = $('#done', el);
  const paintDone = () => {
    const d = isDone();
    doneBtn.setAttribute('aria-pressed', String(d));
    doneBtn.innerHTML = d ? `${icon('circle-check', 20)}ნასწავლია` : `${icon('check', 20)}მონიშნე ნასწავლად`;
  };
  paintDone();
  doneBtn.addEventListener('click', () => {
    store.update((s) => {
      if (s.studied[c.id]) delete s.studied[c.id];
      else s.studied[c.id] = true;
    });
    paintDone();
    if (isDone()) toast(nextCh ? 'შესანიშნავია! გადადი შემდეგ თავზე.' : 'შესანიშნავია! ყველა თავი გაიარე.');
  });

  // Outline: smooth scroll + scroll-spy
  const links = $$('.toc a', el);
  links.forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById(a.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    })
  );
  let io;
  if (links.length && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            links.forEach((a) => a.classList.toggle('is-active', a.dataset.target === en.target.id));
          }
        });
      },
      { rootMargin: '-15% 0px -70% 0px' }
    );
    toc.forEach((t) => {
      const h = document.getElementById(t.id);
      if (h) io.observe(h);
    });
  }

  return { title: c.title, cleanup: () => io && io.disconnect() };
}
