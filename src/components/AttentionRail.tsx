// Component · AttentionRail · signature 3px left attention rail
// Traces to: CLAUDE.md §5.6 · signature detail
// Serves: reading urgency from across a desk without inspecting numbers

import type { SlaState } from '@/types/domain';

import { railTone } from '@/lib/sla';
import { cn } from '@/lib/utils';

interface AttentionRailProperties {
  readonly sla?: SlaState;
  readonly tone?: 'urgent' | 'danger' | null;
  readonly className?: string;
}

export function AttentionRail({ sla, tone, className }: AttentionRailProperties) {
  const activeTone = tone ?? (sla ? railTone(sla) : null);

  if (!activeTone) {
    return null;
  }

  return (
    <span
      className={cn(
        'absolute top-0 bottom-0 left-0 w-[3px]',
        activeTone === 'danger' && 'bg-[var(--color-danger)]',
        activeTone === 'urgent' && 'bg-[var(--color-urgent)]',
        className
      )}
      aria-hidden='true'
    />
  );
}
