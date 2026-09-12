import { Frequency, Role } from '@prisma/client';
import prisma from '../db/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedUser } from '../middleware/auth';

export class EngagementService {
  /**
   * Helper to calculate the next period string based on service frequency and current period
   */
  static calculateNextPeriod(currentPeriod: string, frequency: Frequency): string {
    if (frequency === Frequency.MONTHLY) {
      // Expecting format "YYYY-MM" (e.g., "2026-09")
      const parts = currentPeriod.split('-');
      if (parts.length === 2) {
        let year = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
        return `${year}-${String(month).padStart(2, '0')}`;
      }
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`;
    }

    if (frequency === Frequency.QUARTERLY) {
      // Expecting format "YYYY-Q1"
      const parts = currentPeriod.split('-Q');
      if (parts.length === 2) {
        let year = parseInt(parts[0], 10);
        let quarter = parseInt(parts[1], 10);
        quarter += 1;
        if (quarter > 4) {
          quarter = 1;
          year += 1;
        }
        return `${year}-Q${quarter}`;
      }
      return `${new Date().getFullYear()}-Q2`;
    }

    if (frequency === Frequency.YEARLY) {
      const year = parseInt(currentPeriod, 10);
      if (!isNaN(year)) {
        return `${year + 1}`;
      }
      return `${new Date().getFullYear() + 1}`;
    }

    return currentPeriod;
  }

  /**
   * Create a new engagement and auto-generate tasks from service templates in a transaction.
   */
  static async createEngagement(
    data: {
      clientId: string;
      serviceTypeId: string;
      title: string;
      period?: string;
      startDate?: string;
      targetDate?: string;
    },
    currentUser: AuthenticatedUser
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Verify Client
      const client = await tx.client.findUnique({ where: { id: data.clientId } });
      if (!client) throw new AppError('Client not found', 404);

      // 2. Verify Service Type
      const serviceType = await tx.serviceType.findUnique({
        where: { id: data.serviceTypeId },
        include: { taskTemplates: { orderBy: { orderIndex: 'asc' } } },
      });
      if (!serviceType) throw new AppError('Service type not found', 404);

      // 3. Determine period string
      let period = data.period;
      if (!period) {
        if (serviceType.isRecurring) {
          const now = new Date();
          if (serviceType.frequency === Frequency.MONTHLY) {
            period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          } else if (serviceType.frequency === Frequency.QUARTERLY) {
            const q = Math.floor(now.getMonth() / 3) + 1;
            period = `${now.getFullYear()}-Q${q}`;
          } else if (serviceType.frequency === Frequency.YEARLY) {
            period = `${now.getFullYear()}`;
          } else {
            period = 'RECURRING';
          }
        } else {
          period = 'ONE_TIME';
        }
      }

      // 4. Duplicate Prevention Check
      const existing = await tx.engagement.findUnique({
        where: {
          clientId_serviceTypeId_period: {
            clientId: data.clientId,
            serviceTypeId: data.serviceTypeId,
            period,
          },
        },
      });

      if (existing) {
        throw new AppError(
          `Duplicate recurring engagement: An engagement for '${client.companyName}' with service '${serviceType.name}' for period '${period}' already exists.`,
          409
        );
      }

      const startDate = data.startDate ? new Date(data.startDate) : new Date();
      const targetDate = data.targetDate ? new Date(data.targetDate) : null;

      // 5. Create Engagement
      const engagement = await tx.engagement.create({
        data: {
          title: data.title || `${serviceType.name} - ${period} (${client.companyName})`,
          clientId: data.clientId,
          serviceTypeId: data.serviceTypeId,
          createdById: currentUser.id,
          period,
          startDate,
          targetDate,
        },
      });

      // 6. Generate tasks from templates
      const createdTasks = [];
      for (const template of serviceType.taskTemplates) {
        const dueDate = new Date(startDate.getTime() + template.defaultDeadlineOffsetDays * 24 * 60 * 60 * 1000);

        const task = await tx.task.create({
          data: {
            engagementId: engagement.id,
            templateId: template.id,
            title: template.title,
            description: template.description,
            dueDate,
            status: 'NOT_STARTED',
          },
        });

        await tx.taskAuditLog.create({
          data: {
            taskId: task.id,
            changedById: currentUser.id,
            action: 'CREATED',
            notes: `Auto-generated from template '${template.title}'`,
          },
        });

        createdTasks.push(task);
      }

      return {
        ...engagement,
        client,
        serviceType,
        tasks: createdTasks,
      };
    });
  }

  /**
   * Generate next period's engagement and tasks for a recurring engagement
   */
  static async generateNextPeriod(engagementId: string, currentUser: AuthenticatedUser) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch current engagement
      const current = await tx.engagement.findUnique({
        where: { id: engagementId },
        include: {
          client: true,
          serviceType: {
            include: { taskTemplates: { orderBy: { orderIndex: 'asc' } } },
          },
          tasks: true,
        },
      });

      if (!current) throw new AppError('Engagement not found', 404);

      if (!current.serviceType.isRecurring) {
        throw new AppError('Cannot generate next period for a one-time service engagement.', 400);
      }

      // 2. Compute Next Period
      const nextPeriod = this.calculateNextPeriod(current.period, current.serviceType.frequency);

      // 3. Duplicate Prevention Check
      const existing = await tx.engagement.findUnique({
        where: {
          clientId_serviceTypeId_period: {
            clientId: current.clientId,
            serviceTypeId: current.serviceTypeId,
            period: nextPeriod,
          },
        },
      });

      if (existing) {
        throw new AppError(
          `Duplicate engagement conflict: An engagement for '${current.client.companyName}' with service '${current.serviceType.name}' for period '${nextPeriod}' already exists.`,
          409
        );
      }

      // 4. Compute dates for new period
      let nextStartDate = new Date(current.startDate);
      if (current.serviceType.frequency === Frequency.MONTHLY) {
        nextStartDate.setMonth(nextStartDate.getMonth() + 1);
      } else if (current.serviceType.frequency === Frequency.QUARTERLY) {
        nextStartDate.setMonth(nextStartDate.getMonth() + 3);
      } else if (current.serviceType.frequency === Frequency.YEARLY) {
        nextStartDate.setFullYear(nextStartDate.getFullYear() + 1);
      }

      let nextTargetDate: Date | null = null;
      if (current.targetDate) {
        nextTargetDate = new Date(current.targetDate);
        if (current.serviceType.frequency === Frequency.MONTHLY) {
          nextTargetDate.setMonth(nextTargetDate.getMonth() + 1);
        } else if (current.serviceType.frequency === Frequency.QUARTERLY) {
          nextTargetDate.setMonth(nextTargetDate.getMonth() + 3);
        } else if (current.serviceType.frequency === Frequency.YEARLY) {
          nextTargetDate.setFullYear(nextTargetDate.getFullYear() + 1);
        }
      }

      // 5. Create new Engagement
      const newEngagement = await tx.engagement.create({
        data: {
          title: `${current.serviceType.name} - ${nextPeriod} (${current.client.companyName})`,
          clientId: current.clientId,
          serviceTypeId: current.serviceTypeId,
          createdById: currentUser.id,
          period: nextPeriod,
          startDate: nextStartDate,
          targetDate: nextTargetDate,
        },
      });

      // 6. Clone tasks from templates, keeping assigned team member from previous tasks where template matches
      const previousAssigneeByTemplate: Record<string, string | null> = {};
      current.tasks.forEach((t) => {
        if (t.templateId) {
          previousAssigneeByTemplate[t.templateId] = t.assignedToId;
        }
      });

      const newTasks = [];
      for (const template of current.serviceType.taskTemplates) {
        const dueDate = new Date(nextStartDate.getTime() + template.defaultDeadlineOffsetDays * 24 * 60 * 60 * 1000);
        const assignedToId = previousAssigneeByTemplate[template.id] || null;

        const task = await tx.task.create({
          data: {
            engagementId: newEngagement.id,
            templateId: template.id,
            title: template.title,
            description: template.description,
            assignedToId,
            dueDate,
            status: 'NOT_STARTED',
          },
        });

        await tx.taskAuditLog.create({
          data: {
            taskId: task.id,
            changedById: currentUser.id,
            action: 'CREATED',
            notes: `Auto-generated for period ${nextPeriod} (rolled over from ${current.period})`,
          },
        });

        newTasks.push(task);
      }

      return {
        ...newEngagement,
        client: current.client,
        serviceType: current.serviceType,
        tasks: newTasks,
      };
    });
  }

  /**
   * List all engagements with task counts and completion rate
   */
  static async listEngagements(filters?: { clientId?: string; status?: any }) {
    const where: any = {};
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.status) where.status = filters.status;

    return await prisma.engagement.findMany({
      where,
      include: {
        client: true,
        serviceType: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single engagement details
   */
  static async getEngagementById(id: string) {
    const engagement = await prisma.engagement.findUnique({
      where: { id },
      include: {
        client: true,
        serviceType: {
          include: { taskTemplates: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, title: true },
            },
            auditLogs: {
              orderBy: { createdAt: 'desc' },
              include: {
                changedBy: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!engagement) throw new AppError('Engagement not found', 404);
    return engagement;
  }
}
