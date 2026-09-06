// Feature list row 15 · Reports — weekly overview
// Traces to: Manoj — "monday report = 2 hrs of my life, every week"
// Serves: Monday reporting takes minutes, not hours

import { useState } from 'react';

import type { ReportFigure } from '@/types/api';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Download,
  PieChart,
  TrendingUp,
  Users
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { DataTable } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDelta, formatPreciseDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { api } from '@/services';

import { ScheduleModal } from './ScheduleModal';

function renderFigureValue(fig: ReportFigure): string {
  if (fig.unit === 'percent') {
    return `${fig.value}%`;
  }
  if (fig.unit === 'duration_ms') {
    return formatPreciseDuration(fig.value);
  }
  return String(fig.value);
}

function getDrillDownUrl(fig: ReportFigure): string {
  if (fig.drillDown == null) {
    return '/tickets';
  }
  const params = new URLSearchParams();
  if (fig.drillDown.sla != null && fig.drillDown.sla.length > 0) {
    params.set('sla', fig.drillDown.sla);
  }
  if (fig.drillDown.ownerId != null && fig.drillDown.ownerId.length > 0) {
    params.set('owner', fig.drillDown.ownerId);
  }
  if (fig.drillDown.status != null && fig.drillDown.status.length > 0) {
    params.set('status', fig.drillDown.status.join(','));
  }
  const queryString = params.toString();
  return queryString.length > 0 ? `/tickets?${queryString}` : '/tickets';
}

