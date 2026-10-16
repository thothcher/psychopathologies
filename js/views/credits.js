import { icon } from '../icons.js';
import { esc, $ } from '../util.js';
import { store } from '../store.js';
import { toast } from '../ui.js';

const photos = [
  ['clouds-pastel', 'Scott Goodwill', 'A3u8Ugv1EAw', 'მთავარი გვერდი'],
  ['stones-pink', 'Vitalii Abakumov', 'BZu1L784DrQ', 'ფსიქოკონსულტირების არსი'],
  ['mountains-pastel', 'Marek Piwnicki', 'A1IoRfRQHuk', 'მოკლე ისტორია'],
  ['beach-aerial', 'Graddes', '4ZmRoIabYIY', 'ძირითადი მიმართულებები'],
  ['eucalyptus', 'Annie Spratt', 'hX_hf2lPpUU', 'მიზნები და ამოცანები'],
  ['coffee-cups', 'Sixteen Miles Out', 'f6UNiOH7uBo', 'მიდგომები და კონტაქტი'],
  ['chairs-bay', 'Simon Maage', '29LCTXSGg6A', 'სივრცე და დრო'],
  ['bedroom-minimal', 'Spencer', 'HHWwqWV6d5k', 'ნდობა და ატმოსფერო'],
  ['water-ripples', 'Yoko Saito', 'f4BbfW1EFq0', 'როჯერსის სამი პირობა'],
  ['chairs-window', 'NEW DATA SERVICES', 'nZ50HrjAFNc', 'არავერბალური კომუნიკაცია'],
  ['sand-dunes', 'Christian Lue', '9NvYDKwcH6g', 'გადატანა და კონფრონტაცია'],
  ['desk-notebook', 'Kelly Sikkema', 'wl2qQ2JHMXA', 'კონსულტირების პროცესი']
];

export function mount(el) {
  el.innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">${icon('info', 18)}შესახებ</span>
        <h1>ფოტოები და შესახებ</h1>
        <p>საიტი შექმნილია ფსიქოკონსულტირების ლექციის კონსპექტის მიხედვით, სასწავლო მიზნებისთვის. შენი პროგრესი ინახება მხოლოდ შენს ბრაუზერში.</p>
      </div>
    </div>

    <div class="section-head" style="margin-top:8px"><div><h2>ფოტოები</h2><p>ყველა ფოტო <a href="https://unsplash.com/license" target="_blank" rel="noopener">Unsplash-ის ლიცენზიით</a> გამოიყენება. მადლობა ავტორებს.</p></div></div>
    <div class="credit-grid">
      ${photos
        .map(
          ([file, who, id, where]) => `
        <a class="credit" href="https://unsplash.com/photos/${id}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">
          <img src="img/${file}-sm.jpg" alt="" loading="lazy" width="700" height="525">
          <b>${esc(who)}</b>
          <span>${esc(where)} · Unsplash</span>
        </a>`
        )
        .join('')}
    </div>

    <div class="section-head"><div><h2>სხვა</h2></div></div>
    <div class="prose" style="max-width:640px">
      <ul>
        <li>ხატულები: <a href="https://lucide.dev" target="_blank" rel="noopener">Lucide</a> (ISC ლიცენზია), Iconify-ის საშუალებით.</li>
        <li>შრიფტები: Noto Sans Georgian და Noto Serif Georgian (SIL Open Font License).</li>
        <li>ტესტური კითხვები და მოდელური პასუხები შედგენილია კონსპექტის მიხედვით; ეს არ არის ოფიციალური გამოცდის ტექსტი.</li>
      </ul>
    </div>

    <div class="section-head"><div><h2>პროგრესი</h2><p>ნასწავლი თავები, ბარათები, ტესტის შედეგები და შენი ჩანაწერები ინახება ამ ბრაუზერში.</p></div></div>
    <button class="btn btn-ghost" id="reset">${icon('rotate-ccw', 18)}პროგრესის განულება</button>`;

  $('#reset', el).addEventListener('click', () => {
    if (confirm('ნამდვილად გინდა მთელი პროგრესის განულება? ეს მოქმედება ვერ გაუქმდება.')) {
      store.reset();
      toast('პროგრესი განულდა');
    }
  });
  return { title: 'ფოტოები და შესახებ' };
}
