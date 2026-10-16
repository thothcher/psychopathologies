import { questions } from '../data/quiz.js';
import { timeline } from '../data/timeline.js';
import { chapterById } from '../data/chapters.js';
import { icon } from '../icons.js';
import { esc, $, $$, shuffle, sample, pct, fmtTime, LETTERS } from '../util.js';
import { store } from '../store.js';
import { go } from '../router.js';
import { tone, chapterOptions } from '../ui.js';

const MOCK = { count: 20, seconds: 25 * 60 };

const scopeLabel = (key) => {
  if (key === 'all') return 'ყველა თავი';
  if (key === 'mock') return 'საცდელი გამოცდა';
  if (key === 'years') return 'ქრონოლოგია: რომელ წელს?';
  if (key.startsWith('ch-')) return chapterById[key.slice(3)]?.short || key;
  return key;
};

export function mount(el, params, query) {
  const scope = params[0];
  return scope ? play(el, scope, query) : setup(el);
}

/* ───────── setup ───────── */
function setup(el) {
  const counts = {};
  questions.forEach((q) => (counts[q.ch] = (counts[q.ch] || 0) + 1));
  const results = Object.entries(store.get().quiz);

  el.innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">${icon('circle-question-mark', 18)}ივარჯიშე</span>
        <h1>ტესტი</h1>
        <p>აირჩიე თემა და კითხვების რაოდენობა. ყოველი პასუხის შემდეგ მიიღებ ახსნას — შეცდომებიდან ყველაზე კარგად სწავლობ.</p>
      </div>
    </div>
    <div class="setup-grid">
      <form class="card setup-card" id="setup-form">
        <div class="field">
          <label for="q-scope">თემა</label>
          <select class="select" id="q-scope" name="scope">
            <option value="all">ყველა თავი (${questions.length})</option>
            ${chapterOptions('', counts)}
          </select>
        </div>
        <fieldset class="field">
          <legend>კითხვების რაოდენობა</legend>
          <div class="radio-chips">
            <label><input type="radio" name="n" value="10" checked><span>10</span></label>
            <label><input type="radio" name="n" value="20"><span>20</span></label>
            <label><input type="radio" name="n" value="all"><span>ყველა</span></label>
          </div>
        </fieldset>
        <div><button class="btn btn-primary" type="submit">${icon('play', 18)}დაწყება</button></div>
      </form>

      <div style="display:grid;gap:18px">
        <div class="card setup-card mock-card">
          <span class="chip tone-lilac">${icon('timer', 16)}დროის შეზღუდვით</span>
          <h3>საცდელი გამოცდა</h3>
          <p>${MOCK.count} შემთხვევითი კითხვა ყველა თავიდან, ${MOCK.seconds / 60} წუთი. დროის გასვლისას ტესტი ავტომატურად დასრულდება.</p>
          <div><a class="btn btn-primary" href="#/quiz/mock">${icon('play', 18)}დაიწყე</a></div>
        </div>
        <div class="card setup-card">
          <h3 style="font-size:19px">რომელ წელს?</h3>
          <p style="color:var(--ink-2);font-size:15px">ქრონოლოგიის ტესტი: მოვლენა — წელი.</p>
          <div><a class="btn btn-soft" href="#/quiz/years">${icon('history', 18)}სცადე</a></div>
        </div>
      </div>
    </div>

    ${
      results.length
        ? `<div class="section-head"><div><h2>შენი შედეგები</h2></div></div>
      <div class="best-list" style="max-width:520px">
        ${results
          .map(([k, v]) => `<div class="best-row"><span>${esc(scopeLabel(k))}</span><b>საუკეთესო ${v.best}% · ბოლო ${v.last}%</b></div>`)
          .join('')}
      </div>`
        : ''
    }`;

  $('#setup-form', el).addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const scope = f.get('scope') === 'all' ? 'all' : `ch-${f.get('scope')}`;
    go(`quiz/${scope}?n=${f.get('n')}`);
  });
  return { title: 'ტესტი' };
}

/* ───────── question building ───────── */
function prepare(q) {
  const opts = shuffle(q.options.map((t, i) => ({ t, ok: i === 0 })));
  return { ...q, opts, correct: opts.findIndex((o) => o.ok) };
}

function yearQuestions() {
  const events = timeline.filter((e) => e.exact);
  const years = [...new Set(events.map((e) => Math.floor(e.sort)))];
  return events.map((e) => {
    const y = Math.floor(e.sort);
    const near = years.filter((v) => v !== y).sort((a, b) => Math.abs(a - y) - Math.abs(b - y)).slice(0, 7);
    return {
      id: `y-${e.title}`,
      ch: e.ch,
      text: `${e.title} — რომელ წელს?`,
      sub: e.text,
      options: [String(y), ...sample(near, 3).map(String)],
      why: `${e.year} — ${e.text}${e.note ? ` (${e.note})` : ''}`
    };
  });
}

function buildSet(scope, nParam) {
  let pool;
  let limit;
  let seconds = null;
  if (scope === 'mock') {
    pool = questions;
    limit = MOCK.count;
    seconds = MOCK.seconds;
  } else if (scope === 'years') {
    pool = yearQuestions();
    limit = nParam ? (nParam === 'all' ? pool.length : +nParam) : 10;
  } else if (scope.startsWith('ch-')) {
    pool = questions.filter((q) => q.ch === scope.slice(3));
    limit = nParam === 'all' || !nParam ? pool.length : +nParam;
  } else {
    pool = questions;
    limit = nParam === 'all' ? pool.length : nParam ? +nParam : 10;
  }
  return { list: sample(pool, Math.min(limit, pool.length)).map(prepare), seconds };
}

/* ───────── the quiz ───────── */
function play(el, scope, query) {
  const valid = scope === 'all' || scope === 'mock' || scope === 'years' || (scope.startsWith('ch-') && chapterById[scope.slice(3)]);
  if (!valid) {
    el.innerHTML = `<div class="empty-state"><h1 style="font-size:30px;margin-bottom:12px">ტესტი ვერ მოიძებნა</h1><a class="btn btn-primary" href="#/quiz">ტესტის არჩევა</a></div>`;
    return { title: 'ტესტი' };
  }

  let qs = [];
  let idx = 0;
  let answered = false;
  let picks = [];
  let seconds = null;
  let remaining = 0;
  let timerId = null;
  let saveResult = true;
  let finished = false;

  const stopTimer = () => {
    clearInterval(timerId);
    timerId = null;
  };

  function start(list, secs, save = true) {
    qs = list;
    idx = 0;
    picks = [];
    answered = false;
    finished = false;
    saveResult = save;
    seconds = secs;
    remaining = secs || 0;
    stopTimer();
    if (!qs.length) {
      el.innerHTML = `<div class="empty-state"><h1 style="font-size:28px;margin-bottom:12px">ამ თემაზე კითხვები ჯერ არ არის</h1><a class="btn btn-primary" href="#/quiz">უკან</a></div>`;
      return;
    }
    if (secs) {
      timerId = setInterval(() => {
        remaining--;
        const t = $('#q-timer', el);
        if (t) {
          t.textContent = fmtTime(Math.max(remaining, 0));
          t.classList.toggle('low', remaining <= 120);
        }
        if (remaining <= 0) finish();
      }, 1000);
    }
    renderQuestion();
  }

  function renderQuestion() {
    const q = qs[idx];
    const ch = chapterById[q.ch];
    answered = false;
    el.innerHTML = `
      <div class="quiz-wrap">
        <h1 class="visually-hidden">${esc(scopeLabel(scope))}</h1>
        <div class="quiz-top">
          <a class="btn btn-ghost btn-sm" href="#/quiz" aria-label="ტესტიდან გასვლა">${icon('x', 16)}გასვლა</a>
          <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${qs.length}" aria-valuenow="${idx}"><span style="width:${pct(idx, qs.length)}%"></span></div>
          <span class="q-count">${idx + 1} / ${qs.length}</span>
          ${seconds ? `<span class="q-timer ${remaining <= 120 ? 'low' : ''}">${icon('timer', 16)}<span id="q-timer">${fmtTime(Math.max(remaining, 0))}</span></span>` : ''}
        </div>
        <div class="card q-card ${tone(ch)}">
          <span class="chip">${ch.n}. ${esc(ch.short)}</span>
          <h2 class="q-text">${esc(q.text)}</h2>
          ${q.sub ? `<p style="color:var(--ink-2);margin:-12px 0 22px;font-size:15.5px">${esc(q.sub)}</p>` : ''}
          <div class="q-options" role="group" aria-label="პასუხის ვარიანტები">
            ${q.opts.map((o, k) => `<button class="q-opt" type="button" data-k="${k}"><span class="q-key">${LETTERS[k]}</span><span>${esc(o.t)}</span></button>`).join('')}
          </div>
          <div id="fb" aria-live="polite"></div>
          <div class="q-next" id="q-next" hidden></div>
        </div>
      </div>`;
    $$('.q-opt', el).forEach((b) => b.addEventListener('click', () => choose(+b.dataset.k)));
  }

  function choose(k) {
    if (answered) return;
    answered = true;
    picks[idx] = k;
    const q = qs[idx];
    const right = k === q.correct;
    $$('.q-opt', el).forEach((b, i) => {
      b.disabled = true;
      if (i === q.correct) b.classList.add('is-correct');
      else if (i === k) b.classList.add('is-wrong');
      else b.classList.add('is-dim');
    });
    $('#fb', el).innerHTML = `
      <div class="q-feedback ${right ? 'ok' : 'bad'}">
        ${icon(right ? 'circle-check' : 'circle-x', 22)}
        <div>
          <b>${right ? 'სწორია!' : 'არასწორია'}</b>
          ${right ? '' : `<p>სწორი პასუხი: <strong>${esc(q.opts[q.correct].t)}</strong></p>`}
          ${q.why ? `<p>${esc(q.why)}</p>` : ''}
        </div>
      </div>`;
    const last = idx === qs.length - 1;
    const box = $('#q-next', el);
    box.hidden = false;
    box.innerHTML = `<span style="font-size:13px;color:var(--ink-3)">Enter ან → შემდეგისთვის</span><button class="btn btn-primary" id="next-btn">${last ? 'შედეგის ნახვა' : 'შემდეგი'}${icon('arrow-right', 18)}</button>`;
    const nb = $('#next-btn', el);
    nb.addEventListener('click', next);
    nb.focus({ preventScroll: false });
  }

  function next() {
    if (!answered) return;
    if (idx >= qs.length - 1) finish();
    else {
      idx++;
      renderQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    stopTimer();
    const results = qs.map((q, i) => ({ q, pick: picks[i], ok: picks[i] === q.correct }));
    const right = results.filter((r) => r.ok).length;
    const percent = pct(right, qs.length);
    if (saveResult) {
      store.update((s) => {
        const prev = s.quiz[scope];
        s.quiz[scope] = { best: Math.max(prev?.best || 0, percent), last: percent, n: qs.length, date: Date.now() };
      });
    }
    renderResult(results, right, percent);
  }

  function renderResult(results, right, percent) {
    const wrong = results.filter((r) => !r.ok);
    const msg =
      percent >= 90 ? 'შესანიშნავი შედეგია!' : percent >= 70 ? 'კარგი შედეგია — თითქმის მზად ხარ.' : percent >= 50 ? 'კარგი საფუძველი გაქვს. გაიმეორე შეცდომები და სცადე ხელახლა.' : 'ჯერ გასამეორებელია. დაუბრუნდი თავებს და ბარათებს, შემდეგ კვლავ სცადე.';

    const byCh = {};
    results.forEach((r) => {
      const c = (byCh[r.q.ch] ||= { ok: 0, total: 0 });
      c.total++;
      if (r.ok) c.ok++;
    });
    const chRows = Object.entries(byCh);

    el.innerHTML = `
      <div class="quiz-wrap">
        <div class="card result">
          <div class="ring" style="--p:${percent}"><div class="ring-in"><b>${percent}%</b><span>${right} / ${qs.length}</span></div></div>
          <h2>${scope === 'mock' ? 'საცდელი გამოცდა დასრულდა' : 'ტესტი დასრულდა'}</h2>
          <p>${msg}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" id="retry">${icon('rotate-ccw', 18)}ხელახლა</button>
            ${wrong.length ? `<button class="btn btn-blush" id="retry-wrong">${icon('repeat', 18)}შეცდომების გამეორება (${wrong.length})</button>` : ''}
            <a class="btn btn-ghost" href="#/quiz">${icon('layout-grid', 18)}სხვა ტესტი</a>
          </div>
          ${
            chRows.length > 1
              ? `<div class="by-chapter" aria-label="შედეგი თავების მიხედვით">${chRows
                  .map(([id, v]) => `<div class="row tone-${chapterById[id].tone}"><span>${chapterById[id].n}. ${esc(chapterById[id].short)}</span><div class="bar"><span style="width:${pct(v.ok, v.total)}%;background:var(--t)"></span></div><em>${v.ok}/${v.total}</em></div>`)
                  .join('')}</div>`
              : ''
          }
        </div>
        ${
          wrong.length
            ? `<div class="review-list"><h3>შეცდომები</h3>${wrong
                .map(
                  (r) => `<div class="review-item">
                    <div class="qq">${esc(r.q.text)}</div>
                    <div class="a bad">${icon('circle-x', 18)}<span>${r.pick === undefined ? 'უპასუხოდ დარჩა' : esc(r.q.opts[r.pick].t)}</span></div>
                    <div class="a ok">${icon('circle-check', 18)}<span>${esc(r.q.opts[r.q.correct].t)}</span></div>
                    ${r.q.why ? `<div class="why">${esc(r.q.why)}</div>` : ''}
                  </div>`
                )
                .join('')}</div>`
            : ''
        }
      </div>`;
    $('#retry', el).addEventListener('click', () => run());
    $('#retry-wrong', el)?.addEventListener('click', () => start(shuffle(wrong.map((r) => prepare(r.q))), null, false));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function run() {
    const { list, seconds: secs } = buildSet(scope, query.get('n'));
    start(list, secs, true);
  }

  const onKey = (e) => {
    if (finished || e.ctrlKey || e.metaKey || e.altKey || e.target.closest('select, input, textarea')) return;
    if (!$('.q-opt', el)) return;
    if (!answered && /^[1-6]$/.test(e.key)) {
      const k = +e.key - 1;
      if (k < qs[idx].opts.length) choose(k);
    } else if (answered && (e.key === 'ArrowRight' || (e.key === 'Enter' && e.target === document.body))) {
      e.preventDefault();
      next();
    }
  };
  document.addEventListener('keydown', onKey);

  run();
  return {
    title: scopeLabel(scope),
    cleanup() {
      stopTimer();
      document.removeEventListener('keydown', onKey);
    }
  };
}
