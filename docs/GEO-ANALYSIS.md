# GEO & AI Search Readiness Analysis — F-Forum v3

Date audited: 2026-11-20
Target URL: `https://fforum3.vercel.app/` (local verified candidate build from `f_forumv3` `main`)
Primary reference: Google Search Central AI Optimization Guide (`https://developers.google.com/search/docs/fundamentals/ai-optimization-guide`, May 2026 / updated July 2026).

Per Google's official guidance ("Using third-party SEO tools, services, and advice", June 2026), optimizing for generative AI search is optimizing for Search fundamentals, and the heuristic readiness scores below are diagnostic estimates rather than Google-internal ranking signals.

## 1. GEO Readiness Score

- **Baseline on live `https://fforum3.vercel.app/` (stale build `index-DcAzWVeI.js`):** **31/100** (empty JS-only `<div id="root">`, `/robots.txt` and `/sitemap.xml` rewritten to HTML `index.html`, zero JSON-LD, zero Open Graph/canonical, 9 render-blocking external Google Fonts).
- **Updated local production build (`dist/` after this pass):** **82/100** (heuristic composite across Citability 21/25, Structural Readability 18/20, Multi-Modal Content 12/15, Authority & Brand Signals 13/20, Technical Accessibility 18/20).
- **Deployment Caveat:** The improved 82/100 build is verified locally in `dist/` and committed to GitHub, but **`https://fforum3.vercel.app/` will remain at 31/100 until deployed under the Vercel account owning `team_vcd9RtqsoY9b7YJXl2qw3wvv` / `prj_oxUgzhjHTVbCoWnZVxIoE1UlVB8S`**.

## 2. Platform Breakdown (Qualitative — Not Tool-Measured)

No paid third-party rank-tracking or SERP-scraping API (such as DataForSEO or SE Ranking) was queried during this audit; therefore, no fabricated platform numerical scores are reported.

| Surface | Qualitative Readiness (Local Build) | Key Driver & Remaining Gap |
|---|---|---|
| **Google AI Overviews** | Ready technically; early domain authority | Indexed eligibility, canonical URL, clean Vietnamese metadata, static HTML content, and fast self-hosted fonts are in place; classic Search ranking authority is still nascent on `.vercel.app`. |
| **Google AI Mode** | Moderate-high structural fit | Front-loaded self-contained definition, verifiable 5-library data table, Q&A answers, and recent `dateModified` (`2026-11-20`) support fan-out retrieval; needs external primary citations. |
| **ChatGPT Search (`OAI-SearchBot`)** | High technical crawlability | `OAI-SearchBot` explicitly allowed in `public/robots.txt`, raw HTML inside `#root` readable without JS execution, and clear entity links via GitHub `sameAs`. External mentions (Reddit, YouTube, Wikipedia) are currently absent. |
| **Perplexity (`PerplexityBot`)** | High technical crawlability | `PerplexityBot` explicitly allowed in `public/robots.txt` and raw-HTML answer blocks + comparison table extract cleanly without JS rendering. Community discussion visibility outside GitHub is not yet established. |

## 3. AI Crawler Access Status (Reported Separately by Capability)

Before this pass, `https://fforum3.vercel.app/robots.txt` returned `index.html` (`text/html`) due to a missing `robots.txt` and an overly broad SPA rewrite in `vercel.json`. The updated `public/robots.txt` and fixed `vercel.json` rewrite now serve `text/plain; charset=utf-8` with explicit rules. Search citability and model-training crawlers are evaluated strictly separately:

### Search Citability Crawlers

