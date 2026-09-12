import { Frequency } from '@prisma/client';
import prisma from '../db/prisma';
import { AppError } from '../middleware/errorHandler';

export class AdminService {
  // CLIENTS
  static async listClients() {
    return await prisma.client.findMany({
      include: {
        _count: {
          select: { engagements: true },
        },
      },
      orderBy: { companyName: 'asc' },
    });
  }

  static async createClient(data: {
    name: string;
    companyName: string;
    email: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) {
    return await prisma.client.create({ data });
  }

  static async updateClient(id: string, data: any) {
    return await prisma.client.update({
      where: { id },
      data,
    });
  }

  // SERVICE TYPES & TEMPLATES
  static async listServiceTypes() {
    return await prisma.serviceType.findMany({
      include: {
        taskTemplates: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { engagements: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createServiceType(data: {
    name: string;
    code?: string;
    description?: string;
    isRecurring: boolean;
    frequency: Frequency;
    taskTemplates?: {
      title: string;
      description?: string;
      orderIndex: number;
      defaultDeadlineOffsetDays: number;
    }[];
  }) {
    const existing = await prisma.serviceType.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError('A service type with this name already exists', 409);
    }

    return await prisma.$transaction(async (tx) => {
      const serviceType = await tx.serviceType.create({
        data: {
          name: data.name,
          code: data.code,
          description: data.description,
          isRecurring: data.isRecurring,
          frequency: data.frequency,
        },
      });

      if (data.taskTemplates && data.taskTemplates.length > 0) {
        for (const tmpl of data.taskTemplates) {
          await tx.taskTemplate.create({
            data: {
              serviceTypeId: serviceType.id,
              title: tmpl.title,
              description: tmpl.description,
              orderIndex: tmpl.orderIndex,
              defaultDeadlineOffsetDays: tmpl.defaultDeadlineOffsetDays,
            },
          });
        }
      }

      return await tx.serviceType.findUnique({
        where: { id: serviceType.id },
        include: { taskTemplates: { orderBy: { orderIndex: 'asc' } } },
      });
    });
  }

  static async createTaskTemplate(data: {
    serviceTypeId: string;
    title: string;
    description?: string;
    orderIndex: number;
    defaultDeadlineOffsetDays: number;
  }) {
    return await prisma.taskTemplate.create({ data });
  }

  static async deleteTaskTemplate(id: string) {
    return await prisma.taskTemplate.delete({ where: { id } });
  }
}
