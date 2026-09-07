// Feature list row 6 · Reassign ticket modal
// Traces to: 01-feature-list row 6 · 03-screen-specs line 98
// Serves: consequence-naming ticket assignment with live open counts

import { useState } from 'react';

import type { TicketListItem } from '@/types/api';
import type { Agent } from '@/types/domain';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCheck } from 'lucide-react';

import { StatusChip } from '@/components/StatusChip';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { api } from '@/services';

interface AssignModalProperties {
  readonly item: TicketListItem | null;
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
}

export function AssignModal({ item, isOpen, onOpenChange }: AssignModalProperties) {
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const agentsQuery = useQuery({
    queryKey: ['agents-list'],
    queryFn: () => api.getAgents()
  });

  const overviewQuery = useQuery({
    queryKey: ['team-overview'],
    queryFn: () => api.getTeamOverview()
  });

  const assignMutation = useMutation({
    mutationFn: (agentId: string) => {
      if (item == null) {
        throw new Error('No ticket selected');
      }
      return api.assignTicket({ ticketId: item.ticket.id, ownerId: agentId });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team-overview'] });
      void queryClient.invalidateQueries({ queryKey: ['unassigned-queue-count'] });
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
      // Refresh the ticket-detail view when the modal is opened from there.
      void queryClient.invalidateQueries({ queryKey: ['ticket'] });
      onOpenChange(false);
      setSelectedAgentId('');
    }
  });

  if (item == null) {
    return null;
  }

  const agents = agentsQuery.data ?? [];
  const workload = overviewQuery.data?.workload ?? [];

  const getAgentOpenCount = (agentId: string): number => {
    const row = workload.find((w) => w.agent.id === agentId);
    return row?.open ?? 0;
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const targetOpenCount = selectedAgent ? getAgentOpenCount(selectedAgent.id) : 0;
  const consequenceCount = targetOpenCount + 1;
  const firstName = selectedAgent ? selectedAgent.name.split(' ', 1)[0] : '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <UserCheck className='h-5 w-5 text-[var(--color-primary)]' />
            <span>Assign {item.ticket.id}</span>
          </DialogTitle>
          <DialogDescription>
            {item.ticket.subject} · Customer: {item.ticket.customerName}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 py-2'>
          <span className='block text-xs font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase'>
            Select assignee (showing current workload)
          </span>

          <div className='max-h-60 space-y-1.5 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-pearl)] p-1.5 pr-1'>
            {agents
              .filter((a) => a.role === 'agent')
              .map((agent: Agent) => {
                const count = getAgentOpenCount(agent.id);
                const isSelected = selectedAgentId === agent.id;
                const isOnLeave = agent.status === 'on_leave';

                return (
                  <button
                    key={agent.id}
                    type='button'
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                    }}
                    className={`flex w-full items-center justify-between rounded-[var(--radius-control)] p-2 text-left text-sm transition-colors ${
                      isSelected
                        ? 'border border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)] font-medium text-[var(--color-primary)]'
                        : 'bg-[var(--color-canvas)] text-[var(--color-ink)] hover:bg-[var(--color-pearl)]'
                    }`}
                  >
                    <div className='flex items-center gap-2'>
                      <span>{agent.name}</span>
                      <StatusChip status={agent.status} />
                    </div>
                    <div className='tabular flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]'>
                      <span>{count} open</span>
                      {isOnLeave && (
                        <span className='font-medium text-[var(--color-urgent-ink)]'>(leave)</span>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>

          {selectedAgent && (
            <div className='rounded-[var(--radius-control)] border border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)] p-3 text-xs text-[var(--color-ink)]'>
              <span className='font-semibold text-[var(--color-primary)]'>Consequence:</span> Assign{' '}
              {item.ticket.id} to {selectedAgent.name}? {firstName} will have{' '}
              <span className='tabular font-bold'>{consequenceCount}</span> open.
            </div>
          )}
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
            disabled={!selectedAgentId || assignMutation.isPending}
            onClick={() => {
              assignMutation.mutate(selectedAgentId);
            }}
            className='bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
          >
            {assignMutation.isPending ? 'Assigning…' : 'Assign ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
