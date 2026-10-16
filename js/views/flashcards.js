import { cards as allCards } from '../data/cards.js';
import { chapterById } from '../data/chapters.js';
import { icon } from '../icons.js';
import { esc, $, $$, shuffle, pct, debounce } from '../util.js';
import { store } from '../store.js';
import { go } from '../router.js';
import { tone, chapterOptions } from '../ui.js';

export function mount(el, params) {
  const chId = params[0] && chapterById[params[0]] ? params[0] : 'all';
  const counts = {};
  allCards.forEach((c) => (counts[c.ch] = (counts[c.ch] || 0) + 1));
  const scope = allCards.filter((c) => chId === 'all' || c.ch === chId);

  let shuffleOn = false;
  let hideKnown = false;
  let deck = [];
  let i = 0;
  let session = { known: 0, learning: 0 };
  let missed = [];

  const buildDeck = (source) => {
    let d = source || scope;
    if (hideKnown && !source) d = d.filter((c) => store.get().cards[c.id] !== 'known');
    deck = shuffleOn ? shuffle(d) : d;
    i = 0;
    session = { known: 0, learning: 0 };
    missed = [];
  };

  const knownInScope = () => scope.filter((c) => store.get().cards[c.id] === 'known').length;

  function render() {
    el.innerHTML = `
      <div class="page-head">
        <div>
          <span class="eyebrow">${icon('layers', 18)}ივარჯიშე</span>
          <h1>ბარათები</h1>
          <p>დააჭირე ბარათს, რომ გადაატრიალო. მონიშნე „ვიცი“ ან „ვიმეორებ“ — პასუხები ინახება ამ ბრაუზერში.</p>
        </div>
      </div>
      <div class="toolbar">
        <label class="visually-hidden" for="fc-ch">თავი</label>
        <select class="select" id="fc-ch">
          <option value="all" ${chId === 'all' ? 'selected' : ''}>ყველა თავი (${allCards.length})</option>
          ${chapterOptions(chId, counts)}
        </select>
        <button class="toggle" id="fc-shuffle" aria-pressed="${shuffleOn}">${icon('shuffle', 17)}არეული თანმიმდევრობა</button>
        <button class="toggle" id="fc-hide" aria-pressed="${hideKnown}">${icon('eye', 17)}დამალე ნასწავლები</button>
        <span style="margin-left:auto;font-size:14px;color:var(--ink-2)" id="fc-known"></span>
      </div>
      <div class="fc-wrap" id="fc-body"></div>`;

    $('#fc-ch', el).addEventListener('change', (e) => go(e.target.value === 'all' ? 'flashcards' : `flashcards/${e.target.value}`));
    $('#fc-shuffle', el).addEventListener('click', (e) => {
      shuffleOn = !shuffleOn;
      e.currentTarget.setAttribute('aria-pressed', String(shuffleOn));
      buildDeck();
      renderBody();
    });
    $('#fc-hide', el).addEventListener('click', (e) => {
      hideKnown = !hideKnown;
      e.currentTarget.setAttribute('aria-pressed', String(hideKnown));
      buildDeck();
      renderBody();
    });
    renderBody();
  }

  function renderBody() {
    const body = $('#fc-body', el);
    $('#fc-known', el).textContent = `ნასწავლია ${knownInScope()} / ${scope.length}`;

    if (!deck.length) {
      body.innerHTML = `
        <div class="card empty-state" style="margin-top:28px">
          ${icon('circle-check', 40)}
          <h2 style="font-size:24px;margin:12px 0 6px">აქ ყველაფერი ნასწავლია</h2>
          <p style="margin-bottom:20px">ამ არჩევანში ბარათები აღარ დარჩა.</p>
          <button class="btn btn-primary" id="fc-reset-filter">აჩვენე ყველა ბარათი</button>
        </div>`;
      $('#fc-reset-filter', el).addEventListener('click', () => {
        hideKnown = false;
        $('#fc-hide', el).setAttribute('aria-pressed', 'false');
        buildDeck();
        renderBody();
      });
      return;
    }

    if (i >= deck.length) {
      body.innerHTML = `
        <div class="card fc-done" style="margin-top:28px">
          <span class="eyebrow" style="justify-content:center">${icon('circle-check', 18)}ბრუნი დასრულდა</span>
          <h2>${session.learning === 0 ? 'ყველა ბარათი გახსოვს!' : 'კარგი ნაბიჯია'}</h2>
          <p>${session.learning === 0 ? 'შეგიძლია გადახვიდე ტესტზე ან სხვა თავზე.' : 'გასამეორებელი ბარათები ცალკე შეგიძლია კიდევ ერთხელ გაიარო.'}</p>
          <div class="fc-counts"><div class="k"><b>${session.known}</b>ვიცი</div><div class="l"><b>${session.learning}</b>ვიმეორებ</div></div>
          <div class="hero-actions" style="justify-content:center">
            ${missed.length ? `<button class="btn btn-blush" id="fc-hard">${icon('repeat', 18)}გაიმეორე გასამეორებლები (${missed.length})</button>` : ''}
            <button class="btn btn-primary" id="fc-again">${icon('rotate-ccw', 18)}თავიდან</button>
            <a class="btn btn-ghost" href="#/quiz${chId === 'all' ? '' : `/ch-${chId}`}">${icon('circle-question-mark', 18)}ტესტი</a>
          </div>
        </div>`;
      $('#fc-again', el).addEventListener('click', () => {
        buildDeck();
        renderBody();
      });
      $('#fc-hard', el)?.addEventListener('click', () => {
        const again = [...missed];
        buildDeck(again);
        renderBody();
      });
      return;
    }

    const card = deck[i];
    const ch = chapterById[card.ch];
    const st = store.get().cards[card.id];
    body.innerHTML = `
      <div class="fc-meta">
        <span>${i + 1} / ${deck.length}</span>
        <div class="bar"><span style="width:${pct(i, deck.length)}%"></span></div>
        ${st ? `<span class="fc-state ${st}">${st === 'known' ? 'ნასწავლია' : 'გასამეორებელი'}</span>` : '<span class="fc-state" style="opacity:0">–</span>'}
      </div>
      <div class="fc-stage ${tone(ch)}">
        <div class="fc-card" id="fc-card" role="button" tabindex="0" aria-label="ბარათი. გადასატრიალებლად დააჭირე Enter-ს ან Space-ს">
          <div class="fc-face fc-front">
            <div class="fc-inner"><span class="chip">${ch.n}. ${esc(ch.short)}</span><div class="fc-q">${esc(card.q)}</div></div>
            <div class="fc-hint">${icon('rotate-cw', 14)}დააჭირე გადასატრიალებლად</div>
          </div>
          <div class="fc-face fc-back" aria-hidden="true">
            <div class="fc-inner"><span class="chip">პასუხი</span><div class="fc-a">${esc(card.a)}</div></div>
            <div class="fc-hint">${icon('rotate-cw', 14)}კითხვაზე დასაბრუნებლად დააჭირე</div>
          </div>
        </div>
      </div>
      <div class="fc-actions">
        <button class="btn btn-ghost btn-icon" id="fc-prev" aria-label="წინა ბარათი" ${i === 0 ? 'disabled' : ''}>${icon('arrow-left', 20)}</button>
        <button class="btn btn-blush" id="fc-again-card">${icon('repeat', 18)}ვიმეორებ</button>
        <button class="btn btn-primary" id="fc-know">${icon('check', 18)}ვიცი</button>
        <button class="btn btn-ghost btn-icon" id="fc-next" aria-label="შემდეგი ბარათი">${icon('arrow-right', 20)}</button>
      </div>
      <div class="kbd-hint">
        <span><span class="kbd">Space</span> გადატრიალება</span>
        <span><span class="kbd">←</span> <span class="kbd">→</span> გადასვლა</span>
        <span><span class="kbd">1</span> ვიმეორებ</span>
        <span><span class="kbd">2</span> ვიცი</span>
      </div>`;

    $('#fc-card', el).addEventListener('click', flip);
    $('#fc-prev', el).addEventListener('click', prev);
    $('#fc-next', el).addEventListener('click', next);
    $('#fc-know', el).addEventListener('click', () => rate('known'));
    $('#fc-again-card', el).addEventListener('click', () => rate('learning'));
    fit();
  }

  function fit() {
    const cardEl = $('#fc-card', el);
    if (!cardEl) return;
    const need = Math.max(
      ...$$('.fc-face', cardEl).map((f) => {
        const cs = getComputedStyle(f);
        return $('.fc-inner', f).offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + 40;
      })
    );
    cardEl.style.setProperty('--h', `${Math.max(360, Math.ceil(need))}px`);
  }

  function flip() {
    const cardEl = $('#fc-card', el);
    if (!cardEl) return;
    const on = cardEl.classList.toggle('is-flipped');
    $('.fc-back', cardEl).setAttribute('aria-hidden', String(!on));
    $('.fc-front', cardEl).setAttribute('aria-hidden', String(on));
  }

  function rate(state) {
    const card = deck[i];
    store.update((s) => {
      s.cards[card.id] = state;
    });
    if (state === 'known') session.known++;
    else {
      session.learning++;
      missed.push(card);
    }
    $('#fc-known', el).textContent = `ნასწავლია ${knownInScope()} / ${scope.length}`;
    i++;
    renderBody();
  }
  function next() {
    if (i < deck.length) {
      i++;
      renderBody();
    }
  }
  function prev() {
    if (i > 0) {
      i--;
      renderBody();
    }
  }

  const onKey = (e) => {
    if (e.target.closest('select, input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('#fc-card', el)) return;
    const onBody = e.target === document.body || e.target.id === 'fc-card';
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if ((e.key === ' ' || e.key === 'Enter') && onBody) {
      e.preventDefault();
      flip();
    } else if (e.key === '1') rate('learning');
    else if (e.key === '2') rate('known');
  };
  const onResize = debounce(fit, 150);
  document.addEventListener('keydown', onKey);
  addEventListener('resize', onResize);
  document.fonts?.ready.then(fit);

  buildDeck();
  render();

  const ch = chapterById[chId];
  return {
    title: ch ? `ბარათები · ${ch.short}` : 'ბარათები',
    cleanup() {
      document.removeEventListener('keydown', onKey);
      removeEventListener('resize', onResize);
    }
  };
}
