import { chaptersA } from './chapters-a.js';
import { chaptersB } from './chapters-b.js';

// Short names for the sidebar
const SHORT = {
  essence: 'ფსიქოკონსულტირების არსი',
  history: 'მოკლე ისტორია',
  schools: 'ძირითადი მიმართულებები',
  goals: 'მიზნები და ამოცანები',
  contact: 'მიდგომები და კონტაქტი',
  setting: 'სივრცე და დრო',
  atmosphere: 'ნდობა და ატმოსფერო',
  conditions: 'როჯერსის სამი პირობა',
  nonverbal: 'არავერბალური კომუნიკაცია',
  listening: 'მოსმენა და კითხვები',
  dynamics: 'გადატანა და კონფრონტაცია',
  process: 'კონსულტირების პროცესი',
  counselor: 'კონსულტანტი'
};

export const chapters = [...chaptersA, ...chaptersB].map((c, i) => ({ ...c, n: i + 1, short: SHORT[c.id] || c.title }));
export const chapterById = Object.fromEntries(chapters.map((c) => [c.id, c]));
