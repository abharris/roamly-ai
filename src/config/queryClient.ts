import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      // Don't retry 401s — the axios interceptor handles token refresh + one HTTP retry.
      // Retrying at the RQ level would double-fire requests and cause a request storm.
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) return false;
        return failureCount < 1;
      },
    },
  },
});
