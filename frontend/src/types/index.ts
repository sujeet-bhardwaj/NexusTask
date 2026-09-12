export type Role = 'ADMIN' | 'MANAGER' | 'TEAM_MEMBER';

export type TaskStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CLIENT'
  | 'READY_FOR_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'COMPLETED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type Frequency = 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type EngagementStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  avatar?: string | null;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  _count?: { engagements: number };
}

export interface TaskTemplate {
  id: string;
  serviceTypeId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  defaultDeadlineOffsetDays: number;
}

export interface ServiceType {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isRecurring: boolean;
  frequency: Frequency;
  taskTemplates: TaskTemplate[];
  _count?: { engagements: number };
}

export interface TaskAuditLog {
  id: string;
  taskId: string;
  changedById: string;
  action: string;
  oldStatus?: TaskStatus | null;
  newStatus?: TaskStatus | null;
  notes?: string | null;
  createdAt: string;
  changedBy: {
    id: string;
    name: string;
    email: string;
    role: Role;
    title?: string;
  };
}

export interface Task {
  id: string;
  engagementId: string;
  templateId?: string | null;
  title: string;
  description?: string | null;
  assignedToId?: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: User | null;
  engagement?: {
    id: string;
    title: string;
    period: string;
    client: Client;
    serviceType: ServiceType;
  };
  auditLogs?: TaskAuditLog[];
}

export interface Engagement {
  id: string;
  title: string;
  clientId: string;
  serviceTypeId: string;
  createdById: string;
  status: EngagementStatus;
  period: string;
  startDate: string;
  targetDate?: string | null;
  client: Client;
  serviceType: ServiceType;
  createdBy: { id: string; name: string; email: string };
  tasks: Task[];
}

export interface DashboardMetrics {
  openTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  waitingForClient: number;
  waitingForReview: number;
  completedTasks: number;
  totalEngagements: number;
  activeEngagements: number;
}
