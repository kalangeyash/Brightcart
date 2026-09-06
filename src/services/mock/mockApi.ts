/**
 * Mock implementation of `SupportDeskApi`.
 *
 * In-memory, mutable, and deliberately asynchronous: every method returns a
 * Promise after a realistic delay, so loading states are real rather than
 * theoretical. Mutations write to the store AND append audit events, because
 * "who touched this and when" is a feature, not a detail — it is the one thing
 * on Manoj's list with no workaround today.
 *
 * No fetch. No axios. Nothing here reaches the network.
 */

import type {
  AgentReportRow,
  AssignTicketRequest,
  BandBreakdown,
  BreachReasonBreakdown,
  BulkAssignRequest,
  CategoryBreakdown,
  MockScenario,
  MutationResult,
  OverviewTile,
  ReportFigure,
  ReportPeriod,
  ReportSchedule,
  SetLeaveRequest,
  SetPriorityRequest,
  SetStatusRequest,
  TeamOverview,
  ThreadMessage,
  TicketDetail,
  TicketListItem,
  TicketListResult,
  TicketQuery,
  UnassignedQueue,
  UnassignedQueueItem,
  UnassignedQueueQuery,
  WeeklyReport,
  WorkloadRow
} from '../../types/api';
import type {
  ActivityEvent,
  Agent,
  BreachReason,
  ResponseBand,
  SyncStatus,
  Ticket,
  TicketCategory,
  WeeklyTicketRecord
} from '../../types/domain';
import type { SupportDeskApi } from '../api';

import { formatDateRange } from '../../lib/format';
import {
  ageMs,
  DEFAULT_SLA_POLICY,
  deriveSlaState,
  HOUR,
  isOverOwnershipTarget,
  isUntouchedOver24h,
  MINUTE,
  nowMs,
  slaUrgencyRank
} from '../../lib/sla';
import { ApiError } from '../../types/api';
import { AGENT_SEEDS, agentById, AGENTS, ALL_USERS } from './seed/agents';
import {
  CATEGORY_LABEL,
  INBOUND_OPENERS,
  INTERNAL_NOTES,
  OUTBOUND_REPLIES,
  pick,
  rng
} from './seed/content';
import { assertSeedIntegrity, OPEN_TICKETS } from './seed/tickets';
import {
  assertWeekIntegrity,
  LIVE_SINCE,
  OWNED_WITHIN_TARGET,
  PERIOD_FROM,
  PERIOD_TO,
  PREVIOUS_FROM,
  PREVIOUS_SUMMARY,
  PREVIOUS_TO,
  WEEK_RECORDS
} from './seed/week';

assertSeedIntegrity();
assertWeekIntegrity();

/* ------------------------------------------------------------------ *
 * Scenario control — CLAUDE.md §7
 * ------------------------------------------------------------------ */

let scenario: MockScenario = 'default';

export function setMockScenario(next: MockScenario): void {
  scenario = next;
}

export function readScenarioFromLocation(search: string): MockScenario {
  const value = new URLSearchParams(search).get('mock');
  const allowed: readonly MockScenario[] = [
    'default',
    'loading',
    'empty',
    'error',
    'sync-failure',
    'all-clear'
  ];
  return allowed.includes(value as MockScenario) ? (value as MockScenario) : 'default';
}

const delay = (): Promise<void> => {
  if (scenario === 'loading') return new Promise((r) => setTimeout(r, 10_000));
  return new Promise((r) => setTimeout(r, 200 + Math.random() * 200));
};

async function respond<T>(build: () => T): Promise<T> {
  await delay();
  if (scenario === 'error') {
    throw new ApiError(
      'Support Desk could not load this.',
      500,
      'Try again in a moment. If it keeps failing, check the email channel settings.'
    );
  }
  return build();
}

/* ------------------------------------------------------------------ *
 * Mutable store
 * ------------------------------------------------------------------ */

interface Store {
  tickets: Ticket[];
  agents: Agent[];
  activity: ActivityEvent[];
  sync: SyncStatus;
  schedule: ReportSchedule;
}

let eventSeq = 1;

