# GEO & AI Search Readiness Analysis: F-Forum v3

Date audited: 2026-11-21
Target URL: `https://fforum3.vercel.app/` (live production deployment and verified `main` build)
Primary reference: Google Search Central AI Optimization Guide (`https://developers.google.com/search/docs/fundamentals/ai-optimization-guide`, May 2026 / updated July 2026).

Per Google's official guidance ("Using third-party SEO tools, services, and advice", June 2026), optimizing for generative AI search is optimizing for Search fundamentals. The heuristic readiness scores below are diagnostic estimates rather than Google-internal ranking signals.

## 1. GEO Readiness Score

- **Live production deployment (`https://fforum3.vercel.app/`) & verified `dist/` build:** **86/100** (heuristic composite across Citability 22/25, Structural Readability 19/20, Multi-Modal Content 13/15, Authority & Brand Signals 14/20, Technical Accessibility 18/20).
- **Live Infrastructure Status:** `https://fforum3.vercel.app/` serves semantic static SSR HTML inside `<div id="root">`, `robots.txt` (`text/plain; charset=utf-8`), `sitemap.xml` (`application/xml`, covering 6 routes including `/explore/experience`), `llms.txt` (`text/plain; charset=utf-8`), `og-cover.png` (`1200x630`), `@graph` JSON-LD (`dateModified: "2026-11-21"`), self-hosted `@fontsource` fonts, and ambient video assets.
- **Historical Comparison:** Prior to the v3 static SSR and metadata rollout, the baseline SPA scored 31/100 due to an empty `<div id="root"></div>` and broad SPA rewrites that shadowed `/robots.txt` and `/sitemap.xml`. Those issues are resolved in production.

## 2. Platform Breakdown (Qualitative: Not Tool-Measured)

No paid third-party rank-tracking or SERP-scraping API (such as DataForSEO or SE Ranking) was queried during this audit; therefore, no fabricated platform numerical scores are reported.

| Surface | Qualitative Readiness (Live Build) | Key Driver & Remaining Gap |
|---|---|---|
| **Google AI Overviews** | Ready technically; early domain authority | Indexed eligibility, canonical URL, clean Vietnamese metadata, static HTML content, and fast self-hosted fonts are live; classic Search ranking authority is still young on `.vercel.app`. |
| **Google AI Mode** | High structural fit | Front-loaded self-contained 58-word definition, verifiable 7-row catalog table (`8.322 chi tiết UI/UX`, `196 giao diện`, `83 mẫu chuyển động`, `122 kho GitHub`, `61 công cụ AI`), Q&A answers, and fresh `dateModified` (`2026-11-21`) support query fan-out retrieval; needs external primary citations. |
| **ChatGPT Search (`OAI-SearchBot`)** | High technical crawlability | `OAI-SearchBot` explicitly allowed in `public/robots.txt`, raw HTML inside `#root` readable without JS execution, and clear entity links via GitHub `sameAs`. External mentions (Reddit, YouTube, Wikipedia) are not yet established. |
| **Perplexity (`PerplexityBot`)** | High technical crawlability | `PerplexityBot` explicitly allowed in `public/robots.txt`; raw-HTML answer blocks and comparison table extract cleanly without JS rendering. Community discussion visibility outside GitHub remains the primary off-site gap. |

## 3. AI Crawler Access Status (Reported Separately by Capability)

`https://fforum3.vercel.app/robots.txt` serves `text/plain; charset=utf-8` with explicit per-bot rules. Search citability and model-training crawlers are evaluated strictly separately:

### Search Citability Crawlers

