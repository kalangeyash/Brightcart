// Feature list rows 10–11 · All Tickets · lead full-team view + no-results state
// Traces to: Manoj — "big order issue, management asks who touched this, i have no answer"
// Serves: find any ticket by order ID · the destination for every report drill-down

import type { TicketListItem, TicketQuery } from '@/types/api';
import type { Priority, TicketCategory, TicketStatus } from '@/types/domain';
import type { ReactNode } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Check, Download, Filter, Search, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { AttentionRail } from '@/components/AttentionRail';
import { DataTable } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { PriorityChip } from '@/components/PriorityChip';
import { SlaChip } from '@/components/SlaChip';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingRows } from '@/components/states/LoadingRows';
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
import { Input } from '@/components/ui/input';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { api } from '@/services';

/* ------------------------------------------------------------------ *
 * Option tables — the categories/statuses/etc. the filters expose.
 * Labels are sentence case (CLAUDE.md §9).
 * ------------------------------------------------------------------ */

const STATUS_OPTIONS: ReadonlyArray<{ value: TicketStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_on_customer', label: 'Waiting on customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

const PRIORITY_OPTIONS: ReadonlyArray<{ value: Priority; label: string }> = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' }
];

const CATEGORY_OPTIONS: ReadonlyArray<{ value: TicketCategory; label: string }> = [
  { value: 'refund', label: 'Refund' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'order_change', label: 'Order change' },
  { value: 'other', label: 'Other' }
];

const SLA_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'any', label: 'Any SLA' },
  { value: 'breached', label: 'Breached' },
  { value: 'under_4h', label: 'Under 4h' },
  { value: 'on_track', label: 'On track' }
];

const SORT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'sla', label: 'SLA urgency' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'last_activity', label: 'Last activity' }
];

const STATUS_LABEL = new Map<string, string>(STATUS_OPTIONS.map((o) => [o.value, o.label]));
const PRIORITY_LABEL = new Map<string, string>(PRIORITY_OPTIONS.map((o) => [o.value, o.label]));
const CATEGORY_LABEL = new Map<string, string>(CATEGORY_OPTIONS.map((o) => [o.value, o.label]));

/** Reasons come only from the report breach-reason drill-down; echoed, not filtered. */
const REASON_LABEL: Readonly<Record<string, string>> = {
  arrived_overnight: 'Arrived overnight',
  unowned_over_2h: 'Unowned over 2h',
  reopened: 'Reopened by customer'
};

/** The three questions the lead repeats every day, expressed as URL param sets. */
const SAVED_VIEWS: ReadonlyArray<{ label: string; params: Record<string, string> }> = [
  { label: 'My breaches', params: { sla: 'breached' } },
  { label: 'Untouched 24h', params: { sla: 'breached', sort: 'oldest' } },
  { label: 'Refunds this week', params: { category: 'refund', sort: 'newest' } }
];

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

interface FilterChip {
  readonly key: string;
  readonly label: string;
  readonly onRemove: () => void;
}

interface ChipState {
  readonly search: string;
  readonly owner: string;
  readonly ownerLabel: string;
  readonly statusValues: string[];
  readonly priorityValues: string[];
  readonly categoryValues: string[];
  readonly sla: string;
  readonly reason: string | null;
  readonly patchParams: (next: Record<string, string | null>) => void;
  readonly toggleInList: (key: string, current: string[], value: string) => void;
}