const store: Store = {
  tickets: [...OPEN_TICKETS],
  agents: [...ALL_USERS],
  activity: [],
  sync: {
    mailbox: 'support@brightcart.in',
    healthy: true,
    lastSuccessAt: new Date(nowMs() - 2 * MINUTE).toISOString(),
    stoppedAt: null,
    reason: null
  },
  schedule: {
    enabled: true,
    dayOfWeek: 1,
    time: '08:00',
    recipients: ['manoj.p@brightcart.in']
  }
};

function logEvent(
  ticketId: string,
  type: ActivityEvent['type'],
  from: string | null,
  to: string | null,
  actorId: string | null = 'u-manoj'
): void {
  store.activity.unshift({
    id: `ev-${eventSeq++}`,
    ticketId,
    at: new Date().toISOString(),
    actorId,
    type,
    from,
    to
  });
}

function requireTicket(id: string): Ticket {
  const found = store.tickets.find((t) => t.id === id);
  if (!found) {
    throw new ApiError(`Ticket ${id} no longer exists.`, 404, 'Go back to All tickets.');
  }
  return found;
}

function updateTicket(id: string, patch: Partial<Ticket>): Ticket {
  const index = store.tickets.findIndex((t) => t.id === id);
  const next: Ticket = {
    ...store.tickets[index],
    ...patch,
    lastActivityAt: new Date().toISOString()
  };
  store.tickets[index] = next;
  return next;
}

const openCount = (agentId: string): number =>
  store.tickets.filter((t) => t.ownerId === agentId).length;

/* ------------------------------------------------------------------ *
 * Projections
 * ------------------------------------------------------------------ */

