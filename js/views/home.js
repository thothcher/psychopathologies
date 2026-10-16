import { chapters } from '../data/chapters.js';
import { cards } from '../data/cards.js';
import { questions } from '../data/quiz.js';
import { midterm } from '../data/midterm.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { progress } from '../stats.js';
import { pct } from '../util.js';
import { chapterCard } from '../ui.js';

export function mount(el) {
  const s = store.get();
  const p = progress();
  const next = chapters.find((c) => !s.studied[c.id]) || chapters[0];
  const started = p.studied > 0;

  const stat = (tone, ic, num, of, label, value) => `
    <div class="card stat tone-${tone}">
      <div class="stat-top">
        <span class="stat-icon">${icon(ic, 22)}</span>
        <div><div class="stat-num">${num}${of ? ` <small>/ ${of}</small>` : ''}</div><div class="stat-label">${label}</div></div>
      </div>
      ${value === null ? '' : `<div class="bar"><span style="width:${value}%"></span></div>`}
    </div>`;

  const practice = (tone, ic, title, text, href, meta) => `
    <a class="practice tone-${tone}" href="${href}">
      <span class="practice-icon">${icon(ic, 24)}</span>
      <h3>${title}</h3>
      <p>${text}</p>
      <span class="go">${meta}${icon('arrow-right', 16)}</span>
    </a>`;

  el.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <span class="eyebrow">${icon('sparkles', 18)}სასწავლო სივრცე · ფსიქოლოგიის სტუდენტებისთვის</span>
        <h1>ფსიქოკონსულტირება</h1>
        <p class="lead">ლექციის კონსპექტი თავებად დაყოფილი — ბარათებით, დაკავშირების თამაშით, ტესტებით, ქრონოლოგიითა და გამოცდის კითხვებით. სწავლა მარტივად და მშვიდად.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#/chapter/${next.id}">${icon('book-open', 18)}${started ? 'გააგრძელე სწავლა' : 'დაიწყე სწავლა'}</a>
          <a class="btn btn-ghost" href="#/midterm">${icon('file-pen-line', 18)}გამოცდის კითხვები</a>
        </div>
      </div>
      <div class="hero-media">
        <img src="img/clouds-pastel.jpg" alt="" width="1600" height="1067" fetchpriority="high" decoding="async">
        <div class="hero-badge">
          <div><b>${chapters.length}</b><span>თავი</span></div>
          <div><b>${cards.length}</b><span>ბარათი</span></div>
          <div><b>${questions.length}</b><span>ტესტური კითხვა</span></div>
        </div>
      </div>
    </section>

    <section class="stats" aria-label="შენი პროგრესი">
      ${stat('sage', 'book-open', p.studied, p.chaptersTotal, 'ნასწავლი თავი', pct(p.studied, p.chaptersTotal))}
      ${stat('sky', 'layers', p.known, p.cardsTotal, 'ნასწავლი ბარათი', pct(p.known, p.cardsTotal))}
      ${stat('lilac', 'circle-question-mark', p.bestQuiz === null ? '—' : `${p.bestQuiz}%`, '', 'საუკეთესო ტესტი', p.bestQuiz === null ? 0 : p.bestQuiz)}
      ${stat('sand', 'file-pen-line', p.midDone, p.midTotal, 'გამოცდის კითხვა დაძლეული', pct(p.midDone, p.midTotal))}
    </section>

    <div class="section-head">
      <div><h2>თავები</h2><p>ლექციის მასალა ${chapters.length} თავად. თითოეულ თავს თავისი ბარათები და ტესტი აქვს.</p></div>
      <a class="btn btn-ghost btn-sm" href="#/chapters">ყველა თავი ${icon('arrow-right', 16)}</a>
    </div>
    <div class="ch-grid">${chapters.map((c) => chapterCard(c, s.studied[c.id])).join('')}</div>

    <div class="section-head">
      <div><h2>ივარჯიშე</h2><p>გაიმეორე მასალა თამაშით — ხუთი წუთიც საკმარისია.</p></div>
    </div>
    <div class="practice-grid">
      ${practice('sky', 'layers', 'ბარათები', 'გადაატრიალე და შეამოწმე, რამდენად გახსოვს ცნებები და განმარტებები.', '#/flashcards', `${cards.length} ბარათი`)}
      ${practice('sage', 'spline', 'დაკავშირება', 'დააკავშირე მარცხენა მხარე მარჯვენასთან: ავტორები, ცნებები, წლები.', '#/match', 'თამაში')}
      ${practice('lilac', 'circle-question-mark', 'ტესტი', 'კითხვები არჩევანით და ახსნით — თავის მიხედვით ან ყველა ერთად.', '#/quiz', `${questions.length} კითხვა`)}
      ${practice('sand', 'history', 'ქრონოლოგია', 'ფსიქოკონსულტირების ისტორია წლების მიხედვით და თამაში თარიღებზე.', '#/timeline', 'თარიღები')}
    </div>

    <div class="section-head"><div><h2>გამოცდისთვის</h2></div></div>
    <section class="banner">
      <div class="banner-body">
        <span class="eyebrow" style="color:var(--sand-d)">${icon('graduation-cap', 18)}შუალედური გამოცდა</span>
        <h2>${midterm.length} მთავარი კითხვა კონსპექტიდან</h2>
        <p>დაწერე საკუთარი პასუხი, შეადარე მოდელურ პასუხს და მონიშნე, რომელი პუნქტები გახსოვდა. ან სცადე საცდელი ტესტი დროის შეზღუდვით.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#/midterm">${icon('file-pen-line', 18)}კითხვებზე მუშაობა</a>
          <a class="btn btn-ghost" href="#/quiz/mock">${icon('timer', 18)}საცდელი ტესტი</a>
        </div>
      </div>
      <div class="banner-media"><img src="img/desk-notebook.jpg" alt="" loading="lazy" decoding="async"></div>
    </section>`;

  return { title: '' };
}
