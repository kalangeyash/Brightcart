# Screen specs — the two screens built in React

## Why these two

| Screen | The line it answers | Success criterion it serves |
|---|---|---|
| **Team Overview** — row 6 | *"i cannot see who has 40 mails and who has 5"* · *"nobody knows who is handling what"* | No query unowned over 30 minutes · first response inside 24 hours |
| **Reports — weekly overview** — row 15 | *"monday report = 2 hrs of my life, every week"* | Monday reporting takes minutes, not hours |

They were chosen over Ticket Detail and All Tickets for one reason: those two are the lead's version of screens Priya already has, and a presentation that shows them proves nothing new. Team Overview and Reports have **no agent equivalent** — they are the two screens that exist only because a lead exists, which is what makes them the honest answer to "show me Manoj's side".

---

## UI spec applied — Day 6, as decisions

**Typeface — Inter, with disambiguation on.** Chosen against the pack's five checks, and check 3 decides it: this product is ticket IDs and order numbers all day, so `1` `l` `I` and `0` `O` cannot be ambiguous. Inter ships stylistic sets that fix exactly that — `cv05` gives the l a tail, `ss02`/`zero` slashes the zero — and `tnum` gives tabular figures so every number column lines up. That is a typeface picked for a reason rather than a default.

```css
font-family: 'Inter', system-ui, sans-serif;
font-feature-settings: 'cv05' 1, 'zero' 1;   /* tailed l, slashed 0 */
/* numeric columns and all IDs */
font-variant-numeric: tabular-nums;
```

**Neutrals — cool slate.** The pack's own recommendation for dashboards, and the honest choice given that nobody has asked Brightcart for a brand guide yet. Brand-tinting is a five-variable change the day we get their colour, and that question is on the kickoff list.

```
--bg        #F8FAFC     --surface  #FFFFFF    --border    #E2E8F0
--muted     #64748B     --text     #0F172A
--accent    #B45309     urgency, and nothing else
```

**Semantic colours, and the accent's one job.** The accent is amber and it appears only where time is running out — SLA chips, the breach tile, the left rail on a row that needs attention. It is never a brand colour, never a button fill, never a chart accent for a neutral metric. Red is reserved one step further, for breached and for destructive actions.

```
success #15803D    warning #B45309    danger #B91C1C    info #1D4ED8
```

**Colour is never the only signal.** Every SLA chip carries the words as well as the colour — "52 min left", "Breached 1h ago" — plus an icon. Roughly 1 in 12 men will not separate the red chip from the amber one, and Brightcart has 16 users.

**Contrast, checked not eyeballed.** Body text `#0F172A` on `#F8FAFC` is about 16:1. Muted `#64748B` on white is 4.8:1 — over the 4.5 minimum, which is why it is `#64748B` and not the more elegant `#94A3B8` at 2.9:1. Amber chip text `#92400E` on `#FEF3C7` is about 7:1.

**Spacing — 4 · 8 · 12 · 16 · 24 · 32 · 48.** One radius, 6px. One shadow, used on the drawer only.

**Density is the design decision, not a default.** This is where an AI-drafted version of the screen would go wrong. Manoj has 14 agents; if he cannot see all 14 without scrolling, the screen has failed at the one thing it exists for. Table rows are 40px, not the 64px a marketing-page rhythm would give. The tiles are compact strips, not four large cards down the fold.

**One signature detail, repeated.** A 3px left rail on any row that needs the lead's attention — amber for breach risk, red for breached, none otherwise. Same rail on both screens, same meaning, and it survives at a glance from across a desk.

**Light theme.** Support runs in a lit office on a day shift against dense tabular data. Dark would be a preference, not a reason.

**Icons — Lucide, stroke 2, 16px, always with a label** except search and close.

---

