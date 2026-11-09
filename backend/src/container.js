/**
 * Composition root: nơi duy nhất khởi tạo và nối các lớp với nhau (dependency injection thủ công).
 * Thêm module mới: tạo repository → service → controller rồi đăng ký ở đây.
 * Khi test có thể dựng container riêng với repository giả.
 */
const env = require('./config/env');
const db = require('./models');

const UnitOfWork = require('./repositories/unitOfWork');
const UserRepository = require('./repositories/user.repository');
const RefreshTokenRepository = require('./repositories/refreshToken.repository');
const ProjectRepository = require('./repositories/project.repository');
const ProjectMemberRepository = require('./repositories/projectMember.repository');
const BoardRepository = require('./repositories/board.repository');
const BoardColumnRepository = require('./repositories/boardColumn.repository');
const LabelRepository = require('./repositories/label.repository');
const TaskRepository = require('./repositories/task.repository');
const CommentRepository = require('./repositories/comment.repository');
const SubtaskRepository = require('./repositories/subtask.repository');
const TaskWatcherRepository = require('./repositories/taskWatcher.repository');
const AttachmentRepository = require('./repositories/attachment.repository');
const NotificationRepository = require('./repositories/notification.repository');
const ActivityLogRepository = require('./repositories/activityLog.repository');
const SprintRepository = require('./repositories/sprint.repository');

const GoogleIdentityClient = require('./integrations/googleIdentity.client');
const LocalStorageClient = require('./integrations/localStorage.client');
const MailerClient = require('./integrations/mailer.client');

const TokenService = require('./services/token.service');
const AuthService = require('./services/auth.service');
const UserService = require('./services/user.service');
const ProjectAccessService = require('./services/projectAccess.service');
const ProjectService = require('./services/project.service');
const LabelService = require('./services/label.service');
const BoardService = require('./services/board.service');
const TaskService = require('./services/task.service');
const CommentService = require('./services/comment.service');
const NotificationService = require('./services/notification.service');
const SubtaskService = require('./services/subtask.service');
const AttachmentService = require('./services/attachment.service');
const DueReminderJob = require('./jobs/dueReminder.job');
const ActivityService = require('./services/activity.service');
const SprintService = require('./services/sprint.service');

const AuthController = require('./controllers/auth.controller');
const UserController = require('./controllers/user.controller');
const ProjectController = require('./controllers/project.controller');
const LabelController = require('./controllers/label.controller');
const BoardController = require('./controllers/board.controller');
const TaskController = require('./controllers/task.controller');
const CommentController = require('./controllers/comment.controller');
const SubtaskController = require('./controllers/subtask.controller');
const AttachmentController = require('./controllers/attachment.controller');
const NotificationController = require('./controllers/notification.controller');
const SprintController = require('./controllers/sprint.controller');

const authenticate = require('./middlewares/authenticate');

function buildContainer() {
  // Repositories
  const repositories = {
    unitOfWork: new UnitOfWork(db.sequelize),
    userRepository: new UserRepository(db.User),
    refreshTokenRepository: new RefreshTokenRepository(db.RefreshToken),
    projectRepository: new ProjectRepository(db.Project, db),
    projectMemberRepository: new ProjectMemberRepository(db.ProjectMember, db),
    boardRepository: new BoardRepository(db.Board),
    boardColumnRepository: new BoardColumnRepository(db.BoardColumn),
    labelRepository: new LabelRepository(db.Label),
    taskRepository: new TaskRepository(db.Task, db),
    commentRepository: new CommentRepository(db.Comment, db),
    subtaskRepository: new SubtaskRepository(db.Subtask),
    taskWatcherRepository: new TaskWatcherRepository(db.TaskWatcher),
    attachmentRepository: new AttachmentRepository(db.Attachment, db),
    notificationRepository: new NotificationRepository(db.Notification, db),
    activityLogRepository: new ActivityLogRepository(db.ActivityLog, db),
    sprintRepository: new SprintRepository(db.Sprint),
  };

  // Services
  const deps = { ...repositories, config: env };
  deps.googleIdentityClient = new GoogleIdentityClient(env.GOOGLE_CLIENT_ID);
  deps.storageClient = new LocalStorageClient(env.UPLOAD_DIR);
  deps.mailerClient = new MailerClient(env);
  deps.notificationService = new NotificationService(deps);
  deps.tokenService = new TokenService(deps);
  deps.projectAccessService = new ProjectAccessService(deps);
  deps.activityService = new ActivityService(deps);
  deps.authService = new AuthService(deps);
  deps.userService = new UserService(deps);
  deps.projectService = new ProjectService(deps);
  deps.labelService = new LabelService(deps);
  deps.boardService = new BoardService(deps);
  deps.taskService = new TaskService(deps);
  deps.commentService = new CommentService(deps);
  deps.subtaskService = new SubtaskService(deps);
  deps.attachmentService = new AttachmentService(deps);
  deps.sprintService = new SprintService(deps);
  deps.dueReminderJob = new DueReminderJob(deps);

  // Controllers
  const controllers = {
    auth: new AuthController(deps),
    user: new UserController(deps),
    project: new ProjectController(deps),
    label: new LabelController(deps),
    board: new BoardController(deps),
    task: new TaskController(deps),
    comment: new CommentController(deps),
    subtask: new SubtaskController(deps),
    attachment: new AttachmentController(deps),
    notification: new NotificationController(deps),
    sprint: new SprintController(deps),
  };

  const middlewares = { authenticate: authenticate(deps) };

  const jobs = { dueReminder: deps.dueReminderJob };

  return { db, services: deps, controllers, middlewares, jobs };
}

module.exports = { buildContainer };
