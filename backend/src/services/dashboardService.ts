import { TaskStatus } from '@prisma/client';
import prisma from '../db/prisma';
import { AuthenticatedUser } from '../middleware/auth';

export class DashboardService {
  /**
   * Get KPI summary metrics according to assignment specification:
   * - Open tasks
   * - Overdue tasks
   * - Tasks due today
   * - Tasks waiting for client
   * - Tasks waiting for review
   */
  static async getMetrics(currentUser: AuthenticatedUser, scope: 'global' | 'mine' = 'global') {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const baseWhere: any = {};
    if (scope === 'mine' || currentUser.role === 'TEAM_MEMBER') {
      baseWhere.assignedToId = currentUser.id;
    }

    const [
      openTasksCount,
      overdueTasksCount,
      dueTodayCount,
      waitingForClientCount,
      waitingForReviewCount,
      completedCount,
      totalEngagementsCount,
      activeEngagementsCount,
    ] = await Promise.all([
      // 1. Open tasks (all non-completed tasks)
      prisma.task.count({
        where: {
          ...baseWhere,
          status: { not: TaskStatus.COMPLETED },
        },
      }),

      // 2. Overdue tasks (due date past, not completed)
      prisma.task.count({
        where: {
          ...baseWhere,
          status: { not: TaskStatus.COMPLETED },
          dueDate: { lt: startOfToday },
        },
      }),

      // 3. Tasks due today (due date between start of today and end of today, not completed)
      prisma.task.count({
        where: {
          ...baseWhere,
          status: { not: TaskStatus.COMPLETED },
          dueDate: { gte: startOfToday, lte: endOfToday },
        },
      }),

      // 4. Tasks waiting for client
      prisma.task.count({
        where: {
          ...baseWhere,
          status: TaskStatus.WAITING_FOR_CLIENT,
        },
      }),

      // 5. Tasks waiting for review
      prisma.task.count({
        where: {
          ...baseWhere,
          status: TaskStatus.READY_FOR_REVIEW,
        },
      }),

      // Completed tasks
      prisma.task.count({
        where: {
          ...baseWhere,
          status: TaskStatus.COMPLETED,
        },
      }),

      // Total Engagements
      prisma.engagement.count(),

      // Active Engagements
      prisma.engagement.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    // Breakdown by status
    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: { id: true },
    });

    const statusMap: Record<string, number> = {
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      WAITING_FOR_CLIENT: 0,
      READY_FOR_REVIEW: 0,
      CHANGES_REQUESTED: 0,
      COMPLETED: 0,
    };

    statusCounts.forEach((s) => {
      statusMap[s.status] = s._count.id;
    });

    // Recent Audit Activity
    const recentActivity = await prisma.taskAuditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          include: {
            engagement: {
              include: { client: true },
            },
          },
        },
        changedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return {
      metrics: {
        openTasks: openTasksCount,
        overdueTasks: overdueTasksCount,
        dueTodayTasks: dueTodayCount,
        waitingForClient: waitingForClientCount,
        waitingForReview: waitingForReviewCount,
        completedTasks: completedCount,
        totalEngagements: totalEngagementsCount,
        activeEngagements: activeEngagementsCount,
      },
      statusBreakdown: statusMap,
      recentActivity,
    };
  }
}
