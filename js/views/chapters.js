import { chapters } from '../data/chapters.js';
import { store } from '../store.js';
import { chapterCard } from '../ui.js';

export function mount(el) {
  const s = store.get();
  el.innerHTML = `
    <div class="page-head">
      <div>
        <h1>თავები</h1>
        <p>ლექციის კონსპექტი ${chapters.length} თავად. წაიკითხე თავი, მონიშნე ნასწავლად და გადადი ბარათებზე ან ტესტზე.</p>
      </div>
    </div>
    <div class="ch-grid">${chapters.map((c) => chapterCard(c, s.studied[c.id])).join('')}</div>`;
  return { title: 'თავები' };
}
