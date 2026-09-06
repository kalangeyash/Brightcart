// Feature list row 10–13 · All Tickets · Specced, not built
// Traces to: 01-feature-list row 10–13 · 03-screen-specs line 200
// Serves: destination for drill-down links from Reports figures and overview

import { ArrowLeft, Ticket } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export function TicketsStub() {
  const [params] = useSearchParams();
  const filterEntries: Array<[string, string]> = [];
  params.forEach((value, key) => {
    filterEntries.push([key, value]);
  });

  return (
    <div className='space-y-6'>
      <PageHeader
        title='All Tickets'
        subtitle='Feature list rows 10–13 — Lead Ticket Management & Audit'
      />

      <div className='mx-auto max-w-2xl space-y-4 rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-8'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]'>
            <Ticket className='h-5 w-5' />
          </div>
          <div>
            <h2 className='text-base font-semibold text-[var(--color-ink)]'>
              Filtered Ticket List Drill-Down
            </h2>
            <p className='text-xs text-[var(--color-ink-muted)]'>
              Interrogating report figures routes here per 03-screen-specs line 200
            </p>
          </div>
        </div>

        {filterEntries.length > 0 ? (
          <div className='space-y-2 rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] p-4'>
            <span className='text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase'>
              Active drill-down query filters:
            </span>
            <div className='flex flex-wrap gap-2 pt-1'>
              {filterEntries.map(([k, v]) => (
                <span
                  key={`${k}-${v}`}
                  className='inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-control-line)] bg-[var(--color-canvas)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink)]'
                >
                  <span className='text-[var(--color-ink-muted)]'>{k}:</span>
                  <span className='tabular font-semibold'>{v}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className='text-sm text-[var(--color-ink-muted)]'>
            No query filters applied. All 147 tickets specced in rows 10–13.
          </p>
        )}

        <div className='flex gap-3 pt-2'>
          <Button asChild variant='outline' size='sm' className='gap-2'>
            <Link to='/reports'>
              <ArrowLeft className='h-3.5 w-3.5' />
              <span>Back to Reports</span>
            </Link>
          </Button>
          <Button asChild size='sm'>
            <Link to='/'>Go to Team Overview</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
