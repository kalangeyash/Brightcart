// Feature list row 6 · Team Overview · lead landing screen
// Traces to: Manoj — "i cannot see who has 40 mails and who has 5"
// Serves: no query unowned > 30 min · first response < 24h

import { useState } from 'react';

import type { TicketListItem } from '@/types/api';

import { useQuery } from '@tanstack/react-query';
import { Clock, ExternalLink, RefreshCw, UserCheck, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { AttentionRail } from '@/components/AttentionRail';
import { DataTable } from '@/components/DataTable';
import { LoadBar } from '@/components/LoadBar';
import { PageHeader } from '@/components/PageHeader';
import { PriorityChip } from '@/components/PriorityChip';
import { SlaChip } from '@/components/SlaChip';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingRows } from '@/components/states/LoadingRows';
import { StatusChip } from '@/components/StatusChip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDuration, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { api } from '@/services';

import { AssignModal } from './AssignModal';

export function TeamOverviewScreen() {
  const location = useLocation();
  const [assignTarget, setAssignTarget] = useState<TicketListItem | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'on_leave'>('all');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['team-overview', location.search],
    queryFn: () => api.getTeamOverview()
  });

  // State 1: Loading
  if (isLoading) {
    return (
      <div className='space-y-6'>
        <PageHeader title='Team Overview' subtitle='Shift operations and live SLA risk' />

        {/* 4 Status Tiles Skeletons */}
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={`tile-skel-${index}`}
              className='flex h-24 flex-col justify-between rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4'
            >
              <Skeleton className='h-3.5 w-24' />
              <Skeleton className='h-8 w-16' />
              <Skeleton className='h-3 w-32' />
            </div>
          ))}
        </div>

        {/* Tables Skeleton */}
        <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-12'>
          <div className='space-y-3 lg:col-span-5'>
            <Skeleton className='h-5 w-32' />
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead className='text-right'>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <LoadingRows columns={4} rows={5} />
              </TableBody>
            </DataTable>
          </div>

          <div className='space-y-3 lg:col-span-7'>
            <Skeleton className='h-5 w-48' />
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Open</TableHead>
                  <TableHead>Load</TableHead>
                  <TableHead>Breaching</TableHead>
                  <TableHead>Untouched</TableHead>
                  <TableHead>Oldest</TableHead>
                  <TableHead>Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <LoadingRows columns={8} rows={14} />
              </TableBody>
            </DataTable>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Error
  if (isError || !data) {
    const errorMessage = error instanceof Error ? error.message : undefined;
    return (
      <div className='space-y-6'>
        <PageHeader title='Team Overview' subtitle='Shift operations and live SLA risk' />
        <ErrorState message={errorMessage} onRetry={() => void refetch()} />
      </div>
    );
  }

  // State 3: Row 7 All Clear / Empty state
  if (data.allClear) {
    return (
      <div className='space-y-6'>
        <PageHeader
          title='Team Overview'
          subtitle='Shift operations and live SLA risk'
          actions={
            <Button
              variant='outline'
              size='sm'
              onClick={() => void refetch()}
              className='gap-1.5 border-[var(--color-control-line)]'
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh sync</span>
            </Button>
          }
        />

        {/* 4 Status Tiles in All-Clear */}
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
          {data.tiles.map((tile) => (
            <div
              key={tile.key}
              className='flex flex-col justify-between rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4'
            >
              <span className='text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase'>
                {tile.label}
              </span>
              <span className='tabular my-1 text-3xl font-bold text-[var(--color-ink)]'>
                {tile.value}
              </span>
              <span className='text-xs text-[var(--color-ink-muted)]'>
                {tile.subLabel ?? 'On track'}
              </span>
            </div>
          ))}
        </div>

        {/* Row 7 Specific Microcopy */}
        <EmptyState
          title='Nothing needs you right now'
          description='0 unowned · 0 breaching in the next 2 hours · 147 open across the team'
          syncTime='Synced 09:41'
          action={
            <div className='flex gap-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => void refetch()}
                className='border-[var(--color-control-line)]'
              >
                Refresh sync
              </Button>
              <Button asChild size='sm' className='bg-[var(--color-primary)] text-white'>
                <Link to='/tickets'>View all tickets</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  // State 4: Default Active State
  const isSyncUnhealthy = !data.sync.healthy;

  const handleAssignClick = (item: TicketListItem) => {
    setAssignTarget(item);
    setIsAssignOpen(true);
  };

  // Filter workload table by status
  const filteredWorkload = data.workload.filter((row) => {
    if (statusFilter === 'active') {
      return row.agent.status === 'active';
    }
    if (statusFilter === 'on_leave') {
      return row.agent.status === 'on_leave';
    }
    return true;
  });

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Team Overview'
        subtitle='Shift operations and live SLA risk'
        actions={
          <Button
            variant='outline'
            size='sm'
            onClick={() => void refetch()}
            className='gap-1.5 border-[var(--color-control-line)]'
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        }
      />

      {/* 4 Status Tiles — Fixed Order, Compact Strips */}
      <div
        className={cn(
          'grid grid-cols-2 gap-4 transition-opacity lg:grid-cols-4',
          isSyncUnhealthy && 'opacity-60'
        )}
      >
        {data.tiles.map((tile) => {
          let toneBorder = 'border-[var(--color-hairline)]';
          let toneValue = 'text-[var(--color-ink)]';
          let toneSub = 'text-[var(--color-ink-muted)]';

          if (tile.tone === 'urgent') {
            toneBorder = 'border-[var(--color-urgent)]/40 bg-[var(--color-urgent-soft)]/20';
            toneValue = 'text-[var(--color-urgent-ink)]';
            toneSub = 'text-[var(--color-urgent-ink)] font-medium';
          } else if (tile.tone === 'danger') {
            toneBorder = 'border-[var(--color-danger)]/40 bg-[var(--color-danger-soft)]/20';
            toneValue = 'text-[var(--color-danger)]';
            toneSub = 'text-[var(--color-danger)] font-medium';
          }

          return (
            <div
              key={tile.key}
              className={cn(
                'flex flex-col justify-between rounded-[var(--radius-control)] border bg-[var(--color-canvas)] p-4',
                toneBorder
              )}
            >
              <span className='text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase'>
                {tile.label}
              </span>
              <div className='my-1'>
                <span className={cn('tabular text-3xl font-bold tracking-tight', toneValue)}>
                  {tile.value}
                </span>
              </div>
              <span className={cn('min-h-[16px] text-xs', toneSub)}>{tile.subLabel ?? ''}</span>
            </div>
          );
        })}
      </div>

      {/* Reversed Split Layout: Left Narrow (Needs You Now) + Right Wide (Team Workload) */}
      <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-12'>
        {/* Left Column: Needs You Now (Top 5 breach risk) */}
        <div className='space-y-3 lg:col-span-5'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4 text-[var(--color-urgent-ink)]' />
              <h2 className='text-base font-bold text-[var(--color-ink)]'>Needs you now</h2>
            </div>
            <span className='text-xs text-[var(--color-ink-muted)]'>
              breach risk · soonest first
            </span>
          </div>

          <DataTable>
            <TableHeader>
              <TableRow className='h-9 bg-[var(--color-pearl)]'>
                <TableHead className='w-24'>Ticket</TableHead>
                <TableHead>Customer / Subject</TableHead>
                <TableHead className='w-28'>SLA</TableHead>
                <TableHead className='w-20 text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.needsYouNow.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='py-6 text-center text-xs text-[var(--color-ink-muted)]'
                  >
                    No tickets currently at breach risk
                  </TableCell>
                </TableRow>
              ) : (
                data.needsYouNow.map((item) => {
                  const isBreached = item.sla.kind === 'breached';
                  const isUnowned = item.ticket.ownerId === null;

                  return (
                    <TableRow
                      key={item.ticket.id}
                      className={cn(
                        'group relative h-12',
                        isBreached ? 'bg-[var(--color-danger-soft)]/15' : undefined
                      )}
                    >
                      <TableCell className='tabular pl-4 text-xs font-semibold'>
                        <AttentionRail sla={item.sla} />
                        <Link
                          to={`/tickets/${encodeURIComponent(item.ticket.id)}`}
                          className='inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline'
                        >
                          {item.ticket.id}
                        </Link>
                        <div className='mt-1'>
                          <PriorityChip priority={item.ticket.priority} />
                        </div>
                      </TableCell>

                      <TableCell className='max-w-[180px]'>
                        <div className='truncate text-xs font-medium text-[var(--color-ink)]'>
                          {item.ticket.customerName}
                        </div>
                        <div
                          className='truncate text-xs text-[var(--color-ink-muted)]'
                          title={item.ticket.subject}
                        >
                          {item.ticket.subject}
                        </div>
                        <div className='mt-0.5 text-[11px] text-[var(--color-ink-faint)]'>
                          {isUnowned ? (
                            <span className='font-semibold text-[var(--color-urgent-ink)]'>
                              Unowned
                            </span>
                          ) : (
                            <span>{item.owner?.name ?? 'Assigned'}</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <SlaChip sla={item.sla} />
                      </TableCell>

                      <TableCell className='text-right'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            handleAssignClick(item);
                          }}
                          className='h-7 gap-1 border-[var(--color-control-line)] px-2 text-xs hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]'
                        >
                          <UserCheck className='h-3 w-3' />
                          <span>Assign</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </DataTable>

          <div className='flex justify-end pt-1'>
            <Button
              asChild
              variant='ghost'
              size='sm'
              className='gap-1 text-xs text-[var(--color-primary)]'
            >
              <Link to='/unassigned'>
                <span>View unassigned queue</span>
                <ExternalLink className='h-3 w-3' />
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Column: Team Workload (14 Agents) */}
        <div className='space-y-3 lg:col-span-7'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-[var(--color-primary)]' />
              <h2 className='text-base font-bold text-[var(--color-ink)]'>Team workload</h2>
              <span className='tabular text-xs text-[var(--color-ink-muted)]'>
                ({data.workload.length} agents · median {data.teamMedianOpen})
              </span>
            </div>

            {/* Filter by status */}
            <div className='flex items-center gap-1.5 text-xs'>
              <button
                type='button'
                onClick={() => {
                  setStatusFilter('all');
                }}
                className={cn(
                  'rounded-[var(--radius-control)] px-2 py-0.5 font-medium transition-colors',
                  statusFilter === 'all'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-pearl)]'
                )}
              >
                All (14)
              </button>
              <button
                type='button'
                onClick={() => {
                  setStatusFilter('active');
                }}
                className={cn(
                  'rounded-[var(--radius-control)] px-2 py-0.5 font-medium transition-colors',
                  statusFilter === 'active'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-pearl)]'
                )}
              >
                Active
              </button>
              <button
                type='button'
                onClick={() => {
                  setStatusFilter('on_leave');
                }}
                className={cn(
                  'rounded-[var(--radius-control)] px-2 py-0.5 font-medium transition-colors',
                  statusFilter === 'on_leave'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-pearl)]'
                )}
              >
                On leave
              </button>
            </div>
          </div>

          <DataTable>
            <TableHeader>
              <TableRow className='h-9 bg-[var(--color-pearl)]'>
                <TableHead className='w-36'>Agent</TableHead>
                <TableHead className='w-24'>Status</TableHead>
                <TableHead className='w-32'>Load vs median</TableHead>
                <TableHead className='w-16 text-right'>At-risk</TableHead>
                <TableHead className='w-20 text-right'>Untouched</TableHead>
                <TableHead className='w-16 text-right'>Oldest</TableHead>
                <TableHead className='w-24 text-right'>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkload.map((row) => {
                const isOverloaded = row.open > data.teamMedianOpen * 2;
                const isOnLeave = row.agent.status === 'on_leave';
                const hasBreach = row.breaching > 0;
                const hasUntouched = row.untouchedOver24h > 0;

                // Tone for AttentionRail: danger if breaching, urgent if untouched/leave risk
                let rowRailTone: 'urgent' | 'danger' | null = null;
                if (hasBreach) {
                  rowRailTone = 'danger';
                } else if (hasUntouched || (isOnLeave && row.open > 0)) {
                  rowRailTone = 'urgent';
                }

                return (
                  <TableRow
                    key={row.agent.id}
                    className={cn(
                      'relative h-10 transition-colors',
                      isOnLeave && row.open > 0 ? 'bg-[var(--color-urgent-soft)]/20' : undefined,
                      isOverloaded ? 'font-medium' : undefined
                    )}
                  >
                    {/* Agent Name */}
                    <TableCell className='pl-4 text-xs font-medium'>
                      <AttentionRail tone={rowRailTone} />
                      <span className='text-[var(--color-ink)]'>{row.agent.name}</span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusChip status={row.agent.status} />
                    </TableCell>

                    {/* Workload LoadBar */}
                    <TableCell>
                      <LoadBar open={row.open} loadRatio={row.loadRatio} />
                    </TableCell>

                    {/* Breaching / At Risk */}
                    <TableCell className='tabular text-right text-xs'>
                      {row.breaching > 0 ? (
                        <span className='font-bold text-[var(--color-danger)]'>
                          {row.breaching}
                        </span>
                      ) : (
                        <span className='text-[var(--color-ink-muted)]'>0</span>
                      )}
                    </TableCell>

                    {/* Untouched over 24h */}
                    <TableCell className='tabular text-right text-xs'>
                      {row.untouchedOver24h > 0 ? (
                        <span className='font-bold text-[var(--color-urgent-ink)]'>
                          {row.untouchedOver24h}
                        </span>
                      ) : (
                        <span className='text-[var(--color-ink-muted)]'>0</span>
                      )}
                    </TableCell>

                    {/* Oldest open ticket age */}
                    <TableCell className='tabular text-right text-xs text-[var(--color-ink-muted)]'>
                      {row.oldestOpenAgeMs ? formatDuration(row.oldestOpenAgeMs) : '–'}
                    </TableCell>

                    {/* Last activity */}
                    <TableCell className='tabular text-right text-xs text-[var(--color-ink-muted)]'>
                      {row.lastActivityAt != null && row.lastActivityAt.length > 0
                        ? formatRelative(row.lastActivityAt)
                        : '–'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </div>
      </div>

      {/* Reassign Ticket Modal */}
      <AssignModal item={assignTarget} isOpen={isAssignOpen} onOpenChange={setIsAssignOpen} />
    </div>
  );
}
