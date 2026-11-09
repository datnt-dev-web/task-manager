import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { Task } from '@/domain/entities';
import { boardApi, type BoardView } from '@/infrastructure/api/board.api';
import { taskApi, type CreateTaskInput, type MoveTaskInput } from '@/infrastructure/api/task.api';
import { notify } from '../notify';
import { queryKeys } from '../queryKeys';

export const useBoard = (projectId: string) =>
  useQuery({ queryKey: queryKeys.board(projectId), queryFn: () => boardApi.getByProject(projectId), enabled: !!projectId });

/** Cập nhật cache bảng không cần gọi lại API. */
export function patchBoard(queryClient: QueryClient, projectId: string, patch: (view: BoardView) => BoardView) {
  queryClient.setQueryData<BoardView>(queryKeys.board(projectId), (view) => (view ? patch(view) : view));
}

export const upsertTask = (tasks: Task[], task: Task) =>
  tasks.some((t) => t.id === task.id) ? tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)) : [...tasks, task];

export function useRenameBoard(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, name }: { boardId: string; name: string }) => boardApi.rename(boardId, name),
    onMutate: async ({ name }) => {
      const previous = queryClient.getQueryData<BoardView>(queryKeys.board(projectId));
      patchBoard(queryClient, projectId, (v) => ({ ...v, board: { ...v.board, name } }));
      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(queryKeys.board(projectId), context?.previous);
      notify.error(error);
    },
  });
}

/** Thao tác cấu hình cột: xong thì tải lại bảng. */
function useColumnMutation<T>(projectId: string, fn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.board(projectId) }),
    onError: (error) => notify.error(error),
  });
}

export const useAddColumn = (projectId: string) =>
  useColumnMutation(projectId, ({ boardId, name }: { boardId: string; name: string }) => boardApi.addColumn(boardId, name));

export const useUpdateColumn = (projectId: string) =>
  useColumnMutation(projectId, ({ columnId, ...input }: { columnId: string; name?: string; isDone?: boolean }) =>
    boardApi.updateColumn(columnId, input),
  );

export const useDeleteColumn = (projectId: string) =>
  useColumnMutation(projectId, ({ columnId, moveTo }: { columnId: string; moveTo?: string }) =>
    boardApi.deleteColumn(columnId, moveTo),
  );

/** BRD-03: kéo thả sắp xếp cột — đổi chỗ ngay trên màn hình, lỗi thì hoàn lại. */
export function useReorderColumns(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, columnIds }: { boardId: string; columnIds: string[] }) => boardApi.reorderColumns(boardId, columnIds),
    onMutate: async ({ columnIds }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.board(projectId) });
      const previous = queryClient.getQueryData<BoardView>(queryKeys.board(projectId));
      patchBoard(queryClient, projectId, (v) => ({
        ...v,
        board: { ...v.board, columns: v.board.columns.map((c) => ({ ...c, position: columnIds.indexOf(c.id) })) },
      }));
      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(queryKeys.board(projectId), context?.previous);
      notify.error(error, 'Không sắp xếp được cột, đã hoàn lại');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.board(projectId) }),
  });
}

/** TSK-01 / BRD-07: tạo nhanh, thêm thẳng vào cache bảng. */
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => taskApi.create(projectId, input),
    onSuccess: (task) => {
      patchBoard(queryClient, projectId, (v) => ({ ...v, board: { ...v.board, tasks: upsertTask(v.board.tasks, task) } }));
      queryClient.invalidateQueries({ queryKey: queryKeys.myTasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.taskListsOf(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.backlog(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarOf(projectId) });
    },
    onError: (error) => notify.error(error),
  });
}

/** BRD-05 / UX-08: kéo thả hiển thị ngay; lỗi thì hoàn lại vị trí cũ và báo lý do. */
export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ task, ...input }: MoveTaskInput & { task: Task; optimisticPosition: number }) =>
      taskApi.move(task.key, { columnId: input.columnId, prevTaskId: input.prevTaskId, nextTaskId: input.nextTaskId }),
    onMutate: async ({ task, columnId, optimisticPosition }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.board(projectId) });
      const previous = queryClient.getQueryData<BoardView>(queryKeys.board(projectId));
      patchBoard(queryClient, projectId, (v) => ({
        ...v,
        board: {
          ...v.board,
          tasks: v.board.tasks.map((t) => (t.id === task.id ? { ...t, columnId, position: optimisticPosition } : t)),
        },
      }));
      return { previous };
    },
    onSuccess: (saved) => {
      patchBoard(queryClient, projectId, (v) => ({ ...v, board: { ...v.board, tasks: upsertTask(v.board.tasks, saved) } }));
      queryClient.setQueryData(queryKeys.task(saved.key), (old: { task: Task } | undefined) =>
        old ? { ...old, task: { ...old.task, ...saved } } : old,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.myTasks });
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(queryKeys.board(projectId), context?.previous);
      notify.error(error, 'Không chuyển được công việc, đã hoàn lại vị trí cũ');
    },
  });
}
