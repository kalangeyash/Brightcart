/**
 * Seed: the 147 currently open tickets.
 *
 * Every number here reconciles, and the reconciliation is asserted at module
 * load (see `assertSeedIntegrity`) so a careless edit fails loudly instead of
 * quietly making the demo wrong:
 *
 *   147 open = 138 assigned + 9 unowned
 *   138 assigned = the per-agent distribution in agents.ts
 *   18 awaiting first response = 7 due soon + 3 breached + 8 on track
 *   129 already answered (SLA state `met`)
 *
 * Two rows carry the whole demo and are handwritten rather than generated:
 *   - Rahul Bhosale, 38 open against a team median of 6
 *   - Aditi Joshi, on leave, holding 7 tickets, all untouched over 24h
 *
 * CORRECTION vs 03-screen-specs.md: the spec's tiles (4 breaching, 2 breached)
 * did not reconcile with its own workload column (Rahul 4 + Meera 2 + Priya 1 +
 * Aditi 1 = 8 at-risk tickets held by agents, plus 2 unowned). The tiles were
 * the wrong half. They are now 7 breaching and 3 breached, total 10 at risk.
 * The five rows in "Needs you now" are unchanged — they are the top 5 of 10.
 */

import type { Priority, Ticket, TicketCategory, TicketStatus } from '../../../types/domain';

import { formatOrderId, formatTicketId } from '../../../lib/format';
import { HOUR, MINUTE, nowMs } from '../../../lib/sla';
import { AGENT_SEEDS } from './agents';
import { CUSTOMER_NAMES, customerEmail, pick, rng, shuffle, SUBJECTS } from './content';

const NOW = nowMs();
const DAY = 24 * HOUR;
const TARGET = 24 * HOUR;

const r = rng(20260907);

// Generated ids sit BELOW the handwritten range (#BC-4726 … #BC-4821) so the
// two can never collide. assertSeedIntegrity() enforces this.
let ticketSeq = 4725;
let orderSeq = 97800;

interface MakeArgs {
  readonly ownerId: string | null;
  readonly category?: TicketCategory;
  readonly subject?: string;
  readonly customerName?: string;
  readonly id?: string;
  readonly orderId?: string | null;
  readonly createdMsAgo: number;
  /** null keeps the clock running; a number stops it that long after creation. */
  readonly firstResponseAfterMs: number | null;
  readonly lastActivityMsAgo?: number;
  readonly status?: TicketStatus;
  readonly priority?: Priority;
  readonly replyCount?: number;
  readonly distinctRepliers?: number;
}

function make(a: MakeArgs): Ticket {
  const category = a.category ?? pick(['refund', 'delivery', 'order_change', 'other'] as const, r);
  const customerName = a.customerName ?? pick(CUSTOMER_NAMES, r);
  const createdAt = new Date(NOW - a.createdMsAgo).toISOString();
  const answered = a.firstResponseAfterMs !== null;

  return {
    id: a.id ?? formatTicketId(ticketSeq--),
    orderId: a.orderId !== undefined ? a.orderId : formatOrderId(orderSeq--),
    customerName,
    customerEmail: customerEmail(customerName, r),
    subject: a.subject ?? pick(SUBJECTS[category], r),
    category,
    status:
      a.status ?? (a.ownerId === null ? 'new' : answered ? 'waiting_on_customer' : 'in_progress'),
    priority: a.priority ?? (r() < 0.12 ? 'urgent' : r() < 0.35 ? 'high' : 'normal'),
    ownerId: a.ownerId,
    createdAt,
    firstResponseAt: answered
      ? new Date(NOW - a.createdMsAgo + (a.firstResponseAfterMs as number)).toISOString()
      : null,
    lastActivityAt: new Date(
      NOW - (a.lastActivityMsAgo ?? Math.min(a.createdMsAgo, 20 * MINUTE + r() * 6 * HOUR))
    ).toISOString(),
    resolvedAt: null,
    replyCount: a.replyCount ?? (answered ? 1 + Math.floor(r() * 4) : 0),
    distinctRepliers: a.distinctRepliers ?? (answered ? (r() < 0.15 ? 2 : 1) : 0)
  };
}

/* ------------------------------------------------------------------ *
 * Handwritten: the tickets that appear in "Needs you now"
 * ------------------------------------------------------------------ */

