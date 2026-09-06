// Component · PageHeader · standardized screen header with sync state
// Traces to: 01-feature-list row 4 · 03-screen-specs layout
// Serves: time and sync context on every screen

import type { ReactNode } from 'react';

import { formatClock, formatDate } from '@/lib/format';
import { NOW } from '@/lib/sla';
import { cn } from '@/lib/utils';

interface PageHeaderProperties {
  readonly title: string;
  readonly subtitle?: string;
  readonly lastSyncAt?: string;
  readonly actions?: ReactNode;
  readonly className?: string;
}

export function PageHeader({
  title,
  subtitle,
  lastSyncAt,
  actions,
  className
}: PageHeaderProperties) {
  // Derive shift context from fixed NOW per specification
  const formattedDate = formatDate(NOW);
  const formattedClock = formatClock(NOW);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-b border-[var(--color-hairline)] pb-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div>
        <h1 className='text-[32px] leading-[1.2] font-bold tracking-[-0.4px] text-[var(--color-ink)]'>
          {title}
        </h1>
        {subtitle != null && subtitle.length > 0 ? (
          <p className='mt-1 text-sm text-[var(--color-ink-muted)]'>{subtitle}</p>
        ) : null}
      </div>

      <div className='flex flex-col items-start gap-1 sm:items-end'>
        <div className='tabular text-sm font-medium text-[var(--color-ink)]'>
          Monday, {formattedDate} · {formattedClock}
        </div>
        <div className='tabular text-xs text-[var(--color-ink-muted)]'>
          {lastSyncAt != null && lastSyncAt.length > 0
            ? 'Synced with support@ inbox'
            : 'Synced 2 min ago'}
        </div>
        {actions == null ? null : <div className='mt-2'>{actions}</div>}
      </div>
    </div>
  );
}
