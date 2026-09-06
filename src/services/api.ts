/**
 * The service boundary.
 *
 * This interface is the ONLY thing UI components know about. No component
 * imports a seed file, a mock module, or `fetch`. Swapping the mock for a real
 * backend means writing one more class that satisfies `SupportDeskApi` and
 * changing one line in `services/index.ts` — no component changes.
 *
 * Method names and shapes mirror the endpoint table in CLAUDE.md §7, so the
 * contract survives the transport change.
 */

import type {
  AssignTicketRequest,
  BulkAssignRequest,
  MutationResult,
  ReportPeriod,
  ReportSchedule,
  SetLeaveRequest,
  SetPriorityRequest,
  SetStatusRequest,
  TeamOverview,
  TicketDetail,
  TicketListResult,
  TicketQuery,
  UnassignedQueue,
  UnassignedQueueQuery,
  WeeklyReport
} from '../types/api';
import type { Agent, Priority, SyncStatus, Ticket, TicketStatus } from '../types/domain';

export interface SupportDeskApi {
  /** Row 6 · Team Overview. One call — the screen never assembles its own view model. */
  getTeamOverview(): Promise<TeamOverview>;

  /** Row 8 · Unassigned queue, with suggested owners. */
  getUnassignedQueue(query?: UnassignedQueueQuery): Promise<UnassignedQueue>;

  /** Rows 10–11 · All tickets, filtered. */
  getTickets(query?: TicketQuery): Promise<TicketListResult>;

  /** Rows 12–13 · Ticket detail, thread and activity. */
  getTicket(ticketId: string): Promise<TicketDetail>;

  getAgents(): Promise<readonly Agent[]>;

  getSyncStatus(): Promise<SyncStatus>;

  /** Rows 15–16 · Weekly report. Omit the period for the last complete week. */
  getWeeklyReport(period?: Pick<ReportPeriod, 'from' | 'to'>): Promise<WeeklyReport>;

  assignTicket(req: AssignTicketRequest): Promise<MutationResult<Ticket>>;
  bulkAssign(req: BulkAssignRequest): Promise<MutationResult<readonly Ticket[]>>;
  setPriority(req: SetPriorityRequest): Promise<MutationResult<Ticket>>;
  setStatus(req: SetStatusRequest): Promise<MutationResult<Ticket>>;
  setLeave(req: SetLeaveRequest): Promise<MutationResult<Agent>>;
  /** Row 14 · Reassign everything an agent holds, in one action. */
  reassignAllFrom(agentId: string): Promise<MutationResult<readonly Ticket[]>>;
  saveReportSchedule(schedule: ReportSchedule): Promise<MutationResult<ReportSchedule>>;

  retrySync(): Promise<MutationResult<SyncStatus>>;
}

/** Re-exported so components can type handlers without reaching into /types. */
export type { Priority, TicketStatus };
