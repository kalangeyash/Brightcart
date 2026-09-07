# Feature list — Role: Support Lead (Manoj)

**Product:** Brightcart Support Desk, phase 1
**Role:** Support Lead / admin — 2 users at launch
**Columns:** # · Screen · Data Points · Purpose / Description · Actions · Modals

**Why there is a MoSCoW column here.** The Day 4 rule is to leave it out when the requirement is crystal clear. It is not. Rohit asked for WhatsApp after the proposal was written, the proposal promises "analytics" that nobody asked for, and there is a hard festive-season date. Scope is exactly the situation the tags exist for, so every row carries one and the "Won't" list at the bottom is said out loud.

**Legend.** `ASSUMED` marks anything not stated in any document. Every Purpose column ends with SOURCES — synced, derived by the platform, or entered by a person.

---

## Section 1 · Authentication & Access — removed from scope

Login, Forgot Password, and Set Password (formerly rows 1–3) have been **removed** from this build. Authentication is out of scope: the tool opens directly on the Support Lead's Team Overview. Row numbers below are left unchanged so existing traceability references still resolve — the first built screen remains "row 4".

---

## Section 2 · App Shell — Support Lead

| # | Screen | MoSCoW |
|---|---|---|
| 4 | Lead shell and global navigation | Must |
| 5 | Notification panel | Should |

### 4 · Lead shell and global navigation

**Data points** — Product name "Support Desk" · Primary nav: Team Overview · Unassigned (count badge, e.g. 9) · All Tickets · Reports · Settings · Global search ("Search tickets, customers, order IDs") · Notification bell with unread count · Profile menu (Manoj Patil · Support Lead · Settings) · Last sync timestamp (e.g. "Synced 2 min ago")

**Purpose** — The frame every lead screen sits inside. Two decisions worth defending. First, the Unassigned count sits in the nav rather than inside a screen, because "no query unowned for more than 30 minutes" is a stated success measure and a number you have to navigate to is a number nobody watches. Second, the sync timestamp is permanently visible — the entire ticket list is synced from an external inbox, and a lead making staffing decisions needs to know whether he is looking at live data or a stalled sync.
SOURCES: nav counts derived by platform; sync timestamp derived from the last successful email poll; profile entered by admin.

**Actions** — Navigate · Global search · Open notifications · Open profile menu

**Modals** — None

### 5 · Notification panel

**Data points** — Grouped list: Breaching soon (e.g. "#BC-4821 · Ritika Sharma · 52 min left") · Unowned over 30 min (e.g. "3 tickets unowned since 09:40") · Reassigned to you · Sync failures · Timestamp per item · "Mark all read" · Empty state ("Nothing needs you right now")

**Purpose** — Rohit's line is the whole justification: he finds out about failures when someone escalates on Twitter, or on the Monday report. Notifications exist to make the tool the first place a lead hears about a problem rather than the third. Scoped tightly to the two things that are actually measured — breach risk and unowned tickets — because a notification stream that reports everything is one people switch off in week two.
SOURCES: all items derived by the platform from SLA clock and assignment state.

**Actions** — Open ticket from item · Mark all read · Mute a category

**Modals** — None

---

## Section 3 · Team Overview — lead landing screen ★

| # | Screen | MoSCoW |
|---|---|---|
| 6 | Team Overview | Must |
| 7 | Team Overview — all clear state | Must |

### 6 · Team Overview ★ built in React

**Data points**

- Page title "Team Overview" · Date and shift context (e.g. "Monday, 8 September · 09:42")
- Four status tiles, in fixed order:
  - Unowned now — 9 · sub-line "3 over 30 min"
  - Breaching in under 2h — 4
  - Breached today — 2
  - Open across team — 147
- Breach risk list (top 5, soonest first): Ticket ID `#BC-4821` · Customer (Ritika Sharma) · Subject ("Refund not received — ORD-98213") · Owner avatar or "Unowned" · SLA chip ("52 min left") · Priority chip (Urgent)
- Agent workload table, one row per agent, 14 rows:
  - Agent (Priya Nair) · Status (Active · On leave · Offline)
  - Open (12) · Load bar relative to team median
  - Breaching (1) · Untouched over 24h (0)
  - Oldest open ticket age (e.g. "2d 4h")
  - Last activity ("4 min ago")
- Sorted by Open descending by default, so the overloaded agent is row one

