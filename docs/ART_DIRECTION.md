# F-Forum — Art Direction: "Bút đỏ" (The Red Pen)

## Idea

F-Forum is where students, teachers, vibe coders and web designers draft with AI and then **prove** the result: Live View shows it running, Diff & Check marks every line. The identity is a **printer's proof marked by a teacher's red pen**: paper and ink surfaces, editorial serif type, hairline rules, crop marks, and one red used the way a proofreader uses it — to mark what matters. Nothing glows, nothing is glass, nothing is gold.

## Tokens (only source of colour, type, space) — `src/styles/tokens.css`

| Role | Token |
|---|---|
| Surfaces | `--bg` `--bg-raised` `--bg-sunken` `--bg-high` `--bg-veil` `--bg-inverse` |
| Text | `--fg` `--fg-muted` `--fg-faint` `--fg-inverse` |
| Lines | `--line` `--line-strong` |
| Red pen | `--red` (text/stroke) `--red-fill` + `--on-red` (fills) `--red-soft` |
| Semantic | `--green` `--green-soft` (added / pass) · `--amber` `--amber-soft` (warn) |
| Type | `--font-display` Fraunces · `--font-ui` Manrope · `--font-mono` IBM Plex Mono · `--font-script` Imperial Script |
| Scale | `--text-2xs … --text-4xl`, `--text-display`, `--text-mega` |
| Space | `--space-1 … --space-10`, `--space-section`, `--gutter` |
| Radius | `--radius-xs 2` `--radius-sm 4` `--radius-md 8` `--radius-lg 14` `--radius-sheet` (section tops only) |
| Motion | `--ease-out` `--ease-ux` `--ease-fade` `--ease-pen` `--dur-1…4` |

Themes: `html[data-theme='dark']` = **Mực** (ink, default), `html[data-theme='light']` = **Giấy** (paper). Scene classes re-declare the same tokens locally: `.scene-ink`, `.scene-paper`, `.scene-red`. Old token names (`--bg-canvas`, `--ink-primary`, `--accent-primary`, `--ux-*` …) are aliases; never use them in new code.

## Type roles

- Display / headings: Fraunces, weight 380–560, tight tracking. Classes `.t-display`, `.t-mega` (uppercase, giant), `.t-title`, `.t-italic`.
- Flourished capital: `.t-script` (Imperial Script) for **one** initial or one short word per screen, never body text.
- Red-pen note: `.t-note` (Fraunces italic in `--red`), with `<Mark>` strokes.
- Interface: Manrope. Data, paths, counts, ids: `.t-label` (IBM Plex Mono, never tracked, never uppercase).
- `.t-caps` exists for rare uppercase labels; at most one per screen.

## Shared building blocks

- CSS (`src/styles/base.css`): `.wrap`, `.wrap-wide`, `.btn` + `.btn-solid | .btn-line | .btn-ghost | .btn-red` (+ `.btn-sm`, `.btn-lg`), `.icon-btn`, `.link`, `.field`, `.tag` (+ `.tag-red`, `.tag-green`), `.rule`, `.plate` (preview frame with crop marks), `.sheet`, `.sr-only`, `.no-scrollbar`.
- `src/ui/Mark.tsx` — `<Mark kind="underline|circle|box|strike">text</Mark>` hand-drawn red stroke, draws once in view (lucianLabs #392 values).
- `src/ui/Reveal.tsx` — in-view fade/translate (0.7s, `[0.25,0.1,0.25,1]`, once).
- `src/ui/ScrollFillText.tsx` — words fill from 0.2 to 1 opacity with scroll (`['start 0.8','end 0.2']`).
- `src/ui/Media.tsx` — `previewFor(itemId)` returns a real preview (70 of 121 catalogue items: PinUI clips, ThreeUI stills) or `null`; `<Media preview title />` lazy, plays only in view, falls back honestly. Items without a preview get a **typographic plate** (title set in Fraunces on `--bg-sunken`), never a stock or invented image.

## Rules (binding)

1. Tokens only. No raw hex/rgb, no `font-family` literals outside `tokens.css`.
2. A control is **icon-only or text-only**, never both. Text labels are 1–2 words. Icon-only controls carry `aria-label`. One icon set: `lucide-react`. No emoji.
3. No uniform card grids, no dense text lists, no card inside a card, no glass, no gradients, no glow blobs, no decorative status dots, no drop caps on every page.
4. About 80 words per screen. Vietnamese copy: short, calm, concrete. Keep product names: `F-Forum`, `Live View`, `Diff & Check`, `Workspace`, `Source of Knowledge`.
5. Real data only. Catalogue counts describe the reference library, never usage. No invented metrics, people, quotes, ratings. Missing data gets a truthful empty state.
6. Motion: `transform` and `opacity` only; never `transition: all`; every animation has a reduced-motion path (`useReducedMotion()` and the `html.reduce-motion` class). Springs: `stiffness 300, damping 30`.
7. Accessibility: semantic landmarks, visible `:focus-visible`, 44px touch targets, labels on fields, contrast AA.
8. Layout: verify 390 / 768 / 1440; no horizontal overflow; nav stays on one line.
9. Source files contain **no comments** (only required MIT attribution headers stay). No placeholders, no dead buttons.
10. Every existing store action and feature keeps working. Do not edit `src/store`, `src/services`, `src/types`, `server`, `api`, `src/styles`, `src/ui`; report needed changes instead.
11. New page CSS lives next to the view (`feature.css`, imported by the view), class-prefixed, tokens only, wrapped in `@layer components { … }`.

## Page concepts (each page has its own composition)

- **Landing** — a story in chapters; the scene shifts between paper, ink and red as the page turns.
- **Home** — the PinUI Prompt Composer on a quiet desk, then the library in motion: scroll-driven marquee of real previews, a filling paragraph, a white sheet of libraries, sticky stacking plates.
- **Explore — "Bàn soi" (light table)** — plates laid on a table, drifting ribbons per library, one specimen in focus; repos ranked as a drawn chart.
- **Workspace — "Bàn làm việc"** — short conversation rail, calm centre thread, one Diff & Check zone, a red **Live View** control that opens the running result.
- **Source of Knowledge — "Tòa soạn" (newsroom)** — a broadsheet front page: one lead question in large serif, answers as margin notes, accepted answers marked in red pen.
- **Profile — "Trang bìa" (title page)** — the member's name set like a book title, a colophon of real numbers, saved plates fanned out.
- **Settings** — one quiet sheet, five short groups, the only place the theme changes.

## QA

`node scripts/qa-shots.mjs /route --w=390,768,1440 --scroll=0,50%,100% --theme=light --out=/tmp/ff-qa/<name>` (dev server on :5173 is already running; prints overflow and console errors). `npx tsc --noEmit` must pass.
