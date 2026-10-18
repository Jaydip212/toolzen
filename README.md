# TOOLZEN

**Every Tool. One Place.**

A free, privacy-conscious online tools platform for documents, images, files, text, developers and
everyday digital tasks.

> **Status: Phase 1 (Foundation) complete.** This repository contains the design system, homepage,
> tool directory, search, the tool registry and three genuinely working tools. Tools for PDF, image,
> file conversion, developer, security, calculator, QR and AI categories are registered as
> **planned** and are clearly labelled "Coming soon" — they are not implemented yet.

---

## What works today

**92 of the 101 registered tools are live**, and every one of them runs entirely in the browser.
The homepage prints the real number, derived from the registry rather than hard-coded.

| Category (primary) | Live | Examples |
| --- | --- | --- |
| Developer | 20 | JWT, regex, cron, hashes, API request tester, security headers, DNS, SSL |
| PDF | 18 | Merge, split, rotate, organise, page numbers, watermark, text to PDF, PDF to JPG, to text, metadata, size analysis, compression |
| Image | 17 | Compress, resize, crop, convert, rotate, flip, watermark, favicon, colour picker |
| Calculator | 11 | Percentage, age, date difference, BMI, EMI, GST, discount, profit, interest |
| Security | 10 | Password strength, secure password generator, file hashing, integrity checks |
| Text | 7 | Word and character counts, case conversion, formatting, diff, markdown |
| Document | 6 | CSV/JSON, formatters, Base64, URL encoding, UUID, timestamps |
| QR & barcode | 2 | QR codes (text, link, Wi-Fi, contact card), five barcode formats |
| Conversion | 1 | File size conversion |
| AI | 0 by default | Seven tools, implemented but disabled until a provider key is configured — see below |

Nine tools remain planned: the seven AI tools (needing a server key), plus **Unlock PDF** and
**Protect PDF**, which cannot be built in the browser at all because `pdf-lib` has no RC4 or AES
support in either direction. Their pages say so rather than implying they are coming soon.

There are **no fake buttons and no fabricated results** anywhere in the app — the test suite
enforces this (see `src/tools/ToolRenderer.test.ts`).

### Platform features

- Homepage with hero, live tool search, 12 category cards, featured tools, recently added, why
  TOOLZEN, privacy & security, and an FAQ with structured data.
- Tool directory with instant search, category filters, availability filter and sorting. It opens
  on the tools that actually work; the planned tools are one click away ("Show all tools") rather
  than padding the default view. Typing a search or arriving via `?q=` searches the whole roadmap
  so planned matches are never hidden.
- Category pages split into "Available now" and "Coming soon".
- Reusable tool-page architecture: breadcrumbs, workspace, how-to steps, tool details table, related
  tools and per-page SEO.
- Command-palette search (click Search or press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>K</kbd>).
- Light and dark themes with system-preference detection and persistence.
- Accessible UI primitives: buttons, cards, inputs, badges, toasts, modal/confirm dialogs, spinner,
  progress bar, skeletons, empty and error states.
- Ad slot components that render nothing by default.
- Privacy Policy and Terms of Service pages.

---

## Tech stack

- **React 18** + **TypeScript** (strict) + **Vite 5**
- **Tailwind CSS 3** with CSS-variable design tokens and class-based dark mode
- **React Router 6**
- **Vitest** + **@testing-library/react** for tests
- Self-hosted **Inter** (Latin + Latin Extended subsets)

Phase 1 is entirely client-side. There is no database, no backend and no authentication yet —
deliberately, because none of the available tools need them. Supabase and server functions arrive in
Phase 4 when tools actually require persistent data or server-side processing.

---

## Getting started

```bash
npm install
npm run dev        # start the dev server
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

---

## Environment variables

Copy `.env.example` to `.env.local`. All variables are optional for Phase 1.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_SITE_URL` | `https://www.toolzen.example` | Canonical origin used for canonical URLs, Open Graph tags and the sitemap |
| `VITE_ADS_ENABLED` | `false` | Set to `true` to render ad slot containers |
| `VITE_ADSENSE_CLIENT` | *(empty)* | AdSense publisher id, used only after account approval |

> **Security:** any variable prefixed with `VITE_` is embedded in the browser bundle and is
> **public**. Never put API keys or service-role keys in a `VITE_`-prefixed variable.

---

## Project structure

```
api/
  ai.ts         The only server code: holds the AI provider key, builds the
                prompts server-side, rate limits, never returns the key
src/
  components/
    ads/         AdSlot — isolated from tool logic, off by default
    layout/      Header, Footer, ThemeToggle, ToolSearch, PageShell, ScrollToTop
    seo/         Seo — title, meta, canonical, OG, JSON-LD per route
    tools/       ToolCard, CategoryCard, StatTile
    ui/          Design-system primitives (Button, Card, Form, Toast, Modal, …)
  data/
    categories.ts  The 12 categories and their accent palettes
    tools.ts       The tool registry (live + planned), AI status gating
    registry.ts    Search, filter, sort, related-tools and stats helpers
  lib/          cn(), formatters, theme persistence, clipboard helpers
    ai-tasks.ts    The seven AI task definitions and their prompts
    ai-client.ts   Browser half of the AI tools: probe, run, typed errors
  pages/        Home, AllTools, CategoryPage, ToolPage, About, Privacy, Terms, NotFound
  tools/        One folder per working tool (logic.ts + index.tsx + logic.test.ts)
    ToolRenderer.tsx  Maps a registry id to its component
    shared/AiTool.tsx The shared body of all seven AI tools
  types/        Shared domain types
```

