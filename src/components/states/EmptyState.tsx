// Component · EmptyState · honest empty state
// Traces to: CLAUDE.md §8 · §9 · row 7 / row 16
// Serves: stating facts, not generic cheerleading

import type { ReactNode } from 'react';

import { CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmptyStateProperties {
  readonly title: string;
  readonly description: string;
  readonly syncTime?: string;
  readonly action?: ReactNode;
  readonly icon?: ReactNode;
  readonly className?: string;
}

export function EmptyState({
  title,
  description,
  syncTime,
  action,
  icon,
  className
}: EmptyStateProperties) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-12 text-center',
        className
      )}
    >
      <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-good-soft)] text-[var(--color-good)]'>
        {icon ?? <CheckCircle2 className='h-6 w-6' strokeWidth={2} />}
      </div>
      <h3 className='mb-1 text-lg font-semibold text-[var(--color-ink)]'>{title}</h3>
      <p className='mb-3 max-w-md text-sm text-[var(--color-ink-muted)]'>{description}</p>
      {syncTime != null && syncTime.length > 0 ? (
        <span className='tabular mb-6 text-xs text-[var(--color-ink-faint)]'>{syncTime}</span>
      ) : null}
      {action == null ? null : <div className='mt-2'>{action}</div>}
    </div>
  );
}