**Purpose** — Manoj's landing screen and the answer to the two lines he wrote himself: *"i cannot see who has 40 mails and who has 5"* and *"nobody knows who is handling what."* It also closes the gap behind his worst story — finding out someone had 60 open queries only when they resigned. The four tiles are chosen to be the exact numbers Brightcart is measured on, so the screen states the health of the two success criteria in the first second. The workload table sorts by open count descending rather than alphabetically because the purpose of the screen is to surface the person drowning, not to look up a known person — that is what search is for. "Untouched over 24h" is a separate column from "Open" on purpose: an agent with 30 tickets who is working them is fine, an agent with 12 that nobody has touched is not, and one number cannot say both.
SOURCES: tickets synced from support@ inbox; open counts, load bar, breach counts and untouched ages all derived by the platform; agent list and leave status entered by admin; SLA clock derived from ticket creation time plus the 24-hour policy.

**Actions** — Open a ticket from breach list · Open agent detail drawer · Reassign from breach row · Sort workload table · Filter by status (Active / On leave) · Jump to Unassigned

**Modals** — Agent detail drawer (that agent's open tickets, breach list, leave dates, "Reassign all") · Reassign ticket modal (target agent list showing each agent's current open count, so the reassignment is not blind) · Set priority modal

### 7 · Team Overview — all clear state

**Data points** — Illustration · Headline "Nothing needs you right now" · Sub-line ("0 unowned · 0 breaching in the next 2 hours · 147 open across the team") · Last sync timestamp (e.g. "Synced 09:41") · Link to All Tickets

**Purpose** — Its own numbered row because it is a screen. Shown when unowned and breach-risk counts are both zero — which will be the normal state on a good morning, and if that reads as a broken page the lead learns to distrust the tool. The sub-line restates the numbers rather than just saying "all clear", so an empty screen still proves it has data behind it, and the sync timestamp answers "is this empty or is it broken".
SOURCES: derived by platform.

**Actions** — Refresh sync · View all tickets

**Modals** — None

---

## Section 4 · Unassigned and assignment

| # | Screen | MoSCoW |
|---|---|---|
| 8 | Unassigned Queue | Must |
| 9 | Unassigned Queue — empty state | Must |

### 8 · Unassigned Queue

**Data points** — Page title · Count in title ("Unassigned · 9") · Ageing filter (All / Over 30 min / Over 2h) · Table: Ticket ID · Customer · Subject · Received time (e.g. "09:14") · Age since arrival with a 30-minute threshold marker ("38 min · over target") · Suggested owner (lightest current load, e.g. "Faisal Shaikh · 4 open") · Priority chip · Select-all checkbox and bulk bar

**Purpose** — The screen that owns the first success criterion: no query unowned for more than 30 minutes. Split out from All Tickets rather than living as a filter, because a target that has a screen gets watched and a target that has a filter does not. The "suggested owner" column is the platform doing the arithmetic Manoj currently does by shouting across the floor — *"anyone on the Sharma refund?"* — but it is a suggestion with a name and a number beside it, not an auto-assignment, because a lead knows things about his team's day that the load count does not.
SOURCES: tickets synced from inbox; age derived by platform from received timestamp; suggested owner derived from live open counts; assignment entered by lead.

**Actions** — Assign · Bulk assign selected · Set priority · Open ticket · Sort by age · Filter by age

**Modals** — Assign modal (agent list with live open counts and leave flags) · Bulk assign confirmation ("Assign 6 tickets to Faisal Shaikh? He will have 10 open.")

### 9 · Unassigned Queue — empty state

**Data points** — Illustration · Headline "Everything has an owner" · Sub-line ("Last unassigned ticket was picked up at 09:38") · Last sync timestamp · Link back to Team Overview

**Purpose** — Shown when nothing is unowned, or when the ageing filter matches nothing. The sub-line names a time rather than congratulating, because the useful information at that moment is how recently the queue was actually clear.
SOURCES: derived by platform.

**Actions** — Clear filters · Refresh sync

**Modals** — None

---

## Section 5 · All Tickets — lead view

| # | Screen | MoSCoW |
|---|---|---|
| 10 | All Tickets | Must |
| 11 | All Tickets — no results state | Must |
| 12 | Ticket Detail — lead view | Must |
| 13 | Ticket Detail — activity and audit tab | Must |

### 10 · All Tickets

