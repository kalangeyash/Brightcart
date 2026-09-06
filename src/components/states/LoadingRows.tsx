// Component · LoadingRows · table skeleton at final height
// Traces to: CLAUDE.md §8 · no layout shift when data lands
// Serves: loading state consistency

import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

interface LoadingRowsProperties {
  readonly columns: number;
  readonly rows?: number;
}

export function LoadingRows({ columns, rows = 5 }: LoadingRowsProperties) {
  const rowList = Array.from({ length: rows }, (_, index) => index);
  const colList = Array.from({ length: columns }, (_, index) => index);

  return (
    <>
      {rowList.map((r) => (
        <TableRow key={`skeleton-row-${r}`} className='h-10'>
          {colList.map((c) => (
            <TableCell key={`skeleton-cell-${r}-${c}`}>
              <Skeleton className='h-4 w-full max-w-[120px]' />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
