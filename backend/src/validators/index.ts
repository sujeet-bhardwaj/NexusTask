import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'TEAM_MEMBER']),
  title: z.string().min(2, 'Job title is required'),
});

export const createClientSchema = z.object({
  name: z.string().min(2, 'Contact name is required'),
  companyName: z.string().min(2, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const createServiceTypeSchema = z.object({
  name: z.string().min(3, 'Service name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
  frequency: z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('ONE_TIME'),
  taskTemplates: z.array(
    z.object({
      title: z.string().min(2, 'Task title is required'),
      description: z.string().optional(),
      orderIndex: z.number().int().nonnegative().default(0),
      defaultDeadlineOffsetDays: z.number().int().positive().default(7),
    })
  ).optional(),
});

export const createTaskTemplateSchema = z.object({
  serviceTypeId: z.string(),
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  orderIndex: z.number().int().nonnegative().default(0),
  defaultDeadlineOffsetDays: z.number().int().positive().default(7),
});

export const createEngagementSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  serviceTypeId: z.string().min(1, 'Service Type ID is required'),
  title: z.string().min(3, 'Engagement title is required'),
  period: z.string().optional(), // e.g. "2026-09"
  startDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  targetDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const generateNextPeriodSchema = z.object({
  engagementId: z.string().min(1, 'Engagement ID is required'),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum([
    'NOT_STARTED',
    'IN_PROGRESS',
    'WAITING_FOR_CLIENT',
    'READY_FOR_REVIEW',
    'CHANGES_REQUESTED',
    'COMPLETED',
  ]),
  notes: z.string().optional(),
});

export const assignTaskSchema = z.object({
  assignedToId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  title: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
});

export const createTaskSchema = z.object({
  engagementId: z.string().min(1, 'Engagement ID is required'),
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});
