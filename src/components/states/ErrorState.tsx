// Component · ErrorState · informative recovery state
// Traces to: CLAUDE.md §8 · §9 (never a bare status code)
// Serves: clear explanation of failure and next action

import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProperties {
  readonly message?: string;
  readonly recovery?: string;
  readonly onRetry?: () => void;
  readonly className?: string;
}

export function ErrorState({
  message = 'Support Desk could not load this.',
  recovery = 'Try again in a moment. If it keeps failing, check the email channel settings.',
  onRetry,
  className
}: ErrorStateProperties) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)]/30 p-12 text-center',
        className
      )}
      role='alert'
    >
      <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)]'>
        <AlertTriangle className='h-6 w-6' strokeWidth={2} />
      </div>
      <h3 className='mb-1 text-lg font-semibold text-[var(--color-ink)]'>{message}</h3>
      <p className='mb-6 max-w-md text-sm text-[var(--color-ink-muted)]'>{recovery}</p>
      {onRetry && (
        <Button
          variant='outline'
          size='default'
          onClick={onRetry}
          className='gap-2 border-[var(--color-control-line)] hover:bg-[var(--color-canvas)]'
        >
          <RefreshCw className='h-4 w-4' />
          <span>Try again</span>
        </Button>
      )}
    </div>
  );
}
