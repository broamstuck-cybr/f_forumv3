# F-Forum · The Proof Press

## Product and design audit

F-Forum is a Vietnamese workbench for developers and student teams: find a reference, turn a brief into a web project, inspect it in Live View and Diff & Check, then export or discuss it. React 19 and Vite run the app; the Express API and Vercel functions share server modules. Sessions, quotas, community posts and account projects use local JSON or optional Supabase. Browser storage backs guest projects and preferences. The AI gateway and request-scoped BYOK are optional integrations; this pass did not change their contracts or run a migration.

The requested workstation specification and screenshots were not present in this checkout. Discovery used `PRODUCT_SPEC.md`, implementation, and the simulator page's extracted lock-screen content. The external simulator's gestures could not be exercised; the existing in-repo simulator was retained and tested for mount. The plan deliberately does not treat these substitutes as having fulfilled the missing references.

| Baseline area | Score | Evidence and response |
|---|---:|---|
| Product strategy | 7 | Distinct reference-to-build workflow, obscured by competing landing narratives. Lead with the workbench. |
| UX & navigation | 5 | Documented `/app` and `/work` showed 404 on direct entry. Centralize route mapping, retain aliases. |
| Visual design | 5 | Heavy glass, multiple type treatments and animated stages compete with the work. Give the landing page a print layout and the application a quieter workshop palette. |
| Typography | 5 | The entry document requested many external families. Bundle Newsreader and Be Vietnam Pro, including Vietnamese subsets. Use a system mono stack. |
| Brand | 5 | Separate legacy landing and application palettes. Connect paper, ink and registration red with consistent rules and captions. |
| Interaction | 6 | Real Work controls and simulator, but too much motion on entry. Make the simulator opt-in, keep the landing static and maintain reduced-motion paths. |
| Responsive | 6 | Existing mobile panes, but direct-entry paths failed at every width. Retain task-specific panes and improve menu targets and Escape handling. |
| Functionality | 7 | Editing, preview, checks, export and project synchronization already existed. Fix route regression and preserve those workflows. |
| Architecture | 6 | Routes were eagerly loaded; API tests shared the live local runtime file. Split routes and ZIP export; isolate test data and await child teardown. |
| Performance | 5 | Large entry bundle and remote fonts. Defer route and simulator code; load local fonts and a single 96 KiB hero image. |
| Accessibility | 5 | Mixed menu roles and missing shared skip target. Use a disclosure with normal tab order, visible focus and an Escape return path. Full AA audit remains open. |
| Security | 6 | Existing authorization and sandbox tests are useful; the test teardown endangered local data. Isolate tests; no new authority or schema changes. This is not a penetration test. |
| SEO | 5 | One static title, public entry path mismatch. Add route titles, Open Graph basics and native landing links. Canonicals and SSR are not implemented. |

**Art direction:** An architectural proof sheet rather than a dashboard. Warm paper, dark ink, vermilion marks, wide rules, an asymmetric figure, a numbered index and restrained italic typography. The hero is an AI-generated illustration for this project, not a product screenshot or a third-party reference asset. Explore keeps its indexed catalogue, Source of Knowledge its threaded channels, Profile its personal ledger, and Work its editor and inspector. Their typography, finishes and entry headings were updated; those interiors were not rebuilt from scratch. The legacy landing section sequence was replaced rather than retained verbatim.

