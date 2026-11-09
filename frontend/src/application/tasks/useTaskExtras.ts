import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Attachment, Task } from '@/domain/entities';
import { validateFiles } from '@/domain/rules/file.rules';
import { attachmentApi } from '@/infrastructure/api/attachment.api';
import { subtaskApi, type SubtaskInput } from '@/infrastructure/api/subtask.api';
import { taskApi, type TaskDetailView } from '@/infrastructure/api/task.api';
import { notify } from '../notify';
import { queryKeys } from '../queryKeys';

type TaskRef = Pick<Task, 'key' | 'projectId'>;

/** Sau khi đổi việc con: tải lại chi tiết công việc và bảng (để cập nhật "2/5" trên thẻ). */
function useRefreshTask(task: TaskRef) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.task(task.key) });
    queryClient.invalidateQueries({ queryKey: queryKeys.board(task.projectId) });
  };
}

/** TSK-07: thêm / sửa / xóa việc con. */
export function useSubtaskMutations(task: TaskRef) {
  const refresh = useRefreshTask(task);
  const queryClient = useQueryClient();
  const patchDetail = (fn: (view: TaskDetailView) => TaskDetailView) =>
    queryClient.setQueryData<TaskDetailView>(queryKeys.task(task.key), (v) => (v ? fn(v) : v));

  const add = useMutation({
    mutationFn: (input: SubtaskInput & { title: string }) => subtaskApi.create(task.key, input),
    onSuccess: refresh,
    onError: (error) => notify.error(error),
  });

  const update = useMutation({
    mutationFn: ({ id, ...input }: SubtaskInput & { id: string }) => subtaskApi.update(id, input),
    // Tick hoàn thành hiển thị ngay (UX-08).
    onMutate: ({ id, ...input }) =>
      patchDetail((v) => ({
        ...v,
        task: { ...v.task, subtasks: v.task.subtasks?.map((s) => (s.id === id ? { ...s, ...input } : s)) },
      })),
    onSettled: refresh,
    onError: (error) => notify.error(error),
  });

  const remove = useMutation({
    mutationFn: (id: string) => subtaskApi.remove(id),
    onMutate: (id) =>
      patchDetail((v) => ({ ...v, task: { ...v.task, subtasks: v.task.subtasks?.filter((s) => s.id !== id) } })),
    onSettled: refresh,
    onError: (error) => notify.error(error),
  });

  return { add, update, remove };
}

export const useAttachments = (taskKey: string) =>
  useQuery({ queryKey: ['task', taskKey, 'attachments'], queryFn: () => attachmentApi.list(taskKey), enabled: !!taskKey });

/** ATT-01/03: tải lên có thanh tiến trình, xóa tệp. */
export function useAttachmentMutations(taskKey: string) {
  const queryClient = useQueryClient();
  const key = ['task', taskKey, 'attachments'];
  const [progress, setProgress] = useState<number | null>(null);

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const problem = validateFiles(files);
      if (problem) throw new Error(problem);
      setProgress(0);
      return attachmentApi.upload(taskKey, files, setProgress);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Attachment[]>(key, (list) => [...created, ...(list ?? [])]);
      queryClient.invalidateQueries({ queryKey: queryKeys.fileLibraryAll });
    },
    onError: (error) => notify.error(error, error instanceof Error ? error.message : undefined),
    onSettled: () => setProgress(null),
  });

  const remove = useMutation({
    mutationFn: (id: string) => attachmentApi.remove(id),
    onSuccess: (_d, id) => {
      queryClient.setQueryData<Attachment[]>(key, (list) => list?.filter((a) => a.id !== id));
      queryClient.invalidateQueries({ queryKey: queryKeys.fileLibraryAll });
    },
    onError: (error) => notify.error(error),
  });

  return { upload, remove, progress };
}

/** TSK-08: Theo dõi / Bỏ theo dõi. */
export function useWatchTask(taskKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (watching: boolean) => taskApi.setWatching(taskKey, watching),
    onSuccess: (watching) =>
      queryClient.setQueryData<TaskDetailView>(queryKeys.task(taskKey), (v) => (v ? { ...v, watching } : v)),
    onError: (error) => notify.error(error),
  });
}