**Data points** — Page title · Search ("Search by order ID, customer, or ticket #") · Filters: Owner · Status · Priority · SLA (Breached / Under 4h / On track) · Category (Refund, Delivery, Order change, Other) · Date range · Result count ("147 tickets · 9 unowned") · Table: Ticket ID · Customer · Order ID · Subject · Owner · Status chip · Priority chip · SLA chip · Last activity · Saved views (My breaches, Untouched 24h, Refunds this week)

**Purpose** — The lead's full-team view — the same data an agent sees, without the "mine only" restriction. It exists mostly to answer questions that arrive from outside the team, which is Manoj's line *"big order issue, management asks who touched this, i have no answer"*: the answer starts with finding the ticket by order ID. Saved views are here rather than a report because the three questions a lead repeats every day are queries, not reports.
SOURCES: tickets and customer data synced from inbox; status, priority, owner and category entered by people; SLA and last activity derived by platform.

**Actions** — Search · Filter · Sort · Open ticket · Bulk reassign · Bulk set priority · Save current view · Export current view to CSV

**Modals** — Reassign modal · Set priority modal · Export confirmation

### 11 · All Tickets — no results state

**Data points** — Illustration · Headline "No tickets match these filters" · Echo of the active filters as removable chips (e.g. "Owner: Aditi Joshi ×", "SLA: Breached ×") · Clear all filters

**Purpose** — Separate from a genuinely empty list. Echoing the active filters back is the fix for the commonest cause of an empty table, which is a filter the user forgot they set two screens ago.
SOURCES: derived by platform.

**Actions** — Remove individual filter · Clear all filters

**Modals** — None

### 12 · Ticket Detail — lead view

**Data points** — Ticket ID and subject ("Refund not received — #BC-4821") · Customer block (Ritika Sharma · ritika.s@gmail.com · ORD-98213 · 3 previous tickets) · Owner with change control · Status · Priority · Category · SLA panel (First response due 09:12 tomorrow · "52 min left" · Breached by, if applicable) · Full conversation thread, oldest first, with internal notes inline and visually distinct · Reply count and distinct-repliers flag ("4 messages · 2 agents replied") · Tabs: Conversation · Activity

**Purpose** — The agent screen plus the three things only a lead needs: reassign, override priority, and see the audit tab. The distinct-repliers flag is the direct trace to the one failure both Rohit and Manoj reported independently — *"2 ppl reply same mail"*, and the customer screenshotting two different answers. "3 previous tickets" is there for Ritika's complaint about re-explaining: the lead should be able to see a repeat contact before deciding how to handle it.
SOURCES: thread synced from inbox; internal notes entered by agents; owner, priority, category entered by people; SLA and repliers flag derived by platform.

**Actions** — Reassign · Change priority · Change status · Change category · Add internal note · Open activity tab · Merge with another ticket

**Modals** — Reassign modal · Merge tickets modal (search, preview of the merged thread, warning that merge cannot be undone) · Change status confirmation when moving to Resolved with an unanswered customer message

### 13 · Ticket Detail — activity and audit tab

**Data points** — Chronological event list: timestamp · actor (Priya Nair) · event ("assigned to self", "replied", "changed priority Normal → Urgent", "reassigned to Meera Iyer", "status → Resolved") · Before/after values for any changed field · System events distinguished from human ones ("Ticket created from email", "SLA breached")

**Purpose** — The single feature that answers *"management asks who touched this, i have no answer"* — the one problem in Manoj's list with no partial workaround today, because Gmail simply does not record it. Before/after values matter more than the event name: "changed priority" is not an answer, "Normal → Urgent at 14:02 by Priya" is. System events are visually separated so a breach is never mistaken for something a person did.
SOURCES: every event written by the platform as it happens; not editable by anyone, including admins.

**Actions** — Filter by actor · Filter by event type · Copy permalink to an event

**Modals** — None

---

## Section 6 · Coverage

| # | Screen | MoSCoW |
|---|---|---|
| 14 | Agent Coverage and Leave | Should |

### 14 · Agent Coverage and Leave

**Data points** — Agent list with leave status · Leave dates (e.g. "Aditi Joshi · 8–12 Sep") · Open tickets held by that agent during leave (7) · Suggested redistribution split across the lightest-loaded agents · "Reassign all" · Historic coverage log