export function ReportsScreen() {
  const location = useLocation();
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'pdf' | null>(null);
  const [activePeriod, setActivePeriod] = useState<'this_week' | 'last_week' | 'custom'>(
    'this_week'
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['weekly-report', location.search],
    queryFn: () => api.getWeeklyReport()
  });

  // State 1: Loading
  if (isLoading) {
    return (
      <div className='space-y-6'>
        <PageHeader title='Weekly Report' subtitle='Loading weekly metrics…' />
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-6'>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={`metric-skel-${index}`}
              className='flex h-28 flex-col justify-between rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4'
            >
              <Skeleton className='h-3.5 w-28' />
              <Skeleton className='h-8 w-16' />
              <Skeleton className='h-3 w-20' />
            </div>
          ))}
        </div>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
          <div className='space-y-3 lg:col-span-6'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-44 w-full' />
          </div>
          <div className='space-y-3 lg:col-span-6'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-44 w-full' />
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
        <PageHeader title='Weekly Report' subtitle='Weekly performance and SLA audit' />
        <ErrorState message={errorMessage} onRetry={() => void refetch()} />
      </div>
    );
  }

  // State 3: Row 16 Insufficient Data
  if (data.insufficientData) {
    return (
      <div className='space-y-6'>
        <PageHeader title='Weekly Report' subtitle='1–7 Sep 2026 · Support Desk go-live phase' />

        <EmptyState
          icon={<Clock className='h-6 w-6' />}
          title='Not enough data for this period yet'
          description="Support Desk has been live since 8 Sep. The first full week's report will be ready on 15 Sep."
          action={
            <div className='flex gap-3'>
              <Button asChild size='sm' className='bg-[var(--color-primary)] text-white'>
                <Link to='/'>View live team numbers</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  // State 4: Default Active Report State
  const handleExport = (format: 'csv' | 'pdf') => {
    setExportingFormat(format);
    setTimeout(() => {
      setExportingFormat(null);
    }, 1200);
  };

  // Headline figures split: first two are the key promises
  const [promise1, promise2, ...contextFigures] = data.headline;

  return (
    <div className='space-y-6'>
      {/* Header and Controls */}
      <PageHeader
        title='Weekly Report'
        subtitle={`Period: ${data.period.label}`}
        actions={
          <div className='flex flex-wrap items-center gap-2'>
            {/* Period selector */}
            <div className='inline-flex rounded-[var(--radius-control)] border border-[var(--color-control-line)] bg-[var(--color-canvas)] p-0.5 text-xs font-medium'>
              <button
                type='button'
                onClick={() => {
                  setActivePeriod('this_week');
                }}
                className={cn(
                  'rounded-[min(var(--radius-control),4px)] px-2.5 py-1 transition-colors',
                  activePeriod === 'this_week'
                    ? 'bg-[var(--color-primary)] font-semibold text-white'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                )}
              >
                1–7 Sep
              </button>
              <button
                type='button'
                onClick={() => {
                  setActivePeriod('last_week');
                }}
                className={cn(
                  'rounded-[min(var(--radius-control),4px)] px-2.5 py-1 transition-colors',
                  activePeriod === 'last_week'
                    ? 'bg-[var(--color-primary)] font-semibold text-white'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                )}
              >
                Prev week
              </button>
              <button
                type='button'
                onClick={() => {
                  setActivePeriod('custom');
                }}
                className={cn(
                  'rounded-[min(var(--radius-control),4px)] px-2.5 py-1 transition-colors',
                  activePeriod === 'custom'
                    ? 'bg-[var(--color-primary)] font-semibold text-white'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                )}
              >
                Custom
              </button>
            </div>

            {/* Export CSV / PDF Actions with inline progress */}
            <Button
              variant='outline'
              size='sm'
              disabled={exportingFormat !== null}
              onClick={() => {
                handleExport('csv');
              }}
              className='gap-1 border-[var(--color-control-line)] text-xs'
            >
              <Download
                className={`h-3 w-3 ${exportingFormat === 'csv' ? 'animate-bounce' : ''}`}
              />
              <span>{exportingFormat === 'csv' ? 'Generating CSV…' : 'Export CSV'}</span>
            </Button>

            <Button
              variant='outline'
              size='sm'
              disabled={exportingFormat !== null}
              onClick={() => {
                handleExport('pdf');
              }}
              className='gap-1 border-[var(--color-control-line)] text-xs'
            >
              <Download
                className={`h-3 w-3 ${exportingFormat === 'pdf' ? 'animate-bounce' : ''}`}
              />
              <span>{exportingFormat === 'pdf' ? 'Generating PDF…' : 'Export PDF'}</span>
            </Button>

            {/* Schedule Weekly Email Modal Trigger */}
            <Button
              size='sm'
              onClick={() => {
                setIsScheduleOpen(true);
              }}
              className='gap-1.5 bg-[var(--color-primary)] text-xs text-white hover:bg-[var(--color-primary-hover)]'
            >
              <Calendar className='h-3.5 w-3.5' />
              <span>Schedule weekly email</span>
            </Button>
          </div>
        }
      />

      {/* Schedule Banner Note */}
      <div className='flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)] p-3 text-xs text-[var(--color-ink)]'>
        <div className='flex items-center gap-2'>
          <Calendar className='h-4 w-4 shrink-0 text-[var(--color-primary)]' />
          <span>
            Automated schedule active: <strong>Every Monday 08:00</strong> to{' '}
            <strong>manoj.p@brightcart.in</strong>
          </span>
        </div>
        <button
          type='button'
          onClick={() => {
            setIsScheduleOpen(true);
          }}
          className='font-semibold text-[var(--color-primary)] hover:underline'
        >
          Change
        </button>
      </div>

      {/* Headline Figures — Two Promises Largest and First */}
      <div className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {/* Promise 1: First response within 24h */}
          <Link
            to={getDrillDownUrl(promise1)}
            className='group flex flex-col justify-between rounded-[var(--radius-control)] border-2 border-[var(--color-primary)]/30 bg-[var(--color-canvas)] p-5 transition-all hover:border-[var(--color-primary)]'
          >
            <div className='flex items-center justify-between'>
              <span className='text-xs font-bold tracking-wider text-[var(--color-primary)] uppercase'>
                {promise1.label}
              </span>
              <span className='text-xs text-[var(--color-ink-muted)]'>Target: 100%</span>
            </div>
            <div className='my-2 flex items-baseline gap-3'>
              <span className='tabular text-4xl font-extrabold text-[var(--color-ink)]'>
                {renderFigureValue(promise1)}
              </span>
              {promise1.deltaVsPrevious !== null && (
                <span className='tabular text-sm font-semibold text-[var(--color-good)]'>
                  {formatDelta(promise1.deltaVsPrevious, promise1.unit)}
                </span>
              )}
            </div>
            <span className='text-xs text-[var(--color-ink-muted)] transition-colors group-hover:text-[var(--color-primary)]'>
              Primary client promise · Click to inspect tickets →
            </span>
          </Link>

          {/* Promise 2: Never unowned over 30 min */}
          <Link
            to={getDrillDownUrl(promise2)}
            className='group flex flex-col justify-between rounded-[var(--radius-control)] border-2 border-[var(--color-primary)]/30 bg-[var(--color-canvas)] p-5 transition-all hover:border-[var(--color-primary)]'
          >
            <div className='flex items-center justify-between'>
              <span className='text-xs font-bold tracking-wider text-[var(--color-primary)] uppercase'>
                {promise2.label}
              </span>
              <span className='text-xs text-[var(--color-ink-muted)]'>Target: 100%</span>
            </div>
            <div className='my-2 flex items-baseline gap-3'>
              <span className='tabular text-4xl font-extrabold text-[var(--color-ink)]'>
                {renderFigureValue(promise2)}
              </span>
              {promise2.deltaVsPrevious !== null && (
                <span className='tabular text-sm font-semibold text-[var(--color-good)]'>
                  {formatDelta(promise2.deltaVsPrevious, promise2.unit)}
                </span>
              )}
            </div>
            <span className='text-xs text-[var(--color-ink-muted)] transition-colors group-hover:text-[var(--color-primary)]'>
              Triage promise · Click to inspect tickets →
            </span>
          </Link>
        </div>

        {/* 4 Context Figures */}
        <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
          {contextFigures.map((fig) => {
            const isBreachedCard = fig.key === 'breached';
            return (
              <Link
                key={fig.key}
                to={getDrillDownUrl(fig)}
                className='group flex flex-col justify-between rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4 transition-all hover:border-[var(--color-primary-ring)]'
              >
                <span className='text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase'>
                  {fig.label}
                </span>
                <div className='my-1 flex items-baseline gap-2'>
                  <span
                    className={cn(
                      'tabular text-2xl font-bold',
                      isBreachedCard && fig.value > 0
                        ? 'text-[var(--color-danger)]'
                        : 'text-[var(--color-ink)]'
                    )}
                  >
                    {renderFigureValue(fig)}
                  </span>
                  {fig.deltaVsPrevious !== null && (
                    <span
                      className={cn(
                        'tabular text-xs font-medium',
                        fig.deltaIsGood === true && 'text-[var(--color-good)]',
                        fig.deltaIsGood === false && 'text-[var(--color-danger)]',
                        fig.deltaIsGood === null && 'text-[var(--color-ink-muted)]'
                      )}
                    >
                      {formatDelta(fig.deltaVsPrevious, fig.unit)}
                    </span>
                  )}
                </div>
                <span className='text-[11px] text-[var(--color-ink-faint)] group-hover:text-[var(--color-primary)]'>
                  Click to drill down →
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grid: First Response Distribution & Why Breached */}
      <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-12'>
        {/* First Response Distribution (sums to 587) */}
        <div className='space-y-3 lg:col-span-6'>
          <div className='flex items-center justify-between'>
            <h2 className='flex items-center gap-1.5 text-sm font-bold tracking-wider text-[var(--color-ink)] uppercase'>
              <TrendingUp className='h-4 w-4 text-[var(--color-primary)]' />
              <span>First-response distribution</span>
            </h2>
            <span className='tabular text-xs text-[var(--color-ink-muted)]'>587 tickets total</span>
          </div>

          <div className='space-y-3 rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4'>
            {data.distribution.map((band) => {
              const isBreached = band.band === 'breached';
              return (
                <Link
                  key={band.band}
                  to={`/tickets?sla=${band.band}`}
                  className='group flex flex-col gap-1 rounded-[min(var(--radius-control),4px)] p-1 transition-colors hover:bg-[var(--color-pearl)]'
                >
                  <div className='flex items-center justify-between text-xs'>
                    <span
                      className={cn(
                        'font-medium',
                        isBreached && 'font-semibold text-[var(--color-danger)]'
                      )}
                    >
                      {band.label}
                    </span>
                    <span className='tabular text-[var(--color-ink-muted)]'>
                      <strong className='text-[var(--color-ink)]'>{band.count}</strong> (
                      {Math.round(band.share)}%)
                    </span>
                  </div>
                  <div className='h-2 w-full overflow-hidden rounded-full bg-[var(--color-hairline)]'>
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isBreached ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-primary)]'
                      )}
                      style={{ width: `${Math.max(4, Math.round(band.share))}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Why the 53 Breached */}
        <div className='space-y-3 lg:col-span-6'>
          <div className='flex items-center justify-between'>
            <h2 className='flex items-center gap-1.5 text-sm font-bold tracking-wider text-[var(--color-danger)] uppercase'>
              <AlertTriangle className='h-4 w-4 text-[var(--color-danger)]' />
              <span>Why the 53 breached</span>
            </h2>
            <span className='tabular text-xs text-[var(--color-ink-muted)]'>53 breaches total</span>
          </div>

          <div className='space-y-3 rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4'>
            {data.breachReasons.map((reason) => (
              <Link
                key={reason.reason}
                to={`/tickets?reason=${reason.reason}`}
                className='group flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] p-2 transition-colors hover:bg-[var(--color-danger-soft)]/40'
              >
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 shrink-0 rounded-full bg-[var(--color-danger)]' />
                  <span className='text-xs font-medium text-[var(--color-ink)] group-hover:text-[var(--color-danger)]'>
                    {reason.label}
                  </span>
                </div>
                <span className='tabular rounded-full bg-[var(--color-danger-soft)] px-2 py-0.5 text-xs font-bold text-[var(--color-danger)]'>
                  {reason.count}
                </span>
              </Link>
            ))}

            <p className='pt-1 text-[11px] leading-relaxed text-[var(--color-ink-muted)]'>
              * Arrived overnight is the largest driver (22/53). This highlights coverage and shift
              handover gaps rather than individual agent speed.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Per Agent Table & Category Breakdown */}
      <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-12'>
        {/* Per-agent Table (Sorted by Handled, NOT Breaches per §10) */}
        <div className='space-y-3 lg:col-span-8'>
          <div className='flex items-center justify-between'>
            <h2 className='flex items-center gap-1.5 text-sm font-bold tracking-wider text-[var(--color-ink)] uppercase'>
              <Users className='h-4 w-4 text-[var(--color-primary)]' />
              <span>Per agent, this week</span>
            </h2>
            <span className='text-xs text-[var(--color-ink-muted)]'>
              sorted by handled (workload, not leaderboard)
            </span>
          </div>

          <DataTable>
            <TableHeader>
              <TableRow className='h-9 bg-[var(--color-pearl)]'>
                <TableHead>Agent</TableHead>
                <TableHead className='text-right'>Handled</TableHead>
                <TableHead className='text-right'>Resolved</TableHead>
                <TableHead className='text-right'>Median first response</TableHead>
                <TableHead className='text-right'>Breached</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.perAgent.map((row) => (
                <TableRow key={row.agent.id} className='h-10'>
                  <TableCell className='text-xs font-medium text-[var(--color-ink)]'>
                    {row.agent.name}
                  </TableCell>
                  <TableCell className='tabular text-right text-xs font-medium'>
                    {row.handled}
                  </TableCell>
                  <TableCell className='tabular text-right text-xs text-[var(--color-good)]'>
                    {row.resolved}
                  </TableCell>
                  <TableCell className='tabular text-right text-xs text-[var(--color-ink-muted)]'>
                    {row.medianFirstResponseMs
                      ? formatPreciseDuration(row.medianFirstResponseMs)
                      : '–'}
                  </TableCell>
                  <TableCell className='tabular text-right text-xs'>
                    {row.breached > 0 ? (
                      <span className='font-semibold text-[var(--color-danger)]'>
                        {row.breached}
                      </span>
                    ) : (
                      <span className='text-[var(--color-ink-muted)]'>0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </div>

        {/* Category Split (Sums to 587) */}
        <div className='space-y-3 lg:col-span-4'>
          <div className='flex items-center justify-between'>
            <h2 className='flex items-center gap-1.5 text-sm font-bold tracking-wider text-[var(--color-ink)] uppercase'>
              <PieChart className='h-4 w-4 text-[var(--color-primary)]' />
              <span>Category split</span>
            </h2>
            <span className='tabular text-xs text-[var(--color-ink-muted)]'>587 tickets</span>
          </div>

          <div className='space-y-3 rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4'>
            {data.categories.map((cat) => (
              <Link
                key={cat.category}
                to={`/tickets?category=${cat.category}`}
                className='group flex flex-col gap-1 rounded-[min(var(--radius-control),4px)] p-1 transition-colors hover:bg-[var(--color-pearl)]'
              >
                <div className='flex items-center justify-between text-xs'>
                  <span className='font-medium text-[var(--color-ink)]'>{cat.label}</span>
                  <span className='tabular text-[var(--color-ink-muted)]'>
                    <strong className='text-[var(--color-ink)]'>{cat.count}</strong> (
                    {Math.round(cat.share)}%)
                  </span>
                </div>
                <div className='h-2 w-full overflow-hidden rounded-full bg-[var(--color-hairline)]'>
                  <div
                    className='h-full rounded-full bg-[var(--color-primary)] transition-all duration-300'
                    style={{ width: `${Math.max(4, Math.round(cat.share))}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      <ScheduleModal
        schedule={data.schedule}
        isOpen={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
      />
    </div>
  );
}
