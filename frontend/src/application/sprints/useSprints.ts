import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { Task } from '@/domain/entities';
import { sprintApi, type BacklogView, type PlanTaskInput, type SprintInput } from '@/infrastructure/api/sprint.api';
import { taskApi } from '@/infrastructure/api/task.api';
import { notify } from '../notify';
import { queryKeys } from '../queryKeys';

export const useBacklog = (projectId: string) =>
  useQuery({ queryKey: queryKeys.backlog(projectId), queryFn: () => sprintApi.backlog(projectId), enabled: !!projectId });

export const useCompletedSprints = (projectId: string, enabled: boolean) =>
  useQuery({ queryKey: queryKeys.completedSprints(projectId), queryFn: () => sprintApi.completed(projectId), enabled });

/** Sprint thay đổi ảnh hưởng tới backlog, bảng (lọc theo sprint đang chạy) và chi tiết công việc. */
function invalidateSprintViews(queryClient: QueryClient, projectId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.backlog(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.board(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.completedSprints(projectId) });
  queryClient.invalidateQueries({ queryKey: ['task'] });
}

function useSprintMutation<T, R>(projectId: string, fn: (input: T) => Promise<R>, successMessage?: (result: R) => string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (result) => {
      invalidateSprintViews(queryClient, projectId);
      if (successMessage) notify.success(successMessage(result));
    },
    onError: (error) => notify.error(error),
  });
}

export function useSprintActions(projectId: string) {
  return {
    create: useSprintMutation(projectId, (input: SprintInput) => sprintApi.create(projectId, input), (s) => `Đã tạo ${s.name}`),
    update: useSprintMutation(projectId, ({ id, ...input }: SprintInput & { id: string }) => sprintApi.update(id, input)),
    remove: useSprintMutation(projectId, (id: string) => sprintApi.remove(id), () => 'Đã xóa sprint, công việc trở về backlog'),
    start: useSprintMutation(
      projectId,
      ({ id, ...input }: { id: string; startDate?: string; endDate?: string }) => sprintApi.start(id, input),
      (s) => `Đã bắt đầu ${s.name}. Bảng giờ chỉ hiện công việc của sprint này.`,
    ),
    complete: useSprintMutation(
      projectId,
      ({ id, moveToSprintId }: { id: string; moveToSprintId: string | null }) => sprintApi.complete(id, moveToSprintId),
      (r) => `Đã hoàn thành sprint: ${r.completed}/${r.total} việc xong${r.moved ? `, ${r.moved} việc chuyển sang ${r.movedTo}` : ''}`,
    ),
  };
}

/** Đặt công việc vào đúng nhóm (sprint/backlog) và sắp lại theo backlogRank. */
function placeTask(view: BacklogView, task: Task, sprintId: string | null, rank: number): BacklogView {
  const moved = { ...task, sprintId, backlogRank: rank };
  const without = (list: Task[]) => list.filter((t) => t.id !== task.id);
  const insert = (list: Task[]) => [...without(list), moved].sort((a, b) => (a.backlogRank ?? 0) - (b.backlogRank ?? 0));
  return {
    ...view,
    backlog: sprintId === null ? insert(view.backlog) : without(view.backlog),
    sprints: view.sprints.map((s) => ({ ...s, tasks: s.id === sprintId ? insert(s.tasks) : without(s.tasks) })),
  };
}

/** SPR-03: kéo thả giữa backlog và sprint — hiển thị ngay, lỗi thì hoàn lại. */
export function usePlanTask(projectId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.backlog(projectId);
  return useMutation({
    mutationFn: ({ task, ...input }: PlanTaskInput & { task: Task; optimisticRank: number }) =>
      sprintApi.plan(task.key, { sprintId: input.sprintId, prevTaskId: input.prevTaskId, nextTaskId: input.nextTaskId }),
    onMutate: async ({ task, sprintId, optimisticRank }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BacklogView>(key);
      queryClient.setQueryData<BacklogView>(key, (v) => (v ? placeTask(v, task, sprintId, optimisticRank) : v));
      return { previous };
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<BacklogView>(key, (v) => (v ? placeTask(v, saved, saved.sprintId ?? null, saved.backlogRank ?? 0) : v));
      queryClient.invalidateQueries({ queryKey: queryKeys.board(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.task(saved.key) });
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
      notify.error(error, 'Không chuyển được công việc, đã hoàn lại');
    },
  });
}

/** Thêm nhanh công việc vào backlog hoặc một sprint. */
export function useCreateBacklogTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; sprintId: string | null }) => taskApi.create(projectId, input),
    onSuccess: () => invalidateSprintViews(queryClient, projectId),
    onError: (error) => notify.error(error),
  });
}
