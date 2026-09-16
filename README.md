# NexusTask — Task & Engagement Management Tool
> Full Stack Developer Technical Assignment for a Professional Services Team.

NexusTask is a practical full-stack web application designed for professional services firms (accounting, legal, compliance, consulting) to manage clients, engagements, recurring workflows, and task lifecycles with strict server-side authorization and audit history.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18.0+ (Tested on v24.18)
- **npm**: v9.0+

### 2. Automated Installation & Setup
From the repository root, run:
```bash
npm run setup
```
This single command automatically:
- Installs all backend dependencies
- Generates the Prisma ORM client
- Creates and syncs the SQLite database (`dev.db`)
- Seeds the database with rich sample data (5 clients, 2 managers, 4 team members, 3 services, 23 tasks)
- Installs all frontend dependencies

### 3. Start Development Servers
```bash
npm run dev
```
Or start individually in separate terminals:
- **Backend**: `npm run dev:backend` (Runs on `http://localhost:4000`)
- **Frontend**: `npm run dev:frontend` (Runs on `http://localhost:5173`)

Open your browser at: **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 Demo Personas & Credentials

The application includes a **1-Click Persona Switcher Bar** at the top of the header so you can switch between roles instantly without typing credentials!

All accounts use default password: **`password123`**

| Role | Name | Title | Email | Key Capabilities |
|---|---|---|---|---|
| **Admin** | Elena Vance | Managing Director | `admin@services.com` | Full access, user/client catalog, service blueprints |
| **Manager** | Sarah Connor | Senior Engagement Mgr | `sarah.connor@services.com` | Create engagements, assign tasks, review/approve work |
| **Manager** | David Miller | Operations Manager | `david.miller@services.com` | Set deadlines, review submissions, request changes |
| **Team Member** | Priya Sharma | Senior Tax Associate | `priya.sharma@services.com` | Execute tasks, pause for client info, submit for review |
| **Team Member** | Alex Chen | Compliance Specialist | `alex.chen@services.com` | Execute assigned compliance tasks |
| **Team Member** | Marcus Brooks | Junior Consultant | `marcus.brooks@services.com` | Execute logistics & return tasks |
| **Team Member** | Zara Patel | Audit Analyst | `zara.patel@services.com` | Execute audit checklist & entity registration tasks |

---

## 🧪 Automated Backend Tests

The project includes **12 automated integration tests** built with **Vitest** and **Supertest** directly verifying the assignment requirements:

To execute all tests:
```bash
npm test
```
*(or `npm --prefix backend test`)*

### Test Suite Highlights:
1. `Unauthorized task update is rejected`: Team member trying to update another specialist's task receives `403 Forbidden`.
2. `Unauthorized assignment is rejected`: Only Managers/Admins can assign tasks or alter deadlines.
3. `Duplicate recurring engagement is rejected`: Creating duplicate engagement for same client, service, and period returns `409 Conflict`.
4. `Duplicate next period generation is rejected`: Generating next period when already existing returns `409 Conflict`.
5. `Invalid workflow transitions are rejected`: Skipping steps (e.g. `NOT_STARTED` → `COMPLETED` or `READY_FOR_REVIEW`) returns `400 Bad Request`.
6. `Self-approval is rejected`: Team member attempting to approve own work returns `403 Forbidden`.
7. `Manager approval works correctly`: Manager approving `READY_FOR_REVIEW` marks task `COMPLETED` and creates an approval audit entry.
8. `Manager change request requires notes`: Returning work with empty notes fails; valid notes transitions to `CHANGES_REQUESTED`.
9. `Dashboard KPI accuracy`: Verifies the 5 required metric counts against database state.

---

## 📐 Core Architecture & Features

### 1. Technology Stack
- **Frontend**: React 19, JavaScript (JSX), Vite, Vanilla CSS Design System with CSS variables and glassmorphism.
- **Backend**: Node.js, Express, TypeScript, Zod, JWT.
- **Database**: SQLite with Prisma ORM (relational constraints, foreign keys, compound indexes, and `$transaction` guarantees).

### 2. Data Model
- **`User`**: Role-based access (`ADMIN`, `MANAGER`, `TEAM_MEMBER`).
- **`Client`**: 5 corporate accounts pre-seeded with contact info and compliance notes.
- **`ServiceType` & `TaskTemplate`**: Reusable service definitions (Monthly GST Compliance, GST Registration, Annual Audit) that auto-generate tasks on engagement creation.
- **`Engagement`**: Unique per `(clientId, serviceTypeId, period)`.
- **`Task`**: Status, priority, due date, assignee, and cascade linking.
- **`TaskAuditLog`**: Chronological audit trail of all status transitions, reassignments, deadline changes, and review notes.

### 3. Task Workflow Finite State Machine
```
[NOT_STARTED] ──> [IN_PROGRESS] ──> [READY_FOR_REVIEW] ──> [COMPLETED] (Manager Only!)
                        │                   │
                        ▼                   ▼
              [WAITING_FOR_CLIENT]   [CHANGES_REQUESTED]
                        │                   │
                        └──> [IN_PROGRESS] <──┘
```

### 4. Duplicate Prevention & Idempotency
- **Database Level**: `@@unique([clientId, serviceTypeId, period])` compound unique constraint.
- **Service Level**: `EngagementService.generateNextPeriod` executes inside an atomic `prisma.$transaction`. If an engagement already exists or any task creation fails, the transaction aborts with a `409 Conflict` and rolls back cleanly.

### 5. Five Core KPI Dashboard
1. **Open Tasks** (All active uncompleted work)
2. **Overdue Tasks** (Tasks with due dates in the past, styled with glowing alert badges)
3. **Tasks Due Today** (Tasks due by end of day)
4. **Tasks Waiting for Client** (Tasks paused awaiting customer documentation)
5. **Tasks Waiting for Review** (Tasks awaiting manager approval)

---

## 📄 Submission Documents
- Detailed **[Technical Design Note (2–4 Pages)](file:///c:/Users/Dell/Desktop/Project/TECHNICAL_DESIGN_NOTE.md)** covering:
  - System Architecture & ERD Diagram
  - Backend Layering & Error Handling
  - Role-based Authorization Matrix
  - Recurring Generation & Rollback Guarantees
  - Production Considerations for 5 Million Tasks
  - Architectural Trade-offs & Decisions
