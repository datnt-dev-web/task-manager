import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProjectRole } from '@/domain/entities';
import { projectApi, type CreateProjectInput, type UpdateProjectInput } from '@/infrastructure/api/project.api';
import { notify } from '../notify';
import { queryKeys } from '../queryKeys';

export const useProjects = (archived = false) =>
  useQuery({ queryKey: queryKeys.projects(archived), queryFn: () => projectApi.list(archived) });

/** Trang "Dự án": phân trang + tìm kiếm ở backend. */
export const useProjectPage = (params: { archived: boolean; q: string; page: number; pageSize: number }) =>
  useQuery({
    queryKey: [...queryKeys.projectsAll, 'page', params],
    queryFn: () => projectApi.page(params),
    placeholderData: keepPreviousData,
  });

/** DSH-02: luôn lấy số liệu mới khi mở tab Tổng quan. */
export const useProjectOverview = (projectId: string) =>
  useQuery({
    queryKey: queryKeys.overview(projectId),
    queryFn: () => projectApi.overview(projectId),
    enabled: !!projectId,
    staleTime: 0,
  });

export const useProject = (projectId: string) =>
  useQuery({ queryKey: queryKeys.project(projectId), queryFn: () => projectApi.get(projectId), enabled: !!projectId });

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projectsAll }),
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProjectInput) => projectApi.update(projectId, input),
    onSuccess: (project) => {
      queryClient.setQueryData(queryKeys.project(projectId), project);
      queryClient.invalidateQueries({ queryKey: queryKeys.projectsAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.board(projectId) });
    },
    onError: (error) => notify.error(error),
  });
}

export const useMembers = (projectId: string) =>
  useQuery({ queryKey: queryKeys.members(projectId), queryFn: () => projectApi.members(projectId), enabled: !!projectId });

export const useLabels = (projectId: string) =>
  useQuery({ queryKey: queryKeys.labels(projectId), queryFn: () => projectApi.labels(projectId), enabled: !!projectId });

function useMemberMutation<T>(projectId: string, fn: (input: T) => Promise<unknown>, successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.board(projectId) });
      notify.success(successMessage);
    },
    onError: (error) => notify.error(error),
  });
}

export const useAddMember = (projectId: string) =>
  useMemberMutation(
    projectId,
    ({ userId, role }: { userId: string; role: ProjectRole }) => projectApi.addMember(projectId, userId, role),
    'Đã thêm thành viên',
  );

export const useUpdateMemberRole = (projectId: string) =>
  useMemberMutation(
    projectId,
    ({ userId, role }: { userId: string; role: ProjectRole }) => projectApi.updateMember(projectId, userId, role),
    'Đã đổi vai trò',
  );

export const useRemoveMember = (projectId: string) =>
  useMemberMutation(projectId, (userId: string) => projectApi.removeMember(projectId, userId), 'Đã gỡ thành viên');
