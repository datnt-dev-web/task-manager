import type { Subtask } from '@/domain/entities';
import { http, unwrap } from '../http/client';

export interface SubtaskInput {
  title?: string;
  isDone?: boolean;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export const subtaskApi = {
  create: (taskKey: string, input: SubtaskInput & { title: string }) =>
    unwrap<Subtask>(http.post(`/tasks/${taskKey}/subtasks`, input)),
  update: (subtaskId: string, input: SubtaskInput) => unwrap<Subtask>(http.patch(`/subtasks/${subtaskId}`, input)),
  remove: (subtaskId: string) => http.delete(`/subtasks/${subtaskId}`).then(() => undefined),
};
