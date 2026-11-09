// Tầng domain: kiểu dữ liệu nghiệp vụ thuần, không phụ thuộc React, HTTP hay thư viện UI.

export type ThemePreference = 'light' | 'dark' | 'system';
export type UserStatus = 'invited' | 'active' | 'disabled';
export type ProjectRole = 'manager' | 'member' | 'viewer';
export type TaskType = 'task' | 'bug';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

/** Tài liệu rich text của TipTap (ProseMirror JSON). */
export interface RichDoc {
  type: 'doc';
  content?: unknown[];
}

export interface UserBrief {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface EmailSettings {
  taskAssigned: boolean;
  mentioned: boolean;
  dueSoon: boolean;
  overdue: boolean;
  addedToProject: boolean;
}

export interface User extends UserBrief {
  title: string | null;
  isAdmin: boolean;
  status: UserStatus;
  theme: ThemePreference;
  emailSettings: EmailSettings;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: RichDoc | null;
  icon: string | null;
  color: string | null;
  archivedAt: string | null;
  createdAt: string;
  /** Vai trò của người đang đăng nhập trong dự án. */
  role: ProjectRole;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectRole;
  user: UserBrief & { title: string | null; status: UserStatus };
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  position: number;
  isDone: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  key: string;
  number: number;
  type: TaskType;
  title: string;
  description?: RichDoc | null;
  columnId: string;
  assigneeId: string | null;
  assignee: UserBrief | null;
  creatorId: string;
  creator?: UserBrief;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  completedAt: string | null;
  labels: Label[];
  /** Chỉ có ở màn hình chi tiết. */
  subtasks?: Subtask[];
  /** Chỉ có trên bảng: tiến độ việc con (BRD-06). */
  subtaskCount?: number;
  subtaskDoneCount?: number;
  sprintId?: string | null;
  sprint?: Pick<Sprint, 'id' | 'name' | 'state'> | null;
  backlogRank?: number;
  column?: Pick<BoardColumn, 'id' | 'name' | 'isDone'>;
  project?: Pick<Project, 'id' | 'key' | 'name'> & { color?: string | null; archivedAt?: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  project: Omit<Project, 'role'>;
  columns: BoardColumn[];
  tasks: Task[];
  /** Có sprint đang chạy thì bảng chỉ chứa việc của sprint đó (SPR-04). */
  activeSprint: Sprint | null;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  author: UserBrief;
  body: RichDoc;
  editedAt: string | null;
  createdAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isDone: boolean;
  assigneeId: string | null;
  assignee?: UserBrief | null;
  dueDate: string | null;
  position: number;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedById: string;
  uploadedBy?: UserBrief;
  createdAt: string;
  /** Có ở kho tệp: công việc + dự án chứa tệp. */
  task?: {
    id: string;
    key: string;
    title: string;
    projectId: string;
    project: { id: string; key: string; name: string; color: string | null; archivedAt: string | null };
  };
}

export type FileKind = 'image' | 'pdf' | 'document' | 'archive';

export type NotificationType =
  | 'task_assigned'
  | 'mentioned'
  | 'comment_added'
  | 'status_changed'
  | 'added_to_project'
  | 'due_soon'
  | 'overdue';

export interface AppNotification {
  id: string;
  type: NotificationType;
  actor: UserBrief | null;
  projectId: string | null;
  taskId: string | null;
  task: { id: string; key: string; title: string; projectId: string } | null;
  project: { id: string; key: string; name: string } | null;
  data: {
    taskKey?: string;
    taskTitle?: string;
    projectName?: string;
    subtaskTitle?: string;
    context?: 'comment' | 'description';
    excerpt?: string;
    from?: string;
    to?: string;
  };
  readAt: string | null;
  createdAt: string;
}

export type SprintState = 'planned' | 'active' | 'completed';

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  state: SprintState;
  completedAt: string | null;
}

export interface SprintWithTasks extends Sprint {
  tasks: Task[];
}

export interface Backlog {
  sprints: SprintWithTasks[];
  backlog: Task[];
}

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'subtask_added'
  | 'subtask_completed'
  | 'subtask_reopened'
  | 'subtask_removed'
  | 'attachment_added'
  | 'attachment_removed';

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  actor: UserBrief | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; pageSize: number; total: number };
}
