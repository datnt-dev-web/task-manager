import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Task } from '@/domain/entities';
import { taskApi } from '@/infrastructure/api/task.api';
import { notify } from '../notify';
import { queryKeys } from '../queryKeys';

/** TSK-09: lịch sử thay đổi. */
export const useActivity = (taskKey: string, enabled = true) =>
  useQuery({ queryKey: queryKeys.activity(taskKey), queryFn: () => taskApi.activity(taskKey), enabled: enabled && !!taskKey });

/** RPT-05: công việc theo hạn trong khoảng ngày đang xem. */
export const useCalendar = (projectId: string, from: string, to: string) =>
  useQuery({
    queryKey: queryKeys.calendar(projectId, from, to),
    queryFn: () => taskApi.calendar(projectId, from, to),
    placeholderData: keepPreviousData,
    enabled: !!projectId,
  });

/** Kéo công việc sang ngày khác trên lịch = đổi hạn. Hiển thị ngay, lỗi thì hoàn lại. */
export function useRescheduleTask(projectId: string, from: string, to: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.calendar(projectId, from, to);
  type CalendarData = { tasks: Task[]; withoutDueDate: number };

  return useMutation({
    mutationFn: ({ task, dueDate }: { task: Task; dueDate: string }) => taskApi.update(task.key, { dueDate }),
    onMutate: async ({ task, dueDate }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CalendarData>(key);
      queryClient.setQueryData<CalendarData>(key, (d) =>
        d ? { ...d, tasks: d.tasks.map((t) => (t.id === task.id ? { ...t, dueDate } : t)) } : d,
      );
      return { previous };
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myTasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.task(saved.key) });
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
      notify.error(error, 'Không đổi được hạn, đã hoàn lại');
    },
  });
}
