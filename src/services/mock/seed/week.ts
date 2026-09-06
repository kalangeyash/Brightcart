/**
 * Seed: the reporting week, 31 Aug – 6 Sep 2026 (Mon–Sun).
 *
 * CORRECTION vs 03-screen-specs.md: 8 September 2026 is a Tuesday. The screens
 * are dated Monday, so `NOW` is Monday 7 Sep and the report's default period is
 * the last complete week, 31 Aug – 6 Sep.
 *
 * Records are constructed so the hard totals hold exactly and everything else is
 * COMPUTED from them. Medians are read out of the data rather than asserted,
 * which is the only way a report can be trusted to reconcile with its own
 * drill-downs.
 *
 *   587 received  =  121 under 1h + 188 in 1–4h + 152 in 4–12h + 73 in 12–24h + 53 breached
 *   587           =  241 refunds + 194 delivery + 106 order change + 46 other
 *    53 breached  =   22 arrived overnight + 17 unowned over 2h + 14 reopened
 *   587           =  the per-agent `weeklyHandled` totals in agents.ts
 *    53           =  the per-agent `weeklyBreached` totals in agents.ts
 */

import type {
  BreachReason,
  ResponseBand,
  TicketCategory,
  WeeklyTicketRecord
} from '../../../types/domain';

import { formatTicketId } from '../../../lib/format';
import { AGENT_SEEDS } from './agents';
import { rng, shuffle } from './content';

export const PERIOD_FROM = '2026-08-31T00:00:00+05:30';
export const PERIOD_TO = '2026-09-06T23:59:59+05:30';
export const PREVIOUS_FROM = '2026-08-24T00:00:00+05:30';
export const PREVIOUS_TO = '2026-08-30T23:59:59+05:30';
export const LIVE_SINCE = '2026-07-13T00:00:00+05:30';

const BAND_COUNTS: ReadonlyArray<readonly [ResponseBand, number]> = [
  ['under_1h', 121],
  ['h1_4', 188],
  ['h4_12', 152],
  ['h12_24', 73]
];

const CATEGORY_COUNTS: ReadonlyArray<readonly [TicketCategory, number]> = [
  ['refund', 241],
  ['delivery', 194],
  ['order_change', 106],
  ['other', 46]
];

const BREACH_REASON_COUNTS: ReadonlyArray<readonly [BreachReason, number]> = [
  ['arrived_overnight', 22],
  ['unowned_over_2h', 17],
  ['reopened', 14]
];

const BAND_MINUTE_RANGE: Readonly<
  Record<Exclude<ResponseBand, 'breached'>, readonly [number, number]>
> = {
  under_1h: [4, 59],
  h1_4: [61, 239],
  h4_12: [242, 719],
  h12_24: [722, 1439]
};

export const TOTAL_RECEIVED = 587;
export const TOTAL_RESOLVED = 561;
/** 88% of tickets never sat unowned past the 30-minute target. */
export const OWNED_WITHIN_TARGET = 517;

/** Figures for the previous week, used only for the delta arrows. */
/**
 * CORRECTION: 03-screen-specs.md gives a median first response of 4h 20m. That
 * is arithmetically impossible alongside its own distribution — 121 tickets under
 * 1h and 188 in the 1–4h band puts the 267th of 534 answered tickets inside the
 * 1–4h band, so the median cannot exceed 4h. The computed value is 3h 24m. The
 * distribution was the more carefully derived of the two, so it wins.
 */
export const PREVIOUS_SUMMARY = {
  received: 564,
  resolved: 524,
  breached: 71,
  withinTargetPercent: 85,
  ownedWithinTargetPercent: 77,
  // 203.5 this week + the 51m improvement the spec claims.
  medianFirstResponseMinutes: 255
} as const;

function expand<T>(pairs: ReadonlyArray<readonly [T, number]>): T[] {
  return pairs.flatMap(([value, count]) => Array.from({ length: count }, () => value));
}

