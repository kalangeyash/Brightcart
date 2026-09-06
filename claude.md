# CLAUDE.md — Brightcart Support Desk

Internal ticket-management tool for Brightcart. Two roles, sixteen users, desktop-first web app. This repo builds the **Support Lead (Manoj)** side.

Read this file fully before writing code. Where it conflicts with a habit or a default, this file wins.

---

## 1 · What this product is, in one paragraph

Fourteen support agents and two leads currently run 2,500 queries a month out of a shared Gmail inbox with colour labels and a hand-updated spreadsheet. Nobody owns a query, replies get duplicated, and the lead cannot see who is overloaded or which tickets are about to breach the promised 24-hour response. This tool replaces that. Success is measured three ways and only three ways: **no query unowned for more than 30 minutes · first response inside 24 hours · Monday reporting takes minutes, not hours.** Every screen should be defensible against one of those.

The person using this all day is Manoj, a support lead, on a 1440px desktop, for eight hours. Not a visitor. Not a buyer. Design for the eighth hour.

---

## 2 · Source-of-truth documents

Read these before implementing a screen. They live in the project alongside this file.

| Document | Use it for | Authority |
|---|---|---|
| `01-feature-list-manoj.md` | Screen inventory, data points, actions, modals, MoSCoW, assumptions register | **Absolute.** Do not invent screens or fields. |
| `03-screen-specs.md` | Layout, real seed values, states, microcopy for the two built screens | **Absolute** for those two screens. |
| `02-workflows-manoj.md` | What connects to what, and why the lead's intervention points exist | High |
| `design.md` | Brand tokens — colour, type, radius, shadow philosophy, motion | High, **as adapted in §5** |

**Precedence when they disagree:** feature list → screen specs → this file's §5 → brand analysis → your judgement. If a conflict is real rather than a wording gap, stop and surface it instead of picking one quietly.

---

## 3 · Stack

```
React 19 · TypeScript (strict) · Vite
Tailwind CSS v4 (CSS-first @theme, no tailwind.config.js)
shadcn/ui (new-york style, neutral base, then re-themed per §5)
react-router-dom v7    routing
@tanstack/react-query  server state
msw v2                 mock API (see §7)
recharts               charts, via shadcn/ui chart
lucide-react           icons — the only icon source
date-fns               dates and durations
vitest + @testing-library/react
```

### Commands

```bash
pnpm dev            # Vite + MSW worker
pnpm build          # tsc -b && vite build
pnpm lint           # eslint, zero warnings allowed
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest
pnpm ui:add <name>  # shadcn CLI, e.g. pnpm ui:add data-table
```

`pnpm typecheck && pnpm lint` must both pass before a change is considered done.

---

## 4 · Project structure

```
src/
  app/
    router.tsx            route table, one route per feature-list section
    providers.tsx         QueryClient, Router, Toaster
    layout/
      LeadShell.tsx       feature list row 4 — nav, search, notifications, sync state
      SyncBanner.tsx      row 25 — persistent sync failure banner
  features/
    team-overview/        row 6, 7   ← built
    reports/              rows 15, 16 ← built
    unassigned/           rows 8, 9   (specced, not built)
    tickets/              rows 10–13  (specced, not built)
    settings/             rows 17–22  (specced, not built)
  components/
    ui/                   shadcn primitives — generated, minimally edited
    SlaChip.tsx           the urgency chip; the single most reused piece
    PriorityChip.tsx
    StatusChip.tsx
    LoadBar.tsx           workload bar, relative to team median
    AttentionRail.tsx     the 3px left rail (see §5, signature detail)
    PageHeader.tsx
    DataTable.tsx         dense table wrapper over shadcn table
    states/
      LoadingRows.tsx  EmptyState.tsx  ErrorState.tsx
  lib/
    sla.ts                all SLA maths — one place, nowhere else
    format.ts             numbers, durations, relative times
    utils.ts              cn()
  mocks/
    browser.ts  handlers/  seed/
  types/
    domain.ts             Ticket, Agent, SlaState, Report…
  styles/
    index.css             @theme tokens (§5)
```

**One rule about structure:** a feature folder owns its screen, its hooks, and its screen-specific components. Nothing crosses between feature folders — shared things move up to `components/`.

### Required file header

Every screen component starts with a traceability comment. This is not ceremony; it is the thing that stops the codebase drifting away from what the client signed off.

