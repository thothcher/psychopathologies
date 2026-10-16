import { chapters } from './data/chapters.js';
import { icon } from './icons.js';
import { esc, $, $$ } from './util.js';
import { store } from './store.js';
import { progress } from './stats.js';
import { start } from './router.js';

import * as home from './views/home.js';
import * as chaptersView from './views/chapters.js';
import * as chapter from './views/chapter.js';
import * as flashcards from './views/flashcards.js';
import * as match from './views/match.js';
import * as quiz from './views/quiz.js';
import * as timeline from './views/timeline.js';
import * as midterm from './views/midterm.js';
import * as credits from './views/credits.js';

const views = { '': home, chapters: chaptersView, chapter, flashcards, match, quiz, timeline, midterm, credits };

const link = (route, ic, label) =>
  `<a class="nav-link" data-route="${route}" href="#/${route}">${icon(ic, 19)}<span>${label}</span></a>`;

function sidebarHTML() {
  return `
    <a class="brand" href="#/">
      <span class="brand-mark">${icon('brain', 24)}</span>
      <span><span class="brand-title">ფსიქოკონსულტირება</span><br><span class="brand-sub">სასწავლო სივრცე</span></span>
    </a>
    <nav class="nav-group" aria-label="მთავარი">
      ${link('', 'house', 'მთავარი')}
    </nav>
    <nav class="nav-group" aria-label="თავები">
      <div class="nav-label">თავები</div>
      ${chapters
        .map(
          (c) =>
            `<a class="nav-link" data-route="chapter/${c.id}" data-ch="${c.id}" href="#/chapter/${c.id}"><span class="nav-num">${c.n}</span><span>${esc(c.short)}</span></a>`
        )
        .join('')}
    </nav>
    <nav class="nav-group" aria-label="ივარჯიშე">
      <div class="nav-label">ივარჯიშე</div>
      ${link('flashcards', 'layers', 'ბარათები')}
      ${link('match', 'spline', 'დაკავშირება')}
      ${link('quiz', 'circle-question-mark', 'ტესტი')}
      ${link('timeline', 'history', 'ქრონოლოგია')}
    </nav>
    <nav class="nav-group" aria-label="გამოცდა">
      <div class="nav-label">გამოცდა</div>
      ${link('midterm', 'file-pen-line', 'გამოცდის კითხვები')}
    </nav>
    <div class="side-foot">
      <div class="row"><span>ნასწავლი თავები</span><b id="side-count"></b></div>
      <div class="bar"><span id="side-bar" style="width:0"></span></div>
      <a href="#/credits" class="row" style="margin-top:4px;color:var(--ink-2)"><span>ფოტოები და შესახებ</span>${icon('arrow-right', 16)}</a>
    </div>`;
}

function buildChrome() {
  $('#sidebar').innerHTML = sidebarHTML();
  $('#topbar').innerHTML = `
    <button class="btn btn-ghost btn-icon" id="menu-btn" aria-label="მენიუს გახსნა" aria-controls="sidebar" aria-expanded="false">${icon('menu', 22)}</button>
    <a class="brand" href="#/" style="padding:0"><span class="brand-title">ფსიქოკონსულტირება</span></a>
    <span class="spacer"></span>
    <span class="mini-progress"><span id="top-count"></span><span class="bar"><span id="top-bar" style="width:0"></span></span></span>`;

  const setOpen = (open) => {
    document.body.classList.toggle('nav-open', open);
    $('#menu-btn').setAttribute('aria-expanded', String(open));
  };
  $('#menu-btn').addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
  $('#scrim').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));
  addEventListener('hashchange', () => setOpen(false));
}

function refreshProgress() {
  const p = progress();
  const s = store.get();
  $('#side-count').textContent = `${p.studied}/${p.chaptersTotal}`;
  $('#side-bar').style.width = `${p.overall}%`;
  $('#top-count').textContent = `${p.studied}/${p.chaptersTotal}`;
  $('#top-bar').style.width = `${p.overall}%`;
  $$('.nav-link[data-ch]').forEach((a) => a.classList.toggle('is-done', !!s.studied[a.dataset.ch]));
}

function updateNav(name, params) {
  const key = name === 'chapter' && params[0] ? `chapter/${params[0]}` : name;
  $$('.nav-link').forEach((a) => {
    if (a.dataset.route === key) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

const notFound = () => `
  <div class="empty-state">
    <h1 style="font-size:32px;margin-bottom:12px">გვერდი ვერ მოიძებნა</h1>
    <p style="margin-bottom:22px">მისამართი არასწორია ან გვერდი აღარ არსებობს.</p>
    <a class="btn btn-primary" href="#/">${icon('house', 18)}მთავარზე დაბრუნება</a>
  </div>`;

const footer = () => `
  <footer class="site-footer">
    <span>ფსიქოკონსულტირების სასწავლო სივრცე · შექმნილია ლექციის კონსპექტის მიხედვით</span>
    <span>ფოტოები: <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a> · ხატულები: Lucide</span>
  </footer>`;

let cleanup = null;

buildChrome();
refreshProgress();
store.subscribe(refreshProgress);

start(({ name, params, query }) => {
  const main = $('#main');
  if (cleanup) {
    try {
      cleanup();
    } catch (e) {
      console.error(e);
    }
    cleanup = null;
  }
  const view = views[name];
  if (!view) {
    main.innerHTML = `<div class="container view">${notFound()}</div>`;
    document.title = 'გვერდი ვერ მოიძებნა — ფსიქოკონსულტირება';
  } else {
    main.innerHTML = `<div class="container view" id="view"></div><div class="container">${footer()}</div>`;
    const result = view.mount($('#view'), params, query) || {};
    cleanup = result.cleanup || null;
    document.title = result.title ? `${result.title} — ფსიქოკონსულტირება` : 'ფსიქოკონსულტირება — სასწავლო სივრცე';
  }
  updateNav(name, params);
  window.scrollTo({ top: 0, behavior: 'instant' });
  main.focus({ preventScroll: true });
});