function buildWeek(): WeeklyTicketRecord[] {
  const r = rng(31082026);

  /* Slots, one per handled ticket, ordered fastest-agent-first so that handing
     out the band pool in order produces sensible per-agent medians while the
     global band totals stay exact. */
  const orderedAgents = [...AGENT_SEEDS].sort(
    (a, b) => a.weeklyMedianMinutes - b.weeklyMedianMinutes
  );

  const nonBreachedSlots: string[] = [];
  const breachedSlots: string[] = [];
  for (const a of orderedAgents) {
    const nonBreached = a.weeklyHandled - a.weeklyBreached;
    for (let i = 0; i < nonBreached; i++) nonBreachedSlots.push(a.id);
    for (let i = 0; i < a.weeklyBreached; i++) breachedSlots.push(a.id);
  }

  const bandPool = expand(BAND_COUNTS);
  if (bandPool.length !== nonBreachedSlots.length) {
    throw new Error(
      `band pool ${bandPool.length} does not match non-breached slots ${nonBreachedSlots.length}`
    );
  }

  const categoryPool = shuffle(expand(CATEGORY_COUNTS), rng(41));
  const reasonPool = shuffle(expand(BREACH_REASON_COUNTS), rng(53));

  const records: WeeklyTicketRecord[] = [];
  // Below both the handwritten and generated open-ticket ranges.
  let seq = 4180;
  let categoryIndex = 0;

  const from = Date.parse(PERIOD_FROM);
  const span = Date.parse(PERIOD_TO) - from;
  const receivedAt = (): string => new Date(from + r() * span).toISOString();

  nonBreachedSlots.forEach((handlerId, i) => {
    const band = bandPool[i] as Exclude<ResponseBand, 'breached'>;
    const [lo, hi] = BAND_MINUTE_RANGE[band];
    records.push({
      ticketId: formatTicketId(seq--),
      receivedAt: receivedAt(),
      category: categoryPool[categoryIndex++],
      handlerId,
      firstResponseMinutes: Math.round(lo + r() * (hi - lo)),
      band,
      resolved: true,
      ownedWithinTargetMs: true,
      breachReason: null
    });
  });

  breachedSlots.forEach((handlerId, i) => {
    const reason = reasonPool[i];
    records.push({
      ticketId: formatTicketId(seq--),
      receivedAt: receivedAt(),
      category: categoryPool[categoryIndex++],
      handlerId,
      firstResponseMinutes: Math.round(1441 + r() * 2800),
      band: 'breached',
      resolved: false,
      ownedWithinTargetMs: reason !== 'unowned_over_2h',
      breachReason: reason
    });
  });

  /* Reconcile the two remaining totals against the constructed set rather than
     asserting them independently. A breached ticket is still usually resolved in
     the end — it was late, not abandoned — so the resolved surplus comes from
     the breached pile, which is also the honest reading of the number. */
  const shuffled = shuffle(records, rng(97));

  let resolvedToAdd = TOTAL_RESOLVED - shuffled.filter((x) => x.resolved).length;
  let ownedToClear = shuffled.filter((x) => x.ownedWithinTargetMs).length - OWNED_WITHIN_TARGET;

  return shuffled.map((rec) => {
    let next = rec;
    if (resolvedToAdd > 0 && !next.resolved) {
      next = { ...next, resolved: true };
      resolvedToAdd--;
    }
    if (ownedToClear > 0 && next.ownedWithinTargetMs) {
      next = { ...next, ownedWithinTargetMs: false };
      ownedToClear--;
    }
    return next;
  });
}

export const WEEK_RECORDS: readonly WeeklyTicketRecord[] = buildWeek();

export function assertWeekIntegrity(): void {
  const problems: string[] = [];
  const n = WEEK_RECORDS.length;
  if (n !== TOTAL_RECEIVED) problems.push(`expected ${TOTAL_RECEIVED} records, got ${n}`);

  const count = <K extends string>(
    key: (rec: WeeklyTicketRecord) => K | null
  ): Record<string, number> =>
    WEEK_RECORDS.reduce<Record<string, number>>((acc, rec) => {
      const k = key(rec);
      if (k !== null) acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

  const bands = count((rec) => rec.band);
  for (const [band, expected] of [...BAND_COUNTS, ['breached', 53] as const]) {
    if (bands[band] !== expected)
      problems.push(`band ${band}: expected ${expected}, got ${bands[band] ?? 0}`);
  }

  const cats = count((rec) => rec.category);
  for (const [cat, expected] of CATEGORY_COUNTS) {
    if (cats[cat] !== expected)
      problems.push(`category ${cat}: expected ${expected}, got ${cats[cat] ?? 0}`);
  }

  const reasons = count((rec) => rec.breachReason);
  for (const [reason, expected] of BREACH_REASON_COUNTS) {
    if (reasons[reason] !== expected) {
      problems.push(`breach reason ${reason}: expected ${expected}, got ${reasons[reason] ?? 0}`);
    }
  }

  const handlers = count((rec) => rec.handlerId);
  for (const a of AGENT_SEEDS) {
    if (handlers[a.id] !== a.weeklyHandled) {
      problems.push(`${a.name} handled: expected ${a.weeklyHandled}, got ${handlers[a.id] ?? 0}`);
    }
    const breached = WEEK_RECORDS.filter(
      (x) => x.handlerId === a.id && x.band === 'breached'
    ).length;
    if (breached !== a.weeklyBreached) {
      problems.push(`${a.name} breached: expected ${a.weeklyBreached}, got ${breached}`);
    }
  }

  const resolved = WEEK_RECORDS.filter((x) => x.resolved).length;
  if (resolved !== TOTAL_RESOLVED)
    problems.push(`resolved: expected ${TOTAL_RESOLVED}, got ${resolved}`);

  const owned = WEEK_RECORDS.filter((x) => x.ownedWithinTargetMs).length;
  if (owned !== OWNED_WITHIN_TARGET) {
    problems.push(`owned within target: expected ${OWNED_WITHIN_TARGET}, got ${owned}`);
  }

  if (problems.length > 0) {
    throw new Error(`Week seed integrity failed:\n  - ${problems.join('\n  - ')}`);
  }
}
