import { TaskStatus, Role } from '@prisma/client';
import prisma from '../db/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedUser } from '../middleware/auth';

export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  NOT_STARTED: [TaskStatus.IN_PROGRESS],
  IN_PROGRESS: [TaskStatus.WAITING_FOR_CLIENT, TaskStatus.READY_FOR_REVIEW],
  WAITING_FOR_CLIENT: [TaskStatus.IN_PROGRESS],
  READY_FOR_REVIEW: [TaskStatus.COMPLETED, TaskStatus.CHANGES_REQUESTED],
  CHANGES_REQUESTED: [TaskStatus.IN_PROGRESS],
  COMPLETED: [TaskStatus.IN_PROGRESS], // Manager/Admin can reopen task if required
};

export class WorkflowService {
  /**
   * Validate if a transition from oldStatus to newStatus is theoretically valid in the workflow
   */
  static isValidTransition(oldStatus: TaskStatus, newStatus: TaskStatus): boolean {
    const allowed = ALLOWED_TRANSITIONS[oldStatus] || [];
    return allowed.includes(newStatus);
  }

  /**
   * Transition a task to a new status with role and ownership enforcement,
   * wrapped in a database transaction with audit logging.
   */
  static async transitionTaskStatus(
    taskId: string,
    targetStatus: TaskStatus,
    currentUser: AuthenticatedUser,
    notes?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch task with relations
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: {
          engagement: true,
          assignedTo: true,
        },
      });

      if (!task) {
        throw new AppError('Task not found', 404);
      }

      const currentStatus = task.status;

      // 2. Role-based and ownership permissions validation
      const isManagerOrAdmin = currentUser.role === Role.MANAGER || currentUser.role === Role.ADMIN;
      const isAssignedUser = task.assignedToId === currentUser.id;

      // Rule: Team member cannot update another user's task
      if (!isManagerOrAdmin && !isAssignedUser) {
        // If task is unassigned, allow team member to claim it when starting
        if (task.assignedToId === null && currentStatus === TaskStatus.NOT_STARTED && targetStatus === TaskStatus.IN_PROGRESS) {
          // Self-claim allowed
          task.assignedToId = currentUser.id;
        } else {
          throw new AppError('Forbidden: You can only update tasks assigned to you', 403);
        }
      }

      // 3. Check if already in target status
      if (currentStatus === targetStatus) {
        return task;
      }

      // 4. Workflow transition rule validation
      if (!this.isValidTransition(currentStatus, targetStatus)) {
        throw new AppError(
          `Invalid workflow transition: Cannot transition from '${currentStatus}' to '${targetStatus}'. Allowed transitions: [${(
            ALLOWED_TRANSITIONS[currentStatus] || []
          ).join(', ')}]`,
          400
        );
      }

      // Rule: Team member CANNOT approve their own work (READY_FOR_REVIEW -> COMPLETED)
      if (targetStatus === TaskStatus.COMPLETED) {
        if (!isManagerOrAdmin) {
          throw new AppError('Forbidden: Team members cannot approve tasks. Manager review is required.', 403);
        }
      }

      // Rule: Team member CANNOT request changes (READY_FOR_REVIEW -> CHANGES_REQUESTED)
      if (targetStatus === TaskStatus.CHANGES_REQUESTED) {
        if (!isManagerOrAdmin) {
          throw new AppError('Forbidden: Only managers and admins can request changes during review.', 403);
        }
        if (!notes || notes.trim() === '') {
          throw new AppError('Notes/feedback are required when requesting changes.', 400);
        }
      }

      // Rule: Waiting for client should encourage reason
      if (targetStatus === TaskStatus.WAITING_FOR_CLIENT && (!notes || notes.trim() === '')) {
        notes = 'Waiting for client information/documents';
      }

      // 5. Determine audit action name
      let auditAction = 'STATUS_CHANGE';
      if (targetStatus === TaskStatus.COMPLETED) {
        auditAction = 'APPROVAL';
      } else if (targetStatus === TaskStatus.CHANGES_REQUESTED) {
        auditAction = 'CHANGES_REQUESTED';
      } else if (targetStatus === TaskStatus.READY_FOR_REVIEW) {
        auditAction = 'SUBMITTED_FOR_REVIEW';
      } else if (targetStatus === TaskStatus.WAITING_FOR_CLIENT) {
        auditAction = 'WAITING_FOR_CLIENT';
      }

      // 6. Update task in database
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          status: targetStatus,
          assignedToId: task.assignedToId, // Keep or update if claimed
          completedAt: targetStatus === TaskStatus.COMPLETED ? new Date() : null,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true, title: true },
          },
          engagement: {
            include: {
              client: true,
              serviceType: true,
            },
          },
        },
      });

      // 7. Write audit log entry
      await tx.taskAuditLog.create({
        data: {
          taskId,
          changedById: currentUser.id,
          action: auditAction,
          oldStatus: currentStatus,
          newStatus: targetStatus,
          notes: notes || null,
        },
      });

      return updatedTask;
    });
  }

  /**
   * Assign or reassign a task and/or update due date
   * Only Manager and Admin can assign/reassign tasks
   */
  static async assignOrUpdateTask(
    taskId: string,
    data: {
      assignedToId?: string | null;
      dueDate?: string | Date | null;
      priority?: any;
      title?: string;
      description?: string | null;
    },
    currentUser: AuthenticatedUser
  ) {
    // Only Manager or Admin can assign or change due dates
    if (currentUser.role !== Role.MANAGER && currentUser.role !== Role.ADMIN) {
      throw new AppError('Forbidden: Only managers and admins can assign tasks or set deadlines.', 403);
    }

    return await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: { assignedTo: true },
      });

      if (!task) {
        throw new AppError('Task not found', 404);
      }

      const updatePayload: any = {};
      const auditNotes: string[] = [];

      if (data.assignedToId !== undefined) {
        updatePayload.assignedToId = data.assignedToId;
        if (data.assignedToId !== task.assignedToId) {
          if (data.assignedToId) {
            const assignee = await tx.user.findUnique({ where: { id: data.assignedToId } });
            auditNotes.push(`Reassigned to ${assignee ? assignee.name : data.assignedToId}`);
          } else {
            auditNotes.push('Task unassigned');
          }
        }
      }

      if (data.dueDate !== undefined) {
        updatePayload.dueDate = data.dueDate ? new Date(data.dueDate) : null;
        auditNotes.push(`Deadline updated to ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'None'}`);
      }

      if (data.priority) {
        updatePayload.priority = data.priority;
        auditNotes.push(`Priority changed to ${data.priority}`);
      }

      if (data.title) {
        updatePayload.title = data.title;
      }

      if (data.description !== undefined) {
        updatePayload.description = data.description;
      }

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: updatePayload,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true, title: true },
          },
          engagement: {
            include: {
              client: true,
              serviceType: true,
            },
          },
        },
      });

      if (auditNotes.length > 0) {
        await tx.taskAuditLog.create({
          data: {
            taskId,
            changedById: currentUser.id,
            action: 'TASK_MODIFIED',
            notes: auditNotes.join('; '),
          },
        });
      }

      return updatedTask;
    });
  }
}
