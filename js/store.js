// Progress is kept in the browser (localStorage). Nothing leaves the device.
const KEY = 'psycho-counseling:v1';

const defaults = () => ({
  studied: {}, // chapterId -> true
  cards: {}, // cardId -> 'known' | 'learning'
  quiz: {}, // scopeKey -> { best, last, n, date }
  match: {}, // setId -> best percent
  order: { best: 0, plays: 0 },
  midterm: {}, // questionNo -> true
  answers: {} // questionNo -> user's own written answer
});

let state = defaults();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = { ...defaults(), ...JSON.parse(raw) };
} catch {
  /* storage unavailable: run in memory */
}

const listeners = new Set();
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
};

export const store = {
  get: () => state,
  update(fn) {
    fn(state);
    persist();
    listeners.forEach((l) => l(state));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  reset() {
    state = defaults();
    persist();
    listeners.forEach((l) => l(state));
  }
};
