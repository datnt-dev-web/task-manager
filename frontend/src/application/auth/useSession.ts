import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@/domain/entities';
import { authApi } from '@/infrastructure/api/auth.api';
import { getErrorStatus } from '@/infrastructure/http/apiError';
import { queryKeys } from '../queryKeys';

/** Người dùng đang đăng nhập; `null` nếu chưa đăng nhập. */
export function useSession() {
  return useQuery<User | null>({
    queryKey: queryKeys.session,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if (getErrorStatus(error) === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

function useOnSignedIn() {
  const queryClient = useQueryClient();
  return (user: User) => {
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
    queryClient.setQueryData(queryKeys.session, user);
  };
}

export function useGoogleSignIn() {
  const onSignedIn = useOnSignedIn();
  return useMutation({ mutationFn: authApi.loginWithGoogle, onSuccess: onSignedIn });
}

export function usePasswordSignIn() {
  const onSignedIn = useOnSignedIn();
  return useMutation({ mutationFn: authApi.login, onSuccess: onSignedIn });
}

export function useRegister() {
  const onSignedIn = useOnSignedIn();
  return useMutation({ mutationFn: authApi.register, onSuccess: onSignedIn });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword });
}

/** Đặt lại mật khẩu bằng liên kết trong email → đăng nhập luôn. */
export function useResetPassword() {
  const onSignedIn = useOnSignedIn();
  return useMutation({ mutationFn: authApi.resetPassword, onSuccess: onSignedIn });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (user) => queryClient.setQueryData(queryKeys.session, user),
  });
}

export function useDevSignIn() {
  const onSignedIn = useOnSignedIn();
  return useMutation({ mutationFn: authApi.devLogin, onSuccess: onSignedIn });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Không dùng clear(): nó xóa luôn truy vấn phiên mà RequireAuth đang theo dõi → giao diện không cập nhật.
      queryClient.setQueryData(queryKeys.session, null);
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== queryKeys.session[0] });
    },
  });
}
