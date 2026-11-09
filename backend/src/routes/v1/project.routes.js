const { Router } = require('express');
const validate = require('../../middlewares/validate');
const projectV = require('../../validators/project.validator');
const labelV = require('../../validators/label.validator');
const boardV = require('../../validators/board.validator');
const taskV = require('../../validators/task.validator');
const sprintV = require('../../validators/sprint.validator');

/** Các tài nguyên lồng trong dự án: /projects/:projectId/... */
module.exports = ({ controllers }) => {
  const router = Router();
  const { project, label, board, task, sprint } = controllers;

  router.get('/', validate(projectV.list), project.list);
  router.post('/', validate(projectV.create), project.create);
  router.get('/:projectId', validate(projectV.byId), project.get);
  router.patch('/:projectId', validate(projectV.update), project.update);
  router.delete('/:projectId', validate(projectV.byId), project.remove);

  router.get('/:projectId/members', validate(projectV.byId), project.listMembers);
  router.post('/:projectId/members', validate(projectV.addMember), project.addMember);
  router.patch('/:projectId/members/:userId', validate(projectV.updateMember), project.updateMember);
  router.delete('/:projectId/members/:userId', validate(projectV.removeMember), project.removeMember);

  router.get('/:projectId/labels', validate(labelV.list), label.list);
  router.post('/:projectId/labels', validate(labelV.create), label.create);

  router.get('/:projectId/board', validate(boardV.byProject), board.getByProject);

  router.get('/:projectId/tasks', validate(taskV.list), task.list);
  router.post('/:projectId/tasks', validate(taskV.create), task.create);
  router.get('/:projectId/calendar', validate(taskV.calendar), task.calendar);

  router.get('/:projectId/backlog', validate(sprintV.byProject), sprint.backlog);
  router.get('/:projectId/sprints', validate(sprintV.byProject), sprint.listCompleted);
  router.post('/:projectId/sprints', validate(sprintV.create), sprint.create);

  return router;
};
