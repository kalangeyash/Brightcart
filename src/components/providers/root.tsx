import { useState } from 'react';

import type { PropsWithChildren } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type TRootProvider = PropsWithChildren;

export default function RootProvider({ children }: Readonly<TRootProvider>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: false
          }
        }
      })
  );

  // The Support Desk runs in a single branded light theme (03-screen-specs:
  // "Support runs in a lit office on a day shift"). No theme provider — the
  // brand tokens in styles/global.css are the only palette, and the class-based
  // `dark:` variant never fires because no `.dark` class is ever applied.
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