**Purpose** — Trace: *"agent goes on leave, her mails just sit there."* Tagged Should rather than Must because the underlying failure is already prevented by the Team Overview — an agent on leave with untouched tickets shows up there as an anomaly within a day. This screen turns a one-by-one reassignment into one action, which is convenience, not survival. Honest place for it is the top of the Should list, first thing to pull forward if the festive date holds.
SOURCES: leave dates entered by lead; ticket counts and suggested split derived by platform.

**Actions** — Mark on leave · Set return date · Reassign all · Reassign selected

**Modals** — Reassign-all confirmation showing the resulting load per agent

---

## Section 7 · Reporting ★

| # | Screen | MoSCoW |
|---|---|---|
| 15 | Reports — weekly overview | Must |
| 16 | Reports — insufficient data state | Should |

### 15 · Reports — weekly overview ★ built in React

**Data points**

- Period selector (This week · Last week · Custom) with dates shown ("1–7 Sep 2026")
- Headline figures, each with change against previous period:
  - Tickets received — 587 (▲ 4%)
  - Resolved — 561
  - First response within 24h — 91% (▲ 6 pts) · target 100%
  - Breached — 53
  - Median first response — 4h 20m
  - Never unowned over 30 min — 88% of tickets
- First-response distribution — under 1h / 1–4h / 4–12h / 12–24h / breached
- Per-agent table: Agent · Handled (48) · Resolved (44) · Median first response (3h 05m) · Breached (2)
- Category split — Refunds 41% · Delivery 33% · Order change 18% · Other 8%
- Breach reasons where known — arrived overnight (22) · unowned over 2h (17) · reopened (14)
- Export to CSV / PDF · Schedule ("Every Monday 08:00 to manoj.p@brightcart.in")

**Purpose** — The screen that gives Manoj back two hours a week. His words: *"monday report = 2 hrs of my life, every week"*, and Rohit's: the report is out of date by Tuesday. Third stated success criterion is "Monday reporting takes minutes, not hours" — so the target here is not a beautiful dashboard, it is a report that is already finished when he opens it, which is why the schedule-and-send action sits on the same screen as the numbers rather than three levels into settings. The two headline figures are the two things Brightcart actually promised: 24-hour first response, and nothing unowned past 30 minutes. Everything else on the screen is context for those two. Breach reasons are included because a percentage tells him he failed and a reason tells him what to change — and "arrived overnight" being the top reason is an answer about staffing, not about agents.
SOURCES: all figures derived by the platform from ticket events; no manual entry anywhere on this screen — that is the point of it.

**Actions** — Change period · Export CSV · Export PDF · Schedule weekly email · Drill from any figure into a filtered All Tickets view

**Modals** — Export options (period, which sections, format) · Schedule report modal (day, time, recipients)

### 16 · Reports — insufficient data state

**Data points** — Headline "Not enough data for this period yet" · Sub-line ("Support Desk has been live since 8 Sep. The first full week's report will be ready on 15 Sep.") · Partial figures shown where valid · Link to current-week live numbers

**Purpose** — Covers the first two weeks after go-live and any custom period with too little data. It is a real state, not an edge case: this product ships just before the festive season, and the first thing Manoj will do on day one is open Reports. A blank chart on day one is how a tool loses its most important user in the first week.
SOURCES: derived by platform.

**Actions** — Change period · View live numbers

**Modals** — None

---

## Section 8 · Admin settings

| # | Screen | MoSCoW |
|---|---|---|
| 17 | Settings — Team and users | Must |
| 18 | Settings — Categories and tags | Must |
| 19 | Settings — SLA policy, hours and auto-close | Must |
| 20 | Settings — Assignment rules | Should |
| 21 | Settings — Email channel | Must |
| 22 | Settings — Canned replies | Could |

### 17 · Settings — Team and users

**Data points** — User table: Name · Email · Role (Agent / Support lead) · Status (Active / Invited / Deactivated) · Open tickets held · Date added · Invite user button · Seat count ("16 users")

**Purpose** — The console the proposal promises. "Open tickets held" sits in this table for one reason: deactivating a user who still owns 7 tickets is exactly how Brightcart's current failure repeats itself inside the new tool, so the number has to be visible at the moment of the decision rather than discovered afterwards.
SOURCES: entered by admin; open ticket counts derived by platform.

**Actions** — Invite user · Change role · Deactivate · Resend invite

