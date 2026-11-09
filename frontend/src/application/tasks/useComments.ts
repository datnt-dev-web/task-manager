import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Comment, RichDoc } from '@/domain/entities';
import { commentApi } from '@/infrastructure/api/comment.api';
import { notify } from '../notify';
import { queryKeys } from '../queryKeys';

export const useComments = (taskKey: string) =>
  useQuery({ queryKey: queryKeys.comments(taskKey), queryFn: () => commentApi.list(taskKey), enabled: !!taskKey });

export function useCommentMutations(taskKey: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.comments(taskKey);
  const setComments = (fn: (list: Comment[]) => Comment[]) =>
    queryClient.setQueryData<Comment[]>(key, (list) => fn(list ?? []));

  const add = useMutation({
    mutationFn: (body: RichDoc) => commentApi.create(taskKey, body),
    onSuccess: (comment) => setComments((list) => [...list, comment]),
    onError: (error) => notify.error(error),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: RichDoc }) => commentApi.update(id, body),
    onSuccess: (comment) => setComments((list) => list.map((c) => (c.id === comment.id ? comment : c))),
    onError: (error) => notify.error(error),
  });

  const remove = useMutation({
    mutationFn: (id: string) => commentApi.remove(id),
    onSuccess: (_data, id) => setComments((list) => list.filter((c) => c.id !== id)),
    onError: (error) => notify.error(error),
  });

  return { add, update, remove };
}
