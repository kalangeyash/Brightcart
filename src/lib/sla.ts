/**
 * SLA derivation. The ONLY place in the codebase where this maths happens.
 *
 * Rohit stated the promise: a reply within 24 hours. The brief states the
 * ownership promise: nothing unowned for more than 30 minutes. Both live here.
 *
 * Assumption A3 is unresolved — the clock currently runs continuously. If the
 * client confirms it should pause outside business hours, this file changes and
 * nothing else does.
 */

import type { IsoDateTime, SlaPolicy, SlaState, Ticket } from '../types/domain';

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

export const DEFAULT_SLA_POLICY: SlaPolicy = {
  firstResponseTargetMs: 24 * HOUR,
  dueSoonThresholdMs: 2 * HOUR,
  ownershipTargetMs: 30 * MINUTE,
  pauseOutsideBusinessHours: false
};

/**
 * A fixed clock. Every derived value in this product depends on "now", so it is
 * injected rather than read from Date.now() — otherwise the seed data drifts,
 * screenshots stop reproducing, and tests fail at midnight.
 */
export const NOW: IsoDateTime = '2026-09-07T09:42:00+05:30';

export const nowMs = (): number => Date.parse(NOW);

export function deriveSlaState(
  ticket: Pick<Ticket, 'createdAt' | 'firstResponseAt'>,
  at: number = nowMs(),
  policy: SlaPolicy = DEFAULT_SLA_POLICY
): SlaState {
  const created = Date.parse(ticket.createdAt);

  if (ticket.firstResponseAt !== null) {
    return { kind: 'met', respondedInMs: Date.parse(ticket.firstResponseAt) - created };
  }

  const due = created + policy.firstResponseTargetMs;
  const msRemaining = due - at;

  if (msRemaining <= 0) return { kind: 'breached', msSince: -msRemaining };
  if (msRemaining <= policy.dueSoonThresholdMs) return { kind: 'due_soon', msRemaining };
  return { kind: 'on_track', msRemaining };
}

/** Sort key for "soonest first". Breached before due_soon before on_track before met. */
export function slaUrgencyRank(state: SlaState): number {
  switch (state.kind) {
    case 'breached':
      return -state.msSince;
    case 'due_soon':
      return 1e12 + state.msRemaining;
    case 'on_track':
      return 2e12 + state.msRemaining;
    case 'met':
      return 3e12;
  }
}

export function needsAttention(state: SlaState): boolean {
  return state.kind === 'breached' || state.kind === 'due_soon';
}

/** Drives the 3px attention rail. Amber for risk, red for breached, none otherwise. */
export function railTone(state: SlaState): 'urgent' | 'danger' | null {
  if (state.kind === 'breached') return 'danger';
  if (state.kind === 'due_soon') return 'urgent';
  return null;
}

export function ageMs(createdAt: IsoDateTime, at: number = nowMs()): number {
  return at - Date.parse(createdAt);
}

export function isOverOwnershipTarget(
  ticket: Pick<Ticket, 'createdAt' | 'ownerId'>,
  at: number = nowMs(),
  policy: SlaPolicy = DEFAULT_SLA_POLICY
): boolean {
  return ticket.ownerId === null && ageMs(ticket.createdAt, at) > policy.ownershipTargetMs;
}

export function isUntouchedOver24h(
  ticket: Pick<Ticket, 'lastActivityAt'>,
  at: number = nowMs()
): boolean {
  return at - Date.parse(ticket.lastActivityAt) > 24 * HOUR;
}
