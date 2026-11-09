import type { Label, Project, ProjectMember, ProjectRole, RichDoc } from '@/domain/entities';
import { http, unwrap } from '../http/client';

export interface CreateProjectInput {
  name: string;
  key: string;
  description?: RichDoc | null;
  color?: string | null;
  icon?: string | null;
}

export type UpdateProjectInput = Partial<Omit<CreateProjectInput, 'key'>> & { archived?: boolean };

export const projectApi = {
  list: (archived = false) => unwrap<Project[]>(http.get('/projects', { params: { archived } })),
  get: (projectId: string) => unwrap<Project>(http.get(`/projects/${projectId}`)),
  create: (input: CreateProjectInput) => unwrap<Project>(http.post('/projects', input)),
  update: (projectId: string, input: UpdateProjectInput) => unwrap<Project>(http.patch(`/projects/${projectId}`, input)),

  members: (projectId: string) => unwrap<ProjectMember[]>(http.get(`/projects/${projectId}/members`)),
  addMember: (projectId: string, userId: string, role: ProjectRole) =>
    unwrap<ProjectMember>(http.post(`/projects/${projectId}/members`, { userId, role })),
  updateMember: (projectId: string, userId: string, role: ProjectRole) =>
    unwrap<ProjectMember>(http.patch(`/projects/${projectId}/members/${userId}`, { role })),
  removeMember: (projectId: string, userId: string) =>
    http.delete(`/projects/${projectId}/members/${userId}`).then(() => undefined),

  labels: (projectId: string) => unwrap<Label[]>(http.get(`/projects/${projectId}/labels`)),
  createLabel: (projectId: string, input: Omit<Label, 'id'>) =>
    unwrap<Label>(http.post(`/projects/${projectId}/labels`, input)),
  updateLabel: (labelId: string, input: Partial<Omit<Label, 'id'>>) => unwrap<Label>(http.patch(`/labels/${labelId}`, input)),
  removeLabel: (labelId: string) => http.delete(`/labels/${labelId}`).then(() => undefined),
};
