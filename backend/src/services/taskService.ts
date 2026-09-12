import { TaskStatus, Role, Prisma } from '@prisma/client';
import prisma from '../db/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedUser } from '../middleware/auth';

export class TaskService {
  /**
   * List tasks with comprehensive filtering
   */
  static async listTasks(
    filters: {
      status?: TaskStatus;
      assignedToId?: string;
      engagementId?: string;
      clientId?: string;
      search?: string;
      filterMode?: 'all' | 'mine' | 'overdue' | 'dueToday' | 'waitingClient' | 'readyReview';
    },
    currentUser: AuthenticatedUser
  ) {
    const where: Prisma.TaskWhereInput = {};
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Apply specific filter modes
    if (filters.filterMode === 'mine') {
      where.assignedToId = currentUser.id;
    } else if (filters.filterMode === 'overdue') {
      where.dueDate = { lt: startOfToday };
      where.status = { not: TaskStatus.COMPLETED };
    } else if (filters.filterMode === 'dueToday') {
      where.dueDate = { gte: startOfToday, lte: endOfToday };
      where.status = { not: TaskStatus.COMPLETED };
    } else if (filters.filterMode === 'waitingClient') {
      where.status = TaskStatus.WAITING_FOR_CLIENT;
    } else if (filters.filterMode === 'readyReview') {
      where.status = TaskStatus.READY_FOR_REVIEW;
    }

    // Direct filters override or combine
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.engagementId) {
      where.engagementId = filters.engagementId;
    }

    if (filters.clientId) {
      where.engagement = { clientId: filters.clientId };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { engagement: { client: { companyName: { contains: filters.search } } } },
      ];
    }

    // If current user is TEAM_MEMBER and didn't specify, default to showing their assigned tasks first or let them view all
    return await prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, title: true, role: true },
        },
        engagement: {
          include: {
            client: true,
            serviceType: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1, // latest log
          include: {
            changedBy: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get single task with full audit history
   */
  static async getTaskById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, title: true, role: true },
        },
        engagement: {
          include: {
            client: true,
            serviceType: true,
          },
        },
        template: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: {
              select: { id: true, name: true, email: true, role: true, title: true },
            },
          },
        },
      },
    });

    if (!task) throw new AppError('Task not found', 404);
    return task;
  }

  /**
   * Create an ad-hoc task within an engagement (Manager/Admin only)
   */
  static async createTask(
    data: {
      engagementId: string;
      title: string;
      description?: string;
      assignedToId?: string;
      dueDate?: string;
      priority?: any;
    },
    currentUser: AuthenticatedUser
  ) {
    if (currentUser.role !== Role.MANAGER && currentUser.role !== Role.ADMIN) {
      throw new AppError('Forbidden: Only managers and admins can create tasks manually', 403);
    }

    return await prisma.$transaction(async (tx) => {
      const engagement = await tx.engagement.findUnique({ where: { id: data.engagementId } });
      if (!engagement) throw new AppError('Engagement not found', 404);

      const task = await tx.task.create({
        data: {
          engagementId: data.engagementId,
          title: data.title,
          description: data.description,
          assignedToId: data.assignedToId || null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          priority: data.priority || 'MEDIUM',
          status: 'NOT_STARTED',
        },
        include: {
          assignedTo: true,
          engagement: { include: { client: true, serviceType: true } },
        },
      });

      await tx.taskAuditLog.create({
        data: {
          taskId: task.id,
          changedById: currentUser.id,
          action: 'CREATED',
          notes: 'Manually created by manager',
        },
      });

      return task;
    });
  }
}
