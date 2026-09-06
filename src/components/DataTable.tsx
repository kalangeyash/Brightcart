// Component · DataTable · dense table wrapper
// Traces to: CLAUDE.md §5.4 · 40px rows · 36px header · density target
// Serves: dense 14-agent visibility without scrolling

import type { ReactNode } from 'react';

import { Table } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableProperties {
  readonly children: ReactNode;
  readonly className?: string;
}

export function DataTable({ children, className }: DataTableProperties) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-hairline)] bg-[var(--color-canvas)]',
        className
      )}
    >
      <Table>{children}</Table>
    </div>
  );
}
