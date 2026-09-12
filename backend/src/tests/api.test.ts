import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import prisma from '../db/prisma';

describe('Task & Engagement Management Backend API Integration Tests', () => {
  let adminToken: string;
  let managerToken: string;
  let member1Token: string;
  let member2Token: string;

  let testClientId: string;
  let recurringServiceId: string;
  let sampleEngagementId: string;
  let member1TaskId: string;
  let member2TaskId: string;
  let reviewPendingTaskId: string;

  beforeAll(async () => {
    // 1. Obtain auth tokens for test users
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@services.com', password: 'password123' });
    adminToken = adminLogin.body.data.token;

    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah.connor@services.com', password: 'password123' });
    managerToken = managerLogin.body.data.token;

    const member1Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'priya.sharma@services.com', password: 'password123' });
    member1Token = member1Login.body.data.token;

    const member2Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex.chen@services.com', password: 'password123' });
    member2Token = member2Login.body.data.token;

    // 2. Fetch seed identifiers
    const client = await prisma.client.findFirst();
    testClientId = client!.id;

    const recurringService = await prisma.serviceType.findFirst({ where: { isRecurring: true } });
    recurringServiceId = recurringService!.id;

    // Fetch an engagement
    const engagement = await prisma.engagement.findFirst({
      where: { period: '2026-09', clientId: testClientId },
      include: { tasks: true },
    });
    sampleEngagementId = engagement!.id;

    // Fetch task assigned to Priya (member1)
    const priyaUser = await prisma.user.findUnique({ where: { email: 'priya.sharma@services.com' } });
    const priyaTask = await prisma.task.findFirst({
      where: { assignedToId: priyaUser!.id, status: 'NOT_STARTED' },
    });
    member1TaskId = priyaTask!.id;

    // Fetch task assigned to Alex (member2)
    const alexUser = await prisma.user.findUnique({ where: { email: 'alex.chen@services.com' } });
    const alexTask = await prisma.task.findFirst({
      where: { assignedToId: alexUser!.id },
    });
    member2TaskId = alexTask!.id;

    // Fetch task in READY_FOR_REVIEW
    const reviewTask = await prisma.task.findFirst({
      where: { status: 'READY_FOR_REVIEW' },
    });
    reviewPendingTaskId = reviewTask!.id;
  });

  // TEST 1: Unauthorized task update is rejected
  describe('Requirement: Unauthorized task update is rejected', () => {
    it('should reject a team member trying to update a task assigned to someone else', async () => {
      // Member 1 (Priya) tries to update task assigned to Member 2 (Alex)
      const res = await request(app)
        .patch(`/api/tasks/${member2TaskId}/status`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden: You can only update tasks assigned to you/i);
    });

    it('should reject a team member trying to assign or reassign tasks', async () => {
      // Member 1 tries to call assignment endpoint (Manager/Admin only)
      const res = await request(app)
        .patch(`/api/tasks/${member1TaskId}/assign`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ priority: 'URGENT' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });
  });

  // TEST 2: Duplicate recurring engagement is rejected
  describe('Requirement: Duplicate recurring engagement is rejected', () => {
    it('should prevent creating a duplicate recurring engagement for same client, service, and period', async () => {
      // Try to create an engagement for Apex Global + Monthly GST for period "2026-09" (already exists in seed!)
      const res = await request(app)
        .post('/api/engagements')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          clientId: testClientId,
          serviceTypeId: recurringServiceId,
          title: 'Duplicate Monthly GST Compliance',
          period: '2026-09',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Duplicate recurring engagement/i);
    });

    it('should prevent generating next period if the next period engagement already exists', async () => {
      // Past completed engagement for "2026-08" -> next period is "2026-09".
      // But "2026-09" already exists! Calling generate-next-period on 2026-08 engagement must be rejected with 409.
      const augEngagement = await prisma.engagement.findFirst({
        where: { period: '2026-08', clientId: testClientId },
      });

      const res = await request(app)
        .post(`/api/engagements/${augEngagement!.id}/next-period`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Duplicate engagement conflict/i);
    });
  });

  // TEST 3: Invalid workflow transition is rejected
  describe('Requirement: Invalid workflow transition is rejected', () => {
    it('should reject transitioning directly from NOT_STARTED to COMPLETED (skipping workflow)', async () => {
      // Attempt invalid jump from NOT_STARTED to COMPLETED
      const res = await request(app)
        .patch(`/api/tasks/${member1TaskId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid workflow transition/i);
    });

    it('should reject transitioning directly from NOT_STARTED to READY_FOR_REVIEW', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${member1TaskId}/status`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ status: 'READY_FOR_REVIEW' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid workflow transition/i);
    });

    it('should allow valid transition NOT_STARTED -> IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${member1TaskId}/status`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('should allow valid transition IN_PROGRESS -> WAITING_FOR_CLIENT -> IN_PROGRESS', async () => {
      // Move to WAITING_FOR_CLIENT
      const resWait = await request(app)
        .patch(`/api/tasks/${member1TaskId}/status`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ status: 'WAITING_FOR_CLIENT', notes: 'Need bank statements from client' });

      expect(resWait.status).toBe(200);
      expect(resWait.body.data.status).toBe('WAITING_FOR_CLIENT');

      // Move back to IN_PROGRESS
      const resResume = await request(app)
        .patch(`/api/tasks/${member1TaskId}/status`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ status: 'IN_PROGRESS' });

      expect(resResume.status).toBe(200);
      expect(resResume.body.data.status).toBe('IN_PROGRESS');
    });
  });

  // TEST 4: Manager approval works correctly and Team Member self-approval is rejected
  describe('Requirement: Manager approval works correctly & Self-approval rejected', () => {
    it('should reject a team member attempting to approve their own work (READY_FOR_REVIEW -> COMPLETED)', async () => {
      // Find a task in READY_FOR_REVIEW assigned to member1
      const reviewTask = await prisma.task.findFirst({
        where: { status: 'READY_FOR_REVIEW' },
      });

      // Member attempts to approve it
      const res = await request(app)
        .patch(`/api/tasks/${reviewTask!.id}/status`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden: Team members cannot approve tasks/i);
    });

    it('should allow a Manager to approve a task in READY_FOR_REVIEW and record audit log', async () => {
      const reviewTask = await prisma.task.findFirst({
        where: { status: 'READY_FOR_REVIEW' },
      });

      const res = await request(app)
        .patch(`/api/tasks/${reviewTask!.id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'COMPLETED', notes: 'Work thoroughly reviewed and approved.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.completedAt).not.toBeNull();

      // Verify audit log entry was created
      const auditLog = await prisma.taskAuditLog.findFirst({
        where: { taskId: reviewTask!.id, action: 'APPROVAL' },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.newStatus).toBe('COMPLETED');
    });

    it('should allow a Manager to request changes with mandatory feedback notes', async () => {
      // Create a fresh task in READY_FOR_REVIEW for this test
      const testTask = await prisma.task.create({
        data: {
          engagementId: sampleEngagementId,
          title: 'Review Test Task',
          status: 'READY_FOR_REVIEW',
        },
      });

      // Manager requests changes without notes -> fails with 400
      const failRes = await request(app)
        .patch(`/api/tasks/${testTask.id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'CHANGES_REQUESTED', notes: '   ' });

      expect(failRes.status).toBe(400);

      // Manager requests changes with valid notes -> succeeds
      const successRes = await request(app)
        .patch(`/api/tasks/${testTask.id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'CHANGES_REQUESTED', notes: 'Missing HSN tax rates for row 45' });

      expect(successRes.status).toBe(200);
      expect(successRes.body.data.status).toBe('CHANGES_REQUESTED');
    });
  });

  // TEST 5: Dashboard Metrics
  describe('Requirement: Dashboard KPIs', () => {
    it('should return all required dashboard metrics accurately', async () => {
      const res = await request(app)
        .get('/api/dashboard/metrics')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { metrics, statusBreakdown, recentActivity } = res.body.data;

      // 5 required metrics from prompt
      expect(metrics).toHaveProperty('openTasks');
      expect(metrics).toHaveProperty('overdueTasks');
      expect(metrics).toHaveProperty('dueTodayTasks');
      expect(metrics).toHaveProperty('waitingForClient');
      expect(metrics).toHaveProperty('waitingForReview');

      expect(metrics.openTasks).toBeGreaterThan(0);
      expect(metrics.overdueTasks).toBeGreaterThan(0);
      expect(Array.isArray(recentActivity)).toBe(true);
      expect(typeof statusBreakdown).toBe('object');
    });
  });
});
