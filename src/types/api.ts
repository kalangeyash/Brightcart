/**
 * API contract — Brightcart Support Desk
 *
 * Every shape the UI is allowed to consume. The mock implementation and any
 * future HTTP implementation both satisfy these exactly, which is what makes
 * the swap a one-file change.
 *
 * Note on naming: these are shaped by the SCREEN that needs them (feature-list
 * row numbers in the comments), not by database tables. Screens should never
 * assemble a view model out of three calls.
 */

import type {
  ActivityEvent,
  Agent,
  BreachReason,
  IsoDateTime,
  Priority,
  ResponseBand,
  SlaState,
  SyncStatus,
  Ticket,
  TicketCategory,
  TicketStatus
} from './domain';

/* ------------------------------------------------------------------ *
 * Shared
 * ------------------------------------------------------------------ */

/** A ticket plus everything derived that a list row needs. Assembled server-side. */
export interface TicketListItem {
  readonly ticket: Ticket;
  readonly sla: SlaState;
  readonly owner: Agent | null;
  /** Age since arrival, for the unowned queue's 30-minute target. */
  readonly ageMs: number;
  readonly overOwnershipTarget: boolean;
}

export interface Paginated<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** Errors the UI is expected to render. Never a bare code. */
export class ApiError extends Error {
  constructor(
    override readonly message: string,
    readonly status: number,
    /** What the person can do next. Feeds the error state's action. */
    readonly recovery: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/* ------------------------------------------------------------------ *
 * Row 6 · Team Overview
 * ------------------------------------------------------------------ */

export type TileTone = 'neutral' | 'urgent' | 'danger';

export interface OverviewTile {
  readonly key: 'unowned' | 'breaching' | 'breached' | 'open';
  readonly label: string;
  readonly value: number;
  readonly subLabel: string | null;
  readonly tone: TileTone;
}

export interface WorkloadRow {
  readonly agent: Agent;
  readonly open: number;
  /** open / team median, clamped 0–1 for the bar. Comparison, not a cap. */
  readonly loadRatio: number;
  readonly breaching: number;
  readonly untouchedOver24h: number;
  readonly oldestOpenAgeMs: number | null;
  readonly lastActivityAt: IsoDateTime | null;
}

export interface TeamOverview {
  readonly generatedAt: IsoDateTime;
  readonly tiles: readonly OverviewTile[];
  /** Breach risk, soonest first. Top 5. */
  readonly needsYouNow: readonly TicketListItem[];
  readonly workload: readonly WorkloadRow[];
  readonly teamMedianOpen: number;
  readonly sync: SyncStatus;
  /** True when nothing is unowned and nothing is breaching — the row 7 state. */
  readonly allClear: boolean;
  readonly lastUnownedClearedAt: IsoDateTime | null;
}

/* ------------------------------------------------------------------ *
 * Rows 8–11 · Queues and lists
 * ------------------------------------------------------------------ */

export type UnownedAgeFilter = 'all' | 'over_30m' | 'over_2h';

export interface UnassignedQueueQuery {
  readonly age?: UnownedAgeFilter;
}

export interface UnassignedQueueItem extends TicketListItem {
  /** Lightest current load, excluding agents on leave. A suggestion, not an assignment. */
  readonly suggestedOwner: Agent | null;
  readonly suggestedOwnerOpenCount: number | null;
}

export interface UnassignedQueue {
  readonly items: readonly UnassignedQueueItem[];
  readonly overTargetCount: number;
  readonly lastClearedAt: IsoDateTime | null;
}

export type SlaFilter = 'any' | 'breached' | 'under_4h' | 'on_track';
export type OwnerFilter = string | 'any' | 'unowned';

export interface TicketQuery {
  readonly search?: string;
  readonly ownerId?: OwnerFilter;
  readonly status?: readonly TicketStatus[];
  readonly priority?: readonly Priority[];
  readonly category?: readonly TicketCategory[];
  readonly sla?: SlaFilter;
  readonly from?: IsoDateTime;
  readonly to?: IsoDateTime;
  readonly sort?: 'sla' | 'newest' | 'oldest' | 'last_activity';
  readonly page?: number;
  readonly pageSize?: number;
}

/** Distinguishes "no tickets" from "no tickets match your filters" (rows 11, 24). */
export interface TicketListResult extends Paginated<TicketListItem> {
  readonly filtersApplied: boolean;
  readonly unownedCount: number;
}

/* ------------------------------------------------------------------ *
 * Rows 12–13 · Ticket detail
 * ------------------------------------------------------------------ */

export interface ThreadMessage {
  readonly id: string;
  readonly at: IsoDateTime;
  readonly authorName: string;
  readonly authorId: string | null;
  readonly direction: 'inbound' | 'outbound' | 'internal_note';
  readonly body: string;
}

export interface TicketDetail {
  readonly ticket: Ticket;
  readonly sla: SlaState;
  readonly owner: Agent | null;
  readonly thread: readonly ThreadMessage[];
  readonly activity: readonly ActivityEvent[];
  /** Ritika's problem: a repeat contact should be visible before you reply. */
  readonly previousTicketCount: number;
}

/* ------------------------------------------------------------------ *
 * Rows 15–16 · Reports
 * ------------------------------------------------------------------ */

export interface ReportPeriod {
  readonly from: IsoDateTime;
  readonly to: IsoDateTime;
  readonly label: string;
}

/** A figure plus its change against the previous period, plus its drill-down. */
export interface ReportFigure {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly unit: 'count' | 'percent' | 'duration_ms';
  readonly deltaVsPrevious: number | null;
  readonly deltaIsGood: boolean | null;
  readonly target: number | null;
  /** Every figure is a link. This is the query it opens in All Tickets. */
  readonly drillDown: TicketQuery | null;
}

export interface BandBreakdown {
  readonly band: ResponseBand;
  readonly label: string;
  readonly count: number;
  readonly share: number;
}

export interface BreachReasonBreakdown {
  readonly reason: BreachReason;
  readonly label: string;
  readonly count: number;
}

export interface CategoryBreakdown {
  readonly category: TicketCategory;
  readonly label: string;
  readonly count: number;
  readonly share: number;
}

export interface AgentReportRow {
  readonly agent: Agent;
  readonly handled: number;
  readonly resolved: number;
  readonly medianFirstResponseMs: number | null;
  readonly breached: number;
}

export interface WeeklyReport {
  readonly period: ReportPeriod;
  readonly previousPeriod: ReportPeriod;
  /** First two are the promises Brightcart actually made. Order is meaningful. */
  readonly headline: readonly ReportFigure[];
  readonly distribution: readonly BandBreakdown[];
  readonly breachReasons: readonly BreachReasonBreakdown[];
  readonly categories: readonly CategoryBreakdown[];
  readonly perAgent: readonly AgentReportRow[];
  readonly schedule: ReportSchedule | null;
  /** Row 16 — too little data in this window to report honestly. */
  readonly insufficientData: boolean;
  readonly liveSince: IsoDateTime;
}

export interface ReportSchedule {
  readonly enabled: boolean;
  readonly dayOfWeek: number;
  readonly time: string;
  readonly recipients: readonly string[];
}

/* ------------------------------------------------------------------ *
 * Mutations
 * ------------------------------------------------------------------ */

export interface AssignTicketRequest {
  readonly ticketId: string;
  readonly ownerId: string;
}

export interface BulkAssignRequest {
  readonly ticketIds: readonly string[];
  readonly ownerId: string;
}

export interface SetPriorityRequest {
  readonly ticketId: string;
  readonly priority: Priority;
}

export interface SetStatusRequest {
  readonly ticketId: string;
  readonly status: TicketStatus;
}

export interface SetLeaveRequest {
  readonly agentId: string;
  readonly leaveFrom: IsoDateTime | null;
  readonly leaveUntil: IsoDateTime | null;
}

export interface MutationResult<T> {
  readonly data: T;
  /** Confirmation copy that names the outcome, not the risk. */
  readonly message: string;
}

/* ------------------------------------------------------------------ *
 * Mock-only controls (§7 of CLAUDE.md — forcing states)
 * ------------------------------------------------------------------ */

export type MockScenario = 'default' | 'loading' | 'empty' | 'error' | 'sync-failure' | 'all-clear';
