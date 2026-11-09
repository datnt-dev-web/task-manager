import { useRef } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Task } from '@/domain/entities';
import type { BoardView } from '@/infrastructure/api/board.api';
import { taskApi, type TaskListQuery, type UpdateTaskInput } from '@/infrastructure/api/task.api';
import { patchBoard, upsertTask } from '../board/useBoard';
import { notify } from '../notify';
import { queryKeys } from '../queryKeys';

export const useTask = (key: string | null) =>
  useQuery({ queryKey: queryKeys.task(key ?? ''), queryFn: () => taskApi.get(key!), enabled: !!key });

export const useMyTasks = () => useQuery({ queryKey: queryKeys.myTasks, queryFn: taskApi.mine });

export const useTaskList = (projectId: string, query: TaskListQuery) =>
  useQuery({
    queryKey: queryKeys.taskList(projectId, query),
    queryFn: () => taskApi.list(projectId, query),
    placeholderData: keepPreviousData,
    enabled: !!projectId,
  });

/** SRC-03: gợi ý kết quả tìm kiếm toàn hệ thống khi đang gõ. */
export const useQuickSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => taskApi.quickSearch(q),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

/** TSK-05: sửa tại chỗ, đồng bộ mọi nơi đang hiển thị công việc. */
export function useUpdateTask(task: Pick<Task, 'key' | 'projectId'>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTaskInput) => taskApi.update(task.key, input),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.task(saved.key), (old: { task: Task } | undefined) =>
        old ? { ...old, task: { ...old.task, ...saved } } : old,
      );
      patchBoard(queryClient, task.projectId, (v) => ({ ...v, board: { ...v.board, tasks: upsertTask(v.board.tasks, saved) } }));
      queryClient.invalidateQueries({ queryKey: queryKeys.myTasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.taskListsOf(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.backlog(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarOf(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(saved.key) });
    },
    onError: (error) => notify.error(error),
  });
}

/**
 * TSK-11 / UX-06: ẩn công việc ngay, chờ 5 giây cho người dùng bấm Hoàn tác rồi mới gọi API xóa.
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const timers = useRef(new Map<string, number>());

  return (task: Task) => {
    const boardKey = queryKeys.board(task.projectId);
    const previousBoard = queryClient.getQueryData<BoardView>(boardKey);
    patchBoard(queryClient, task.projectId, (v) => ({
      ...v,
      board: { ...v.board, tasks: v.board.tasks.filter((t) => t.id !== task.id) },
    }));

    const commit = async () => {
      timers.current.delete(task.id);
      try {
        await taskApi.remove(task.key);
        queryClient.removeQueries({ queryKey: queryKeys.task(task.key) });
        queryClient.invalidateQueries({ queryKey: queryKeys.myTasks });
        queryClient.invalidateQueries({ queryKey: queryKeys.taskListsOf(task.projectId) });
      } catch (error) {
        if (previousBoard) queryClient.setQueryData(boardKey, previousBoard);
        notify.error(error, 'Không xóa được công việc');
      }
    };

    timers.current.set(task.id, window.setTimeout(commit, 5000));
    notify.undoable(`Đã xóa ${task.key}`, () => {
      window.clearTimeout(timers.current.get(task.id));
      timers.current.delete(task.id);
      if (previousBoard) queryClient.setQueryData(boardKey, previousBoard);
    });
  };
}
