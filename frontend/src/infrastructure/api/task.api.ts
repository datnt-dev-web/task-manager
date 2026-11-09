import type { ActivityLog, Paginated, ProjectRole, RichDoc, Task, TaskPriority, TaskType } from '@/domain/entities';
import { http, unwrap } from '../http/client';

export interface CreateTaskInput {
  title: string;
  columnId?: string;
  type?: TaskType;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  description?: RichDoc | null;
  labelIds?: string[];
  sprintId?: string | null;
}

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, 'sprintId'>>;

export interface MoveTaskInput {
  columnId: string;
  prevTaskId: string | null;
  nextTaskId: string | null;
}

export interface TaskDetailView {
  task: Task;
  role: ProjectRole;
  watching: boolean;
}

export interface TaskListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  assignee?: 'me' | 'none' | string;
  priorities?: string;
  columnIds?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export const taskApi = {
  list: async (projectId: string, query: TaskListQuery): Promise<Paginated<Task>> => {
    const { data } = await http.get(`/projects/${projectId}/tasks`, { params: query });
    return { items: data.data, meta: data.meta };
  },
  mine: () => unwrap<Task[]>(http.get('/my-tasks')),
  calendar: async (projectId: string, from: string, to: string): Promise<{ tasks: Task[]; withoutDueDate: number }> => {
    const { data } = await http.get(`/projects/${projectId}/calendar`, { params: { from, to } });
    return { tasks: data.data, withoutDueDate: data.meta.withoutDueDate };
  },
  activity: (key: string) => unwrap<ActivityLog[]>(http.get(`/tasks/${key}/activity`)),
  get: async (key: string): Promise<TaskDetailView> => {
    const { data } = await http.get(`/tasks/${key}`);
    return { task: data.data, role: data.meta.role, watching: data.meta.watching };
  },
  setWatching: (key: string, watching: boolean) =>
    (watching ? http.post(`/tasks/${key}/watch`) : http.delete(`/tasks/${key}/watch`)).then(() => watching),
  create: (projectId: string, input: CreateTaskInput) => unwrap<Task>(http.post(`/projects/${projectId}/tasks`, input)),
  update: (key: string, input: UpdateTaskInput) => unwrap<Task>(http.patch(`/tasks/${key}`, input)),
  move: (key: string, input: MoveTaskInput) => unwrap<Task>(http.post(`/tasks/${key}/move`, input)),
  remove: (key: string) => http.delete(`/tasks/${key}`).then(() => undefined),
};
