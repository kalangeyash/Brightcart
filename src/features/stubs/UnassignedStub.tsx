// Feature list row 8–9 · Unassigned Queue · Specced, not built
// Traces to: 01-feature-list row 8/9 · 03-screen-specs "What I would build next"
// Serves: honest placeholder for unassigned queue and assignment flows

import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export function UnassignedStub() {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Unassigned Queue'
        subtitle='Feature list rows 8 & 9 — Specced, not built in this phase'
      />

      <div className='mx-auto max-w-xl space-y-4 rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-12 text-center'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]'>
          <Users className='h-6 w-6' />
        </div>
        <h2 className='text-lg font-semibold text-[var(--color-ink)]'>
          Unassigned Queue & Assignment Engine
        </h2>
        <p className='text-sm leading-relaxed text-[var(--color-ink-muted)]'>
          Specced under Feature List rows 8–9 to provide automated aging buckets (over 30 min, over
          2h) and suggested lightest-load assignments. Team Overview currently proves the assignment
          interactions.
        </p>
        <div className='pt-2'>
          <Button asChild variant='outline'>
            <Link to='/'>Return to Team Overview</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
