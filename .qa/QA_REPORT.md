# F-FORUM v3 — Full-Stack Visual & Functional QA Report

- **Project:** `f_forumv3` (`https://fforum3.vercel.app`)
- **Date:** `2026-11-28`
- **Test Environment:** Live local production server (`tsx server/index.ts` + `vite preview` serving `dist/`) + Live OpenRouter Gateway (`sk-***0899`) stored privately in Supabase RLS `ff_admin_config`
- **Viewports Verified:** Desktop `1440x900`, Tablet `768px`, Mobile `390x844`
- **Runtime Hygiene:** `0` console errors, `0` page errors, `0px` horizontal overflow across desktop & mobile routes, `0` secret hits in source/git history, `51 / 51` automated tests green.

---

## 1. Deterministic Verification & Live Flow Matrix

| Check | Result | Evidence |
| :--- | :---: | :--- |
| `npm run typecheck` (`tsc --noEmit`) | **PASS** | `0` TypeScript errors |
| `npm run build` (`tsc -b && vite build`) | **PASS** | `795` modules built cleanly |
| `npm test` (4 suites) | **PASS** | `51 / 51` passed (`core`, `security-pool`, `tier5-adversarial`, `vault-and-cleanup`) |
| Secret & public-release history scan | **PASS** | `0` secret hits (OpenRouter & Gemini keys stored exclusively in RLS-locked Supabase `ff_admin_config`) |
| **Flow 1:** OpenRouter Primary Gateway + 1-Click OpenRouter / Gemini Switch in Admin Panel | **PASS** | `GET /api/ai/quota` returns `activeProfile: "openrouter"`, `defaultModel: "openrouter/auto-smart"`, zero raw keys exposed; `POST /api/admin/key-pool/test` (`mode: "gateway"`) verified live (`ok: true`, `1967ms`, `106` tokens, masked `sk-***0899`); 1-click switch preserves both saved profiles |
| **Flow 2:** 2-in-1 F-Forum & GitHub AI Assistant (`intent: "assistant"`) | **PASS** | Answers accurately about F-Forum routes, 5,909 Vault libraries, and `broamstuck-cybr/f_forumv3` architecture with `files: []` (0 wasted code regen tokens) and returns clickable matched Vault cards (`Ghép mẫu`) |
| **Flow 3:** Token-Efficient Real Vault Stitching (`intent: "assemble"` + `src/engine/vaultStitcher.ts`) | **PASS** | Deterministic CSS-scoped Vault slot extraction (`src/vault-modules.css`) + compact JSON `assemblyPlan` (`2,282` total tokens, ~75% reduction vs raw full-file generation), `selectedSlots: ["slot-1", "slot-2"]`, incremental find/replace `patch` mode verified |
| **Flow 4:** Cost Guardrails & Auto Free/Budget Routing | **PASS** | Auto-detects OpenRouter free-tier (`HTTP 402` -> seamless `:free` failover `baidu/ernie-5.5-flash-preview:free` -> `nvidia/nemotron-3-ultra-550b-a55b:free` -> `openrouter/free`), upgrades automatically to `google/gemini-2.5-flash-lite` + `deepseek/deepseek-v3.2` when credits are funded; `15` turns/user/day, `45`/IP/day, `guestSandboxEnabled: false` |
| **Flow 5:** Responsive Desktop & Mobile UI (`1440/768/390px`), 15 Visual Demo Thumbnails & Live Production User E2E | **PASS** | Verified directly on `https://fforum3.vercel.app/workspace` (Assistant Q&A `4.6s`, Real Vault Build `9.7s`, Follow-up Patch `8.8s`, `0` console errors); redesigned `15 mẫu demo` drawer with 15 real crisp `720x450` WebP demo previews (`270 KB` total, `15/15` loaded, `0` broken images), single-row concise category filters, and 2-line compact card metadata |

---

## 2. 5-Axis Visual Evaluation

```json
{
  "axis_scores": {
    "above_the_fold_3s": 19,
    "spacing_alignment": 19,
    "contrast_vietnamese": 19,
    "edge_interaction_concentric": 19,
    "design_system_antislop": 19
  },
  "total_score": 95,
  "pass": true,
  "top_3_flaws": []
}
```

**VERDICT: PASS (95/100 · Release Ready)**
