import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateTaskStatusSchema, assignTaskSchema, createTaskSchema } from '../validators';
import { TaskService } from '../services/taskService';
import { WorkflowService } from '../services/workflowService';
import { Role } from '@prisma/client';

const router = Router();

// List tasks with filters
router.get('/', authenticate, async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status as any,
      assignedToId: req.query.assignedToId as string | undefined,
      engagementId: req.query.engagementId as string | undefined,
      clientId: req.query.clientId as string | undefined,
      search: req.query.search as string | undefined,
      filterMode: req.query.filterMode as any,
    };

    const tasks = await TaskService.listTasks(filters, req.user!);
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
});

// Get task details + audit logs
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const task = await TaskService.getTaskById(req.params.id as string);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// Create ad-hoc task (Manager / Admin)
router.post(
  '/',
  authenticate,
  requireRoles(Role.MANAGER, Role.ADMIN),
  validate(createTaskSchema),
  async (req, res, next) => {
    try {
      const task = await TaskService.createTask(req.body, req.user!);
      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Workflow state transition
router.patch(
  '/:id/status',
  authenticate,
  validate(updateTaskStatusSchema),
  async (req, res, next) => {
    try {
      const updatedTask = await WorkflowService.transitionTaskStatus(
        req.params.id as string,
        req.body.status,
        req.user!,
        req.body.notes
      );
      res.json({
        success: true,
        message: `Task status transitioned to ${req.body.status}`,
        data: updatedTask,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Assign, reassign, update deadline (Manager / Admin)
router.patch(
  '/:id/assign',
  authenticate,
  requireRoles(Role.MANAGER, Role.ADMIN),
  validate(assignTaskSchema),
  async (req, res, next) => {
    try {
      const updatedTask = await WorkflowService.assignOrUpdateTask(
        req.params.id as string,
        req.body,
        req.user!
      );
      res.json({
        success: true,
        message: 'Task assignment and deadline updated successfully',
        data: updatedTask,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
