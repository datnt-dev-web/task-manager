const AppError = require('../utils/AppError');

// Vai trò thật chỉ có member / manager. 'viewer' chỉ dùng làm mức tối thiểu "được xem"
// (mọi thành viên) khi gọi assert(); dữ liệu cũ đã được migration chuyển thành member.
const ROLE_RANK = { viewer: 1, member: 2, manager: 3 };

/**
 * Điểm kiểm tra quyền duy nhất cho mọi tài nguyên thuộc dự án (ma trận phân quyền mục 6).
 * - Quản trị viên được coi như Quản lý dự án ở mọi dự án.
 * - Người không phải thành viên nhận 404 để không lộ sự tồn tại của dự án.
 * - Dự án đã lưu trữ chỉ cho phép xem (trừ khi allowArchived, dùng cho thao tác khôi phục).
 */
class ProjectAccessService {
  constructor({ projectRepository, projectMemberRepository }) {
    this.projectRepository = projectRepository;
    this.projectMemberRepository = projectMemberRepository;
  }

  async getRole(user, projectId) {
    if (user.isAdmin) return 'manager';
    const membership = await this.projectMemberRepository.findMembership(projectId, user.id);
    return membership?.role ?? null;
  }

  async assert(user, projectId, minRole = 'viewer', { allowArchived = false } = {}) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) throw AppError.notFound('Không tìm thấy dự án');

    const role = await this.getRole(user, projectId);
    if (!role) throw AppError.notFound('Không tìm thấy dự án');

    if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
      throw AppError.forbidden('Chỉ Admin dự án được thực hiện thao tác này');
    }
    if (project.archivedAt && minRole !== 'viewer' && !allowArchived) {
      throw AppError.forbidden('Dự án đã được lưu trữ, chỉ có thể xem');
    }
    return { project, role };
  }
}

ProjectAccessService.ROLE_RANK = ROLE_RANK;
module.exports = ProjectAccessService;
