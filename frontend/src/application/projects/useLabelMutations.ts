import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Label } from '@/domain/entities';
import { projectApi } from '@/infrastructure/api/project.api';
import { notify } from '../notify';
import { queryKeys } from '../queryKeys';

/** PRJ-06: quản lý nhãn. Đổi nhãn thì làm mới bảng/backlog để thẻ hiện đúng tên, màu. */
export function useLabelMutations(projectId: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.labels(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.board(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.backlog(projectId) });
    queryClient.invalidateQueries({ queryKey: ['task'] });
  };
  const onError = (error: unknown) => notify.error(error);

  return {
    create: useMutation({ mutationFn: (input: Omit<Label, 'id'>) => projectApi.createLabel(projectId, input), onSuccess: refresh, onError }),
    update: useMutation({
      mutationFn: ({ id, ...input }: Partial<Omit<Label, 'id'>> & { id: string }) => projectApi.updateLabel(id, input),
      onSuccess: refresh,
      onError,
    }),
    remove: useMutation({ mutationFn: (id: string) => projectApi.removeLabel(id), onSuccess: refresh, onError }),
  };
}