## Screen 1 · Team Overview

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Support Desk   Overview · Unassigned 9 · Tickets · Reports    │
│                                     🔍   🔔 3   Manoj Patil   │
├──────────────────────────────────────────────────────────────┤
│ Team Overview                    Monday, 8 Sep · 09:42        │
│                                  Synced 2 min ago             │
├──────────────────────────────────────────────────────────────┤
│ [ UNOWNED NOW 9 ] [ BREACHING <2H 4 ] [ BREACHED 2 ] [ OPEN 147 ] │
│   3 over 30 min                                               │
├───────────────────────────────┬──────────────────────────────┤
│ NEEDS YOU NOW                 │ TEAM WORKLOAD  14 agents      │
│ (breach risk, soonest first)  │ (sorted by open, descending)  │
└───────────────────────────────┴──────────────────────────────┘
```

Two-thirds / one-third would be the default. It is reversed here: workload gets the wide column because the table has eight columns of numbers, and the breach list is five rows of short text.

### Tiles — fixed order, never reordered

| Tile | Value | Sub-line | Colour |
|---|---|---|---|
| Unowned now | 9 | 3 over 30 min | amber if any over 30 min |
| Breaching in under 2h | 4 | — | amber |
| Breached today | 2 | — | red |
| Open across team | 147 | 138 assigned · 9 unowned | neutral |

The fourth tile is deliberately neutral. It is context, not an alarm, and giving it colour is how a dashboard stops meaning anything.

### Needs you now — breach risk, top 5

| Ticket | Customer | Subject | Owner | SLA |
|---|---|---|---|---|
| #BC-4821 | Ritika Sharma | Refund not received — ORD-98213 | Unowned | 52 min left |
| #BC-4803 | Sunil Kamath | Wrong item delivered — ORD-98104 | Rahul Bhosale | 1h 18m left |
| #BC-4776 | Neha Agarwal | Order cancelled, no refund — ORD-97988 | Rahul Bhosale | 1h 44m left |
| #BC-4812 | Imran Sheikh | Delivery 6 days late — ORD-98150 | Meera Iyer | 1h 51m left |
| #BC-4759 | Deepa Menon | Duplicate charge — ORD-97902 | Unowned | Breached 1h ago |

Row one is unowned **and** closest to breach — the exact ticket that becomes a Twitter escalation. Each row has an inline Assign action so the fix takes one click from the screen where the problem was noticed.

### Team workload — all 14 visible, no scroll

| Agent | Status | Open | Load | Breaching | Untouched 24h | Oldest | Last activity |
|---|---|---|---|---|---|---|---|
| Rahul Bhosale | Active | 38 | ████████ | 4 | 6 | 4d 2h | 12 min ago |
| Meera Iyer | Active | 24 | █████ | 2 | 1 | 2d 6h | 3 min ago |
| Arjun Deshpande | Active | 16 | ███ | 0 | 0 | 1d 4h | 8 min ago |
| Priya Nair | Active | 12 | ██ | 1 | 0 | 1d 1h | 1 min ago |
| Sneha Kulkarni | Active | 10 | ██ | 0 | 0 | 22h | 6 min ago |
| Vikram Rao | Active | 8 | █ | 0 | 0 | 18h | 15 min ago |
| **Aditi Joshi** | **On leave** | **7** | █ | **1** | **7** | **3d 8h** | **4 days ago** |
| Anjali Menon | Active | 6 | █ | 0 | 0 | 14h | 2 min ago |
| Nisha Pillai | Active | 5 | █ | 0 | 0 | 9h | 20 min ago |
| Karan Mehta | Active | 4 | ▌ | 0 | 0 | 7h | 5 min ago |
| Divya Raut | Active | 3 | ▌ | 0 | 0 | 5h | 11 min ago |
| Faisal Shaikh | Active | 2 | ▌ | 0 | 0 | 3h | 2 min ago |
| Sameer Qureshi | Active | 2 | ▌ | 0 | 0 | 3h | 7 min ago |
| Tanvi Gokhale | Active | 1 | ▌ | 0 | 0 | 1h | 9 min ago |

Two things this table is built to say in one glance, both taken straight from what Manoj described:

- **Rahul has 38 open against a team median of 6.** That is the "60 open queries, found out when she resigned" story, caught six weeks earlier.
- **Aditi is on leave and holding 7 tickets, all untouched for over 24 hours, oldest 3d 8h.** That is *"agent goes on leave, her mails just sit there"* — visible without anyone remembering to look.

The load bar is relative to the team median, not to a fixed cap, because there is no stated cap. It is a comparison, and comparison is what he asked for.

### States

| State | Behaviour |
|---|---|
| Loading | Skeleton rows at final height, so nothing shifts when data lands |
| All clear | Row 7 — "Nothing needs you right now", with the three numbers restated and the sync time |
| Sync failure | Persistent banner: "Email sync stopped at 08:14. New tickets are not arriving." Retry now · Open channel settings. Tiles dim, because a dashboard that looks confident on stale data is worse than one that admits it |
| Agent list empty | Cannot occur — a lead always has a team. No state |

### Microcopy

- Tile labels are sentence case: "Unowned now", not "UNOWNED NOW" as a sentence — ALL CAPS is reserved for the two-word `PRIORITY` style label.
- "Unowned", not "unassigned", in the tile — because unowned is what it means to Manoj, and it is the word that makes the 30-minute promise legible.
- The assign confirmation names the consequence: "Assign #BC-4821 to Faisal Shaikh? He will have 3 open." Not "Are you sure?"
- Empty state says what is true, not what is nice: "Nothing needs you right now."

---

## Screen 2 · Reports — weekly overview

Period shown: **1–7 Sep 2026**.

### Headline figures — the two promises first

| Figure | Value | Against last week | Note |
|---|---|---|---|
| **First response within 24h** | **91%** | ▲ 6 pts | target 100% — shown, because a target you cannot see is one nobody misses on purpose |
| **Never unowned over 30 min** | **88%** | ▲ 11 pts | |
| Tickets received | 587 | ▲ 4% | |
| Resolved | 561 | ▲ 7% | |
| Breached | 53 | ▼ 18 | |
| Median first response | 4h 20m | ▼ 51m | median, not mean — one four-day ticket should not move the number |

The first two sit larger and first. Everything below them is context for them. That ordering is the argument: Brightcart made two promises, and this report opens by saying whether they kept them.

### First response distribution

| Band | Tickets | Share |
|---|---|---|
| Under 1h | 121 | 21% |
| 1–4h | 188 | 32% |
| 4–12h | 152 | 26% |
| 12–24h | 73 | 12% |
| Breached | 53 | 9% |

### Why the 53 breached

| Reason | Count |
|---|---|
| Arrived overnight, unowned until morning | 22 |
| Unowned more than 2h during the day | 17 |
| Reopened by a customer reply | 14 |

The most useful block on the screen. A percentage tells Manoj he failed; a reason tells him what to change — and "arrived overnight" being the largest is an answer about shift cover, not about agents. It is also the block that would never appear if the report were designed to look like a dashboard rather than to answer a question.

### Per agent, this week

| Agent | Handled | Resolved | Median first response | Breached |
|---|---|---|---|---|
| Rahul Bhosale | 61 | 48 | 8h 40m | 19 |
| Meera Iyer | 54 | 51 | 4h 55m | 8 |
| Arjun Deshpande | 49 | 47 | 3h 40m | 4 |
| Priya Nair | 44 | 43 | 3h 05m | 2 |
| Sneha Kulkarni | 41 | 40 | 3h 20m | 2 |
| … 9 more | | | | |

Sorted by handled, not by breaches. This is a workload report, not a leaderboard — the moment it is sorted worst-first it becomes a performance review, and nobody at Brightcart asked for one. Worth saying out loud to the client, because they will ask.

### Category split

Refunds 241 · 41% · Delivery 194 · 33% · Order change 106 · 18% · Other 46 · 8%

### Actions

- **Every figure is a link.** Click 53 breached and land in All Tickets, filtered to those 53. A number that cannot be interrogated is a number that gets argued about — which is the state the hand-typed spreadsheet is already in.
- Export CSV · Export PDF
- **Schedule** — "Every Monday 08:00 to manoj.p@brightcart.in". Sits on this screen, not three levels into settings, because the goal is that Manoj never opens this screen on a Monday at all.

### States

| State | Behaviour |
|---|---|
| Loading | Skeletons at final height |
| Insufficient data | Row 16 — "Support Desk has been live since 8 Sep. The first full week's report will be ready on 15 Sep." Partial figures shown where valid |
| Custom range too short | Same state, different sub-line |
| Export in progress | Inline progress on the button, not a blocking modal |

---

## What I would build next, and why not now

1. **Agent detail drawer** — clicking Rahul's row. Specced as a modal on row 6; not built because the two screens already carry the argument and a half-built drawer is worse than a described one.
2. **Unassigned Queue** — row 8. Closest to being a third screen. Left out because Team Overview already proves the assignment thinking, and eight minutes is eight minutes.
