const { Router } = require('express');

/** Gắn toàn bộ route API v1. Mọi route trừ /auth đều yêu cầu đăng nhập. */
module.exports = (container) => {
  const router = Router();
  const { authenticate } = container.middlewares;
  const { boards, columns } = require('./v1/board.routes')(container);
  const { tasks, comments, subtasks, attachments, notifications, sprints } = require('./v1/task.routes')(container);

  router.get('/health', async (_req, res) => {
    await container.db.sequelize.authenticate();
    res.json({ status: 'ok' });
  });

  router.use('/auth', require('./v1/auth.routes')(container));

  router.use(authenticate);
  router.use('/users', require('./v1/user.routes')(container));
  router.use('/projects', require('./v1/project.routes')(container));
  router.use('/labels', require('./v1/label.routes')(container));
  router.use('/boards', boards);
  router.use('/columns', columns);
  router.get('/my-tasks', container.controllers.task.listMine);
  router.use('/tasks', tasks);
  router.use('/comments', comments);
  router.use('/subtasks', subtasks);
  router.use('/attachments', attachments);
  router.use('/notifications', notifications);
  router.use('/sprints', sprints);

  return router;
};