## Source coverage (100%)
- pinui      : used — [Prompt Composer item](https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/blob/3f5c676380dffbc4e916ab09be85cb0b4402165f/sources/pinui/registry/prompt-composer/ITEM.md); retained the existing attributed composer and its quick actions in Home.
- threeui    : skipped — Pocket Quest appears in the Heroes index; another demo-driven hero would compete with the existing device simulator. No catalogue source or paid implementation copied.
- motionsites: used — [Vectrus Energy free brief](https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/blob/3f5c676380dffbc4e916ab09be85cb0b4402165f/sources/motionsites/prompts/editorial/vectrus-energy.md); adapted the structural idea of one dominant visual and sequential sections, not its video, copy, code or scroll timing.
- lucianlabs : skipped — index entries 049 and 276 rely on pointer-led editorial reveals; important information here remains immediately available on touch and keyboard.
- codefronts : skipped — Navigation index was consulted; native links and the existing React disclosures addressed the route problem more directly.
- decision   : Use a native-scroll editorial entry and keep the functional composer and simulator behind clear user intent.

Read the archive contract, crawler map, source guide and all five indexes; opened two reference-item files. Also consulted the Shoptify study's `docs/02-design-system.md` for neutral surfaces and typographic role separation; no captured assets, fonts or proprietary code reused. Existing component attribution remains in `NOTICE.md` and `src/components/pinui/ATTRIBUTION.md`.

## Verification and acceptance

- **PASS:** `npm run build`, `npm run typecheck`, `npm run lint` (the repo's TypeScript-based check), `npm test` (20 passing tests), `git diff --check`.
- **PASS:** Chromium rendered nine route entries at each of 390, 768 and 1440 CSS px; document and shell scroll width matched every tested viewport. Captured key-route screenshots and visually sampled desktop landing and Explore, mobile landing and tablet Work. Shell width does not prove all embedded content is unclipped in every state.
- **PASS:** At 390 px with reduced motion, exercised keyboard skip focus, FAQ expansion, simulator mount/close, canonical navigation, menu Escape and focus return, sandboxed Live View, actual ZIP download and browser Back. No uncaught page errors in that journey.
- **PASS:** Core tests exercise quota limits, admin protection, scoped project persistence, sandbox markup and secret scanning. These are local tests, not production integration verification.
- **PASS:** Reference index coverage, item limit and preservation of existing attribution. No new usage metrics, testimonials or sample accounts introduced.
- **PARTIAL:** Route rendering and core journeys are verified; full touch/device testing, authenticated community journeys, live gateway and Supabase, all dialog states, and a complete contrast/screen-reader audit are not verified. Existing community seed records and catalogue content were not revalidated end-to-end.
- **PARTIAL:** Some existing external catalogue preview hosts fail in the sandbox; fallback/partial previews remain. The 404 no longer needs an external video. Build output measured primary JS at 548.70 kB minified / 160.38 kB gzip, down from 1,058.76 / 286.62 kB before route splitting in this pass. Vite still flags the primary chunk; no Lighthouse or Core Web Vitals claims.
- **PARTIAL:** The landing and 404 are rebuilt; application interiors share the updated tokens and navigation but retain legacy modules, styling and some icon-plus-text controls. The full redesign and production-readiness bar is not met.
- **FAIL (inputs unavailable):** Workstation-only specification and supplied screenshots could not be read. External simulator was available as extracted page text, not a tested interactive reference.

The biggest remaining risk is in legacy interior flows rather than the landing: the catalogue depends on remote previews, and authenticated workflows need deployment-like coverage. Preserve the routing and storage fixes when deepening those areas.

## Run locally

Use Node 22 and `npm ci`, then `npm run dev`. Open the Vite web address (port 5173); `/api` is proxied to Express on port 8787. `npm run build` creates the production frontend. Keep server-only configuration in local `.env` or the hosting environment, using `.env.example` and `DEPLOYMENT_VERCEL.md` as guides. No credentials are required for the local guest preview. Configure the AI provider and durable storage before validating production generation and account data. Nothing was deployed by this pass.

## Budget

Single-agent execution; no delegated API calls. This environment does not expose requested model routing, token billing, provider price telemetry or an enforced spend cap. Dollar usage and remaining balance cannot be credibly estimated from the available data. Work was bounded to targeted archive reads, one hero generation, a viewport matrix and a focused journey check. The $20 target was not a verified billing limit.
