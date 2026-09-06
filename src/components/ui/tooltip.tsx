/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */

import * as React from 'react';

import { Tooltip as TooltipPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'animate-in fade-in-0 zoom-in-95 z-50 overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-ink)] px-2.5 py-1 text-xs text-white shadow-[var(--shadow-overlay)]',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
