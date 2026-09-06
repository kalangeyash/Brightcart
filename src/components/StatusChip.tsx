// Component · StatusChip · agent & ticket status indicator
// Traces to: CLAUDE.md §5.2 · §5.7 · 03-screen-specs Team Overview
// Serves: visibility of agent availability & ticket lifecycle

import type { AgentStatus, TicketStatus } from '@/types/domain';

import { Calendar, Check, CheckCircle2, Circle, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';

interface StatusChipProperties {
  readonly status: AgentStatus | TicketStatus;
  readonly className?: string;
}

export function StatusChip({ status, className }: StatusChipProperties) {
  let label: string;
  let toneClass: string;
  let Icon: typeof Circle;

  switch (status) {
    case 'active': {
      label = 'Active';
      toneClass =
        'bg-[var(--color-good-soft)] text-[var(--color-good)] border-[var(--color-good)]/20';
      Icon = Check;
      break;
    }
    case 'on_leave': {
      label = 'On leave';
      toneClass =
        'bg-[var(--color-urgent-soft)] text-[var(--color-urgent-ink)] border-[var(--color-urgent)]/20 font-medium';
      Icon = Calendar;
      break;
    }
    case 'offline': {
      label = 'Offline';
      toneClass =
        'bg-[var(--color-pearl)] text-[var(--color-ink-muted)] border-[var(--color-hairline)]';
      Icon = Circle;
      break;
    }
    case 'new': {
      label = 'New';
      toneClass =
        'bg-[var(--color-urgent-soft)] text-[var(--color-urgent-ink)] border-[var(--color-urgent)]/20';
      Icon = Clock;
      break;
    }
    case 'in_progress': {
      label = 'In progress';
      toneClass =
        'bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)]/20';
      Icon = Clock;
      break;
    }
    case 'waiting_on_customer': {
      label = 'Waiting';
      toneClass =
        'bg-[var(--color-pearl)] text-[var(--color-ink-muted)] border-[var(--color-hairline)]';
      Icon = Clock;
      break;
    }
    case 'resolved': {
      label = 'Resolved';
      toneClass =
        'bg-[var(--color-good-soft)] text-[var(--color-good)] border-[var(--color-good)]/20';
      Icon = CheckCircle2;
      break;
    }
    case 'closed': {
      label = 'Closed';
      toneClass =
        'bg-[var(--color-pearl)] text-[var(--color-ink-muted)] border-[var(--color-hairline)]';
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
      <Icon className='h-3 w-3 shrink-0' strokeWidth={2} />
      <span>{label}</span>
    </span>
  );
}
