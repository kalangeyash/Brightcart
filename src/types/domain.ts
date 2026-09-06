/**
 * Core domain model — Brightcart Support Desk
 *
 * These types describe the product's nouns and nothing else. Screen-shaped and
 * request-shaped types live in `types/api.ts`.
 *
 * Rules that this file exists to enforce:
 *  - `ownerId: null` is the only representation of "unowned". Never a boolean.
 *  - SLA state is always DERIVED (see lib/sla.ts). It is never stored on a Ticket.
 *  - Assumed formats are marked with their assumptions-register id (A1–A7) so the
 *    open questions stay visible in the code rather than only in a document.
 */

/** ISO-8601 timestamp string, e.g. "2026-09-07T09:42:00+05:30". */
export type IsoDateTime = string;

/* ------------------------------------------------------------------ *
 * Agents
 * ------------------------------------------------------------------ */

export type AgentStatus = 'active' | 'on_leave' | 'offline';

/** A6: both leads currently hold identical rights. Unresolved with the client. */
export type UserRole = 'agent' | 'lead';

export interface Agent {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly status: AgentStatus;
  /** Inclusive last day of leave, or null. Entered by a lead. */
  readonly leaveFrom: IsoDateTime | null;
  readonly leaveUntil: IsoDateTime | null;
  /** Initials for the avatar. Derived at seed time so the UI never splits names. */
  readonly initials: string;
}

/* ------------------------------------------------------------------ *
 * Tickets
 * ------------------------------------------------------------------ */

export type TicketStatus = 'new' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';

export type Priority = 'urgent' | 'high' | 'normal';

/** A4: assumed category list. Confirm against an export of the Gmail labels. */
export type TicketCategory = 'refund' | 'delivery' | 'order_change' | 'other';

export interface Ticket {
  /** A1: assumed format "#BC-4821". The client has never stated one. */
  readonly id: string;
  /** A2: assumed format "ORD-98213". Null when the email never referenced an order. */
  readonly orderId: string | null;

  readonly customerName: string;
  readonly customerEmail: string;
  readonly subject: string;

  readonly category: TicketCategory;
  readonly status: TicketStatus;
  /** A5: set by a person, not derived. Who decides is still an open question. */
  readonly priority: Priority;

  /** null === unowned. The single source of truth for the 30-minute promise. */
  readonly ownerId: string | null;

  readonly createdAt: IsoDateTime;
  /** When an agent first replied to the customer. null === the SLA clock is running. */
  readonly firstResponseAt: IsoDateTime | null;
  readonly lastActivityAt: IsoDateTime;
  readonly resolvedAt: IsoDateTime | null;

  readonly replyCount: number;
  /**
   * Distinct agents who have replied. > 1 is the duplicate-reply signal —
   * Rohit: "two people replying to the same customer happens more than I'd like".
   */
  readonly distinctRepliers: number;
}

/* ------------------------------------------------------------------ *
 * SLA — derived, never stored
 * ------------------------------------------------------------------ */

/**
 * The 24-hour first-response clock.
 *
 * `met` exists because the clock stops at first response. Of the 147 currently
 * open tickets, 129 have already been answered — they are not "on track", they
 * are finished with the clock. Without this case every long conversation would
 * read as a permanent breach risk.
 */
export type SlaState =
  | { readonly kind: 'met'; readonly respondedInMs: number }
  | { readonly kind: 'on_track'; readonly msRemaining: number }
  | { readonly kind: 'due_soon'; readonly msRemaining: number }
  | { readonly kind: 'breached'; readonly msSince: number };

export type SlaKind = SlaState['kind'];

/**
 * A3 — UNRESOLVED. The clock currently runs continuously. If Brightcart only
 * staffs business hours it should pause, which reclassifies 22 of last week's
 * 53 breaches. Kept as a policy object so the answer is a config change.
 */
export interface SlaPolicy {
  readonly firstResponseTargetMs: number;
  /** Warn once this much time or less remains. Drives the `due_soon` state. */
  readonly dueSoonThresholdMs: number;
  /** Ownership target — drives "unowned over 30 min". */
  readonly ownershipTargetMs: number;
  readonly pauseOutsideBusinessHours: false;
}

/* ------------------------------------------------------------------ *
 * Activity / audit
 * ------------------------------------------------------------------ */

export type ActivityEventType =
  | 'ticket_created'
  | 'assigned'
  | 'reassigned'
  | 'self_claimed'
  | 'replied'
  | 'internal_note'
  | 'priority_changed'
  | 'status_changed'
  | 'category_changed'
  | 'sla_breached'
  | 'merged';

export interface ActivityEvent {
  readonly id: string;
  readonly ticketId: string;
  readonly at: IsoDateTime;
  /** null === the platform did it, not a person. Rendered differently. */
  readonly actorId: string | null;
  readonly type: ActivityEventType;
  /** Before/after is the whole point — "changed priority" is not an answer. */
  readonly from: string | null;
  readonly to: string | null;
}

/* ------------------------------------------------------------------ *
 * Sync — the product's single point of failure
 * ------------------------------------------------------------------ */

export interface SyncStatus {
  readonly mailbox: string;
  readonly healthy: boolean;
  readonly lastSuccessAt: IsoDateTime;
  readonly stoppedAt: IsoDateTime | null;
  readonly reason: string | null;
}

/* ------------------------------------------------------------------ *
 * Reporting
 * ------------------------------------------------------------------ */

export type ResponseBand = 'under_1h' | 'h1_4' | 'h4_12' | 'h12_24' | 'breached';

export type BreachReason = 'arrived_overnight' | 'unowned_over_2h' | 'reopened';

/**
 * One row per ticket received in the reporting window. Deliberately separate
 * from `Ticket`: reports read a closed historical record, not live mutable state,
 * so a reassignment today cannot silently rewrite last week's numbers.
 */
export interface WeeklyTicketRecord {
  readonly ticketId: string;
  readonly receivedAt: IsoDateTime;
  readonly category: TicketCategory;
  readonly handlerId: string | null;
  readonly firstResponseMinutes: number | null;
  readonly band: ResponseBand;
  readonly resolved: boolean;
  readonly ownedWithinTargetMs: boolean;
  readonly breachReason: BreachReason | null;
}
