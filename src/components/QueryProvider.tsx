'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { QueryClient } from '@tanstack/react-query'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: true,
            retry: 2,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
