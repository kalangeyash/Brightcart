// Component · PriorityChip · ticket priority indicator
// Traces to: CLAUDE.md §5.2 · §5.7 · 01-feature-list row 6/10
// Serves: triage urgency clarity without raw colour alone

import type { Priority } from '@/types/domain';

import { AlertCircle, ArrowUp, Minus } from 'lucide-react';

import { cn } from '@/lib/utils';

interface PriorityChipProperties {
  readonly priority: Priority;
  readonly className?: string;
}

export function PriorityChip({ priority, className }: PriorityChipProperties) {
  let label: string;
  let toneClass: string;
  let Icon: typeof Minus;

  switch (priority) {
    case 'urgent': {
      label = 'Urgent';
      toneClass =
        'bg-[var(--color-urgent-soft)] text-[var(--color-urgent-ink)] border-[var(--color-urgent)]/20 font-semibold';
      Icon = AlertCircle;
      break;
    }
    case 'high': {
      label = 'High';
      toneClass =
        'bg-[var(--color-pearl)] text-[var(--color-ink)] border-[var(--color-control-line)] font-medium';
      Icon = ArrowUp;
      break;
    }
    case 'normal': {
      label = 'Normal';
      toneClass =
        'bg-[var(--color-pearl)] text-[var(--color-ink-muted)] border-[var(--color-hairline)]';
      Icon = Minus;
      break;
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        toneClass,
        className
      )}
    >
      <Icon className='h-3.5 w-3.5 shrink-0' strokeWidth={2} />
      <span>{label}</span>
    </span>
  );
}
