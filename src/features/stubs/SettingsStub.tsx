// Feature list row 17–22 · Admin Settings · Specced, not built
// Traces to: 01-feature-list row 17–22
// Serves: placeholder for mailbox channel and team settings

import { Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export function SettingsStub() {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Settings'
        subtitle='Feature list rows 17–22 — Email channel, SLA policies, and assignment rules'
      />

      <div className='mx-auto max-w-xl space-y-4 rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-12 text-center'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]'>
          <SettingsIcon className='h-6 w-6' />
        </div>
        <h2 className='text-lg font-semibold text-[var(--color-ink)]'>
          Email Channel & SLA Settings
        </h2>
        <p className='text-sm leading-relaxed text-[var(--color-ink-muted)]'>
          Specced under Feature List rows 17–22. Governs mailbox connection (support@brightcart.in),
          auto-close policy, category definitions, and business hour schedules.
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
