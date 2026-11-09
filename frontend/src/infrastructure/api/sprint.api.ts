import type { Backlog, ProjectRole, Sprint, Task } from '@/domain/entities';
import { http, unwrap } from '../http/client';

export interface SprintInput {
  name?: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface PlanTaskInput {
  sprintId: string | null;
  prevTaskId: string | null;
  nextTaskId: string | null;
}

export interface BacklogView extends Backlog {
  role: ProjectRole;
}

export interface CompleteSprintResult {
  completed: number;
  total: number;
  moved: number;
  movedTo: string;
}

export const sprintApi = {
  backlog: async (projectId: string): Promise<BacklogView> => {
    const { data } = await http.get(`/projects/${projectId}/backlog`);
    return { ...data.data, role: data.meta.role };
  },
  completed: (projectId: string) => unwrap<Sprint[]>(http.get(`/projects/${projectId}/sprints`)),
  create: (projectId: string, input: SprintInput) => unwrap<Sprint>(http.post(`/projects/${projectId}/sprints`, input)),
  update: (sprintId: string, input: SprintInput) => unwrap<Sprint>(http.patch(`/sprints/${sprintId}`, input)),
  remove: (sprintId: string) => http.delete(`/sprints/${sprintId}`).then(() => undefined),
  start: (sprintId: string, input: { startDate?: string; endDate?: string }) =>
    unwrap<Sprint>(http.post(`/sprints/${sprintId}/start`, input)),
  complete: (sprintId: string, moveToSprintId: string | null) =>
    unwrap<CompleteSprintResult>(http.post(`/sprints/${sprintId}/complete`, { moveToSprintId })),
  plan: (taskKey: string, input: PlanTaskInput) => unwrap<Task>(http.post(`/tasks/${taskKey}/plan`, input)),
};