```tsx
// Feature list row 6 · Team Overview · lead landing screen
// Traces to: Manoj — "i cannot see who has 40 mails and who has 5"
// Serves: no query unowned > 30 min · first response < 24h
```

---

## 5 · Design system

### 5.1 The one decision to understand first

Brightcart's brand kit describes a **storefront**: photography-first, museum-gallery calm, 80px tile padding, 17px body copy, four things on screen. That is correct for the shop and wrong for this product — it is exactly the "marketing-page spacing on a work tool" failure. This tool wears the same brand at a different volume.

Concretely, the brand hierarchy is **inverted** here, and it is a deliberate choice you should be able to defend:

| | Storefront | Support Desk |
|---|---|---|
| **Ember Amber `#C1691B`** | primary CTA, every "click me" | **urgency only** — SLA chips, breach tile, attention rail. Never a button fill, never a nav item, never a chart colour for a neutral metric. |
| **Deep Pine `#1F4D3D`** | secondary action | **primary interactive** — primary buttons, links, focus rings, selected states |

The reason: the brand kit says the accent carries every interactive element; the Day 6 rule says the accent has exactly one job, urgency. Both cannot be true on the same screen. Amber is the better urgency colour of the two, and a support tool needs urgency to mean one thing more than it needs its buttons to match the shop. Pine at 9.7:1 on white is also the stronger button colour.

### 5.2 Tokens

`src/styles/index.css`:

```css
@import "tailwindcss";

@theme {
  /* Surfaces — brand neutrals, unchanged */
  --color-canvas:        #ffffff;
  --color-parchment:     #f5f5f7;   /* page background */
  --color-pearl:         #fafafc;   /* zebra rows, inset panels */
  --color-hairline:      #e0e0e0;   /* table dividers, card borders */
  --color-control-line:  #8e8e93;   /* input & control borders — 3.26:1, the accessible one */

  /* Text */
  --color-ink:           #1d1d1f;   /* all primary text */
  --color-ink-muted:     #6e6e73;   /* secondary text — 5.07:1. NOT the brand's #7a7a7a (4.29:1, fails) */
  --color-ink-faint:     #7a7a7a;   /* fine print only, never body */
  --color-on-dark:       #ffffff;

  /* Interactive — Deep Pine */
  --color-primary:       #1f4d3d;
  --color-primary-hover: #296352;
  --color-primary-ring:  #296352;
  --color-primary-soft:  #e7f0eb;

  /* Urgency — Ember Amber. One job. */
  --color-urgent:        #c1691b;   /* fills, bars, icons, 3px rails — NOT small text */
  --color-urgent-ink:    #8a4a12;   /* amber text — 6.8:1 on white */
  --color-urgent-soft:   #fbf0e4;   /* chip background */

  /* Breached / destructive */
  --color-danger:        #9b2c1f;
  --color-danger-soft:   #fbeae7;

  /* Resolved / on track — reuses Pine so no third accent enters the system */
  --color-good:          #1f4d3d;
  --color-good-soft:     #e7f0eb;

  /* Radius — one value, plus the pill */
  --radius-control: 8px;
  --radius-pill: 9999px;

  /* The only shadow in the product */
  --shadow-overlay: 0 8px 32px rgba(29, 29, 31, 0.16);
}
```

**Semantic colours.** The brand kit forbids a third accent, and that holds — success is Pine, warning is Amber, info is neutral grey rather than a new blue. The one deliberate exception is `--color-danger`: red for breached and for destructive actions. Green-for-danger is not creative, it is a bug, and a support tool with no red is a support tool where nothing looks broken.

**Colour is never the only signal.** Every SLA chip carries the words as well as the colour — "52 min left", "Breached 1h ago" — plus a Lucide icon. Roughly 1 in 12 men will not separate the amber chip from the red one.

### 5.3 Type

Inter, loaded as a variable font, with the disambiguation sets on. This is a typeface choice with a reason: the product is ticket IDs and order numbers all day, and `1 / l / I` and `0 / O` cannot be ambiguous.

```css
body {
  font-family: "Inter var", Inter, system-ui, sans-serif;
  font-feature-settings: "cv05" 1, "zero" 1;  /* tailed l, slashed zero */
}
.tabular { font-variant-numeric: tabular-nums; }
```

`.tabular` is mandatory on every numeric table column, every ID, every counter, every figure on the report.

Scale — Day 6 values, **not** the storefront's 17px body. Body at 14px is the whole density argument.