const AT_RISK: readonly Ticket[] = [
  // Unowned AND closest to breach — the exact ticket that becomes a Twitter escalation.
  make({
    id: '#BC-4821',
    orderId: 'ORD-98213',
    ownerId: null,
    customerName: 'Ritika Sharma',
    category: 'refund',
    subject: 'Refund not received',
    createdMsAgo: TARGET - 52 * MINUTE,
    firstResponseAfterMs: null,
    lastActivityMsAgo: TARGET - 52 * MINUTE,
    priority: 'urgent',
    replyCount: 0,
    distinctRepliers: 0
  }),
  make({
    id: '#BC-4759',
    orderId: 'ORD-97902',
    ownerId: null,
    customerName: 'Deepa Menon',
    category: 'refund',
    subject: 'Duplicate charge on my card',
    createdMsAgo: TARGET + 1 * HOUR,
    firstResponseAfterMs: null,
    lastActivityMsAgo: TARGET + 1 * HOUR,
    priority: 'urgent',
    replyCount: 0,
    distinctRepliers: 0
  }),
  make({
    id: '#BC-4803',
    orderId: 'ORD-98104',
    ownerId: 'u-rahul',
    customerName: 'Sunil Kamath',
    category: 'delivery',
    subject: 'Wrong item delivered',
    createdMsAgo: TARGET - 78 * MINUTE,
    firstResponseAfterMs: null,
    priority: 'high'
  }),
  make({
    id: '#BC-4776',
    orderId: 'ORD-97988',
    ownerId: 'u-rahul',
    customerName: 'Neha Agarwal',
    category: 'refund',
    subject: 'Order cancelled, no refund yet',
    createdMsAgo: TARGET - 104 * MINUTE,
    firstResponseAfterMs: null,
    priority: 'high'
  }),
  make({
    id: '#BC-4812',
    orderId: 'ORD-98150',
    ownerId: 'u-meera',
    customerName: 'Imran Sheikh',
    category: 'delivery',
    subject: 'Delivery 6 days late',
    createdMsAgo: TARGET - 111 * MINUTE,
    firstResponseAfterMs: null,
    priority: 'high'
  }),
  make({
    id: '#BC-4788',
    orderId: 'ORD-98041',
    ownerId: 'u-rahul',
    customerName: 'Fatima Ansari',
    category: 'delivery',
    subject: 'Package marked delivered but not received',
    createdMsAgo: TARGET - 116 * MINUTE,
    firstResponseAfterMs: null
  }),
  make({
    id: '#BC-4799',
    orderId: 'ORD-98077',
    ownerId: 'u-priya',
    customerName: 'Kabir Malhotra',
    category: 'refund',
    subject: 'Bank says no refund was initiated',
    createdMsAgo: TARGET - 93 * MINUTE,
    firstResponseAfterMs: null
  }),
  // Aditi is on leave. This one is breaching and nobody is coming.
  make({
    id: '#BC-4726',
    orderId: 'ORD-97814',
    ownerId: 'u-aditi',
    customerName: 'Swati Gaikwad',
    category: 'order_change',
    subject: 'Want to cancel before it ships',
    createdMsAgo: TARGET - 72 * MINUTE,
    firstResponseAfterMs: null,
    lastActivityMsAgo: 4 * DAY,
    priority: 'high'
  }),
  make({
    id: '#BC-4744',
    orderId: 'ORD-97869',
    ownerId: 'u-rahul',
    customerName: 'Naveen Reddy',
    category: 'refund',
    subject: 'Refund amount is less than what I paid',
    createdMsAgo: TARGET + 3 * HOUR,
    firstResponseAfterMs: null,
    lastActivityMsAgo: 26 * HOUR
  }),
  make({
    id: '#BC-4751',
    orderId: 'ORD-97884',
    ownerId: 'u-meera',
    customerName: 'Ishita Banerjee',
    category: 'delivery',
    subject: 'Courier keeps rescheduling',
    createdMsAgo: TARGET + 5 * HOUR,
    firstResponseAfterMs: null,
    lastActivityMsAgo: 27 * HOUR
  })
];

/* ------------------------------------------------------------------ *
 * Generated: the rest
 * ------------------------------------------------------------------ */