/** The active filters, echoed back as removable chips (rows 10–11). */
function buildActiveChips(state: ChipState): FilterChip[] {
  const { search, owner, ownerLabel, statusValues, priorityValues, categoryValues, sla, reason } =
    state;
  const { patchParams, toggleInList } = state;

  return [
    ...(search
      ? [
          {
            key: 'search',
            label: `Search: ${search}`,
            onRemove: () => {
              patchParams({ search: null });
            }
          }
        ]
      : []),
    ...(owner === 'any'
      ? []
      : [
          {
            key: 'owner',
            label: `Owner: ${ownerLabel}`,
            onRemove: () => {
              patchParams({ owner: null });
            }
          }
        ]),
    ...statusValues.map((v) => ({
      key: `status-${v}`,
      label: `Status: ${STATUS_LABEL.get(v) ?? v}`,
      onRemove: () => {
        toggleInList('status', statusValues, v);
      }
    })),
    ...priorityValues.map((v) => ({
      key: `priority-${v}`,
      label: `Priority: ${PRIORITY_LABEL.get(v) ?? v}`,
      onRemove: () => {
        toggleInList('priority', priorityValues, v);
      }
    })),
    ...categoryValues.map((v) => ({
      key: `category-${v}`,
      label: `Category: ${CATEGORY_LABEL.get(v) ?? v}`,
      onRemove: () => {
        toggleInList('category', categoryValues, v);
      }
    })),
    ...(sla === 'any'
      ? []
      : [
          {
            key: 'sla',
            label: `SLA: ${SLA_OPTIONS.find((o) => o.value === sla)?.label ?? sla}`,
            onRemove: () => {
              patchParams({ sla: null });
            }
          }
        ]),
    ...(reason != null && reason.length > 0
      ? [
          {
            key: 'reason',
            label: `Reason: ${REASON_LABEL[reason] ?? reason}`,
            onRemove: () => {
              patchParams({ reason: null });
            }
          }
        ]
      : [])
  ];
}