**Modals** — Invite user modal · Deactivate modal (blocks until the held tickets are reassigned, with the reassignment done inside the modal)

### 18 · Settings — Categories and tags

**Data points** — Category list with description and usage count (Refund · "Money back requested or promised" · 241 this month) · Add category · Merge categories · Archive · Warning when the list exceeds 8

**Purpose** — Direct trace: *"new agent joins, takes 3-4 weeks to understand our label system."* The problem is not that Gmail labels are bad, it is that the label system was never written down or bounded. Two features fix it — a plain-English description attached to every category, and a soft cap that makes growing the list a decision rather than a habit. The Gmail label sprawl is what we are replacing; recreating it here would be the most expensive kind of failure.
SOURCES: entered by admin; usage counts derived by platform.

**Actions** — Add · Edit · Merge · Archive · Reorder

**Modals** — Merge categories modal (shows how many tickets move) · Archive confirmation

### 19 · Settings — SLA policy, hours and auto-close

**Data points** — First response target (24 hours, as promised to customers) · Business hours toggle and hours · Whether the clock pauses outside hours · Breach warning threshold (notify at 2h remaining) · Auto-close rule (Resolved tickets close after 7 days of no reply) · Reopen rule (customer replies to a closed ticket, it reopens as New)

**Purpose** — Makes the promise Rohit already made to customers into something the platform can measure. The business-hours question is the one genuinely open decision on this screen — support runs a 24-hour promise but we do not know whether Brightcart staffs evenings, and the answer changes every breach number in the reports. Flagged for kickoff rather than assumed. Auto-close is the trace to *"old mails from 3 months back still in inbox, nobody archives"*: the reason nobody archives is that archiving is a chore with no deadline, so the platform does it on a rule and the reopen rule makes it safe.
SOURCES: entered by admin; ASSUMED default of a 24/7 clock until the client confirms.

**Actions** — Edit targets · Toggle business hours · Set auto-close window · Save

**Modals** — Confirmation when changing the SLA target ("This changes the clock on 147 open tickets. Existing breaches are not recalculated.")

### 20 · Settings — Assignment rules

**Data points** — Rule list (e.g. "Category = Refund → suggest lightest-loaded agent") · Round-robin toggle · Exclude agents on leave · Cap per agent (e.g. 25 open) · Rule order

**Purpose** — Automation of what the lead does by hand on the Unassigned Queue. Should, not Must — the manual path already meets the 30-minute target for a team of 14, and shipping automated assignment before anyone trusts the assignment screen is how a team ends up fighting the rules. Right thing to build in phase 1.5 with a month of real data behind the defaults.
SOURCES: entered by admin.

**Actions** — Add rule · Reorder · Enable/disable · Delete

**Modals** — Delete rule confirmation

### 21 · Settings — Email channel

**Data points** — Connected mailbox (support@brightcart.in) · Connection status · Last successful sync · Sync frequency · Failure log (last 10 with timestamps and reasons) · Reply-from address · Signature template · Reconnect

**Purpose** — The one integration the proposal commits to, and the single point of failure for the whole product: if the mailbox connection drops, tickets stop existing and the tool goes quietly silent — the exact failure mode Brightcart already lives with. So the status is visible in settings and, more importantly, on the shell for everyone. A visible failure log is what stops "it's not syncing" becoming a support call to us.
SOURCES: connection entered by admin; status and failure log derived by platform.

**Actions** — Reconnect · Test connection · Edit signature · View failure log

**Modals** — Reconnect flow · Test connection result

### 22 · Settings — Canned replies

**Data points** — Reply list with title, body, category, usage count · Add · Edit · Variables available ({{customer_name}}, {{order_id}}, {{ticket_id}})

**Purpose** — Could. Nobody at Brightcart asked for it. It appears here because Priya writes the same refund-status reply several times a day and it is the obvious next efficiency — but it is not traceable to a stated problem, so it goes below the line and stays visible for phase 2 rather than being smuggled into v1.
SOURCES: entered by agents and leads; usage counts derived by platform.

**Actions** — Add · Edit · Delete · Insert into reply

**Modals** — Delete confirmation

---

## Section 9 · Audit

| # | Screen | MoSCoW |
|---|---|---|
| 23 | Global audit log | Should |
| 24 | Global audit log — no results state | Should |

### 23 · Global audit log

**Data points** — Filters: date range · actor · event type · ticket · Event rows with timestamp, actor, event, before/after values, ticket link · Export to CSV