| User-Agent | Governed Capability | Status in `public/robots.txt` | Notes |
|---|---|---|---|
| `Googlebot` | Google Search, AI Overviews, and AI Mode inclusion | Allowed (`/`, disallows `/admin`, `/api/`) | Required baseline for Google Search & AI features (separate from Search Console's "Search generative AI" toggle). |
| `OAI-SearchBot` | ChatGPT Search citability | Allowed (`/`, disallows `/admin`, `/api/`) | Independent of `GPTBot`. |
| `Claude-SearchBot` | Claude search-result citability | Allowed (`/`, disallows `/admin`, `/api/`) | Independent of `ClaudeBot`. |
| `PerplexityBot` | Perplexity AI search indexing | Allowed (`/`, disallows `/admin`, `/api/`) | Not used for foundation-model training. |
| `Applebot` | Siri, Spotlight, and Safari search discoverability | Allowed (`/`, disallows `/admin`, `/api/`) | Independent of `Applebot-Extended`. |

### Model Training & Grounding Opt-In/Out Crawlers

| User-Agent | Governed Capability | Status in `public/robots.txt` | Notes |
|---|---|---|---|
| `GPTBot` | OpenAI model training only | Allowed (`/`, disallows `/admin`, `/api/`) | Does not govern ChatGPT Search; site owner may switch to `Disallow: /` on licensing preference without affecting ChatGPT Search. |
| `ClaudeBot` | Anthropic model training only | Allowed (`/`, disallows `/admin`, `/api/`) | Does not govern Claude search citability. |
| `Google-Extended` | Gemini/Vertex training & grounding | Allowed (`/`, disallows `/admin`, `/api/`) | Does not affect Google Search, AI Overviews, or AI Mode. |
| `Applebot-Extended` | Apple Intelligence training signal | Allowed (`/`, disallows `/admin`, `/api/`) | Labeling opt-out signal only; does not affect Safari/Spotlight/Siri search. |
| `CCBot` | Common Crawl dataset scraping | Disallowed (`/`) | Blocked by default to limit bulk scrape mirroring. |

## 4. `llms.txt` Status

- **Live `https://fforum3.vercel.app/llms.txt` & local `public/llms.txt`:** Present and served as `text/plain; charset=utf-8`, mapping all 6 public routes (`/`, `/home`, `/explore`, `/explore/experience`, `/workspace`, `/community`) and key verifiable figures (`195 người truy cập`, `196 giao diện`, `8.322 chi tiết UI/UX`, `122 kho GitHub tiếng Việt`, `61 công cụ AI`, `83 mẫu chuyển động`, `6 phép kiểm`, `15 lượt miễn phí`).
- **Weighting Note:** Carries **0 weight** in the GEO readiness score. Per Google's AI Optimization Guide (May 2026 / clarified June 2026), Google Search ignores `llms.txt`; it neither helps nor hurts rankings or citations. Included solely as an optional convenience map for non-Google LLM agents.

## 5. Brand Mention & Entity Authority Analysis

- **GitHub (Verified Present):** `broamstuck-cybr/f_forumv3`, `broamstuck-cybr/SOURCEOFKNOWLEDGFORAI`, `broamstuck-cybr/shoptify-winter-reverser-engine`, linked via `Organization.sameAs` and `SoftwareSourceCode.codeRepository`.
- **Wikipedia / Wikidata:** Absent (not yet notable for standalone encyclopedia coverage).
- **YouTube / Reddit / LinkedIn:** No verified public channel or external forum threads detected for `F-Forum v3`. Because brand mentions correlate 3x more strongly with third-party AI citations than backlinks (Ahrefs December 2025 study of 75,000 brands), publishing walkthrough demos and technical teardowns on YouTube and developer communities is the highest-leverage off-site priority.
- **Who / How / Why Check:** Authorship (`F-Forum`), MIT licensing, 6-check verification workflow (`Workspace -> Diff & Check -> Tri thức`), and free academic access (`0 VND`, 15 turns + BYOK) are stated plainly without promotional fluff or invented testimonials.

## 6. Passage-Level Citability

- **Front-loaded definition (first 30% of HTML):** `index.html` opens `<article>` with an `<h2>F-Forum là gì?</h2>` heading and a self-contained 58-word Vietnamese answer block naming target users (`học sinh, sinh viên, giảng viên cùng vibe coder Việt Nam`) and concrete figures (`196 giao diện`, `8.322 chi tiết UI/UX`, `6 phép kiểm Diff & Check`, publish loop to `Tri thức`).
- **Structured verifiable table:** Includes a 7-row HTML `<table>` detailing the 5 core libraries (`CodeFronts` 5.047, `ThreeUI` 961, `GetLayers` 966, `LucianLabs` 480, `MotionSites` 826, `PinUI` 42) alongside the `196 giao diện · 83 mẫu` and `122 kho · 61 công cụ` catalog counts.
- **Direct Q&A passages:** `FAQ_ITEMS` in `landingContent.ts` and the static `<article>` FAQ use natural query-matching headings and direct 40-65 word active-voice answers. Passage length is applied purely for human readability; Google's AI Optimization Guide confirms artificial chunking for AI is unnecessary.

## 7. Server-Side Rendering & Multi-Modal Accessibility Check

- **Static SSR Baseline inside `#root`:** `index.html` ships semantic static HTML (`<header>`, `<nav>`, `<main>`, `<article>`, `<h1>`..`<h3>`, `<table>`, `<ul>`) inside `<div id="root">`. React 19 `createRoot().render()` hydrates interactive views in browsers, while raw-HTML crawlers (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `GPTBot`) immediately read the full definition, data table, Q&A, and 6 route links without running JavaScript.
- **Multi-Modal & Performance Hygiene:** Self-hosted `@fontsource` fonts, route-level `React.lazy` splitting, deferred `jszip` dynamic import, `1200x630` Open Graph cover (`og-cover.png`), interactive `DotMatrixHandsCanvas`, ambient video assets with `prefers-reduced-motion` compliance, and single `<main>` landmark discipline across routes keep initial payload lean and accessible to browser agents.

## 8. Top 5 Highest-Impact Next Steps

1. **Verify domain in Google Search Console & submit `https://fforum3.vercel.app/sitemap.xml`**, confirming the "Search generative AI" control is set to Include and inspecting URL indexing for `/`, `/home`, `/explore`, `/explore/experience`, `/workspace`, and `/community`.
2. **Add build-time route prerendering (SSG) for `/explore`, `/explore/experience`, and `/community`** so individual catalog categories and public `Tri thức` discussions emit route-specific static HTML snapshots in `dist/`.
3. **Publish first-hand walkthrough videos and technical write-ups off-site** (YouTube teardowns of the 6-check `Diff & Check` loop and Vietnamese student/club guides on developer forums) to build external brand mentions.
4. **Attach a dedicated production domain** (replacing `.vercel.app` when ready for broader academic rollout), updating `canonical`, `sitemap.xml`, `robots.txt`, `llms.txt`, and `SITE_ORIGIN` in `src/App.tsx`.
5. **Maintain quarterly freshness cadence** on `index.html` (`dateModified`), `sitemap.xml` (`<lastmod>`), and `docs/ARCHITECTURE_AND_CRITIQUE.md` as new components and Vietnamese GitHub repositories join the catalog (pages updated within 90 days retain roughly 3x higher citation eligibility in third-party studies).

## 9. Schema Recommendations

Implemented in `index.html` via a single `@graph`:
- `Organization` (`F-Forum` with `sameAs` GitHub links)
- `WebSite` (`F-Forum`, `vi-VN`)
- `WebApplication` (`F-Forum v3`, `DeveloperApplication`, `0 VND` offer, `datePublished: "2026-11-18"`, `dateModified: "2026-11-21"`, `MIT` license, 5-item factual `featureList`)
- `SoftwareSourceCode` (`broamstuck-cybr/f_forumv3`)

Not implemented intentionally: `FAQPage` JSON-LD remains omitted per Google's rich-result restrictions for non-government/non-health sites, keeping Q&A in semantic HTML.

## 10. Content Reformatting & Anti-Slop Discipline

- All user-facing copy in `HomeView.tsx`, `landingContent.ts`, `index.html`, and `public/llms.txt` enforces active Vietnamese prose without AI buzzwords, passive voice, or Rule-of-Three filler, anchoring every claim to verifiable counts (`196 giao diện`, `8.322 chi tiết UI/UX`, `122 kho GitHub tiếng Việt`, `61 công cụ AI`, `83 mẫu chuyển động`, `6 phép kiểm`, `15 lượt miễn phí`).
- For `Explore` (`Bàn soi`) and `Workspace`, semantic `<button>` elements and single `<main>` landmarks remain locked so browser agents and Lighthouse Agentic Browsing checks navigate reliably.