export function AllTicketsScreen() {
  const [params, setParams] = useSearchParams();

  /* URL is the single source of truth, so a report drill-down lands pre-filtered. */
  const search = params.get('search') ?? '';
  const owner = params.get('owner') ?? 'any';
  const sla = params.get('sla') ?? 'any';
  const sort = params.get('sort') ?? 'sla';
  const reason = params.get('reason');
  const statusValues = params.get('status')?.split(',').filter(Boolean) ?? [];
  const priorityValues = params.get('priority')?.split(',').filter(Boolean) ?? [];
  const categoryValues = params.get('category')?.split(',').filter(Boolean) ?? [];

  const query: TicketQuery = {
    search: search || undefined,
    ownerId: owner === 'any' ? undefined : owner,
    status: statusValues.length > 0 ? (statusValues as TicketStatus[]) : undefined,
    priority: priorityValues.length > 0 ? (priorityValues as Priority[]) : undefined,
    category: categoryValues.length > 0 ? (categoryValues as TicketCategory[]) : undefined,
    sla: sla === 'any' ? undefined : (sla as TicketQuery['sla']),
    sort: sort as TicketQuery['sort'],
    pageSize: 200
  };

  const agentsQuery = useQuery({ queryKey: ['agents-list'], queryFn: () => api.getAgents() });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tickets', params.toString()],
    queryFn: () => api.getTickets(query)
  });

  const agents = agentsQuery.data ?? [];
  const agentName = (id: string): string => agents.find((a) => a.id === id)?.name ?? id;

  /* ---- param helpers ---- */
  const patchParams = (next: Record<string, string | null>) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '') {
        merged.delete(key);
      } else {
        merged.set(key, value);
      }
    }
    setParams(merged, { replace: true });
  };

  const toggleInList = (key: string, current: string[], value: string) => {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    patchParams({ [key]: next.length > 0 ? next.join(',') : null });
  };

  let ownerLabel: string;
  if (owner === 'any') {
    ownerLabel = 'Any owner';
  } else if (owner === 'unowned') {
    ownerLabel = 'Unowned';
  } else {
    ownerLabel = agentName(owner);
  }

  /* ---- active filter chips (removable) ---- */
  const activeChips = buildActiveChips({
    search,
    owner,
    ownerLabel,
    statusValues,
    priorityValues,
    categoryValues,
    sla,
    reason,
    patchParams,
    toggleInList
  });

  const clearAll = () => {
    setParams(new URLSearchParams(), { replace: true });
  };

  const exportCsv = () => {
    if (!data) {
      return;
    }
    const header = [
      'Ticket',
      'Customer',
      'Order ID',
      'Subject',
      'Owner',
      'Status',
      'Priority',
      'Last activity'
    ];
    const rows = data.items.map((index) =>
      [
        index.ticket.id,
        index.ticket.customerName,
        index.ticket.orderId ?? '',
        index.ticket.subject,
        index.owner?.name ?? 'Unowned',
        STATUS_LABEL.get(index.ticket.status) ?? index.ticket.status,
        PRIORITY_LABEL.get(index.ticket.priority) ?? index.ticket.priority,
        formatRelative(index.ticket.lastActivityAt)
      ]
        .map((cell) => csvEscape(cell))
        .join(',')
    );
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'brightcart-tickets.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const ticketNoun = data?.total === 1 ? 'ticket' : 'tickets';
  const resultCount =
    data == null ? '' : `${data.total} ${ticketNoun} · ${data.unownedCount} unowned`;

  return (
    <div className='space-y-5'>
      <PageHeader
        title='All tickets'
        subtitle='The full-team view — find any ticket by order ID, customer, or number'
        actions={
          <Button
            variant='outline'
            size='sm'
            onClick={exportCsv}
            disabled={!data || data.items.length === 0}
            className='gap-1.5 border-[var(--color-control-line)]'
          >
            <Download className='h-3.5 w-3.5' />
            <span>Export CSV</span>
          </Button>
        }
      />

      {/* Toolbar: search · saved views · filters · sort */}
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative w-full sm:w-72'>
            <Search className='absolute top-2.5 left-2.5 h-3.5 w-3.5 text-[var(--color-ink-muted)]' />
            <Input
              type='search'
              value={search}
              onChange={(event) => {
                patchParams({ search: event.target.value || null });
              }}
              placeholder='Search by order ID, customer, or ticket #'
              className='h-8 border-[var(--color-control-line)] pl-8 text-xs'
            />
          </div>

          <span className='text-xs text-[var(--color-ink-muted)]'>Saved views:</span>
          {SAVED_VIEWS.map((view) => (
            <button
              key={view.label}
              type='button'
              onClick={() => {
                setParams(new URLSearchParams(view.params), { replace: true });
              }}
              className='rounded-[var(--radius-pill)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]'
            >
              {view.label}
            </button>
          ))}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          {/* <span className='inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-muted)]'>
            <Filter className='h-3.5 w-3.5' />
            Filters
          </span> */}

          {/* Owner — single select */}
          <FilterMenu label={`Owner: ${ownerLabel}`} active={owner !== 'any'}>
            <SingleItem
              label='Any owner'
              selected={owner === 'any'}
              onSelect={() => {
                patchParams({ owner: null });
              }}
            />
            <SingleItem
              label='Unowned'
              selected={owner === 'unowned'}
              onSelect={() => {
                patchParams({ owner: 'unowned' });
              }}
            />
            <DropdownMenuSeparator />
            {agents
              .filter((a) => a.role === 'agent')
              .map((a) => (
                <SingleItem
                  key={a.id}
                  label={a.name}
                  selected={owner === a.id}
                  onSelect={() => {
                    patchParams({ owner: a.id });
                  }}
                />
              ))}
          </FilterMenu>

          {/* Status — multi */}
          <FilterMenu label='Status' active={statusValues.length > 0} count={statusValues.length}>
            {STATUS_OPTIONS.map((o) => (
              <MultiItem
                key={o.value}
                label={o.label}
                selected={statusValues.includes(o.value)}
                onToggle={() => {
                  toggleInList('status', statusValues, o.value);
                }}
              />
            ))}
          </FilterMenu>

          {/* Priority — multi */}
          <FilterMenu
            label='Priority'
            active={priorityValues.length > 0}
            count={priorityValues.length}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <MultiItem
                key={o.value}
                label={o.label}
                selected={priorityValues.includes(o.value)}
                onToggle={() => {
                  toggleInList('priority', priorityValues, o.value);
                }}
              />
            ))}
          </FilterMenu>

          {/* SLA — single */}
          <FilterMenu
            label={`SLA: ${SLA_OPTIONS.find((o) => o.value === sla)?.label ?? 'Any'}`}
            active={sla !== 'any'}
          >
            {SLA_OPTIONS.map((o) => (
              <SingleItem
                key={o.value}
                label={o.label}
                selected={sla === o.value}
                onSelect={() => {
                  patchParams({ sla: o.value === 'any' ? null : o.value });
                }}
              />
            ))}
          </FilterMenu>

          {/* Category — multi */}
          <FilterMenu
            label='Category'
            active={categoryValues.length > 0}
            count={categoryValues.length}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <MultiItem
                key={o.value}
                label={o.label}
                selected={categoryValues.includes(o.value)}
                onToggle={() => {
                  toggleInList('category', categoryValues, o.value);
                }}
              />
            ))}
          </FilterMenu>

          <div className='ml-auto flex items-center gap-2'>
            <FilterMenu
              label={`Sort: ${SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'SLA'}`}
              active={false}
            >
              {SORT_OPTIONS.map((o) => (
                <SingleItem
                  key={o.value}
                  label={o.label}
                  selected={sort === o.value}
                  onSelect={() => {
                    patchParams({ sort: o.value === 'sla' ? null : o.value });
                  }}
                />
              ))}
            </FilterMenu>
          </div>
        </div>

        {/* Result count + active chips */}
        <div className='flex flex-wrap items-center gap-2'>
          {resultCount.length > 0 && (
            <span className='tabular text-sm font-medium text-[var(--color-ink)]'>
              {resultCount}
            </span>
          )}
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type='button'
              onClick={chip.onRemove}
              className='inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--color-primary)]/25 bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10'
            >
              <span>{chip.label}</span>
              <X className='h-3 w-3' />
            </button>
          ))}
          {activeChips.length > 0 && (
            <button
              type='button'
              onClick={clearAll}
              className='text-xs font-medium text-[var(--color-ink-muted)] underline-offset-2 hover:text-[var(--color-ink)] hover:underline'
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Table + states */}
      {isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      ) : (
        <TicketsTable
          items={data?.items ?? []}
          isLoading={isLoading}
          filtersApplied={Boolean(data?.filtersApplied) || activeChips.length > 0}
          ownerName={agentName}
          onClearFilters={clearAll}
          activeChips={activeChips}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Table — owns its own loading / empty / filtered-empty rendering
 * ------------------------------------------------------------------ */

interface TicketsTableProperties {
  readonly items: readonly TicketListItem[];
  readonly isLoading: boolean;
  readonly filtersApplied: boolean;
  readonly ownerName: (id: string) => string;
  readonly onClearFilters: () => void;
  readonly activeChips: ReadonlyArray<{ key: string; label: string; onRemove: () => void }>;
}

function TicketsTable({
  items,
  isLoading,
  filtersApplied,
  onClearFilters,
  activeChips
}: TicketsTableProperties) {
  // Row 11 — filtered-empty is distinct from genuinely empty.
  if (!isLoading && items.length === 0) {
    if (filtersApplied) {
      return (
        <EmptyState
          title='No tickets match these filters'
          description='Nothing here matches the current filters. Remove one, or clear them all to see the full list.'
          icon={<Filter className='h-6 w-6' />}
          action={
            <div className='flex flex-col items-center gap-3'>
              {activeChips.length > 0 && (
                <div className='flex flex-wrap justify-center gap-2'>
                  {activeChips.map((chip) => (
                    <button
                      key={chip.key}
                      type='button'
                      onClick={chip.onRemove}
                      className='inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--color-primary)]/25 bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'
                    >
                      <span>{chip.label}</span>
                      <X className='h-3 w-3' />
                    </button>
                  ))}
                </div>
              )}
              <Button
                variant='outline'
                size='sm'
                onClick={onClearFilters}
                className='border-[var(--color-control-line)]'
              >
                Clear all filters
              </Button>
            </div>
          }
        />
      );
    }
    return (
      <EmptyState
        title='No open tickets'
        description='Nothing is in the queue right now. New tickets appear here as they sync from the support@ inbox.'
        syncTime='Synced 2 min ago'
      />
    );
  }

  return (
    <DataTable>
      <TableHeader>
        <TableRow className='h-9 bg-[var(--color-pearl)]'>
          <TableHead className='w-24'>Ticket</TableHead>
          <TableHead className='w-40'>Customer</TableHead>
          <TableHead className='w-28'>Order ID</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead className='w-32'>Owner</TableHead>
          <TableHead className='w-28'>Status</TableHead>
          <TableHead className='w-24'>Priority</TableHead>
          <TableHead className='w-32'>SLA</TableHead>
          <TableHead className='w-28 text-right'>Last activity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <LoadingRows columns={9} rows={12} />
        ) : (
          items.map((item) => {
            const isUnowned = item.ticket.ownerId === null;
            return (
              <TableRow key={item.ticket.id} className='group relative h-10'>
                <TableCell className='tabular relative pl-4 text-xs font-semibold'>
                  <AttentionRail sla={item.sla} />
                  <Link
                    to={`/tickets/${encodeURIComponent(item.ticket.id)}`}
                    className='text-[var(--color-primary)] hover:underline'
                  >
                    {item.ticket.id}
                  </Link>
                </TableCell>
                <TableCell className='max-w-[160px] truncate text-xs text-[var(--color-ink)]'>
                  {item.ticket.customerName}
                </TableCell>
                <TableCell className='tabular text-xs text-[var(--color-ink-muted)]'>
                  {item.ticket.orderId ?? '–'}
                </TableCell>
                <TableCell className='max-w-[260px]'>
                  <span
                    className='block truncate text-xs text-[var(--color-ink)]'
                    title={item.ticket.subject}
                  >
                    {item.ticket.subject}
                  </span>
                </TableCell>
                <TableCell className='text-xs'>
                  {isUnowned ? (
                    <span className='font-semibold text-[var(--color-urgent-ink)]'>Unowned</span>
                  ) : (
                    <span className='text-[var(--color-ink)]'>
                      {item.owner?.name ?? 'Assigned'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusChip status={item.ticket.status} />
                </TableCell>
                <TableCell>
                  <PriorityChip priority={item.ticket.priority} />
                </TableCell>
                <TableCell>
                  <SlaChip sla={item.sla} />
                </TableCell>
                <TableCell className='tabular text-right text-xs text-[var(--color-ink-muted)]'>
                  {formatRelative(item.ticket.lastActivityAt)}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </DataTable>
  );
}

/* ------------------------------------------------------------------ *
 * Small filter-menu primitives, built on the shared DropdownMenu
 * ------------------------------------------------------------------ */

interface FilterMenuProperties {
  readonly label: string;
  readonly active: boolean;
  readonly count?: number;
  readonly children: ReactNode;
}

function FilterMenu({ label, active, count, children }: FilterMenuProperties) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:outline-none',
            active
              ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
              : 'border-[var(--color-control-line)] bg-[var(--color-canvas)] text-[var(--color-ink)] hover:bg-[var(--color-pearl)]'
          )}
        >
          <span>{label}</span>
          {count != null && count > 0 && (
            <span className='tabular rounded-full bg-[var(--color-primary)] px-1.5 text-[10px] font-bold text-white'>
              {count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-56 shadow-[var(--shadow-overlay)]'>
        <DropdownMenuLabel className='text-xs'>Filter</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SingleItem({
  label,
  selected,
  onSelect
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        onSelect();
      }}
      className='cursor-pointer justify-between text-xs'
    >
      <span>{label}</span>
      {selected && <Check className='h-3.5 w-3.5 text-[var(--color-primary)]' />}
    </DropdownMenuItem>
  );
}

function MultiItem({
  label,
  selected,
  onToggle
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly onToggle: () => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        onToggle();
      }}
      className='cursor-pointer justify-between text-xs'
    >
      <span>{label}</span>
      <span
        className={cn(
          'flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border',
          selected
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
            : 'border-[var(--color-control-line)]'
        )}
      >
        {selected && <Check className='h-2.5 w-2.5' strokeWidth={3} />}
      </span>
    </DropdownMenuItem>
  );
}
