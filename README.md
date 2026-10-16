# ფსიქოკონსულტირება — study site

**Live site: <https://thothcher.github.io/psychopathologies/>**

A study website for the *Psychological Counseling* (ფსიქოკონსულტირება) course, built from a set of lecture
notes (the notes themselves are not part of this repository). The interface is in Georgian.
Plain HTML, CSS and JavaScript (ES modules). No build step, no dependencies.

## Hosting

The site is static and is served by **GitHub Pages** straight from the root of the `main` branch.
All asset paths are relative and navigation uses `#/` routes, so it works under the
`/psychopathologies/` sub-path without any configuration.

## Run it locally

Double-click **`start.bat`**, or from a terminal in this folder:

```
npm start          # or: node server.js
```

Then open <http://localhost:5173>. (If that port is busy it uses the next free one and prints the address.)

> The site must be opened through the server, not by double-clicking `index.html`, because browsers block ES modules on `file://`.

## What is inside

| Page | What it does |
| --- | --- |
| Home | Progress overview, chapter grid, shortcuts |
| Chapters (13) | The notes, split by topic, each with key terms and links to its own practice |
| Flashcards | Flip cards per chapter; "know" / "repeat"; keyboard: Space, ← →, 1, 2 |
| Matching | Connect left items to right items (drag with a mouse, or tap one then the other) |
| Quiz | Multiple choice with explanations; per chapter, all chapters, a timed mock exam, and a "which year?" quiz |
| Timeline | Chronology from the notes, plus an "arrange in order" game |
| Midterm | The 21 exam questions from the notes: write your own answer, reveal the model answer, tick the key points you remembered |

Progress (studied chapters, known cards, quiz scores, your written answers) is saved in the browser's
`localStorage`. It stays on your device; "პროგრესის განულება" on the credits page clears it.

## Editing the content

Everything lives in `js/data/` as plain data, so you can fix or extend it without touching the app code:

| File | Content |
| --- | --- |
| `chapters-a.js`, `chapters-b.js` | Chapter text. Built with small helpers: `h`, `h3`, `p`, `ul`, `ol`, `note`, `quote`, `defs`, `table`, `link` (see `blocks.js`) |
| `cards.js` | Flashcards: `[chapterId, front, back]` |
| `quiz.js` | Questions: `q(chapter, question, correct, wrong1, wrong2, wrong3, explanation)` — the **first** option is the correct one; order is shuffled when the quiz runs |
| `matching.js` | Matching sets: pairs of `[left, right]`; each round shows up to 6 random pairs |
| `timeline.js` | Events. `exact: true` makes an event usable in the year games; `note` shows a small hint when other sources give a different date |
| `midterm.js` | The 21 exam questions with `lead` and `points` |

Colors, spacing and fonts are CSS variables at the top of `css/base.css`.

## Structure

```
index.html
server.js            tiny static server (Node, no packages)
css/                 base.css (tokens, buttons) · layout.css (shell, pages) · games.css
js/app.js            sidebar, router wiring
js/views/            one file per page
js/data/             all study content
js/icons.js          icons bundled from Lucide (via Iconify) — no CDN needed
fonts/               Noto Sans / Serif Georgian, self-hosted
img/                 Unsplash photos (two sizes each)
```

## Credits

- Photos: [Unsplash](https://unsplash.com) — photographers are listed on the site's credits page.
- Icons: [Lucide](https://lucide.dev) (ISC license), fetched through [Iconify](https://iconify.design).
- Fonts: Noto Sans Georgian and Noto Serif Georgian (SIL Open Font License).

## A note on dates

Timeline dates follow the lecture notes. A few of them differ from other sources (for example the Wundt
laboratory, usually dated 1879); those entries carry a small note so you can double-check with your lecturer.
