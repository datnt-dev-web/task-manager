import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/infrastructure/api/user.api';
import { notify } from '../notify';
import { queryKeys } from '../queryKeys';

/** Danh bạ nhân viên để chọn khi thêm thành viên dự án. */
export const useUserDirectory = (q: string) =>
  useQuery({ queryKey: queryKeys.users(q), queryFn: () => userApi.list({ q, pageSize: 20 }), staleTime: 30_000 });

export const useAllUsers = (q: string) =>
  useQuery({ queryKey: [...queryKeys.users(q), 'admin'], queryFn: () => userApi.list({ q, pageSize: 100 }) });

/** ADM-03/04: khóa/mở tài khoản, cấp/bỏ quyền Quản trị viên. */
export function useAdminUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...input }: { userId: string; status?: 'active' | 'disabled'; isAdmin?: boolean }) =>
      userApi.adminUpdate(userId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (error) => notify.error(error),
  });
}

export function useInviteUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (emails: string[]) => userApi.invite(emails),
    onSuccess: ({ created, skipped }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notify.success(`Đã thêm ${created.length} người${skipped.length ? `, bỏ qua ${skipped.length} email đã có` : ''}`);
    },
    onError: (error) => notify.error(error),
  });
}
