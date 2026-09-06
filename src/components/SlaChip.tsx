// Component · SlaChip · shared urgency indicator
// Traces to: CLAUDE.md §5.2 · §5.7 · §8 (colour is never the only signal)
// Serves: first response < 24h · at-a-glance breach warning

import type { SlaState } from '@/types/domain';

import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

interface SlaChipProperties {
  readonly sla: SlaState;
  readonly className?: string;
}

export function SlaChip({ sla, className }: SlaChipProperties) {
  let label = '';
  let toneClass = '';
  let Icon = Clock;

  switch (sla.kind) {
    case 'breached': {
      label = `Breached ${formatDuration(sla.msSince)} ago`;
      toneClass =
        'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/20';
      Icon = AlertTriangle;
      break;
    }
    case 'due_soon': {
      label = `${formatDuration(sla.msRemaining)} left`;
      toneClass =
        'bg-[var(--color-urgent-soft)] text-[var(--color-urgent-ink)] border-[var(--color-urgent)]/20';
      Icon = Clock;
      break;
    }
    case 'on_track': {
      label = `${formatDuration(sla.msRemaining)} left`;
      toneClass =
        'bg-[var(--color-good-soft)] text-[var(--color-good)] border-[var(--color-good)]/20';
      Icon = CheckCircle2;
      break;
    }
    case 'met': {
      label = `Met in ${formatDuration(sla.respondedInMs)}`;
      toneClass =
        'bg-[var(--color-good-soft)] text-[var(--color-good)] border-[var(--color-good)]/20';
      Icon = CheckCircle2;
      break;
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        toneClass,
        className
      )}
    >
      <Icon className='h-3.5 w-3.5 shrink-0' strokeWidth={2} />
      <span className='tabular'>{label}</span>
    </span>
  );
}