**Purpose** — The per-ticket activity tab (row 13) answers "who touched this ticket". This answers the wider version — "what happened last Tuesday afternoon", and the settings changes nobody remembers making. Should rather than Must because the per-ticket tab covers the question Manoj actually described; this covers the question he will start asking in month two.
SOURCES: written by the platform; not editable.

**Actions** — Filter · Export CSV · Open the related ticket

**Modals** — Export confirmation

### 24 · Global audit log — no results state

**Data points** — Headline "No activity matches these filters" · Active filters as removable chips · Clear filters

**Purpose** — Same reasoning as row 11 — an empty audit log is far more alarming than an empty ticket list, so it must be obvious that the filter is the cause.
SOURCES: derived by platform.

**Actions** — Clear filters

**Modals** — None

---

## Section 10 · System states

| # | Screen | MoSCoW |
|---|---|---|
| 25 | Sync failure banner and recovery | Must |
| 26 | Permission denied | Should |

### 25 · Sync failure banner and recovery

**Data points** — Persistent banner across every screen ("Email sync stopped at 08:14. New tickets are not arriving.") · Time since last successful sync · Retry now · Link to the email channel settings · Count of tickets known to be waiting, where available

**Purpose** — The most important state in the product and the easiest one to leave out of a feature list. Every number on the lead's screens is only as true as the last sync, and a stale dashboard that looks healthy is worse than no dashboard — it is Brightcart's existing problem with extra confidence. Names what stopped, when, and what it means in plain words, which is heuristic 1 and heuristic 9 in the same banner.
SOURCES: derived by the platform from sync job status.

**Actions** — Retry now · Open channel settings · Dismiss for this session (banner returns on next screen)

**Modals** — None

### 26 · Permission denied

**Data points** — Headline "You don't have access to this" · Plain explanation of which role is required · Link back to Team Overview · Who to contact

**Purpose** — Two roles exist, so this state exists. Mostly hit by an agent following a link a lead sent them. Says what to do next rather than showing a code — the pack's own example of what not to ship is "Error 402-B".
SOURCES: derived by platform from role.

**Actions** — Back to Team Overview

**Modals** — None

---

## Won't have — phase 1, said out loud

| Item | Who asked | Why not now |
|---|---|---|
| WhatsApp channel | Rohit, in the email — "everyone's on WhatsApp now" | Proposal section 2 puts third-party channel integrations out of scope for phase 1. This is a live contradiction between what the client asked for and what was sold, and it needs a decision from Rohit at kickoff, not a quiet omission. |
| Customer-facing portal | Nobody — proposal and brief both exclude it | Ritika's problem is real (no reference number, nobody holding her problem) but it is solved in v1 by an automatic acknowledgement with a ticket ID from the email channel, not by a portal. |
| Mobile app | Nobody | Out of scope in the proposal. Desktop-first per the brief. |
| Custom report builder | Nobody — "analytics" in the proposal implies it | The client asked for the Monday report, once, in specific terms. One well-chosen report beats a builder nobody configures. |
| CSAT / satisfaction surveys | Nobody | Obvious next thing; no stated problem behind it. Phase 2. |
| Per-agent performance scoring | Nobody | The workload table shows load, not quality. Turning it into a scoreboard changes what the tool is for, and that is a decision for Brightcart's leadership, not for us. |

## Assumptions register

| # | Assumption | How to close it |
|---|---|---|
| A1 | Ticket ID format `#BC-4821` | Ask Manoj. Carried over from the agent tab, still unconfirmed. |
| A2 | Order ID format `ORD-98213` | Ask — this is Brightcart's own data, they will know it in one sentence. |
| A3 | The 24-hour clock runs continuously, not only in business hours | Ask Rohit. Changes every breach number in the reports. |
| A4 | Categories are Refund / Delivery / Order change / Other | Ask for an export of the current Gmail label list. Question 7 in the Day 2 groups. |
| A5 | Priority is set by a person, not derived | Manoj said urgent tickets look the same as normal ones, but never said who decides. |
| A6 | Both leads have identical, full admin rights | Only two lead users exist, so this is likely — but "Rohit approved the budget and won't use the tool" leaves an unanswered question about whether he needs read-only reports. |
| A7 | Agents self-claim from unassigned as well as being assigned | Implied by the agent tab's claim action; never stated by the client. |