/** Seven unowned tickets that arrived this morning and are still inside target. */
const YOUNG_UNOWNED: readonly Ticket[] = [4, 9, 14, 19, 23, 27, 38].map((mins, i) =>
  make({
    ownerId: null,
    createdMsAgo: mins * MINUTE,
    firstResponseAfterMs: null,
    lastActivityMsAgo: mins * MINUTE,
    replyCount: 0,
    distinctRepliers: 0,
    priority: i === 6 ? 'high' : 'normal'
  })
);

/** One owned ticket still inside target and not yet answered. */
const OWNED_ON_TRACK: Ticket = make({
  ownerId: 'u-arjun',
  createdMsAgo: 6 * HOUR,
  firstResponseAfterMs: null
});

function buildAnsweredForAgent(agentId: string, count: number, untouched: number): Ticket[] {
  const out: Ticket[] = [];
  for (let i = 0; i < count; i++) {
    const isUntouched = i < untouched;
    // Untouched tickets are also the oldest — that is what makes them visible.
    const createdMsAgo = isUntouched ? (2 + r() * 3) * DAY : (0.4 + r() * 2.2) * DAY;
    out.push(
      make({
        ownerId: agentId,
        createdMsAgo,
        firstResponseAfterMs: (0.5 + r() * 8) * HOUR,
        lastActivityMsAgo: isUntouched
          ? createdMsAgo * (0.75 + r() * 0.2)
          : (0.05 + r() * 0.8) * DAY
      })
    );
  }
  return out;
}

function buildOpenTickets(): Ticket[] {
  const atRiskByAgent = new Map<string, number>();
  for (const t of AT_RISK) {
    if (t.ownerId) atRiskByAgent.set(t.ownerId, (atRiskByAgent.get(t.ownerId) ?? 0) + 1);
  }

  const answered: Ticket[] = [];
  for (const seed of AGENT_SEEDS) {
    const already = (atRiskByAgent.get(seed.id) ?? 0) + (seed.id === 'u-arjun' ? 1 : 0);
    const remaining = seed.openTarget - already;
    // Aditi's at-risk ticket is itself untouched, so it counts toward her target.
    const untouchedRemaining = Math.max(
      0,
      seed.untouchedOver24hTarget - (seed.id === 'u-aditi' ? 1 : 0)
    );
    answered.push(...buildAnsweredForAgent(seed.id, remaining, untouchedRemaining));
  }

  return shuffle([...AT_RISK, ...YOUNG_UNOWNED, OWNED_ON_TRACK, ...answered], rng(7));
}

export const OPEN_TICKETS: readonly Ticket[] = buildOpenTickets();

/* ------------------------------------------------------------------ *
 * Integrity — fail loudly, not quietly
 * ------------------------------------------------------------------ */

export function assertSeedIntegrity(): void {
  const problems: string[] = [];
  const total = OPEN_TICKETS.length;
  if (total !== 147) problems.push(`expected 147 open tickets, got ${total}`);

  const unowned = OPEN_TICKETS.filter((t) => t.ownerId === null).length;
  if (unowned !== 9) problems.push(`expected 9 unowned, got ${unowned}`);

  for (const seed of AGENT_SEEDS) {
    const n = OPEN_TICKETS.filter((t) => t.ownerId === seed.id).length;
    if (n !== seed.openTarget) {
      problems.push(`${seed.name}: expected ${seed.openTarget} open, got ${n}`);
    }
  }

  const awaiting = OPEN_TICKETS.filter((t) => t.firstResponseAt === null).length;
  if (awaiting !== 18) problems.push(`expected 18 awaiting first response, got ${awaiting}`);

  const untouchedExpected: Record<string, number> = { 'u-rahul': 6, 'u-meera': 1, 'u-aditi': 7 };
  for (const [agentId, expected] of Object.entries(untouchedExpected)) {
    const n = OPEN_TICKETS.filter(
      (t) => t.ownerId === agentId && NOW - Date.parse(t.lastActivityAt) > 24 * HOUR
    ).length;
    if (n !== expected) problems.push(`${agentId} untouched>24h: expected ${expected}, got ${n}`);
  }

  const ids = new Set(OPEN_TICKETS.map((t) => t.id));
  if (ids.size !== total) problems.push('duplicate ticket ids in seed');

  if (problems.length > 0) {
    throw new Error(`Seed integrity failed:\n  - ${problems.join('\n  - ')}`);
  }
}
