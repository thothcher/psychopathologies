import { matchSets } from '../data/matching.js';
import { chapterById } from '../data/chapters.js';
import { icon } from '../icons.js';
import { esc, $, $$, shuffle, sample, pct } from '../util.js';
import { store } from '../store.js';

const TONES = ['sage', 'sky', 'lilac', 'sand', 'blush'];
const ROUND_SIZE = 6;

export function mount(el, params) {
  const set = matchSets.find((s) => s.id === params[0]);
  return set ? play(el, set) : picker(el);
}

/* ───────── set picker ───────── */
function picker(el) {
  const best = store.get().match;
  el.innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">${icon('spline', 18)}ივარჯიშე</span>
        <h1>დაკავშირება</h1>
        <p>დააკავშირე მარცხენა მხარე მარჯვენასთან. აირჩიე თემა და შეამოწმე, რამდენად ზუსტად გახსოვს წყვილები.</p>
      </div>
    </div>
    <div class="set-grid">
      ${matchSets
        .map((s, i) => {
          const ch = chapterById[s.ch];
          const b = best[s.id];
          return `
        <a class="set-card tone-${TONES[i % TONES.length]}" href="#/match/${s.id}">
          <span class="set-icon">${icon(s.icon, 24)}</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.desc)}</p>
          <div class="set-meta">
            <span class="chip">${s.pairs.length} წყვილი</span>
            ${ch ? `<span class="chip chip-outline">${ch.n}. ${esc(ch.short)}</span>` : ''}
            ${typeof b === 'number' ? `<span class="chip chip-outline">საუკეთესო: ${b}%</span>` : ''}
          </div>
        </a>`;
        })
        .join('')}
    </div>`;
  return { title: 'დაკავშირება' };
}

/* ───────── the game ───────── */
function play(el, set) {
  let left = [];
  let right = [];
  let links = new Map(); // leftId -> rightId
  let locked = new Set(); // ids confirmed correct
  let selected = null; // { side: 'l' | 'r', id }
  let checked = false;
  let drag = null;
  let suppressClick = false;
  let ro = null; // ResizeObserver on the board

  const total = () => left.length;

  function newRound() {
    const chosen = sample(
      set.pairs.map(([l, r], id) => ({ id, l, r })),
      Math.min(ROUND_SIZE, set.pairs.length)
    );
    left = shuffle(chosen.map((x) => ({ id: x.id, text: x.l })));
    right = shuffle(chosen.map((x) => ({ id: x.id, text: x.r })));
    links = new Map();
    locked = new Set();
    selected = null;
    checked = false;
    render();
  }

  const item = (side, it) =>
    `<button type="button" class="m-item ${side === 'l' ? 'left' : 'right'}" data-side="${side}" data-id="${it.id}">${esc(it.text)}<span class="m-dot"></span></button>`;

  function render() {
    el.innerHTML = `
      <nav class="crumbs" aria-label="გვერდის მისამართი">
        <a href="#/">მთავარი</a>${icon('chevron-right', 14)}<a href="#/match">დაკავშირება</a>${icon('chevron-right', 14)}<span>${esc(set.title)}</span>
      </nav>
      <div class="page-head">
        <div>
          <h1>${esc(set.title)}</h1>
          <p>${esc(set.desc)}</p>
        </div>
        <a class="btn btn-ghost btn-sm" href="#/match">${icon('arrow-left', 16)}სხვა თემა</a>
      </div>
      <div class="card match-panel">
        <div class="match-help">${icon('mouse-pointer-click', 18)}<span>დააჭირე მარცხენა ელემენტს, შემდეგ — მარჯვენას. კომპიუტერზე შეგიძლია გადაათრიო კიდეც. ხაზზე „×“ კავშირს შლის.</span></div>
        <div class="match-board" id="board">
          <svg class="match-lines" id="lines" aria-hidden="true"></svg>
          <div class="match-col" role="group" aria-label="${esc(set.leftLabel)}">
            <div class="match-col-head">${esc(set.leftLabel)}</div>
            ${left.map((x) => item('l', x)).join('')}
          </div>
          <div class="match-col" role="group" aria-label="${esc(set.rightLabel)}">
            <div class="match-col-head">${esc(set.rightLabel)}</div>
            ${right.map((x) => item('r', x)).join('')}
          </div>
        </div>
        <div class="match-actions" id="actions"></div>
        <div class="visually-hidden" aria-live="polite" id="live"></div>
      </div>`;
    bind();
    refresh();
  }

  /* ----- state -> DOM ----- */
  const elOf = (side, id) => $(`.m-item[data-side="${side}"][data-id="${id}"]`, el);
  const isLocked = (id) => locked.has(id);

  // Pair ids are shared by both columns, so a link is correct when partner id === own id.
  const partnerOf = (side, id) => (side === 'l' ? links.get(id) : [...links].find(([, r]) => r === id)?.[0]);

  function refresh() {
    $$('.m-item', el).forEach((n) => {
      const side = n.dataset.side;
      const id = +n.dataset.id;
      const partner = partnerOf(side, id);
      const linked = partner !== undefined;
      const showResult = checked || isLocked(id);
      const ok = showResult && linked && partner === id;
      const bad = showResult && linked && partner !== id;
      const sel = !!selected && selected.side === side && selected.id === id;
      n.classList.toggle('is-linked', linked && !ok && !bad);
      n.classList.toggle('is-ok', ok);
      n.classList.toggle('is-bad', bad);
      n.classList.toggle('is-selected', sel);
      n.setAttribute('aria-pressed', String(sel));
    });
    layout();
    renderActions();
  }

  const curve = ([x1, y1], [x2, y2]) => {
    const dx = Math.max(40, (x2 - x1) * 0.5);
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  };

  function dotCenter(node, boardRect) {
    const r = $('.m-dot', node).getBoundingClientRect();
    return [r.left + r.width / 2 - boardRect.left, r.top + r.height / 2 - boardRect.top];
  }

  function layout() {
    const board = $('#board', el);
    const svg = $('#lines', el);
    if (!board || !svg) return;
    const br = board.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${br.width} ${br.height}`);
    svg.innerHTML = '';
    $$('.line-x', board).forEach((n) => n.remove());
    for (const [l, r] of links) {
      const a = dotCenter(elOf('l', l), br);
      const b = dotCenter(elOf('r', r), br);
      const cls = checked || isLocked(l) ? (l === r ? 'ok' : 'bad') : '';
      svg.insertAdjacentHTML('beforeend', `<path class="ml ${cls}" d="${curve(a, b)}"/>`);
      if (!checked && !isLocked(l)) {
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'line-x';
        x.dataset.l = l;
        x.setAttribute('aria-label', 'კავშირის წაშლა');
        x.style.left = `${(a[0] + b[0]) / 2}px`;
        x.style.top = `${(a[1] + b[1]) / 2}px`;
        x.innerHTML = icon('x', 14);
        board.appendChild(x);
      }
    }
  }

  function renderActions() {
    const box = $('#actions', el);
    if (!box) return;
    const allLinked = links.size === total();
    const okCount = [...links].filter(([l, r]) => l === r).length;
    const perfect = checked && okCount === total();
    let main;
    if (perfect) main = `<button class="btn btn-primary" id="m-next">${icon('arrow-right', 18)}შემდეგი რაუნდი</button>`;
    else if (checked) main = `<button class="btn btn-primary" id="m-fix">${icon('undo-2', 18)}შეასწორე არასწორები</button>`;
    else main = `<button class="btn btn-primary" id="m-check" ${allLinked ? '' : 'disabled'}>${icon('check', 18)}შემოწმება</button>`;

    box.innerHTML = `
      ${main}
      ${perfect ? '' : `<button class="btn btn-ghost" id="m-clear">${icon('eraser', 18)}გასუფთავება</button>`}
      <button class="btn btn-ghost" id="m-new">${icon('shuffle', 18)}ახალი რაუნდი</button>
      ${checked ? `<span class="match-score ${perfect ? 'perfect' : ''}">${okCount} / ${total()} სწორია${perfect ? ' — შესანიშნავია' : ''}</span>` : `<span class="match-score">${links.size} / ${total()} დაკავშირებულია</span>`}`;

    $('#m-check', el)?.addEventListener('click', check);
    $('#m-fix', el)?.addEventListener('click', fix);
    $('#m-next', el)?.addEventListener('click', newRound);
    $('#m-clear', el)?.addEventListener('click', () => {
      links = new Map([...links].filter(([l]) => isLocked(l)));
      selected = null;
      checked = false;
      refresh();
    });
    $('#m-new', el).addEventListener('click', newRound);
  }

  /* ----- actions ----- */
  function connect(l, r) {
    if (isLocked(l) || isLocked(r)) return;
    checked = false;
    links.delete(l);
    for (const [k, v] of links) if (v === r) links.delete(k);
    links.set(l, r);
    const lt = left.find((x) => x.id === l)?.text;
    const rt = right.find((x) => x.id === r)?.text;
    $('#live', el).textContent = `დაკავშირდა: ${lt} — ${rt}`;
  }

  function check() {
    checked = true;
    let ok = 0;
    for (const [l, r] of links)
      if (l === r) {
        ok++;
        locked.add(l);
      }
    const score = pct(ok, total());
    store.update((s) => {
      s.match[set.id] = Math.max(s.match[set.id] || 0, score);
    });
    refresh();
  }

  function fix() {
    links = new Map([...links].filter(([l, r]) => l === r));
    checked = false;
    selected = null;
    refresh();
  }

  /* ----- input ----- */
  function bind() {
    const board = $('#board', el);

    // The board element is replaced on every round, so re-attach the observer each time.
    ro?.disconnect();
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(layout);
      ro.observe(board);
    }

    board.addEventListener('click', (e) => {
      if (suppressClick) return;
      const x = e.target.closest('.line-x');
      if (x) {
        links.delete(+x.dataset.l);
        refresh();
        return;
      }
      const n = e.target.closest('.m-item');
      if (!n) return;
      const side = n.dataset.side;
      const id = +n.dataset.id;
      if (isLocked(id)) return;
      if (!selected) selected = { side, id };
      else if (selected.side === side) selected = selected.id === id ? null : { side, id };
      else {
        connect(side === 'r' ? selected.id : id, side === 'r' ? id : selected.id);
        selected = null;
      }
      refresh();
    });

    // Mouse / pen drag (touch uses tap-tap so the page can still scroll)
    board.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      const n = e.target.closest('.m-item');
      if (!n || isLocked(+n.dataset.id)) return;
      drag ={ side: n.dataset.side, id: +n.dataset.id, x: e.clientX, y: e.clientY, moved: false, node: n };
    });
  }

  const onMove = (e) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) {
      drag.moved = true;
      drag.node.classList.add('is-selected');
      $('#lines', el).insertAdjacentHTML('beforeend', '<path class="ml temp" id="tmp-line"/>');
    }
    if (drag.moved) {
      const br = $('#board', el).getBoundingClientRect();
      const a = dotCenter(drag.node, br);
      const b = [e.clientX - br.left, e.clientY - br.top];
      const [from, to] = drag.side === 'l' ? [a, b] : [b, a];
      $('#tmp-line', el)?.setAttribute('d', curve(from, to));
    }
  };

  const onUp = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moved) return;
    $('#tmp-line', el)?.remove();
    d.node.classList.remove('is-selected');
    const t = document.elementFromPoint(e.clientX, e.clientY)?.closest('.m-item');
    if (t && t.dataset.side !== d.side && !isLocked(+t.dataset.id)) {
      const l = d.side === 'l' ? d.id : +t.dataset.id;
      const r = d.side === 'r' ? d.id : +t.dataset.id;
      connect(l, r);
      selected = null;
      refresh();
    }
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 0);
  };

  addEventListener('pointermove', onMove);
  addEventListener('pointerup', onUp);

  // Keep lines glued to the items when the layout changes.
  const onResize = () => layout();
  addEventListener('resize', onResize);
  document.fonts?.ready.then(layout);

  newRound();

  return {
    title: set.title,
    cleanup() {
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('resize', onResize);
      ro?.disconnect();
    }
  };
}
