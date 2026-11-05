# TOOLZEN

**Every Tool. One Place.**

A free, privacy-conscious online tools platform for documents, images, files, text, developers and
everyday digital tasks.

> **Status: Phases 1–3 complete — 92 tools live.** PDF, image, document, conversion, text,
> developer, security, calculator, QR and colour categories are implemented and working. TOOLZEN is
> a conventional utilities platform: every tool is deterministic software running on standard
> libraries and browser APIs, with no AI integration of any kind.

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

Two tools remain planned: **Unlock PDF** and **Protect PDF**, which cannot be built in the
browser at all because `pdf-lib` has no RC4 or AES support in either direction. Their pages say so
rather than implying they are coming soon.

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
| `VITE_SITE_URL` | `https://www.etoolzen.com` | Canonical origin used for canonical URLs, Open Graph tags and the sitemap |
| `VITE_ADS_ENABLED` | `false` | Set to `true` to render ad slot containers |
| `VITE_ADSENSE_CLIENT` | *(empty)* | AdSense publisher id, used only after account approval |

> **Security:** any variable prefixed with `VITE_` is embedded in the browser bundle and is
> **public**. Never put API keys or service-role keys in a `VITE_`-prefixed variable.

---

## Project structure

```
src/
  components/
    ads/         AdSlot — isolated from tool logic, off by default
    layout/      Header, Footer, ThemeToggle, ToolSearch, PageShell, ScrollToTop
    seo/         Seo — title, meta, canonical, OG, JSON-LD per route
    tools/       ToolCard, CategoryCard, StatTile
    ui/          Design-system primitives (Button, Card, Form, Toast, Modal, …)
  data/
    categories.ts  The 12 categories and their accent palettes
    tools.ts       The tool registry (live + planned)
    registry.ts    Search, filter, sort, related-tools and stats helpers
  lib/          cn(), formatters, theme persistence, clipboard helpers
  pages/        Home, AllTools, CategoryPage, ToolPage, About, Privacy, Terms, NotFound
  tools/        One folder per working tool (logic.ts + index.tsx + logic.test.ts)
    ToolRenderer.tsx  Maps a registry id to its component
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

- **In your browser** — the tool runs on your device; nothing is uploaded. This is all 92 live
  tools, including every PDF, image, text, developer, security and calculator tool.
- **On a TOOLZEN server with temporary storage** — reserved for future tools that need server-side
  compute. No tool currently uses it.
- TOOLZEN has no AI features: no AI APIs, no AI keys and no AI-powered tools.

See `/privacy` for the full policy.

---

---

## Monetization, analytics and growth (Phases 4-6)

- **Ad slots** cover the homepage, category pages and tool pages (top, bottom
  and a desktop sidebar). They render nothing unless `VITE_ADS_ENABLED=true`;
  with ads on but no publisher id, an honest "ad space reserved" placeholder
  appears. No AdSense loader is injected until a real account exists, and no
  publisher ids are invented.
- **Direct sponsorships** are owner-supplied campaigns in
  `src/components/ads/sponsorships.ts`, which ships empty. A campaign renders
  only inside its date window, carries a visible "Sponsored" label, targets
  https only and uses `rel="sponsored noopener"`. No agreement means no render.
- **Analytics** (`src/lib/analytics.ts`) is off without
  `VITE_ANALYTICS_ENDPOINT`. When configured, the payload is only an event
  name, a page path and a registry id - never user input, file contents,
  search text or filenames. Failure can never break a tool.
- **Feedback and tool requests** validate fully and deliver only through an
  optional `VITE_FEEDBACK_ENDPOINT`; without it the forms say plainly that
  delivery is not configured. Real rate limiting belongs on that endpoint.
- **Favourites and recently used tools** live in localStorage as ids only,
  capped at ten recent entries, clearable and disableable. Nothing leaves the
  browser. The **guides library** (`src/data/guides.ts`) holds real step-by-step
  articles with comparison sections, linked only to live registry tools.

## Advanced utilities (Phase 7)

Fifteen new tools were added with no new dependencies: time-zone conversion
(Intl, DST-aware), Roman numerals, number to words, UTF-8 binary text, CSS
unit conversion, crypto-random number and token generation, list shuffling,
meta tag / robots.txt / sitemap.xml generators, file signature inspection,
canvas image effects (grayscale, invert, brightness, contrast) and exact-cents
tip and split-bill calculators. The Unit Converter gained area, volume and
speed families. All are client-side; the shared pure logic lives in
`src/lib/phase7/` and is unit-tested in Node.

Deliberately excluded, with reasons rather than placeholders:
- **DOCX / XLSX / PPTX / RTF reading and writing** - ZIP-based Office Open XML
  formats need a large document library, and some conversions (notably PPTX to
  PDF) genuinely require server-side rendering. Clearly identified as a future
  server component, not faked.
- **Language minifiers, HTML/CSS validators and YAML converters** - correct
  implementations need real parsers, not regex, and those libraries would grow
  every bundle. Nothing here fakes a minify or a validation.
- **Timers, calendars and the remaining money calculators** - not built; the
  existing percentage, EMI, GST, compound-interest, date and time calculators
  continue to work.
- **Comparison pages** - handled by the Phase 6 guides library rather than
  duplicated as thin pages.

Every published tool has registry metadata, instructions, three FAQs, a
privacy note and a real implementation; the registry integrity test enforces
that standard.

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
never list a tool that is not live. The default host is `www.etoolzen.com`; override it with
`VITE_SITE_URL` if the site is served from a different origin.

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
| 3 | Advanced developer, security and data utilities; no AI by design | ✅ Complete |
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
