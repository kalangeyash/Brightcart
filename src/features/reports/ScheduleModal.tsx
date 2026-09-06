// Feature list row 15 · Schedule report modal
// Traces to: 01-feature-list row 15 · 03-screen-specs line 202
// Serves: eliminating Monday reporting burden completely

import { useState } from 'react';

import type { ReportSchedule } from '@/types/api';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/services';

interface ScheduleModalProperties {
  readonly schedule?: ReportSchedule | null;
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
}

export function ScheduleModal({ schedule, isOpen, onOpenChange }: ScheduleModalProperties) {
  const queryClient = useQueryClient();
  const [recipient, setRecipient] = useState<string>(
    schedule?.recipients[0] ?? 'manoj.p@brightcart.in'
  );
  const [time, setTime] = useState<string>(schedule?.time ?? '08:00');
  const [day, setDay] = useState<number>(schedule?.dayOfWeek ?? 1);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.saveReportSchedule({
        enabled: true,
        dayOfWeek: day,
        time,
        recipients: [recipient]
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['weekly-report'] });
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5 text-[var(--color-primary)]' />
            <span>Schedule Weekly Report</span>
          </DialogTitle>
          <DialogDescription>
            Automate the Monday report so Manoj never has to generate it by hand.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2 text-sm'>
          <div>
            <span className='mb-1 block text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase'>
              Delivery schedule
            </span>
            <div className='flex items-center gap-3'>
              <div className='flex-1'>
                <span className='text-xs text-[var(--color-ink-muted)]'>Day</span>
                <select
                  value={day}
                  onChange={(event) => {
                    setDay(Number(event.target.value));
                  }}
                  className='mt-1 h-8 w-full rounded-[var(--radius-control)] border border-[var(--color-control-line)] bg-[var(--color-canvas)] px-2 text-xs text-[var(--color-ink)]'
                >
                  <option value={1}>Every Monday</option>
                  <option value={2}>Every Tuesday</option>
                  <option value={5}>Every Friday</option>
                </select>
              </div>

              <div className='w-28'>
                <span className='flex items-center gap-1 text-xs text-[var(--color-ink-muted)]'>
                  <Clock className='h-3 w-3' /> Time
                </span>
                <Input
                  type='time'
                  value={time}
                  onChange={(event) => {
                    setTime(event.target.value);
                  }}
                  className='tabular mt-1 h-8 text-xs'
                />
              </div>
            </div>
          </div>

          <div>
            <span className='mb-1 block flex items-center gap-1 text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase'>
              <Mail className='h-3.5 w-3.5' /> Recipient email
            </span>
            <Input
              type='email'
              value={recipient}
              onChange={(event) => {
                setRecipient(event.target.value);
              }}
              placeholder='e.g. manoj.p@brightcart.in'
              className='text-xs'
            />
          </div>

          <div className='rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] p-3 text-xs text-[var(--color-ink-muted)]'>
            <span className='font-semibold text-[var(--color-ink)]'>Current policy:</span> Delivered
            Every Monday at {time} to {recipient}.
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type='button'
            disabled={saveMutation.isPending || !recipient}
            onClick={() => {
              saveMutation.mutate();
            }}
            className='bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
          >
            {saveMutation.isPending ? 'Saving…' : 'Save schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