| Style | Size / weight / leading | Tailwind |
|---|---|---|
| H1 page title | 32 · 700 · 1.2 · tracking −0.4px | `text-[32px] font-bold leading-[1.2] tracking-[-0.4px]` |
| H2 section | 24 · 700 · 1.25 | |
| H3 | 20 · 600 · 1.3 | |
| H4 ticket subject | 18 · 600 · 1.35 | |
| Body | **14 · 400 · 1.5** | default |
| Body S | 12 · 400 · 1.5 | |
| Caption | 12 · 400 · 1.4 | `Ritika Sharma · #BC-4821 · 08:12` |
| Label | 12 · 500 · 1.3 · uppercase | two-word labels only, e.g. `PRIORITY` |
| Button | 14 · 600 | |
| Metric | 28 · 600 · tabular | report headline figures |

Sentence case everywhere. ALL CAPS is the Label style and nothing else — never a sentence, never an eyebrow above a heading. Negative tracking on H1/H2 only, carried over from the brand's display feel.

The middle-dot caption (`name · id · time`) is a specified brand pattern. Use it in the Caption style where it genuinely joins metadata. Do not spread it into headings or labels as decoration.

### 5.4 Space and density

Scale: `4 · 8 · 12 · 16 · 24 · 32 · 48`. Nothing off this list. The storefront's 80px section padding does not exist in this product.

Density targets, and they are requirements rather than preferences:

- **All 14 agents visible without scrolling** on Team Overview at 1440×900.
- Table rows **40px**, header 36px, cell padding `8px 12px`.
- Page gutter 24px. Card padding 16px. Gap between panels 16px.
- Status tiles are compact strips across the top, not four large cards down the fold.

If a layout can only fit nine agents, it is wrong. Density is the design decision here; it is not a default to inherit from a component library.

### 5.5 Shape, depth, motion

- **One radius: 8px** on buttons, inputs, cards, panels. This is the brand's utility grammar (`rounded.sm`), which is the correct half of the brand for an internal tool.
- **Pill radius only on chips** — SLA, status, priority, filter chips. The storefront's pill buttons stay in the storefront.
- **No shadows** on cards, buttons, tables, chips, or text. The brand allows exactly one shadow and it is for product photography, which does not exist here. `--shadow-overlay` is a reasoned addition for one purpose only: dialogs, sheets and popovers, where layering has to be legible.
- **No gradients anywhere.**
- **Motion:** `transform: scale(0.97)` on button press — the brand's signature micro-interaction, kept. Beyond that, motion only answers a user action: a sheet opening, a row confirming. No entrance animations, no hover lifts, no staggered reveals. Respect `prefers-reduced-motion`.

### 5.6 The signature detail

**A 3px left rail on any row that needs the lead's attention.** Amber for breach risk, red for breached, nothing otherwise. Same component, same meaning, on the breach list, the workload table, the unassigned queue and the report drill-downs. It reads from across a desk, which is how a lead actually uses this screen.

Implemented once, in `AttentionRail.tsx`. It never carries a third meaning.

### 5.7 Icons

`lucide-react`, stroke 2, 16px, aligned to the text baseline. One family, no exceptions, never emoji. Icon **plus** label for anything that matters — icon-only is acceptable for search and close and almost nothing else.

### 5.8 shadcn/ui usage

Generate primitives with the CLI, then re-theme via the CSS variables above rather than editing component internals — the diff should stay small enough to re-run the CLI later.

Expected set: `button · input · table · badge · card · tabs · select · dialog · sheet · dropdown-menu · tooltip · skeleton · separator · avatar · popover · sonner · chart`.

Three overrides to apply globally after generation:

1. **Sizing.** Default shadcn is comfortable, not dense. Button `h-8`, input `h-8`, table cells `py-2 px-3`.
2. **Radius.** `--radius: 8px`. Do not use shadcn's 0.5rem/0.75rem/1rem ladder.
3. **Shadow.** Strip `shadow-sm` from card, button, badge and table. Keep it only on dialog, sheet and popover, mapped to `--shadow-overlay`.

`Badge` is not the chip. Build `SlaChip`, `StatusChip` and `PriorityChip` as separate components — they carry an icon, words and a colour together, and that contract should not be one variant prop away from being broken.

---

## 6 · Domain model

`src/types/domain.ts`. Keep these exact — the mock API and the UI both depend on them.