function toListItem(ticket: Ticket): TicketListItem {
  return {
    ticket,
    sla: deriveSlaState(ticket),
    owner: agentById(ticket.ownerId),
    ageMs: ageMs(ticket.createdAt),
    overOwnershipTarget: isOverOwnershipTarget(ticket)
  };
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function buildWorkload(): { rows: WorkloadRow[]; medianOpen: number } {
  const counts = AGENTS.map((a) => openCount(a.id));
  const medianOpen = Math.max(1, median(counts));

  const rows: WorkloadRow[] = AGENTS.map((agent) => {
    const owned = store.tickets.filter((t) => t.ownerId === agent.id);
    const oldest = owned.reduce<number | null>(
      (acc, t) => Math.max(acc ?? 0, ageMs(t.createdAt)),
      null
    );
    const lastActivity =
      owned
        .map((t) => t.lastActivityAt)
        .sort()
        .at(-1) ?? null;

    return {
      agent,
      open: owned.length,
      // Relative to the team median, not to a fixed cap — there is no stated cap,
      // and comparison is what Manoj actually asked for.
      loadRatio: Math.min(1, owned.length / (medianOpen * 3)),
      breaching: owned.filter((t) => {
        const k = deriveSlaState(t).kind;
        return k === 'due_soon' || k === 'breached';
      }).length,
      untouchedOver24h: owned.filter((t) => isUntouchedOver24h(t)).length,
      oldestOpenAgeMs: oldest,
      lastActivityAt: lastActivity
    };
  });

  // Sorted by open descending: the purpose of the screen is to surface the
  // person drowning, not to look up a known person. That is what search is for.
  rows.sort((a, b) => b.open - a.open);
  return { rows, medianOpen };
}

function buildTiles(): OverviewTile[] {
  const unowned = store.tickets.filter((t) => t.ownerId === null);
  const overTarget = unowned.filter((t) => isOverOwnershipTarget(t)).length;
  const states = store.tickets.map((t) => deriveSlaState(t).kind);
  const breaching = states.filter((k) => k === 'due_soon').length;
  const breached = states.filter((k) => k === 'breached').length;
  const assigned = store.tickets.length - unowned.length;

  return [
    {
      key: 'unowned',
      label: 'Unowned now',
      value: unowned.length,
      subLabel: overTarget > 0 ? `${overTarget} over 30 min` : null,
      tone: overTarget > 0 ? 'urgent' : 'neutral'
    },
    {
      key: 'breaching',
      label: 'Breaching in under 2h',
      value: breaching,
      subLabel: null,
      tone: breaching > 0 ? 'urgent' : 'neutral'
    },
    {
      key: 'breached',
      label: 'Breached today',
      value: breached,
      subLabel: null,
      tone: breached > 0 ? 'danger' : 'neutral'
    },
    // Deliberately neutral. This is context, not an alarm — giving it colour is
    // how a dashboard stops meaning anything.
    {
      key: 'open',
      label: 'Open across team',
      value: store.tickets.length,
      subLabel: `${assigned} assigned · ${unowned.length} unowned`,
      tone: 'neutral'
    }
  ];
}

function suggestOwner(): { agent: Agent | null; open: number | null } {
  const candidates = AGENTS.filter((a) => a.status === 'active');
  if (candidates.length === 0) return { agent: null, open: null };
  const best = candidates.reduce((lo, a) => (openCount(a.id) < openCount(lo.id) ? a : lo));
  return { agent: best, open: openCount(best.id) };
}

/* ------------------------------------------------------------------ *
 * Reporting
 * ------------------------------------------------------------------ */

const BAND_LABEL: Readonly<Record<ResponseBand, string>> = {
  under_1h: 'Under 1h',
  h1_4: '1–4h',
  h4_12: '4–12h',
  h12_24: '12–24h',
  breached: 'Breached'
};

const BREACH_REASON_LABEL: Readonly<Record<BreachReason, string>> = {
  arrived_overnight: 'Arrived overnight, unowned until morning',
  unowned_over_2h: 'Unowned more than 2h during the day',
  reopened: 'Reopened by a customer reply'
};

function tally<K extends string>(
  records: readonly WeeklyTicketRecord[],
  key: (r: WeeklyTicketRecord) => K | null
) {
  return records.reduce<Record<string, number>>((acc, rec) => {
    const k = key(rec);
    if (k !== null) acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

function buildReport(): WeeklyReport {
  const records = WEEK_RECORDS;
  const received = records.length;
  const breached = records.filter((r) => r.band === 'breached').length;
  const resolved = records.filter((r) => r.resolved).length;
  const withinTarget = ((received - breached) / received) * 100;
  const ownedWithin = (OWNED_WITHIN_TARGET / received) * 100;
  const medianMinutes = median(
    records.filter((r) => r.band !== 'breached').map((r) => r.firstResponseMinutes ?? 0)
  );

  const period: ReportPeriod = {
    from: PERIOD_FROM,
    to: PERIOD_TO,
    label: formatDateRange(PERIOD_FROM, PERIOD_TO)
  };
  const previousPeriod: ReportPeriod = {
    from: PREVIOUS_FROM,
    to: PREVIOUS_TO,
    label: formatDateRange(PREVIOUS_FROM, PREVIOUS_TO)
  };

  // Order is meaningful. The first two are the promises Brightcart actually
  // made; everything below them is context for those two.
  const headline: ReportFigure[] = [
    {
      key: 'within_24h',
      label: 'First response within 24h',
      value: Math.round(withinTarget),
      unit: 'percent',
      deltaVsPrevious: Math.round(withinTarget) - PREVIOUS_SUMMARY.withinTargetPercent,
      deltaIsGood: true,
      target: 100,
      drillDown: { sla: 'breached' }
    },
    {
      key: 'owned_within_30m',
      label: 'Never unowned over 30 min',
      value: Math.round(ownedWithin),
      unit: 'percent',
      deltaVsPrevious: Math.round(ownedWithin) - PREVIOUS_SUMMARY.ownedWithinTargetPercent,
      deltaIsGood: true,
      target: 100,
      drillDown: { ownerId: 'unowned' }
    },
    {
      key: 'received',
      label: 'Tickets received',
      value: received,
      unit: 'count',
      deltaVsPrevious: Math.round(
        ((received - PREVIOUS_SUMMARY.received) / PREVIOUS_SUMMARY.received) * 100
      ),
      deltaIsGood: null,
      target: null,
      drillDown: { from: PERIOD_FROM, to: PERIOD_TO }
    },
    {
      key: 'resolved',
      label: 'Resolved',
      value: resolved,
      unit: 'count',
      deltaVsPrevious: Math.round(
        ((resolved - PREVIOUS_SUMMARY.resolved) / PREVIOUS_SUMMARY.resolved) * 100
      ),
      deltaIsGood: true,
      target: null,
      drillDown: { status: ['resolved', 'closed'] }
    },
    {
      key: 'breached',
      label: 'Breached',
      value: breached,
      unit: 'count',
      deltaVsPrevious: breached - PREVIOUS_SUMMARY.breached,
      deltaIsGood: false,
      target: null,
      drillDown: { sla: 'breached' }
    },
    {
      key: 'median_first_response',
      label: 'Median first response',
      value: medianMinutes * MINUTE,
      unit: 'duration_ms',
      deltaVsPrevious: (medianMinutes - PREVIOUS_SUMMARY.medianFirstResponseMinutes) * MINUTE,
      deltaIsGood: false,
      target: null,
      drillDown: null
    }
  ];

  const bandCounts = tally(records, (r) => r.band);
  const distribution: BandBreakdown[] = (
    ['under_1h', 'h1_4', 'h4_12', 'h12_24', 'breached'] as const
  ).map((band) => ({
    band,
    label: BAND_LABEL[band],
    count: bandCounts[band] ?? 0,
    share: ((bandCounts[band] ?? 0) / received) * 100
  }));

  const reasonCounts = tally(records, (r) => r.breachReason);
  const breachReasons: BreachReasonBreakdown[] = (
    ['arrived_overnight', 'unowned_over_2h', 'reopened'] as const
  )
    .map((reason) => ({
      reason,
      label: BREACH_REASON_LABEL[reason],
      count: reasonCounts[reason] ?? 0
    }))
    .sort((a, b) => b.count - a.count);

  const categoryCounts = tally(records, (r) => r.category);
  const categories: CategoryBreakdown[] = (['refund', 'delivery', 'order_change', 'other'] as const)
    .map((category: TicketCategory) => ({
      category,
      label: CATEGORY_LABEL[category],
      count: categoryCounts[category] ?? 0,
      share: ((categoryCounts[category] ?? 0) / received) * 100
    }))
    .sort((a, b) => b.count - a.count);

  const perAgent: AgentReportRow[] = AGENT_SEEDS.map((seed) => {
    const mine = records.filter((r) => r.handlerId === seed.id);
    const answered = mine.filter((r) => r.band !== 'breached');
    return {
      agent: agentById(seed.id) as Agent,
      handled: mine.length,
      resolved: mine.filter((r) => r.resolved).length,
      medianFirstResponseMs:
        answered.length > 0
          ? median(answered.map((r) => r.firstResponseMinutes ?? 0)) * MINUTE
          : null,
      breached: mine.filter((r) => r.band === 'breached').length
    };
    // Sorted by handled, not worst-first. This is a workload report, not a
    // leaderboard — nobody at Brightcart asked for a performance review.
  }).sort((a, b) => b.handled - a.handled);

  return {
    period,
    previousPeriod,
    headline,
    distribution,
    breachReasons,
    categories,
    perAgent,
    schedule: store.schedule,
    insufficientData: false,
    liveSince: LIVE_SINCE
  };
}

/* ------------------------------------------------------------------ *
 * Thread + activity for ticket detail
 * ------------------------------------------------------------------ */

function buildThread(ticket: Ticket): ThreadMessage[] {
  const r = rng(ticket.id.length * 977 + ticket.subject.length);
  const created = Date.parse(ticket.createdAt);
  const messages: ThreadMessage[] = [
    {
      id: `${ticket.id}-m1`,
      at: ticket.createdAt,
      authorName: ticket.customerName,
      authorId: null,
      direction: 'inbound',
      body: `${pick(INBOUND_OPENERS, r)}${ticket.orderId ? ` Order ${ticket.orderId}.` : ''}`
    }
  ];

  if (ticket.firstResponseAt) {
    const owner = agentById(ticket.ownerId);
    messages.push({
      id: `${ticket.id}-m2`,
      at: ticket.firstResponseAt,
      authorName: owner?.name ?? 'Support',
      authorId: owner?.id ?? null,
      direction: 'outbound',
      body: pick(OUTBOUND_REPLIES, r)
    });
    if (ticket.distinctRepliers > 1) {
      messages.push({
        id: `${ticket.id}-m3`,
        at: new Date(Date.parse(ticket.firstResponseAt) + 40 * MINUTE).toISOString(),
        authorName: 'Sneha Kulkarni',
        authorId: 'u-sneha',
        direction: 'internal_note',
        body: INTERNAL_NOTES[1]
      });
    }
  } else if (Date.now() - created > 6 * HOUR) {
    messages.push({
      id: `${ticket.id}-n1`,
      at: new Date(created + 2 * HOUR).toISOString(),
      authorName: 'Manoj Patil',
      authorId: 'u-manoj',
      direction: 'internal_note',
      body: pick(INTERNAL_NOTES, r)
    });
  }

  return messages;
}

function seededActivity(ticket: Ticket): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      id: `${ticket.id}-e1`,
      ticketId: ticket.id,
      at: ticket.createdAt,
      actorId: null,
      type: 'ticket_created',
      from: null,
      to: 'Created from email'
    }
  ];
  if (ticket.ownerId) {
    events.push({
      id: `${ticket.id}-e2`,
      ticketId: ticket.id,
      at: new Date(Date.parse(ticket.createdAt) + 12 * MINUTE).toISOString(),
      actorId: ticket.ownerId,
      type: 'self_claimed',
      from: 'Unowned',
      to: agentById(ticket.ownerId)?.name ?? ticket.ownerId
    });
  }
  if (deriveSlaState(ticket).kind === 'breached') {
    events.push({
      id: `${ticket.id}-e3`,
      ticketId: ticket.id,
      at: new Date(
        Date.parse(ticket.createdAt) + DEFAULT_SLA_POLICY.firstResponseTargetMs
      ).toISOString(),
      actorId: null,
      type: 'sla_breached',
      from: null,
      to: 'First response target missed'
    });
  }
  return events.reverse();
}

/* ------------------------------------------------------------------ *
 * The implementation
 * ------------------------------------------------------------------ */

export class MockSupportDeskApi implements SupportDeskApi {
  getTeamOverview(): Promise<TeamOverview> {
    return respond(() => {
      const allClear = scenario === 'all-clear' || scenario === 'empty';
      const { rows, medianOpen } = buildWorkload();

      const needsYouNow = allClear
        ? []
        : store.tickets
            .map(toListItem)
            .filter((i) => i.sla.kind === 'due_soon' || i.sla.kind === 'breached')
            .sort((a, b) => slaUrgencyRank(a.sla) - slaUrgencyRank(b.sla))
            .slice(0, 5);

      const tiles = allClear
        ? buildTiles().map((t) =>
            t.key === 'open' ? t : { ...t, value: 0, subLabel: null, tone: 'neutral' as const }
          )
        : buildTiles();

      return {
        generatedAt: new Date().toISOString(),
        tiles,
        needsYouNow,
        workload: rows,
        teamMedianOpen: medianOpen,
        sync: this.currentSync(),
        allClear,
        lastUnownedClearedAt: new Date(nowMs() - 4 * MINUTE).toISOString()
      };
    });
  }

  getUnassignedQueue(query: UnassignedQueueQuery = {}): Promise<UnassignedQueue> {
    return respond(() => {
      const suggestion = suggestOwner();
      const all = store.tickets.filter((t) => t.ownerId === null).map(toListItem);

      const filtered = all.filter((i) => {
        if (query.age === 'over_30m') return i.ageMs > 30 * MINUTE;
        if (query.age === 'over_2h') return i.ageMs > 2 * HOUR;
        return true;
      });

      const items: UnassignedQueueItem[] = (scenario === 'empty' ? [] : filtered)
        .sort((a, b) => b.ageMs - a.ageMs)
        .map((i) => ({
          ...i,
          suggestedOwner: suggestion.agent,
          suggestedOwnerOpenCount: suggestion.open
        }));

      return {
        items,
        overTargetCount: all.filter((i) => i.overOwnershipTarget).length,
        lastClearedAt: new Date(nowMs() - 4 * MINUTE).toISOString()
      };
    });
  }

  getTickets(query: TicketQuery = {}): Promise<TicketListResult> {
    return respond(() => {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 25;
      const term = query.search?.trim().toLowerCase() ?? '';

      let items = (scenario === 'empty' ? [] : store.tickets).map(toListItem);

      if (term) {
        items = items.filter(({ ticket }) =>
          [ticket.id, ticket.orderId ?? '', ticket.customerName, ticket.subject]
            .join(' ')
            .toLowerCase()
            .includes(term)
        );
      }
      if (query.ownerId && query.ownerId !== 'any') {
        items = items.filter(({ ticket }) =>
          query.ownerId === 'unowned' ? ticket.ownerId === null : ticket.ownerId === query.ownerId
        );
      }
      if (query.status?.length)
        items = items.filter((i) => query.status!.includes(i.ticket.status));
      if (query.priority?.length)
        items = items.filter((i) => query.priority!.includes(i.ticket.priority));
      if (query.category?.length)
        items = items.filter((i) => query.category!.includes(i.ticket.category));
      if (query.sla && query.sla !== 'any') {
        items = items.filter((i) => {
          if (query.sla === 'breached') return i.sla.kind === 'breached';
          if (query.sla === 'under_4h')
            return (
              i.sla.kind === 'due_soon' ||
              (i.sla.kind === 'on_track' && i.sla.msRemaining < 4 * HOUR)
            );
          return i.sla.kind === 'on_track' || i.sla.kind === 'met';
        });
      }

      switch (query.sort ?? 'sla') {
        case 'newest':
          items.sort((a, b) => (b.ageMs - a.ageMs === 0 ? 0 : a.ageMs - b.ageMs));
          break;
        case 'oldest':
          items.sort((a, b) => b.ageMs - a.ageMs);
          break;
        case 'last_activity':
          items.sort(
            (a, b) => Date.parse(b.ticket.lastActivityAt) - Date.parse(a.ticket.lastActivityAt)
          );
          break;
        default:
          items.sort((a, b) => slaUrgencyRank(a.sla) - slaUrgencyRank(b.sla));
      }

      const filtersApplied = Boolean(
        term ||
        (query.ownerId && query.ownerId !== 'any') ||
        query.status?.length ||
        query.priority?.length ||
        query.category?.length ||
        (query.sla && query.sla !== 'any')
      );

      return {
        items: items.slice((page - 1) * pageSize, page * pageSize),
        total: items.length,
        page,
        pageSize,
        filtersApplied,
        unownedCount: items.filter((i) => i.ticket.ownerId === null).length
      };
    });
  }

  getTicket(ticketId: string): Promise<TicketDetail> {
    return respond(() => {
      const ticket = requireTicket(ticketId);
      const live = store.activity.filter((e) => e.ticketId === ticketId);
      return {
        ticket,
        sla: deriveSlaState(ticket),
        owner: agentById(ticket.ownerId),
        thread: buildThread(ticket),
        activity: [...live, ...seededActivity(ticket)],
        previousTicketCount: store.tickets.filter(
          (t) => t.customerEmail === ticket.customerEmail && t.id !== ticket.id
        ).length
      };
    });
  }

  getAgents(): Promise<readonly Agent[]> {
    return respond(() => store.agents);
  }

  private currentSync(): SyncStatus {
    if (scenario === 'sync-failure') {
      return {
        mailbox: 'support@brightcart.in',
        healthy: false,
        lastSuccessAt: '2026-09-07T08:14:00+05:30',
        stoppedAt: '2026-09-07T08:14:00+05:30',
        reason: 'Mailbox authorisation expired'
      };
    }
    return store.sync;
  }

  getSyncStatus(): Promise<SyncStatus> {
    return respond(() => this.currentSync());
  }

  getWeeklyReport(period?: Pick<ReportPeriod, 'from' | 'to'>): Promise<WeeklyReport> {
    return respond(() => {
      const report = buildReport();
      if (scenario === 'empty') {
        return { ...report, insufficientData: true };
      }
      if (period) {
        const days = (Date.parse(period.to) - Date.parse(period.from)) / (24 * HOUR);
        if (days < 3) {
          return {
            ...report,
            period: { ...period, label: formatDateRange(period.from, period.to) },
            insufficientData: true
          };
        }
      }
      return report;
    });
  }

  /* --------------------------- mutations --------------------------- */

  assignTicket({ ticketId, ownerId }: AssignTicketRequest): Promise<MutationResult<Ticket>> {
    return respond(() => {
      const before = requireTicket(ticketId);
      const owner = agentById(ownerId);
      if (!owner) throw new ApiError('That agent no longer exists.', 404, 'Pick another agent.');

      const next = updateTicket(ticketId, {
        ownerId,
        status: before.status === 'new' ? 'in_progress' : before.status
      });
      logEvent(
        ticketId,
        before.ownerId === null ? 'assigned' : 'reassigned',
        agentById(before.ownerId)?.name ?? 'Unowned',
        owner.name
      );
      // The confirmation names the outcome, not the risk.
      return { data: next, message: `Assigned to ${owner.name}.` };
    });
  }

  bulkAssign({
    ticketIds,
    ownerId
  }: BulkAssignRequest): Promise<MutationResult<readonly Ticket[]>> {
    return respond(() => {
      const owner = agentById(ownerId);
      if (!owner) throw new ApiError('That agent no longer exists.', 404, 'Pick another agent.');
      const updated = ticketIds.map((id) => {
        const before = requireTicket(id);
        logEvent(
          id,
          before.ownerId === null ? 'assigned' : 'reassigned',
          agentById(before.ownerId)?.name ?? 'Unowned',
          owner.name
        );
        return updateTicket(id, { ownerId });
      });
      return {
        data: updated,
        message: `${updated.length} tickets assigned to ${owner.name}. He now has ${openCount(ownerId)} open.`
      };
    });
  }

  setPriority({ ticketId, priority }: SetPriorityRequest): Promise<MutationResult<Ticket>> {
    return respond(() => {
      const before = requireTicket(ticketId);
      const next = updateTicket(ticketId, { priority });
      logEvent(ticketId, 'priority_changed', before.priority, priority);
      return { data: next, message: `Priority set to ${priority}.` };
    });
  }

  setStatus({ ticketId, status }: SetStatusRequest): Promise<MutationResult<Ticket>> {
    return respond(() => {
      const before = requireTicket(ticketId);
      const next = updateTicket(ticketId, {
        status,
        resolvedAt: status === 'resolved' ? new Date().toISOString() : before.resolvedAt
      });
      logEvent(ticketId, 'status_changed', before.status, status);
      return { data: next, message: `Status changed to ${status.replace(/_/g, ' ')}.` };
    });
  }

  setLeave({ agentId, leaveFrom, leaveUntil }: SetLeaveRequest): Promise<MutationResult<Agent>> {
    return respond(() => {
      const index = store.agents.findIndex((a) => a.id === agentId);
      if (index < 0)
        throw new ApiError('That agent no longer exists.', 404, 'Go back to the team list.');
      const next: Agent = {
        ...store.agents[index],
        leaveFrom,
        leaveUntil,
        status: leaveUntil ? 'on_leave' : 'active'
      };
      store.agents[index] = next;
      return {
        data: next,
        message: leaveUntil ? `${next.name} marked on leave.` : `${next.name} is back.`
      };
    });
  }

  reassignAllFrom(agentId: string): Promise<MutationResult<readonly Ticket[]>> {
    return respond(() => {
      const held = store.tickets.filter((t) => t.ownerId === agentId);
      const targets = AGENTS.filter((a) => a.status === 'active' && a.id !== agentId);
      if (targets.length === 0) {
        throw new ApiError(
          'Nobody is available to take these.',
          409,
          'Mark an agent as active first.'
        );
      }
      // Spread across the lightest-loaded agents, recomputing after each move.
      const updated = held.map((t) => {
        const target = targets.reduce((lo, a) => (openCount(a.id) < openCount(lo.id) ? a : lo));
        logEvent(t.id, 'reassigned', agentById(agentId)?.name ?? 'Unknown', target.name);
        return updateTicket(t.id, { ownerId: target.id });
      });
      return { data: updated, message: `${updated.length} tickets reassigned.` };
    });
  }

  saveReportSchedule(schedule: ReportSchedule): Promise<MutationResult<ReportSchedule>> {
    return respond(() => {
      store.schedule = schedule;
      return {
        data: schedule,
        message: schedule.enabled
          ? `Report scheduled for ${schedule.time} every Monday.`
          : 'Scheduled report turned off.'
      };
    });
  }

  retrySync(): Promise<MutationResult<SyncStatus>> {
    return respond(() => {
      store.sync = {
        mailbox: 'support@brightcart.in',
        healthy: true,
        lastSuccessAt: new Date().toISOString(),
        stoppedAt: null,
        reason: null
      };
      setMockScenario('default');
      return { data: store.sync, message: 'Sync restored.' };
    });
  }
}

/** Test hook — restores the store between test cases. */
export function resetMockStore(): void {
  store.tickets = [...OPEN_TICKETS];
  store.agents = [...ALL_USERS];
  store.activity = [];
  scenario = 'default';
}
