import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { env } from '@/config/env';
import { queryKeys } from '@/application/queryKeys';
import { ThemeProvider } from '@/application/theme/ThemeProvider';
import { setSessionExpiredHandler } from '@/infrastructure/http/client';
import { getErrorStatus } from '@/infrastructure/http/apiError';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        // Không thử lại với lỗi quyền/không tồn tại.
        retry: (count, error) => ![401, 403, 404].includes(getErrorStatus(error) ?? 0) && count < 2,
      },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    // Không dùng queryClient.clear(): truy vấn phiên có thể đang chạy và sẽ bị treo nếu bị xóa giữa chừng.
    setSessionExpiredHandler(() => {
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== queryKeys.session[0] });
      queryClient.setQueryData(queryKeys.session, null);
    });
  }, [queryClient]);

  return (
    <GoogleOAuthProvider clientId={env.googleClientId || 'not-configured'}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
