const { Router } = require('express');
const multer = require('multer');
const validate = require('../../middlewares/validate');
const requireAdmin = require('../../middlewares/requireAdmin');
const taskV = require('../../validators/task.validator');
const commentV = require('../../validators/comment.validator');
const subtaskV = require('../../validators/subtask.validator');
const attachmentV = require('../../validators/attachment.validator');
const notificationV = require('../../validators/notification.validator');
const sprintV = require('../../validators/sprint.validator');

const MAX_FILES_PER_UPLOAD = 10;

/** Công việc và các tài nguyên con: bình luận, việc con, tệp, người theo dõi; cùng thông báo. */
module.exports = ({ controllers, services }) => {
  const { task, comment, subtask, attachment, notification, sprint } = controllers;
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: services.config.MAX_UPLOAD_MB * 1024 * 1024, files: MAX_FILES_PER_UPLOAD },
  }).array('files', MAX_FILES_PER_UPLOAD);

  const tasks = Router();
  tasks.get('/:key', validate(taskV.byKey), task.get);
  tasks.patch('/:key', validate(taskV.update), task.update);
  tasks.post('/:key/move', validate(taskV.move), task.move);
  tasks.post('/:key/plan', validate(taskV.plan), sprint.plan);
  tasks.get('/:key/activity', validate(taskV.byKey), task.activity);
  tasks.delete('/:key', validate(taskV.byKey), task.remove);
  tasks.post('/:key/watch', validate(taskV.byKey), task.watch);
  tasks.delete('/:key/watch', validate(taskV.byKey), task.unwatch);
  tasks.get('/:key/comments', validate(commentV.list), comment.list);
  tasks.post('/:key/comments', validate(commentV.create), comment.create);
  tasks.post('/:key/subtasks', validate(subtaskV.create), subtask.create);
  tasks.get('/:key/attachments', validate(attachmentV.byTask), attachment.list);
  // Kiểm tra quyền trước khi nhận tệp để người không có quyền không đẩy được dữ liệu lên RAM.
  tasks.post('/:key/attachments', validate(attachmentV.byTask), task.assertCanUpload, upload, attachment.upload);

  const comments = Router();
  comments.patch('/:commentId', validate(commentV.update), comment.update);
  comments.delete('/:commentId', validate(commentV.remove), comment.remove);

  const subtasks = Router();
  subtasks.patch('/:subtaskId', validate(subtaskV.update), subtask.update);
  subtasks.delete('/:subtaskId', validate(subtaskV.remove), subtask.remove);

  const attachments = Router();
  attachments.get('/', validate(attachmentV.search), attachment.search);
  attachments.get('/:attachmentId/download', validate(attachmentV.download), attachment.download);
  attachments.delete('/:attachmentId', validate(attachmentV.remove), attachment.remove);

  const notifications = Router();
  notifications.get('/', validate(notificationV.list), notification.list);
  notifications.get('/unread-count', notification.unreadCount);
  notifications.post('/read', validate(notificationV.markRead), notification.markRead);
  notifications.post('/run-due-reminders', requireAdmin, notification.runDueReminders);

  const sprints = Router();
  sprints.patch('/:sprintId', validate(sprintV.update), sprint.update);
  sprints.delete('/:sprintId', validate(sprintV.remove), sprint.remove);
  sprints.post('/:sprintId/start', validate(sprintV.start), sprint.start);
  sprints.post('/:sprintId/complete', validate(sprintV.complete), sprint.complete);

  return { tasks, comments, subtasks, attachments, notifications, sprints };
};
