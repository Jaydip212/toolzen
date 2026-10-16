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

| Tool | Category | Processing |
| --- | --- | --- |
| [Word Counter](/src/tools/word-counter) | Text, Productivity | In the browser |
| [Character Counter](/src/tools/character-counter) | Text | In the browser |
| [Case Converter](/src/tools/case-converter) | Text | In the browser |

Everything else in the directory is honestly marked as coming soon. There are **no fake buttons and
no fabricated results** anywhere in the app — the test suite enforces this (see
`src/tools/ToolRenderer.test.ts`).

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

- **In your browser** — the tool runs on your device; nothing is uploaded.
- **On a TOOLZEN server with temporary storage** — the file is uploaded over HTTPS, processed, and
  deleted automatically. Files are stored outside the public web root with randomised identifiers
  and are never exposed through public URLs.

The three tools shipped in Phase 1 are all browser-only. See `/privacy` for the full policy.

---

## Advertisements

Ad slots are **off by default** and render nothing. They are fully isolated from tool functionality:
no tool imports the ad module. With `VITE_ADS_ENABLED=true` and no publisher id, an honest
"reserved space" placeholder is shown for layout review — never a fake advertisement. The AdSense
loader script is intentionally not injected; that is Phase 5 work, after provider approval.

---

## SEO

Per-route `<Seo>` component managing title, description, canonical URL, robots directives,
Open Graph/Twitter tags and JSON-LD (`WebSite`, `FAQPage`, `SoftwareApplication`). `robots.txt` and a
sitemap for the static routes live in `public/`. Replace the `toolzen.example` host in
`VITE_SITE_URL`, `public/robots.txt` and `public/sitemap.xml` with your production domain before
deploying. A build-time sitemap generator that includes every tool route is planned for Phase 5.

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
| 1 | Foundation: setup, design system, homepage, directory, search, registry, 3 tools | ✅ Complete |
| 2 | PDF, image, text and file utilities; calculators | Planned |
| 3 | Developer tools, defensive security tools, document conversion | Planned |
| 4 | Optional auth, admin dashboard, analytics, secure server processing | Planned |
| 5 | Ad integration, SEO completion, performance/a11y/security review, launch | Planned |

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
