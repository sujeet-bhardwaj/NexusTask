import { PrismaClient, Role, Frequency, EngagementStatus, TaskStatus, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing data (respecting foreign key order)
  await prisma.taskAuditLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.taskTemplate.deleteMany();
  await prisma.engagement.deleteMany();
  await prisma.serviceType.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Existing data wiped cleanly.');

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 3. Create Users
  console.log('👥 Creating Users...');
  const admin = await prisma.user.create({
    data: {
      name: 'Elena Vance',
      email: 'admin@services.com',
      password: passwordHash,
      role: Role.ADMIN,
      title: 'Managing Director & Systems Admin',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'sarah.connor@services.com',
      password: passwordHash,
      role: Role.MANAGER,
      title: 'Senior Engagement Manager',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: 'David Miller',
      email: 'david.miller@services.com',
      password: passwordHash,
      role: Role.MANAGER,
      title: 'Client Operations Manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const member1 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya.sharma@services.com',
      password: passwordHash,
      role: Role.TEAM_MEMBER,
      title: 'Senior Tax Associate',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const member2 = await prisma.user.create({
    data: {
      name: 'Alex Chen',
      email: 'alex.chen@services.com',
      password: passwordHash,
      role: Role.TEAM_MEMBER,
      title: 'Compliance Specialist',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  const member3 = await prisma.user.create({
    data: {
      name: 'Marcus Brooks',
      email: 'marcus.brooks@services.com',
      password: passwordHash,
      role: Role.TEAM_MEMBER,
      title: 'Junior Consultant',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    },
  });

  const member4 = await prisma.user.create({
    data: {
      name: 'Zara Patel',
      email: 'zara.patel@services.com',
      password: passwordHash,
      role: Role.TEAM_MEMBER,
      title: 'Audit Analyst',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    },
  });

  // 4. Create 5 Clients
  console.log('🏢 Creating 5 Clients...');
  const client1 = await prisma.client.create({
    data: {
      name: 'Robert Hastings',
      companyName: 'Apex Global Technologies',
      email: 'contact@apexglobal.tech',
      phone: '+1 (555) 234-5678',
      address: '100 Innovation Way, Suite 400, Tech Park',
      notes: 'Key SaaS enterprise account, high volume monthly compliance',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Meera Kapoor',
      companyName: 'Nexa Retail Solutions',
      email: 'accounts@nexaretail.com',
      phone: '+1 (555) 345-6789',
      address: '42 Commerce Boulevard, Central Square',
      notes: 'Multi-store retail chain with quarterly inventory reconciliation',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Liam Gallagher',
      companyName: 'Horizon Logistics Ltd',
      email: 'finance@horizonlogistics.co',
      phone: '+1 (555) 456-7890',
      address: '88 Harbour Expressway, Docklands',
      notes: 'Freight forwarder, requires strict e-way bill compliance',
    },
  });

  const client4 = await prisma.client.create({
    data: {
      name: 'Dr. Clara Thorne',
      companyName: 'BlueSky Health & Wellness',
      email: 'admin@blueskyhealth.org',
      phone: '+1 (555) 567-8901',
      address: '12 Medical Center Drive, Healthcare Hub',
      notes: 'Rapidly expanding diagnostic lab network',
    },
  });

  const client5 = await prisma.client.create({
    data: {
      name: 'Arthur Pendelton',
      companyName: 'Vantage Financial Advisors',
      email: 'tax@vantageadvisors.net',
      phone: '+1 (555) 678-9012',
      address: '70 Wall Financial Plaza, Floor 18',
      notes: 'Institutional client with strict regulatory audit schedules',
    },
  });

  // 5. Create 3 Service Types with Task Templates
  console.log('📋 Creating 3 Service Types & Templates...');
  const gstMonthly = await prisma.serviceType.create({
    data: {
      name: 'Monthly GST Compliance',
      code: 'GST-MTH',
      description: 'Monthly Goods & Services Tax reconciliation, credit matching, and GSTR-3B return filing',
      isRecurring: true,
      frequency: Frequency.MONTHLY,
      taskTemplates: {
        create: [
          {
            title: 'Gather Sales & Purchase Registers',
            description: 'Obtain monthly billing summaries, credit notes, and purchase invoices from client ERP',
            orderIndex: 0,
            defaultDeadlineOffsetDays: 3,
          },
          {
            title: 'Reconcile GSTR-2B Input Tax Credit',
            description: 'Run automatic reconciliation between client purchase book and GSTN portal 2B statement',
            orderIndex: 1,
            defaultDeadlineOffsetDays: 7,
          },
          {
            title: 'Prepare & File GSTR-3B Return',
            description: 'Compute final tax liability, generate challan, and complete digital signature filing',
            orderIndex: 2,
            defaultDeadlineOffsetDays: 14,
          },
          {
            title: 'Archive Filing Acknowledgement & Challan',
            description: 'Save ARN receipt, payment challan, and mail confirmation report to client finance team',
            orderIndex: 3,
            defaultDeadlineOffsetDays: 18,
          },
        ],
      },
    },
    include: { taskTemplates: true },
  });

  const gstRegistration = await prisma.serviceType.create({
    data: {
      name: 'GST Registration',
      code: 'GST-REG',
      description: 'Complete registration process for newly incorporated entities or new state branch locations',
      isRecurring: false,
      frequency: Frequency.ONE_TIME,
      taskTemplates: {
        create: [
          {
            title: 'Collect KYC, Utility Bills & Rent Deeds',
            description: 'Verify PAN, Aadhaar, board resolution, and registered premises electricity bill',
            orderIndex: 0,
            defaultDeadlineOffsetDays: 3,
          },
          {
            title: 'Draft GST Application on Portal',
            description: 'Fill TRN form, upload premise documents, promoter details, and goods HSN codes',
            orderIndex: 1,
            defaultDeadlineOffsetDays: 6,
          },
          {
            title: 'Verify Aadhaar OTP & Submit Application',
            description: 'Trigger primary authorized signatory OTP verification and generate ARN number',
            orderIndex: 2,
            defaultDeadlineOffsetDays: 10,
          },
        ],
      },
    },
    include: { taskTemplates: true },
  });

  const annualAudit = await prisma.serviceType.create({
    data: {
      name: 'Annual Financial Audit & Filing',
      code: 'AUD-ANN',
      description: 'Comprehensive statutory audit, trial balance scrutiny, and annual income tax return filing',
      isRecurring: true,
      frequency: Frequency.YEARLY,
      taskTemplates: {
        create: [
          {
            title: 'Trial Balance Review & Ledger Scrutiny',
            description: 'Sample testing of major revenue items, operating expenses, and loan agreements',
            orderIndex: 0,
            defaultDeadlineOffsetDays: 15,
          },
          {
            title: 'Fixed Asset Register & Depreciation Schedule',
            description: 'Reconcile additions and verify depreciation rates as per Companies Act and Tax laws',
            orderIndex: 1,
            defaultDeadlineOffsetDays: 25,
          },
          {
            title: 'Form 3CD Tax Audit Report Preparation',
            description: 'Compile quantitative details, related-party disclosures, and statutory dues checklist',
            orderIndex: 2,
            defaultDeadlineOffsetDays: 40,
          },
          {
            title: 'Final Tax Return Submission & Report',
            description: 'Upload audited financials, e-verify return, and deliver signed physical copies',
            orderIndex: 3,
            defaultDeadlineOffsetDays: 55,
          },
        ],
      },
    },
    include: { taskTemplates: true },
  });

  // 6. Create Engagements & 20+ Tasks
  console.log('📌 Creating Engagements and 20+ Tasks...');
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const inTenDays = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  // Engagement 1: Apex Global - Past Completed Month (2026-08)
  const eng1 = await prisma.engagement.create({
    data: {
      title: 'Monthly GST Compliance - 2026-08 (Apex Global)',
      clientId: client1.id,
      serviceTypeId: gstMonthly.id,
      createdById: manager1.id,
      period: '2026-08',
      status: EngagementStatus.COMPLETED,
      startDate: new Date('2026-08-01'),
      targetDate: new Date('2026-08-20'),
    },
  });

  for (const tmpl of gstMonthly.taskTemplates) {
    const task = await prisma.task.create({
      data: {
        engagementId: eng1.id,
        templateId: tmpl.id,
        title: tmpl.title,
        description: tmpl.description,
        assignedToId: member1.id,
        status: TaskStatus.COMPLETED,
        priority: Priority.MEDIUM,
        dueDate: new Date('2026-08-18'),
        completedAt: new Date('2026-08-17'),
      },
    });
    await prisma.taskAuditLog.create({
      data: {
        taskId: task.id,
        changedById: manager1.id,
        action: 'APPROVAL',
        oldStatus: TaskStatus.READY_FOR_REVIEW,
        newStatus: TaskStatus.COMPLETED,
        notes: 'Monthly compliance verified and approved.',
      },
    });
  }

  // Engagement 2: Apex Global - Active Month (2026-09)
  const eng2 = await prisma.engagement.create({
    data: {
      title: 'Monthly GST Compliance - 2026-09 (Apex Global)',
      clientId: client1.id,
      serviceTypeId: gstMonthly.id,
      createdById: manager1.id,
      period: '2026-09',
      status: EngagementStatus.ACTIVE,
      startDate: new Date('2026-09-01'),
      targetDate: new Date('2026-09-20'),
    },
  });

  // Task 1: Completed
  const t2_1 = await prisma.task.create({
    data: {
      engagementId: eng2.id,
      templateId: gstMonthly.taskTemplates[0].id,
      title: gstMonthly.taskTemplates[0].title,
      description: gstMonthly.taskTemplates[0].description,
      assignedToId: member1.id,
      status: TaskStatus.COMPLETED,
      priority: Priority.HIGH,
      dueDate: fiveDaysAgo,
      completedAt: yesterday,
    },
  });
  await prisma.taskAuditLog.create({
    data: {
      taskId: t2_1.id,
      changedById: manager1.id,
      action: 'APPROVAL',
      oldStatus: TaskStatus.READY_FOR_REVIEW,
      newStatus: TaskStatus.COMPLETED,
      notes: 'All invoices verified against SAP export.',
    },
  });

  // Task 2: Ready for review (Priya completed, Sarah needs to review)
  const t2_2 = await prisma.task.create({
    data: {
      engagementId: eng2.id,
      templateId: gstMonthly.taskTemplates[1].id,
      title: gstMonthly.taskTemplates[1].title,
      description: gstMonthly.taskTemplates[1].description,
      assignedToId: member1.id,
      status: TaskStatus.READY_FOR_REVIEW,
      priority: Priority.HIGH,
      dueDate: inTwoDays,
    },
  });
  await prisma.taskAuditLog.create({
    data: {
      taskId: t2_2.id,
      changedById: member1.id,
      action: 'SUBMITTED_FOR_REVIEW',
      oldStatus: TaskStatus.IN_PROGRESS,
      newStatus: TaskStatus.READY_FOR_REVIEW,
      notes: 'Reconciliation table prepared. 99.8% match with GSTR-2B, minor diff noted in sheet.',
    },
  });

  // Task 3: In Progress
  await prisma.task.create({
    data: {
      engagementId: eng2.id,
      templateId: gstMonthly.taskTemplates[2].id,
      title: gstMonthly.taskTemplates[2].title,
      description: gstMonthly.taskTemplates[2].description,
      assignedToId: member2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: inFiveDays,
    },
  });

  // Task 4: Not Started
  await prisma.task.create({
    data: {
      engagementId: eng2.id,
      templateId: gstMonthly.taskTemplates[3].id,
      title: gstMonthly.taskTemplates[3].title,
      description: gstMonthly.taskTemplates[3].description,
      assignedToId: member2.id,
      status: TaskStatus.NOT_STARTED,
      priority: Priority.MEDIUM,
      dueDate: inTenDays,
    },
  });

  // Engagement 3: Nexa Retail - Monthly GST (2026-09)
  const eng3 = await prisma.engagement.create({
    data: {
      title: 'Monthly GST Compliance - 2026-09 (Nexa Retail)',
      clientId: client2.id,
      serviceTypeId: gstMonthly.id,
      createdById: manager1.id,
      period: '2026-09',
      status: EngagementStatus.ACTIVE,
      startDate: new Date('2026-09-01'),
      targetDate: new Date('2026-09-22'),
    },
  });

  // Task 3_1: Waiting for client
  const t3_1 = await prisma.task.create({
    data: {
      engagementId: eng3.id,
      templateId: gstMonthly.taskTemplates[0].id,
      title: gstMonthly.taskTemplates[0].title,
      description: gstMonthly.taskTemplates[0].description,
      assignedToId: member1.id,
      status: TaskStatus.WAITING_FOR_CLIENT,
      priority: Priority.MEDIUM,
      dueDate: now, // Due Today!
    },
  });
  await prisma.taskAuditLog.create({
    data: {
      taskId: t3_1.id,
      changedById: member1.id,
      action: 'WAITING_FOR_CLIENT',
      oldStatus: TaskStatus.IN_PROGRESS,
      newStatus: TaskStatus.WAITING_FOR_CLIENT,
      notes: 'Sent reminder email to client accountant for September credit notes register.',
    },
  });

  // Task 3_2: Not started
  await prisma.task.create({
    data: {
      engagementId: eng3.id,
      templateId: gstMonthly.taskTemplates[1].id,
      title: gstMonthly.taskTemplates[1].title,
      description: gstMonthly.taskTemplates[1].description,
      assignedToId: member1.id,
      status: TaskStatus.NOT_STARTED,
      priority: Priority.MEDIUM,
      dueDate: inFiveDays,
    },
  });

  // Task 3_3 & 3_4
  await prisma.task.create({
    data: {
      engagementId: eng3.id,
      templateId: gstMonthly.taskTemplates[2].id,
      title: gstMonthly.taskTemplates[2].title,
      description: gstMonthly.taskTemplates[2].description,
      assignedToId: member3.id,
      status: TaskStatus.NOT_STARTED,
      priority: Priority.MEDIUM,
      dueDate: inTenDays,
    },
  });
  await prisma.task.create({
    data: {
      engagementId: eng3.id,
      templateId: gstMonthly.taskTemplates[3].id,
      title: gstMonthly.taskTemplates[3].title,
      description: gstMonthly.taskTemplates[3].description,
      assignedToId: member3.id,
      status: TaskStatus.NOT_STARTED,
      priority: Priority.LOW,
      dueDate: inTenDays,
    },
  });

  // Engagement 4: Horizon Logistics - Monthly GST (2026-09) with OVERDUE tasks
  const eng4 = await prisma.engagement.create({
    data: {
      title: 'Monthly GST Compliance - 2026-09 (Horizon Logistics)',
      clientId: client3.id,
      serviceTypeId: gstMonthly.id,
      createdById: manager2.id,
      period: '2026-09',
      status: EngagementStatus.ACTIVE,
      startDate: new Date('2026-09-01'),
      targetDate: new Date('2026-09-20'),
    },
  });

  // Overdue Task 1
  await prisma.task.create({
    data: {
      engagementId: eng4.id,
      templateId: gstMonthly.taskTemplates[0].id,
      title: gstMonthly.taskTemplates[0].title,
      description: gstMonthly.taskTemplates[0].description,
      assignedToId: member3.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.URGENT,
      dueDate: threeDaysAgo, // OVERDUE
    },
  });

  // Overdue Task 2
  await prisma.task.create({
    data: {
      engagementId: eng4.id,
      templateId: gstMonthly.taskTemplates[1].id,
      title: gstMonthly.taskTemplates[1].title,
      description: gstMonthly.taskTemplates[1].description,
      assignedToId: member3.id,
      status: TaskStatus.NOT_STARTED,
      priority: Priority.URGENT,
      dueDate: yesterday, // OVERDUE
    },
  });

  // Task 4_3: Ready for Review
  const t4_3 = await prisma.task.create({
    data: {
      engagementId: eng4.id,
      templateId: gstMonthly.taskTemplates[2].id,
      title: gstMonthly.taskTemplates[2].title,
      description: gstMonthly.taskTemplates[2].description,
      assignedToId: member3.id,
      status: TaskStatus.READY_FOR_REVIEW,
      priority: Priority.HIGH,
      dueDate: now, // Due Today!
    },
  });
  await prisma.taskAuditLog.create({
    data: {
      taskId: t4_3.id,
      changedById: member3.id,
      action: 'SUBMITTED_FOR_REVIEW',
      oldStatus: TaskStatus.IN_PROGRESS,
      newStatus: TaskStatus.READY_FOR_REVIEW,
      notes: 'Draft return prepared, awaiting manager David approval to submit.',
    },
  });

  // Task 4_4
  await prisma.task.create({
    data: {
      engagementId: eng4.id,
      templateId: gstMonthly.taskTemplates[3].id,
      title: gstMonthly.taskTemplates[3].title,
      description: gstMonthly.taskTemplates[3].description,
      assignedToId: member3.id,
      status: TaskStatus.NOT_STARTED,
      priority: Priority.MEDIUM,
      dueDate: inFiveDays,
    },
  });

  // Engagement 5: BlueSky Health - GST Registration (One-Time)
  const eng5 = await prisma.engagement.create({
    data: {
      title: 'GST Registration - BlueSky Health (Branch 4)',
      clientId: client4.id,
      serviceTypeId: gstRegistration.id,
      createdById: manager2.id,
      period: 'ONE_TIME',
      status: EngagementStatus.ACTIVE,
      startDate: new Date(),
      targetDate: inTenDays,
    },
  });

  // Task 5_1: Changes Requested
  const t5_1 = await prisma.task.create({
    data: {
      engagementId: eng5.id,
      templateId: gstRegistration.taskTemplates[0].id,
      title: gstRegistration.taskTemplates[0].title,
      description: gstRegistration.taskTemplates[0].description,
      assignedToId: member4.id,
      status: TaskStatus.CHANGES_REQUESTED,
      priority: Priority.HIGH,
      dueDate: now, // Due Today!
    },
  });
  await prisma.taskAuditLog.create({
    data: {
      taskId: t5_1.id,
      changedById: manager2.id,
      action: 'CHANGES_REQUESTED',
      oldStatus: TaskStatus.READY_FOR_REVIEW,
      newStatus: TaskStatus.CHANGES_REQUESTED,
      notes: 'Electricity bill uploaded was older than 2 months. Please obtain current bill from client.',
    },
  });

  await prisma.task.create({
    data: {
      engagementId: eng5.id,
      templateId: gstRegistration.taskTemplates[1].id,
      title: gstRegistration.taskTemplates[1].title,
      description: gstRegistration.taskTemplates[1].description,
      assignedToId: member4.id,
      status: TaskStatus.NOT_STARTED,
      priority: Priority.MEDIUM,
      dueDate: inFiveDays,
    },
  });

  await prisma.task.create({
    data: {
      engagementId: eng5.id,
      templateId: gstRegistration.taskTemplates[2].id,
      title: gstRegistration.taskTemplates[2].title,
      description: gstRegistration.taskTemplates[2].description,
      assignedToId: member4.id,
      status: TaskStatus.NOT_STARTED,
      priority: Priority.MEDIUM,
      dueDate: inTenDays,
    },
  });

  // Engagement 6: Vantage Financial - Annual Audit (Recurring Yearly: 2026)
  const eng6 = await prisma.engagement.create({
    data: {
      title: 'Annual Financial Audit & Filing - 2026 (Vantage Financial)',
      clientId: client5.id,
      serviceTypeId: annualAudit.id,
      createdById: manager1.id,
      period: '2026',
      status: EngagementStatus.ACTIVE,
      startDate: new Date('2026-08-01'),
      targetDate: new Date('2026-10-31'),
    },
  });

  // Task 6_1: In progress due today
  await prisma.task.create({
    data: {
      engagementId: eng6.id,
      templateId: annualAudit.taskTemplates[0].id,
      title: annualAudit.taskTemplates[0].title,
      description: annualAudit.taskTemplates[0].description,
      assignedToId: member2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: now, // Due Today!
    },
  });

  // Task 6_2: Ready for review
  const t6_2 = await prisma.task.create({
    data: {
      engagementId: eng6.id,
      templateId: annualAudit.taskTemplates[1].id,
      title: annualAudit.taskTemplates[1].title,
      description: annualAudit.taskTemplates[1].description,
      assignedToId: member4.id,
      status: TaskStatus.READY_FOR_REVIEW,
      priority: Priority.MEDIUM,
      dueDate: inFiveDays,
    },
  });
  await prisma.taskAuditLog.create({
    data: {
      taskId: t6_2.id,
      changedById: member4.id,
      action: 'SUBMITTED_FOR_REVIEW',
      oldStatus: TaskStatus.IN_PROGRESS,
      newStatus: TaskStatus.READY_FOR_REVIEW,
      notes: 'Asset register depreciation calculated as per Schedule II.',
    },
  });

  // Task 6_3: Waiting for client
  const t6_3 = await prisma.task.create({
    data: {
      engagementId: eng6.id,
      templateId: annualAudit.taskTemplates[2].id,
      title: annualAudit.taskTemplates[2].title,
      description: annualAudit.taskTemplates[2].description,
      assignedToId: member2.id,
      status: TaskStatus.WAITING_FOR_CLIENT,
      priority: Priority.MEDIUM,
      dueDate: inTenDays,
    },
  });
  await prisma.taskAuditLog.create({
    data: {
      taskId: t6_3.id,
      changedById: member2.id,
      action: 'WAITING_FOR_CLIENT',
      oldStatus: TaskStatus.IN_PROGRESS,
      newStatus: TaskStatus.WAITING_FOR_CLIENT,
      notes: 'Waiting for client management representation letter regarding related party transactions.',
    },
  });

  // Task 6_4: Not started
  await prisma.task.create({
    data: {
      engagementId: eng6.id,
      templateId: annualAudit.taskTemplates[3].id,
      title: annualAudit.taskTemplates[3].title,
      description: annualAudit.taskTemplates[3].description,
      assignedToId: member2.id,
      status: TaskStatus.NOT_STARTED,
      priority: Priority.LOW,
      dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Seed completed successfully! Created:');
  console.log(' - 7 Users (1 Admin, 2 Managers, 4 Team Members)');
  console.log(' - 5 Clients');
  console.log(' - 3 Service Types with templates');
  console.log(' - 6 Engagements');
  console.log(' - 23 Tasks with audit logs');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
