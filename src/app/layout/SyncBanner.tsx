// Feature list row 25 · Sync failure banner and recovery
// Traces to: 01-feature-list row 25 · 03-screen-specs line 132
// Serves: immediate awareness when ticket sync stops · names failure & action

import type { SyncStatus } from '@/types/domain';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { formatClock } from '@/lib/format';
import { api } from '@/services';

interface SyncBannerProperties {
  readonly sync?: SyncStatus;
}

export function SyncBanner({ sync }: SyncBannerProperties) {
  const queryClient = useQueryClient();

  const retryMutation = useMutation({
    mutationFn: () => api.retrySync(),
    onSuccess: () => {
      void queryClient.invalidateQueries();
    }
  });

  if (sync == null || sync.healthy) {
    return null;
  }

  const stoppedTime = sync.stoppedAt == null ? '08:14' : formatClock(sync.stoppedAt);

  return (
    <div
      role='alert'
      className='relative z-40 flex flex-col items-center justify-between gap-3 bg-[var(--color-danger)] px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-overlay)] sm:flex-row'
    >
      <div className='flex items-center gap-2.5'>
        <AlertTriangle className='h-4 w-4 shrink-0 text-white' strokeWidth={2} />
        <span>Email sync stopped at {stoppedTime}. New tickets are not arriving.</span>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        <Button
          size='sm'
          variant='outline'
          disabled={retryMutation.isPending}
          onClick={() => {
            retryMutation.mutate();
          }}
          className='h-7 gap-1.5 border-white bg-white text-xs font-medium text-[var(--color-danger)] hover:bg-white/90 hover:text-[var(--color-danger)]'
        >
          <RefreshCw className={`h-3 w-3 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
          <span>{retryMutation.isPending ? 'Retrying…' : 'Retry now'}</span>
        </Button>

        <Link
          to='/settings'
          className='inline-flex items-center gap-1 px-2 py-1 text-xs text-white underline underline-offset-4 hover:text-white/80'
        >
          <Settings className='h-3.5 w-3.5' />
          <span>Open channel settings</span>
        </Link>
      </div>
    </div>
  );
}