```ts
export type TicketStatus = "new" | "in_progress" | "waiting_on_customer" | "resolved" | "closed";
export type Priority = "urgent" | "high" | "normal";
export type AgentStatus = "active" | "on_leave" | "offline";

/** Derived by the platform, never stored. All maths lives in lib/sla.ts. */
export type SlaState =
  | { kind: "on_track"; msRemaining: number }
  | { kind: "due_soon"; msRemaining: number }   // < 2h
  | { kind: "breached"; msSince: number };

export interface Ticket {
  id: string;              // "#BC-4821" — ASSUMED format, see assumptions register A1
  orderId: string | null;  // "ORD-98213" — ASSUMED format, A2
  customerName: string;
  customerEmail: string;
  subject: string;
  category: "refund" | "delivery" | "order_change" | "other";  // ASSUMED, A4
  status: TicketStatus;
  priority: Priority;
  ownerId: string | null;  // null === unowned
  createdAt: string;       // ISO
  firstResponseAt: string | null;
  lastActivityAt: string;
  replyCount: number;
  distinctRepliers: number; // the duplicate-reply signal
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: "agent" | "lead";
  status: AgentStatus;
  leaveUntil: string | null;
}
```

**Rules.**
- `ownerId: null` is the single source of truth for "unowned". Never a separate boolean.
- SLA state is **always derived** from `createdAt` + the 24-hour policy in `lib/sla.ts`. Never stored, never computed inline in a component, never duplicated in the mock server.
- The 24-hour clock currently runs continuously. Whether it should pause outside business hours is **assumption A3, unresolved** — it changes every breach figure in the report. `lib/sla.ts` takes a policy object so the answer is one config change, not a rewrite.

---

## 7 · Mock data server

MSW v2, browser worker, started in `main.tsx` when `import.meta.env.DEV`.

```
src/mocks/
  browser.ts
  handlers/
    agents.ts  tickets.ts  overview.ts  reports.ts
  seed/
    agents.ts     14 agents + 2 leads, real names, fixed
    tickets.ts    147 open — 138 assigned, 9 unowned
    reports.ts    week of 1–7 Sep 2026
```

### Endpoints

| Method | Path | Returns |
|---|---|---|
| GET | `/api/overview` | tiles, breach-risk top 5, workload rows for 14 agents |
| GET | `/api/agents` | agent list with derived open counts |
| GET | `/api/tickets` | filterable, paginated |
| GET | `/api/tickets/:id` | ticket + thread + activity |
| POST | `/api/tickets/:id/assign` | `{ ownerId }` → updated ticket |
| POST | `/api/tickets/:id/priority` | `{ priority }` |
| GET | `/api/reports/weekly?from&to` | headline figures, distribution, breach reasons, per-agent |
| GET | `/api/sync/status` | last sync, health |

### Seed data rules

**No faker, no lorem, no `user1@example.com`.** The Day 4 rule — real example values, never placeholders — applies to seed data more than anywhere else, because seed data is what everyone actually looks at. The numbers are fixed and internally consistent; they come from `03-screen-specs.md` and they must reconcile:

- 147 open = 138 assigned + 9 unowned
- Agent open counts sum to 138: Rahul 38 · Meera 24 · Arjun 16 · Priya 12 · Sneha 10 · Vikram 8 · Aditi 7 · Anjali 6 · Nisha 5 · Karan 4 · Divya 3 · Faisal 2 · Sameer 2 · Tanvi 1
- Weekly report: 587 received = 121 + 188 + 152 + 73 + 53 across the response bands
- 53 breached = 22 overnight + 17 unowned over 2h + 14 reopened
- Category split sums to 587: 241 · 194 · 106 · 46

Two rows carry the demo and must survive any reseed:
- **Rahul Bhosale** — 38 open against a team median of 6, 4 breaching, 6 untouched over 24h.
- **Aditi Joshi** — on leave, holding 7 tickets, all untouched over 24h, oldest 3d 8h.

Timestamps are generated relative to a fixed `NOW = 2026-09-08T09:42:00+05:30` so screenshots are reproducible.

### Forcing states

Every screen has to be built in all four states, so make them reachable without editing code. Append `?mock=` to any route:

| Value | Effect |
|---|---|
| `loading` | handlers delay 10s |
| `empty` | handlers return empty collections |
| `error` | handlers return 500 |
| `sync-failure` | `/api/sync/status` reports a stall at 08:14 |
| `all-clear` | 0 unowned, 0 breaching — the row 7 state |

