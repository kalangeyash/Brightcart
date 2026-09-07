// Feature list rows 12–13 · Ticket Detail — lead view + activity/audit tab
// Traces to: Manoj — "management asks who touched this, i have no answer" · "2 ppl reply same mail"
// Serves: reassign · override priority · the immutable audit trail

import { useState } from 'react';

import type { TicketListItem } from '@/types/api';
import type { ActivityEventType, Priority, TicketStatus } from '@/types/domain';
import type { ReactNode } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronDown,
  Mail,
  MessageSquare,
  ScrollText,
  StickyNote,
  UserCheck,
  Users
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { PriorityChip } from '@/components/PriorityChip';
import { SlaChip } from '@/components/SlaChip';
import { ErrorState } from '@/components/states/ErrorState';
import { StatusChip } from '@/components/StatusChip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatClock, formatDate, formatRelative } from '@/lib/format';
import { ageMs, isOverOwnershipTarget } from '@/lib/sla';
import { cn } from '@/lib/utils';
import { api } from '@/services';

import { AssignModal } from '../team-overview/AssignModal';

const PRIORITY_OPTIONS: ReadonlyArray<{ value: Priority; label: string }> = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' }
];

const STATUS_OPTIONS: ReadonlyArray<{ value: TicketStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_on_customer', label: 'Waiting on customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

const EVENT_LABEL: Readonly<Record<ActivityEventType, string>> = {
  ticket_created: 'Ticket created',
  assigned: 'Assigned',
  reassigned: 'Reassigned',
  self_claimed: 'Claimed',
  replied: 'Replied',
  internal_note: 'Added internal note',
  priority_changed: 'Changed priority',
  status_changed: 'Changed status',
  category_changed: 'Changed category',
  sla_breached: 'SLA breached',
  merged: 'Merged tickets'
};

export function TicketDetailScreen() {
  const { ticketId = '' } = useParams();
  const id = decodeURIComponent(ticketId);
  const queryClient = useQueryClient();
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api.getTicket(id)
  });

  const agentsQuery = useQuery({ queryKey: ['agents-list'], queryFn: () => api.getAgents() });
  const actorName = (actorId: string): string =>
    agentsQuery.data?.find((a) => a.id === actorId)?.name ?? 'A person';

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    void queryClient.invalidateQueries({ queryKey: ['team-overview'] });
    void queryClient.invalidateQueries({ queryKey: ['tickets'] });
  };

  const priorityMutation = useMutation({
    mutationFn: (priority: Priority) => api.setPriority({ ticketId: id, priority }),
    onSuccess: invalidate
  });
  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => api.setStatus({ ticketId: id, status }),
    onSuccess: invalidate
  });

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError || !data) {
    const isNotFound = error instanceof Error && error.message.includes('no longer exists');
    return (
      <div className='space-y-4'>
        <BackLink />
        <ErrorState
          message={isNotFound ? `Ticket ${id} no longer exists.` : undefined}
          recovery={
            isNotFound
              ? 'It may have been merged or closed. Go back to all tickets to find it.'
              : undefined
          }
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const { ticket, sla, owner, thread, activity, previousTicketCount } = data;

  // AssignModal speaks TicketListItem; the detail response carries everything but
  // the two derived fields, so we complete it here rather than duplicate the modal.
  const assignItem: TicketListItem = {
    ticket,
    sla,
    owner,
    ageMs: ageMs(ticket.createdAt),
    overOwnershipTarget: isOverOwnershipTarget(ticket)
  };

  return (
    <div className='space-y-5'>
      <BackLink />

      {/* Header */}
      <div className='flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-hairline)] pb-4'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold tracking-[-0.4px] text-[var(--color-ink)]'>
              {ticket.subject}
            </h1>
            <span className='tabular text-2xl font-bold text-[var(--color-ink-muted)]'>
              {ticket.id}
            </span>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <SlaChip sla={sla} />
            <StatusChip status={ticket.status} />
            <PriorityChip priority={ticket.priority} />
          </div>
        </div>

        {/* Lead controls: reassign · priority · status */}
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              setIsAssignOpen(true);
            }}
            className='gap-1.5 border-[var(--color-control-line)]'
          >
            <UserCheck className='h-3.5 w-3.5' />
            <span>Reassign</span>
          </Button>

          <ControlMenu
            label='Priority'
            current={ticket.priority}
            disabled={priorityMutation.isPending}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <DropdownMenuItem
                key={o.value}
                className='cursor-pointer text-xs'
                onSelect={() => {
                  priorityMutation.mutate(o.value);
                }}
              >
                {o.label}
              </DropdownMenuItem>
            ))}
          </ControlMenu>

          <ControlMenu label='Status' current={ticket.status} disabled={statusMutation.isPending}>
            {STATUS_OPTIONS.map((o) => (
              <DropdownMenuItem
                key={o.value}
                className='cursor-pointer text-xs'
                onSelect={() => {
                  statusMutation.mutate(o.value);
                }}
              >
                {o.label}
              </DropdownMenuItem>
            ))}
          </ControlMenu>
        </div>
      </div>

      <div className='grid grid-cols-1 items-start gap-5 lg:grid-cols-3'>
        {/* Customer + owner block */}
        <aside className='space-y-4 lg:col-span-1'>
          <section className='rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4'>
            <h2 className='mb-2 text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase'>
              Customer
            </h2>
            <p className='text-sm font-semibold text-[var(--color-ink)]'>{ticket.customerName}</p>
            <p className='text-xs text-[var(--color-ink-muted)]'>{ticket.customerEmail}</p>
            <dl className='mt-3 space-y-1.5 text-xs'>
              <div className='flex justify-between'>
                <dt className='text-[var(--color-ink-muted)]'>Order</dt>
                <dd className='tabular font-medium text-[var(--color-ink)]'>
                  {ticket.orderId ?? '–'}
                </dd>
              </div>
              <div className='flex justify-between'>
                <dt className='text-[var(--color-ink-muted)]'>Previous tickets</dt>
                <dd className='tabular font-medium text-[var(--color-ink)]'>
                  {previousTicketCount}
                </dd>
              </div>
            </dl>
            {previousTicketCount > 0 && (
              <p className='mt-2 rounded-[var(--radius-control)] bg-[var(--color-pearl)] p-2 text-[11px] text-[var(--color-ink-muted)]'>
                Repeat contact — {previousTicketCount} previous{' '}
                {previousTicketCount === 1 ? 'ticket' : 'tickets'}. Check before replying.
              </p>
            )}
          </section>

          <section className='rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4'>
            <h2 className='mb-2 text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase'>
              Owner
            </h2>
            {owner ? (
              <p className='text-sm font-medium text-[var(--color-ink)]'>{owner.name}</p>
            ) : (
              <p className='text-sm font-semibold text-[var(--color-urgent-ink)]'>Unowned</p>
            )}
            <p className='mt-1 text-xs text-[var(--color-ink-muted)]'>
              Opened {formatDate(ticket.createdAt)} · {formatClock(ticket.createdAt)}
            </p>
          </section>
        </aside>

        {/* Conversation + Activity tabs */}
        <div className='lg:col-span-2'>
          <Tabs defaultValue='conversation'>
            <TabsList>
              <TabsTrigger value='conversation' className='gap-1.5'>
                <MessageSquare className='h-3.5 w-3.5' />
                Conversation
              </TabsTrigger>
              <TabsTrigger value='activity' className='gap-1.5'>
                <ScrollText className='h-3.5 w-3.5' />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value='conversation'>
              <div className='mb-3 flex items-center gap-2 text-xs text-[var(--color-ink-muted)]'>
                <span className='tabular'>
                  {ticket.replyCount} {ticket.replyCount === 1 ? 'message' : 'messages'}
                </span>
                <span>·</span>
                <span className='tabular'>{ticket.distinctRepliers} agents replied</span>
                {ticket.distinctRepliers > 1 && (
                  <span className='inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--color-urgent)]/25 bg-[var(--color-urgent-soft)] px-2 py-0.5 font-semibold text-[var(--color-urgent-ink)]'>
                    <Users className='h-3 w-3' />
                    Duplicate replies
                  </span>
                )}
              </div>

              <div className='space-y-3'>
                {thread.map((message) => {
                  if (message.direction === 'internal_note') {
                    return (
                      <div
                        key={message.id}
                        className='rounded-[var(--radius-control)] border border-[var(--color-urgent)]/20 bg-[var(--color-urgent-soft)]/40 p-3'
                      >
                        <div className='mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-urgent-ink)] uppercase'>
                          <StickyNote className='h-3 w-3' />
                          Internal note · {message.authorName}
                          <span className='ml-auto font-normal text-[var(--color-ink-muted)]'>
                            {formatRelative(message.at)}
                          </span>
                        </div>
                        <p className='text-sm text-[var(--color-ink)]'>{message.body}</p>
                      </div>
                    );
                  }

                  const isInbound = message.direction === 'inbound';
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'rounded-[var(--radius-control)] border p-3',
                        isInbound
                          ? 'border-[var(--color-hairline)] bg-[var(--color-canvas)]'
                          : 'border-[var(--color-primary)]/15 bg-[var(--color-primary-soft)]/40'
                      )}
                    >
                      <div className='mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink)]'>
                        <Mail className='h-3 w-3 text-[var(--color-ink-muted)]' />
                        {message.authorName}
                        <span className='font-normal text-[var(--color-ink-muted)]'>
                          {isInbound ? 'customer' : 'support'}
                        </span>
                        <span className='ml-auto font-normal text-[var(--color-ink-muted)]'>
                          {formatRelative(message.at)}
                        </span>
                      </div>
                      <p className='text-sm text-[var(--color-ink)]'>{message.body}</p>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value='activity'>
              <ol className='space-y-2'>
                {activity.map((event) => {
                  const isSystem = event.actorId === null;
                  return (
                    <li
                      key={event.id}
                      className={cn(
                        'flex items-start gap-3 rounded-[var(--radius-control)] border p-3 text-xs',
                        isSystem
                          ? 'border-dashed border-[var(--color-control-line)]/50 bg-[var(--color-pearl)]'
                          : 'border-[var(--color-hairline)] bg-[var(--color-canvas)]'
                      )}
                    >
                      <span className='tabular mt-0.5 shrink-0 whitespace-nowrap text-[var(--color-ink-muted)]'>
                        {formatDate(event.at)} · {formatClock(event.at)}
                      </span>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-1.5'>
                          <span className='font-semibold text-[var(--color-ink)]'>
                            {EVENT_LABEL[event.type]}
                          </span>
                          <span className='text-[var(--color-ink-muted)]'>
                            {isSystem ? 'System' : actorName(event.actorId)}
                          </span>
                        </div>
                        {(event.from != null || event.to != null) && (
                          <div className='mt-0.5 text-[var(--color-ink-muted)]'>
                            {event.from != null && (
                              <span className='line-through'>{event.from}</span>
                            )}
                            {event.from != null && event.to != null && <span> → </span>}
                            {event.to != null && (
                              <span className='font-medium text-[var(--color-ink)]'>
                                {event.to}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AssignModal item={assignItem} isOpen={isAssignOpen} onOpenChange={setIsAssignOpen} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function BackLink() {
  return (
    <Link
      to='/tickets'
      className='inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline'
    >
      <ArrowLeft className='h-4 w-4' />
      All tickets
    </Link>
  );
}

interface ControlMenuProperties {
  readonly label: string;
  readonly current: string;
  readonly disabled: boolean;
  readonly children: ReactNode;
}

function ControlMenu({ label, disabled, children }: ControlMenuProperties) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size='sm'
          variant='outline'
          disabled={disabled}
          className='gap-1.5 border-[var(--color-control-line)]'
        >
          <span>{label}</span>
          <ChevronDown className='h-3.5 w-3.5' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48 shadow-[var(--shadow-overlay)]'>
        <DropdownMenuLabel className='text-xs'>Change {label.toLowerCase()}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DetailSkeleton() {
  return (
    <div className='space-y-5'>
      <Skeleton className='h-5 w-24' />
      <div className='flex items-start justify-between gap-4 border-b border-[var(--color-hairline)] pb-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-80' />
          <div className='flex gap-2'>
            <Skeleton className='h-6 w-28' />
            <Skeleton className='h-6 w-24' />
          </div>
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-24' />
        </div>
      </div>
      <div className='grid grid-cols-1 gap-5 lg:grid-cols-3'>
        <Skeleton className='h-40 w-full lg:col-span-1' />
        <div className='space-y-3 lg:col-span-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-24 w-full' />
        </div>
      </div>
    </div>
  );
}
