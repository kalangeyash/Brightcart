/**
 * Formatting. Assumptions A1 and A2 — the ticket and order ID formats — are
 * isolated here, so confirming them with Manoj is a two-line change.
 */

import { HOUR, MINUTE, nowMs } from './sla';

/** A1 — assumed. The client has never stated a ticket ID format. */
export const formatTicketId = (n: number): string => `#BC-${n}`;

/** A2 — assumed. Brightcart's real order ID format is unknown. */
export const formatOrderId = (n: number): string => `ORD-${n}`;

const DAY = 24 * HOUR;

/** "4d 2h", "2h 6m", "52m". Compact enough for a 40px table row. */
export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  if (abs >= DAY) {
    const d = Math.floor(abs / DAY);
    const h = Math.floor((abs % DAY) / HOUR);
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
  }
  if (abs >= HOUR) {
    const h = Math.floor(abs / HOUR);
    const m = Math.floor((abs % HOUR) / MINUTE);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.max(1, Math.floor(abs / MINUTE))}m`;
}

/** "3h 05m" — for report medians, where the leading zero aids column alignment. */
export function formatPreciseDuration(ms: number): string {
  const h = Math.floor(ms / HOUR);
  const m = Math.floor((ms % HOUR) / MINUTE);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

/** "4 min ago", "4 days ago". Never a bare timestamp in a list. */
export function formatRelative(iso: string, at: number = nowMs()): string {
  const diff = at - Date.parse(iso);
  if (diff < MINUTE) return 'just now';
  if (diff < DAY) return `${formatDuration(diff)} ago`;
  const days = Math.floor(diff / DAY);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata'
  });
}

export function formatDateRange(from: string, to: string): string {
  const y = new Date(to).getFullYear();
  return `${formatDate(from)} – ${formatDate(to)} ${y}`;
}

export const formatPercent = (v: number): string => `${Math.round(v)}%`;

/** Signed change, for report deltas. "▲ 6 pts", "▼ 18". */
export function formatDelta(value: number, unit: 'count' | 'percent' | 'duration_ms'): string {
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : '–';
  const abs = Math.abs(value);
  if (unit === 'percent') return `${arrow} ${Math.round(abs)} pts`;
  if (unit === 'duration_ms') return `${arrow} ${formatPreciseDuration(abs)}`;
  return `${arrow} ${abs}`;
}