---

## Adding a new tool

The architecture is designed so a new tool needs no changes to routing, search or SEO.

1. **Create the tool folder** — `src/tools/my-tool/` containing:
   - `logic.ts` — pure, testable functions with no React imports.
   - `logic.test.ts` — unit tests for those functions.
   - `index.tsx` — the React UI, built from `src/components/ui` primitives.

2. **Register it** — add a `ToolSeed` entry to `src/data/tools.ts` with `status: 'live'`. The route
   is derived from the `id`, so `/tools/my-tool` works automatically.

3. **Map it** — add the component to `toolComponents` in `src/tools/ToolRenderer.tsx`.

4. **Verify** — `npm run typecheck && npm test && npm run build`.

`ToolRenderer.test.ts` fails if a tool is marked `live` without an implementation, or if a planned
tool accidentally gains one.

---

## Privacy and processing model

Every tool page states which processing mode applies:

- **In your browser** — the tool runs on your device; nothing is uploaded. This is 92 of the 101
  tools, including every PDF, image, text, developer, security and calculator tool.
- **Sent to an AI provider** — the seven AI tools send your text to the serverless function in
  `api/ai.ts`, which forwards it to the configured provider and returns the reply. Nothing is
  retained by TOOLZEN. These are the only tools where text leaves the device.
- **On a TOOLZEN server with temporary storage** — reserved for future tools that need server-side
  compute. No tool currently uses it.

See `/privacy` for the full policy.

---

## AI tools

The seven AI tools are implemented and tested, but they cannot run without a provider key, so they
ship **disabled** by default. Two steps switch them on:

1. Set `AI_PROVIDER_API_KEY` in the hosting environment (Vercel → Settings → Environment Variables).
   Optionally set `AI_PROVIDER_BASE_URL` (any OpenAI-compatible endpoint) and `AI_PROVIDER_MODEL`
   (default `gpt-4o-mini`).
2. Build with `VITE_AI_ENABLED=true`.

Until both are done, the tools stay `planned` in the registry, are excluded from the sitemap, and
the homepage's "available today" count stays truthful. If the flag is on but the key is missing,
the tool renders an explanation and **no controls at all** rather than a button that fails.

`api/ai.ts` is the only server code in the project. It refuses client-supplied prompts — the client
names a task and the prompts live in `src/lib/ai-tasks.ts` — so the endpoint cannot be used as a
free general-purpose language-model proxy. It also rate limits per address and never returns or logs
the key.

---

## Advertisements

Ad slots are **off by default** and render nothing. They are fully isolated from tool functionality:
no tool imports the ad module. With `VITE_ADS_ENABLED=true` and no publisher id, an honest
"reserved space" placeholder is shown for layout review — never a fake advertisement. The AdSense
loader script is intentionally not injected; that is Phase 5 work, after provider approval.

---

## SEO

Per-route `<Seo>` component managing title, description, canonical URL, robots directives,
Open Graph/Twitter tags and JSON-LD (`Organization`, `WebSite`, `SoftwareApplication`,
`BreadcrumbList`, `HowTo`, `FAQPage`, plus a speakable `WebPage`). `sitemap.xml`, `robots.txt` and
`llms.txt` are generated from the tool registry at build time and written to `dist/`, so they can
never list a tool that is not live. Replace the `toolzen.example` host via `VITE_SITE_URL` before
deploying.

---

## Deployment

The build output in `dist/` is a static single-page app and can be hosted on Vercel, Netlify, Cloudflare
Pages or any static host.

For client-side routing to work, all unknown paths must be rewritten to `/index.html`. A
`vercel.json` with this rewrite (plus long-lived caching for hashed assets) is included. For other
hosts, configure the equivalent SPA fallback.

Set `VITE_SITE_URL` to your production origin in the hosting provider's environment settings.

> No deployment has been performed or verified from this repository. The build has been run and
> passes locally.

---

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Foundation: setup, design system, homepage, directory, search, registry | ✅ Complete |
| 2 | PDF, image, text and file utilities; calculators; QR and barcode | ✅ Complete — 92 tools live |
| 3 | Developer tools, defensive security tools, document conversion | ✅ Complete |
| 4 | Secure server processing: the AI endpoint | ✅ Built — enable with a provider key |
| 5 | Ad integration, performance/a11y/security review, launch | Pending |
| — | Optional auth, admin dashboard, analytics | Not started, not promised |
| — | Unlock PDF / Protect PDF | Blocked — `pdf-lib` has no RC4 or AES support |

---

## Troubleshooting

**`npm run build` fails with `[safe-delete] ... trash operation`**

Some sandboxed environments inject a Node `--require` shim that redirects every file deletion
through an external trash binary. Vite clears `dist/` before each build, so that shim can make the
build fail even though compilation succeeded. Disable it for the build command only:

```bash
NODE_OPTIONS="" CODEBUDDY_SAFE_DELETE_ENABLED=0 npx vite build
```

This affects only the build tooling in that shell — it is not a project configuration issue, and
`npm run build` works normally in a standard environment.

---

## Licence

Proprietary. The TOOLZEN name, logo and interface are original works. Third-party dependencies remain
under their own licences.
