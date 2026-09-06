/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */

import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-control)] bg-[var(--color-hairline)]',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
