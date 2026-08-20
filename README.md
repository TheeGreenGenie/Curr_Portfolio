# Solomon Shasanmi — Portfolio

A hand-built Flask portfolio for my work as a developer and a poet. No CMS, no database, no
build step — content lives in two JSON files and images are discovered from the filesystem,
so publishing a project is a matter of dropping screenshots in a folder.

---

## About me

I'm a developer and creative based in Philadelphia, PA. I build full-stack web apps, automation
pipelines, and tools that solve real problems — 27 projects across AI, blockchain, data, games,
and web, including hackathon work that's placed at MorganHacks and MLH tracks.

Outside of code I write poetry, which turns out to demand the same precision and rhythm that good
software does. This site is where both live.

---

## Stack

| Layer | Choice |
|---|---|
| Backend | Flask 3.0.3 (single-module `app.py`, no blueprints) |
| Frontend | Jinja2 templates, Tailwind via CDN + a custom CSS token layer |
| Motion | AOS (scroll reveals), Anime.js (filtering, staggered entrances) |
| Data | `data/projects.json`, `data/poems.json` — no database |
| Runtime | Python 3.13 |

Theming is a `:root` custom-property layer with a `html.light` override, toggled in JS and
persisted to `localStorage`. An inline script in `<head>` applies the saved theme before first
paint, so there's no light-mode flash.

---

## Technical capabilities

**Filesystem-driven project galleries.** Screenshots are discovered at request time from
`static/images/projects/<id>/`. The JSON `screenshots` array controls display order — the first
entry becomes the card's display picture — and any file in the folder that isn't listed is
appended alphabetically. Listed files that don't exist on disk are dropped rather than rendering
broken images. Adding a screenshot requires no code or JSON change.

**Two project detail layouts, chosen from the data.** Projects with `has_live_site` render a
sticky sidebar beside a sandboxed iframe of the running site; everything else gets a hero image
with a masonry gallery. When a live preview fails to load, the page falls back to the screenshot
set, with a manual toggle between preview and screenshots.

**Automatic poetry theming.** Uncollected poems are grouped by a keyword-scoring classifier
(`detect_theme`) across six themes — Memory & Time, Nature & Light, Longing & Loss, Quiet &
Stillness, Place & Distance, Wonder & Ordinary — matching both unigrams and bigrams. Named
collections bypass it and group by hand.

**Composable filtering.** The projects index filters on two independent axes — category
(auto-derived from the data) and accomplishment (personal / school / hackathon, plus an
award-winning filter that appears only when awards exist). Both combine, with an empty state when
a combination matches nothing. Sorting puts the best-illustrated work first: screenshot count,
then featured, then title, so projects without pictures sink to the bottom.

**Keyboard page navigation.** Arrow and Page keys snap between full-screen sections. Stops are
measured from the live layout rather than hardcoded, so they follow the current viewport and are
rebuilt on resize via `ResizeObserver`. Sections taller than the screen get intermediate stops so
nothing is skipped, and the handler yields while typing or when an overlay owns the keyboard.

**Gallery lightbox.** Scoped per gallery, with on-screen arrows, ←/→ keys, wrap-around, and an
index counter. The horizontal strip on live-site pages has its own arrows that advance one image
at a time and fade out at each end.

**Responsive collapsibles.** The profile photo and specialty cards share one toggle mechanism with
two presentations: on desktop, collapsed cards show an oversized icon filling the block with no
text; on mobile they become two-per-row icon tiles that expand to full width, and the photo becomes
a rounded dropdown.

**Graceful degradation throughout.** Missing images render a themed placeholder built from markup
(not an asset, so it follows the light/dark theme). Missing documents hide their buttons instead of
producing dead links. Filtering works without Anime.js loaded.

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Hero, about, specialties, resume/CV |
| `/projects` | Filterable, picture-sorted project index |
| `/projects/<slug>` | Project detail — live-embed or gallery layout |
| `/poetry` | Collections + auto-themed poem groups |
| `/poetry/<slug>` | Single poem with prev/next |
| `/documents/<resume\|cv>` | In-browser PDF viewer |

---

## Running it

```bash
pip install -r requirements.txt
python app.py            # http://127.0.0.1:5000
```

---

## Adding content

**A project** — append an object to `data/projects.json`:

```jsonc
{
  "id": "my-project",            // also the URL slug and screenshot folder name
  "title": "My Project",
  "description": "One-line summary for the card.",
  "long_description": "Full write-up for the detail page.",
  "how_to_use": "Optional usage notes.",
  "screenshots": [],             // display order; empty = alphabetical by filename
  "live_url": "https://…",
  "github_url": "https://…",
  "has_live_site": true,         // true = iframe layout, false = gallery layout
  "coming_soon": false,
  "project_type": "personal",    // personal | school | hackathon
  "hackathon_wins": [],          // any entry adds the Award-Winning filter
  "collaborators": [],           // [{ "name": "…", "linkedin": "…" }]
  "tags": ["Flask", "Python"],
  "category": "web",             // drives the category filter
  "date": "2026-08",
  "featured": false
}
```

**Screenshots** — drop images in `static/images/projects/<id>/`. They're picked up automatically;
list filenames in `screenshots` only when you want a specific order.

**A poem** — append to `data/poems.json` with `id`, `title`, `content` (`\n` for line breaks),
`date`, and an optional `collection`. Leave `collection` empty to let the theme classifier place it.

**Resume / CV** — put `resume.pdf` and `cv.pdf` in `static/files/`. Buttons appear only when the
file exists; the lookup also matches names like `Solomon-CV.pdf`.

---

## Layout

```
app.py                  routes, screenshot resolution, poem theming, document lookup
data/                   projects.json, poems.json
static/
  css/style.css         design tokens + all component styles
  js/main.js            theme, nav, filters, lightbox, snapping, collapsibles
  images/projects/<id>/ per-project screenshots
  files/                resume.pdf, cv.pdf
templates/              base + page templates, _macros.html
```
