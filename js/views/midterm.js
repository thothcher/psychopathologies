import { midterm } from '../data/midterm.js';
import { chapterById } from '../data/chapters.js';
import { icon } from '../icons.js';
import { esc, $, $$, pct, debounce } from '../util.js';
import { store } from '../store.js';
import { tone, toast } from '../ui.js';

export function mount(el, params, query) {
  let filter = 'all';
  const isDone = (n) => !!store.get().midterm[n];

  const answerHTML = (m) => `
    <div class="answer">
      <p class="lead">${esc(m.lead)}</p>
      <div style="font-size:14px;font-weight:600;margin-top:14px;color:var(--t-d)">მონიშნე პუნქტები, რომლებიც შენს პასუხში იყო:</div>
      <ul class="key-points" aria-label="საკვანძო პუნქტები">
        ${m.points.map((p, i) => `<li><label class="kp"><input type="checkbox" data-i="${i}"><span>${esc(p)}</span></label></li>`).join('')}
      </ul>
      <div class="kp-score" aria-live="polite"><span class="s"></span></div>
    </div>`;

  const itemHTML = (m) => {
    const ch = chapterById[m.ch];
    return `
    <article class="acc-item ${tone(ch)} ${isDone(m.n) ? 'is-done' : ''}" data-n="${m.n}" id="q${m.n}">
      <h3 style="font-size:inherit;font-family:inherit">
        <button class="acc-head" type="button" id="h${m.n}" aria-expanded="false" aria-controls="p${m.n}">
          <span class="acc-n">${isDone(m.n) ? icon('check', 20) : m.n}</span>
          <span class="acc-q">${esc(m.q)}<small>${ch.n}. ${esc(ch.short)}</small></span>
          <span class="acc-chev">${icon('chevron-down', 22)}</span>
        </button>
      </h3>
      <div class="acc-panel" id="p${m.n}" role="region" aria-labelledby="h${m.n}" inert>
        <div><div class="acc-body">
          <div class="lbl">${icon('pencil', 16)}შენი პასუხი</div>
          <textarea data-n="${m.n}" rows="5" placeholder="დაწერე პასუხი საკუთარი სიტყვებით, სანამ მოდელურ პასუხს ნახავ…" aria-label="შენი პასუხი">${esc(store.get().answers[m.n] || '')}</textarea>
          <div class="small">ტექსტი ინახება მხოლოდ ამ ბრაუზერში.</div>
          <div class="acc-actions">
            <button class="btn btn-primary btn-sm" type="button" data-act="reveal">${icon('eye', 17)}აჩვენე მოდელური პასუხი</button>
            <button class="btn btn-ghost btn-sm" type="button" data-act="done" aria-pressed="${isDone(m.n)}">${icon('check', 17)}<span>${isDone(m.n) ? 'დაძლეულია' : 'მონიშნე დაძლეულად'}</span></button>
          </div>
          <div class="answer-slot"></div>
        </div></div>
      </div>
    </article>`;
  };

  el.innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">${icon('graduation-cap', 18)}გამოცდისთვის</span>
        <h1>გამოცდის კითხვები</h1>
        <p>${midterm.length} მთავარი კითხვა კონსპექტიდან. ჯერ დაწერე საკუთარი პასუხი, მერე შეადარე მოდელურს და მონიშნე, რა გახსოვდა.</p>
      </div>
    </div>

    <div class="card mid-top">
      <div>
        <h2 id="mid-title"></h2>
        <p>ყველა კითხვა მონიშნე დაძლეულად, როცა პასუხი თავისუფლად გახსოვს.</p>
        <div class="bar" role="progressbar" aria-labelledby="mid-title"><span id="mid-bar" style="width:0"></span></div>
      </div>
      <div class="toolbar">
        <button class="btn btn-soft" id="mid-random">${icon('shuffle', 18)}შემთხვევითი კითხვა</button>
        <a class="btn btn-primary" href="#/quiz/mock">${icon('timer', 18)}საცდელი ტესტი</a>
      </div>
    </div>

    <div class="filter-chips" role="group" aria-label="ფილტრი">
      <button class="filter-chip" data-f="all" aria-pressed="true" id="f-all"></button>
      <button class="filter-chip" data-f="todo" aria-pressed="false" id="f-todo"></button>
    </div>

    <div class="acc" id="acc">${midterm.map(itemHTML).join('')}</div>`;

  const item = (n) => $(`.acc-item[data-n="${n}"]`, el);

  function paintTop() {
    const done = midterm.filter((m) => isDone(m.n)).length;
    $('#mid-title', el).textContent = `დაძლეულია ${done} / ${midterm.length}`;
    $('#mid-bar', el).style.width = `${pct(done, midterm.length)}%`;
    $('#f-all', el).textContent = `ყველა (${midterm.length})`;
    $('#f-todo', el).textContent = `დასაძლევი (${midterm.length - done})`;
    $$('.acc-item', el).forEach((it) => {
      const n = +it.dataset.n;
      it.hidden = filter === 'todo' && isDone(n);
    });
  }

  function setOpen(n, open) {
    const it = item(n);
    if (!it) return;
    it.classList.toggle('is-open', open);
    $('.acc-head', it).setAttribute('aria-expanded', String(open));
    $('.acc-panel', it).inert = !open;
  }

  function openOnly(n, scroll = true) {
    $$('.acc-item', el).forEach((it) => setOpen(+it.dataset.n, +it.dataset.n === n));
    if (scroll) setTimeout(() => item(n)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function setDone(n, value) {
    store.update((s) => {
      if (value) s.midterm[n] = true;
      else delete s.midterm[n];
    });
    const it = item(n);
    it.classList.toggle('is-done', value);
    $('.acc-n', it).innerHTML = value ? icon('check', 20) : String(n);
    const btn = $('[data-act="done"]', it);
    btn.setAttribute('aria-pressed', String(value));
    $('span', btn).textContent = value ? 'დაძლეულია' : 'მონიშნე დაძლეულად';
    paintTop();
  }

  const saveAnswer = debounce((n, value) => {
    store.update((s) => {
      if (value.trim()) s.answers[n] = value;
      else delete s.answers[n];
    });
  }, 400);

  // events
  el.addEventListener('click', (e) => {
    const head = e.target.closest('.acc-head');
    if (head) {
      const it = head.closest('.acc-item');
      const n = +it.dataset.n;
      if (it.classList.contains('is-open')) setOpen(n, false);
      else openOnly(n, false);
      return;
    }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const it = act.closest('.acc-item');
    const n = +it.dataset.n;
    const m = midterm.find((x) => x.n === n);
    if (act.dataset.act === 'done') setDone(n, !isDone(n));
    if (act.dataset.act === 'reveal') {
      const slot = $('.answer-slot', it);
      if (slot.innerHTML.trim()) {
        slot.innerHTML = '';
        act.innerHTML = `${icon('eye', 17)}აჩვენე მოდელური პასუხი`;
      } else {
        slot.innerHTML = answerHTML(m);
        act.innerHTML = `${icon('eye-off', 17)}დამალე პასუხი`;
        paintScore(it, m);
        slot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });

  el.addEventListener('change', (e) => {
    const cb = e.target.closest('.kp input');
    if (!cb) return;
    const it = cb.closest('.acc-item');
    const m = midterm.find((x) => x.n === +it.dataset.n);
    paintScore(it, m);
  });

  el.addEventListener('input', (e) => {
    if (e.target.matches('textarea[data-n]')) saveAnswer(+e.target.dataset.n, e.target.value);
  });

  function paintScore(it, m) {
    const boxes = $$('.kp input', it);
    const got = boxes.filter((b) => b.checked).length;
    boxes.forEach((b) => b.closest('.kp').classList.toggle('is-checked', b.checked));
    const out = $('.kp-score .s', it);
    if (!out) return;
    const all = got === m.points.length;
    out.innerHTML = `${icon(all ? 'circle-check' : 'list-checks', 18)}${got} / ${m.points.length} პუნქტი${all ? ' — შესანიშნავია' : ''}`;
    if (all && !isDone(m.n)) {
      setDone(m.n, true);
      toast('ყველა პუნქტი გახსოვდა — კითხვა დაძლეულია');
    }
  }

  $$('.filter-chip', el).forEach((b) =>
    b.addEventListener('click', () => {
      filter = b.dataset.f;
      $$('.filter-chip', el).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      paintTop();
    })
  );

  $('#mid-random', el).addEventListener('click', () => {
    const todo = midterm.filter((m) => !isDone(m.n));
    const pool = todo.length ? todo : midterm;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    filter = 'all';
    $$('.filter-chip', el).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.f === 'all')));
    paintTop();
    openOnly(pick.n);
  });

  paintTop();
  const open = +query.get('open');
  if (open) openOnly(open);

  return { title: 'გამოცდის კითხვები' };
}
