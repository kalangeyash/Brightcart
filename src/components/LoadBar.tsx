// Component · LoadBar · workload relative to team median
// Traces to: CLAUDE.md §5.2 · 03-screen-specs line 124
// Serves: catching overload six weeks before resignation

import { cn } from '@/lib/utils';

interface LoadBarProperties {
  readonly open: number;
  readonly loadRatio: number;
  readonly className?: string;
}

export function LoadBar({ open, loadRatio, className }: LoadBarProperties) {
  // loadRatio is clamped 0-1, representing open / (median * 3)
  const percentage = Math.max(8, Math.min(100, Math.round(loadRatio * 100)));

  return (
    <div className={cn('flex min-w-[120px] items-center gap-2', className)}>
      <div
        className='h-2 w-20 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-hairline)]'
        role='progressbar'
        aria-valuenow={open}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Open tickets workload: ${open}`}
      >
        <div
          className='h-full rounded-[var(--radius-pill)] bg-[var(--color-urgent)] transition-all duration-300'
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className='tabular w-6 text-right text-xs font-medium text-[var(--color-ink)]'>
        {open}
      </span>
    </div>
  );
}