Default latency is 200–400ms so loading states are actually visible in normal use.

---

## 8 · Screen states — the definition of done

A screen is not done until all of these hold. This is the checklist to run before saying a screen is finished.

- [ ] **Default** state matches the layout and copy in `03-screen-specs.md`
- [ ] **Loading** — skeletons at the final row height, so nothing shifts when data lands
- [ ] **Empty** — the specific state from the feature list, not a generic "no data". Numbers restated, sync timestamp shown, so an empty screen still proves it has data behind it
- [ ] **Error** — says what failed, when, and what to do. Never a code
- [ ] **Filtered-empty** is distinct from **genuinely empty**, and echoes the active filters back as removable chips
- [ ] Every number uses `.tabular`
- [ ] Every colour-coded thing also carries words
- [ ] Keyboard: tab order follows reading order, visible focus ring in `--color-primary-ring`, Escape closes overlays
- [ ] Contrast checked with a checker, not by eye — 4.5:1 body, 3:1 borders and large text
- [ ] Fits the density target at 1440×900
- [ ] Traceability header comment present

Empty and error states are numbered rows in the feature list. They are screens, and they get built, not deferred.

---

## 9 · Writing the words

Copy is design content. Same discipline as spacing.

- **Sentence case.** Plain verbs. Active voice.
- **The button names the outcome:** "Assign ticket", not "Submit". The name survives into the confirmation: "Assigned to Faisal Shaikh."
- **Confirmations name the consequence, not the risk:** "Assign #BC-4821 to Faisal Shaikh? He will have 3 open." Not "Are you sure?"
- **Errors diagnose and direct:** "Email sync stopped at 08:14. New tickets are not arriving." Then a retry and a link to the channel settings.
- **Empty states state what is true, not what is nice:** "Nothing needs you right now." Never "Great job!"
- **Use the team's own words.** "Unowned", not "unassigned", in the tile — unowned is the word that makes the 30-minute promise legible. "Tickets", never "case management entities".

---

## 10 · Don't

- Don't invent a screen, field, action or modal that is not in `01-feature-list-manoj.md`. If something is genuinely missing, say so and add it to the list first.
- Don't use Ember Amber for anything that is not urgency.
- Don't add a third accent colour.
- Don't add a shadow to a card, button, chip or table.
- Don't add a gradient.
- Don't use faker, lorem ipsum, placeholder names, or `example.com`.
- Don't use emoji as icons, or mix icon families.
- Don't set body copy at 16px or 17px because the brand kit says so — that is the storefront's reading pace.
- Don't reach for shadcn's default spacing and call it a design decision.
- Don't compute SLA state anywhere except `lib/sla.ts`.
- Don't write entrance animations or hover lifts.
- Don't sort the workload table or the per-agent report worst-first. Load, and handled, respectively. The moment it sorts worst-first it becomes a performance review, and nobody at Brightcart asked for one.
- Don't silently resolve a contradiction between the brand kit and the feature list. Surface it.

---

## 11 · Open questions carried into the code

These are unresolved with the client. Where the code has to pick something, it picks the documented default and isolates it so the answer is a config change.

| # | Question | Current default | Isolated in |
|---|---|---|---|
| A1 | Ticket ID format | `#BC-4821` | `lib/format.ts` |
| A2 | Order ID format | `ORD-98213` | `lib/format.ts` |
| A3 | Does the 24h clock pause outside business hours? | runs continuously | `lib/sla.ts` policy object |
| A4 | The real category list | 4 categories | `types/domain.ts` + seed |
| A5 | Who sets priority | a person, not a rule | — |
| A6 | Do both leads have identical rights? | yes | — |
| A7 | Can agents self-claim from unassigned? | yes | `POST /assign` |

A3 is the one that matters most: if the clock pauses, 22 of last week's 53 breaches stop being breaches and the whole report reads differently.

---

## 12 · Adding a screen

1. Find its row in `01-feature-list-manoj.md`. If it has no row, stop — the feature list changes first.
2. Create `src/features/<section>/<ScreenName>.tsx` with the traceability header.
3. Add the MSW handler and seed data before the UI, so you are building against real shapes.
4. Build default → loading → empty → error, in that order. Not default first and the rest later.
5. Run the §8 checklist.
6. `pnpm typecheck && pnpm lint`.