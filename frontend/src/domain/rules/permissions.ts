import type { ProjectRole, Task } from '../entities';

// Ma trận phân quyền (spec mục 6). Backend vẫn là nơi kiểm tra cuối cùng; đây chỉ để ẩn/hiện UI.

const RANK: Record<ProjectRole, number> = { viewer: 1, member: 2, manager: 3 };

export const hasRole = (role: ProjectRole | null | undefined, min: ProjectRole) => !!role && RANK[role] >= RANK[min];

/** Tạo/sửa/kéo thả công việc, bình luận. */
export const canEditTasks = (role?: ProjectRole | null) => hasRole(role, 'member');

/** Đổi tên bảng, cấu hình cột, thành viên, nhãn. */
export const canManageProject = (role?: ProjectRole | null) => hasRole(role, 'manager');

/**
 * Kéo thả / đổi trạng thái / xếp vào sprint: Quản trị viên & Quản lý dự án di chuyển mọi công việc;
 * Thành viên chỉ di chuyển việc được giao cho mình hoặc do mình tạo. (Backend kiểm tra lại.)
 */
export function canMoveTask(
  role: ProjectRole | null | undefined,
  userId: string,
  task: Pick<Task, 'assigneeId' | 'creatorId'>,
) {
  if (role === 'manager') return true;
  return role === 'member' && (task.assigneeId === userId || task.creatorId === userId);
}

export const CANNOT_MOVE_HINT = 'Bạn chỉ kéo được công việc được giao cho mình hoặc do mình tạo';

export const ROLE_LABELS: Record<ProjectRole, string> = {
  manager: 'Quản lý dự án',
  member: 'Thành viên',
  viewer: 'Người xem',
};