| User-Agent | Governed Capability | Status in Updated `public/robots.txt` | Notes |
|---|---|---|---|
| `Googlebot` | Google Search, AI Overviews, and AI Mode inclusion | Allowed (`/`, disallows `/admin`, `/api/`) | Required baseline for Google Search & AI features (separate from Search Console's "Search generative AI" toggle). |
| `OAI-SearchBot` | ChatGPT Search citability | Allowed (`/`, disallows `/admin`, `/api/`) | Independent of `GPTBot`. |
| `Claude-SearchBot` | Claude search-result citability | Allowed (`/`, disallows `/admin`, `/api/`) | Independent of `ClaudeBot`. |
| `PerplexityBot` | Perplexity AI search indexing | Allowed (`/`, disallows `/admin`, `/api/`) | Not used for foundation-model training. |
| `Applebot` | Siri, Spotlight, and Safari search discoverability | Allowed (`/`, disallows `/admin`, `/api/`) | Independent of `Applebot-Extended`. |

### Model Training & Grounding Opt-In/Out Crawlers

| User-Agent | Governed Capability | Status in Updated `public/robots.txt` | Notes |
|---|---|---|---|
| `GPTBot` | OpenAI model training only | Allowed (`/`, disallows `/admin`, `/api/`) | Does not govern ChatGPT Search; site owner may switch to `Disallow: /` on licensing preference without affecting ChatGPT Search. |
| `ClaudeBot` | Anthropic model training only | Allowed (`/`, disallows `/admin`, `/api/`) | Does not govern Claude search citability. |
| `Google-Extended` | Gemini/Vertex training & grounding | Allowed (`/`, disallows `/admin`, `/api/`) | Does not affect Google Search, AI Overviews, or AI Mode. |
| `Applebot-Extended` | Apple Intelligence training signal | Allowed (`/`, disallows `/admin`, `/api/`) | Labeling opt-out signal only; does not affect Safari/Spotlight/Siri search. |
| `CCBot` | Common Crawl dataset scraping | Disallowed (`/`) | Blocked by default to limit bulk scrape mirroring. |

## 4. `llms.txt` Status

- **Live `fforum3.vercel.app`:** Missing (rewritten to `index.html`).
- **Local production build:** Present at `public/llms.txt` (emitted to `dist/llms.txt`, served as `text/plain; charset=utf-8`), mapping all 5 public sections and key verifiable repository facts.
- **Weighting Note:** Carries **0 weight** in the GEO readiness score. Per Google's AI Optimization Guide (May 2026 / clarified June 2026), Google Search ignores `llms.txt`; it neither helps nor hurts rankings or citations. Included solely as an optional convenience map for non-Google LLM agents.

## 5. Brand Mention & Entity Authority Analysis

- **GitHub (Verified Present):** `broamstuck-cybr/f_forumv3`, `broamstuck-cybr/SOURCEOFKNOWLEDGFORAI`, `broamstuck-cybr/shoptify-winter-reverser-engine`, linked via `Organization.sameAs` and `SoftwareSourceCode.codeRepository`.
- **Wikipedia / Wikidata:** Absent (not yet notable for standalone encyclopedia coverage).
- **YouTube / Reddit / LinkedIn:** No verified public channel or community discussions detected for `F-Forum v3`. Because brand mentions correlate strongly with third-party AI citations (Ahrefs December 2025 study), publishing genuine walkthrough demos and technical teardowns on YouTube/dev forums is the main off-site growth lever.
- **Who / How / Why Check:** Authorship (`F-Forum`), MIT licensing, 6-layer verification workflow, and free academic mission (`0 VND`, 15 turns + BYOK) are stated plainly without commodity filler or invented testimonials.

## 6. Passage-Level Citability

- **Front-loaded definition (first 30% of HTML):** Added a concise, self-contained 55-word `"F-Forum là gì?"` answer block directly inside `<article>` in `index.html` and mirrored on the Landing Hero (`LandingHero.tsx`), naming target users (students, teachers, vibe coders, web designers) and verifiable capabilities (`Live View` sandbox, `Diff & Check` 6 layers, 6,770 components).
- **Structured verifiable table:** Included an HTML `<table>` comparing all 5 libraries in `SOURCEOFKNOWLEDGFORAI` (`CodeFronts` 5,047, `ThreeUI` 961, `LucianLabs` 400, `MotionSites` 321, `PinUI` 41) with exact counts and licenses.
- **Direct Q&A passages:** Reframed `FAQ_ITEMS` with natural query-matching headings (`F-Forum là gì và phù hợp với đối tượng nào?`, `Live View và Diff & Check kiểm định mã nguồn như thế nào?`, etc.) and factual 40-60 word answers. Note: passage length is applied purely for human readability; Google's AI Optimization Guide explicitly states artificial "chunking" for AI is unnecessary.

## 7. Server-Side Rendering & JavaScript Accessibility Check

- **Before:** Vite SPA shipped an empty `<div id="root"></div>`, making the entire site blank to raw-HTML fetchers (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `GPTBot`) that do not execute JavaScript.
- **After:** `index.html` now ships semantic static HTML (`<header>`, `<nav>`, `<main>`, `<article>`, `<h1>`..`<h3>`, `<table>`, `<ul>`) inside `<div id="root">`. React 19 `createRoot().render()` cleanly replaces it on interactive browsers, while raw-HTML AI crawlers and no-JS agents immediately read the full definition, data table, Q&A, and route links.
- **Performance (`/boost`):** Removed the render-blocking 9-family Google Fonts stylesheet from `index.html` (all 4 active typefaces are self-hosted via `@fontsource` in `src/main.tsx`), added immutable caching for `/assets/*` in `vercel.json`, and fixed nested `<main>` landmarks across routes so every view exposes exactly one `<main>` landmark.

## 8. Top 5 Highest-Impact Changes

1. **Deploy the verified build to `https://fforum3.vercel.app/`** (re-link or trigger production deploy under Vercel team `team_vcd9RtqsoY9b7YJXl2qw3wvv`, project `prj_oxUgzhjHTVbCoWnZVxIoE1UlVB8S`) so live traffic receives the new bundle, `robots.txt`, `sitemap.xml`, `og-cover.png`, and JSON-LD.
2. **Verify domain in Google Search Console & submit `https://fforum3.vercel.app/sitemap.xml`**, confirming the "Search generative AI" control is set to Include and inspecting URL indexing for `/`, `/explore`, `/workspace`, and `/community`.
3. **Add route-level static prerendering (SSG) for `/explore` and `/community`** in a future build step so individual catalog libraries and public `Source of Knowledge` Q&A threads render unique static HTML per URL without requiring JS.
4. **Publish first-hand technical artifacts off-site** (e.g., walkthrough videos of the `Diff & Check` workflow on YouTube and architecture notes on developer forums) to earn authentic brand mentions and primary citations.
5. **Attach a custom production domain** (replacing `.vercel.app`) once ready for public launch, updating `canonical`, `sitemap.xml`, `robots.txt`, `llms.txt`, and `SITE_ORIGIN` in `src/App.tsx`.

## 9. Schema Recommendations

Implemented in `index.html` via a single clean `@graph`:
- `Organization` (`F-Forum` with `sameAs` GitHub links)
- `WebSite` (`F-Forum`, `vi-VN`)
- `WebApplication` (`F-Forum v3`, `DeveloperApplication`, `0 VND` offer, `datePublished`, `dateModified`, `MIT` license, factual `featureList`)
- `SoftwareSourceCode` (`broamstuck-cybr/f_forumv3`)

Not implemented intentionally: `FAQPage` JSON-LD was omitted per Google's current rich-result restrictions for non-government/non-health sites, keeping Q&A in clean semantic HTML instead.

## 10. Content Reformatting Suggestions

- Keep `LandingPricing` and `HomeView` free of promotional superlatives; anchor every capability claim to concrete artifacts (`6 phép kiểm`, `sandbox="allow-scripts"`, `6.770 thành phần`, `15 lượt miễn phí + BYOK`).
- When adding new `Source of Knowledge` articles or `SOURCEOFKNOWLEDGFORAI` updates, record real update dates and link directly to upstream MIT repositories to preserve freshness signals (pages updated within 3 months are significantly more likely to remain citation-eligible).
- For `Explore` (`Bàn soi`) and `Workspace`, maintain semantic `<button>` and landmark roles with single-word/two-word accessible labels so browser agents and Lighthouse Agentic Browsing checks can navigate reliably.
