import { chapters } from './data/chapters.js';
import { cards } from './data/cards.js';
import { midterm } from './data/midterm.js';
import { store } from './store.js';
import { pct } from './util.js';

export function progress() {
  const s = store.get();
  const studied = chapters.filter((c) => s.studied[c.id]).length;
  const known = cards.filter((c) => s.cards[c.id] === 'known').length;
  const midDone = midterm.filter((m) => s.midterm[m.n]).length;
  const bests = Object.values(s.quiz).map((q) => q.best).filter((b) => typeof b === 'number');
  const bestQuiz = bests.length ? Math.max(...bests) : null;
  return {
    studied,
    chaptersTotal: chapters.length,
    known,
    cardsTotal: cards.length,
    midDone,
    midTotal: midterm.length,
    bestQuiz,
    overall: pct(studied, chapters.length)
  };
}
