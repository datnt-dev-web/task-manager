import type { BoardColumn, ProjectRole, Task } from '../entities';

// Ma trận phân quyền (spec mục 6). Backend vẫn là nơi kiểm tra cuối cùng; đây chỉ để ẩn/hiện UI.

const RANK: Record<ProjectRole, number> = { member: 1, manager: 2 };

export const hasRole = (role: ProjectRole | null | undefined, min: ProjectRole) => !!role && RANK[role] >= RANK[min];

/** Tạo / sửa / xóa công việc, việc con, lập sprint: chỉ Quản trị viên / Quản lý dự án. */
export const canEditTasks = (role?: ProjectRole | null) => hasRole(role, 'manager');


/** Bình luận, đính kèm tệp: Quản lý dự án với mọi việc; Thành viên chỉ với việc được giao cho mình. */
export function canParticipate(
  role: ProjectRole | null | undefined,
  userId: string,
  task: Pick<Task, 'assigneeId'>,
) {
  if (role === 'manager') return true;
  return role === 'member' && task.assigneeId === userId;
}

/** Đổi tên bảng, cấu hình cột, thành viên, nhãn. */
export const canManageProject = (role?: ProjectRole | null) => hasRole(role, 'manager');

/**
 * Kéo thả / đổi trạng thái: Quản trị viên & Quản lý dự án di chuyển mọi công việc;
 * Thành viên chỉ di chuyển việc được giao cho mình. (Backend kiểm tra lại.)
 */
export function canMoveTask(role: ProjectRole | null | undefined, userId: string, task: Pick<Task, 'assigneeId'>) {
  if (role === 'manager') return true;
  return role === 'member' && task.assigneeId === userId;
}

/**
 * Quy trình duyệt: chỉ Quản trị viên / Quản lý dự án được đưa việc vào (duyệt) hoặc ra khỏi cột Hoàn thành.
 * Thành viên làm xong thì chuyển sang Chờ duyệt. (Backend kiểm tra lại.)
 */
export function canChangeColumn(
  role: ProjectRole | null | undefined,
  from: Pick<BoardColumn, 'id' | 'isDone'> | null | undefined,
  to: Pick<BoardColumn, 'id' | 'isDone'>,
) {
  if (role === 'manager' || from?.id === to.id) return true;
  return !to.isDone && !from?.isDone;
}

export const ONLY_MANAGER_COMPLETES_HINT =
  'Chỉ Quản trị viên / Quản lý dự án được duyệt hoàn thành. Làm xong, hãy chuyển sang Chờ duyệt.';

export const CANNOT_MOVE_HINT = 'Bạn chỉ kéo được công việc được giao cho mình';

export const ROLE_LABELS: Record<ProjectRole, string> = {
  manager: 'Admin',
  member: 'Thành viên',
};
