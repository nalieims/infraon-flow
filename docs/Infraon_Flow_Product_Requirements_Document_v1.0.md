PRODUCT REQUIREMENTS DOCUMENT

Infraon Flow

OKR Management + Daily Work Execution Platform

MVP Product Definition

Version 1.0  |  19 October 2026  |  Status: Draft for development

| Document field | Definition |
| --- | --- |
| Product | Infraon Flow (working name) |
| Product type | Multi-tenant SaaS web application |
| Primary users | Individuals, team leads, managers, workspace administrators |
| Frontend | Angular 21, TypeScript, PrimeNG and Tailwind CSS |
| Backend | Python, Django and Django REST Framework |
| Database | PostgreSQL |
| Document owner | Product / Engineering |
| MVP objective | Connect strategic objectives and measurable key results to initiatives and daily tasks. |

# 1. Executive Summary

Infraon Flow is a goal-setting and work-execution platform that combines an OKR framework with practical daily task management. It enables a person or organization to define objectives, measure key results, organize initiatives, assign work, and understand how day-to-day execution contributes to larger outcomes.

The MVP will focus on a reliable end-to-end workflow: create a workspace, establish an objective, define measurable key results, create initiatives, link tasks to those initiatives, complete work, and review progress through dashboards and check-ins.

# 2. Problem Statement

- Goals and daily tasks often live in separate tools, making it difficult to connect execution with outcomes.

- Teams can track activity (tasks completed) without understanding whether measurable business results are improving.

- Managers lack a consistent view of ownership, progress, blockers, and overdue work.

- Individuals need a clear daily plan while retaining visibility into the larger goals their work supports.

# 3. Product Vision and Value Proposition

Vision: Help people and teams turn ambitious goals into focused, measurable, everyday action.

Value proposition: One connected workspace for objectives, key results, initiatives, tasks, daily planning, and progress reviews.

## 3.1 Product principles

- Outcome-first: measure results, not just activity.

- Execution-connected: make it easy to link tasks to initiatives and key results.

- Simple by default: keep the MVP intuitive and avoid enterprise complexity.

- Flexible: allow unlinked operational tasks that do not contribute to an OKR.

- Secure by design: enforce workspace-level data isolation and role-based permissions.

# 4. Goals, Non-goals and Success Metrics

## 4.1 MVP goals

- Support personal and business workspaces using one consistent data model.

- Support company, team, and individual ownership of objectives.

- Provide measurable key results with progress check-ins.

- Provide task creation, assignment, prioritization, due dates, subtasks, and Kanban/list views.

- Provide a My Day view that helps users plan and complete daily work.

- Show how initiatives and tasks connect to strategic goals.

- Provide a useful dashboard for individuals and workspace managers.

## 4.2 Non-goals for MVP

- AI-generated OKRs, AI task planning, or AI coaching.

- Real-time chat, video meetings, or a full document/wiki editor.

- Advanced workflow automation, custom workflow builders, or complex approval chains.

- Gantt charts, resource capacity planning, timesheets, and billing.

- Native mobile applications and deep third-party integrations.

- Enterprise SSO, advanced audit exports, and complex custom roles.

## 4.3 Initial success metrics

| Metric | Initial validation target | Why it matters |
| --- | --- | --- |
| Activated workspaces | 5–10 pilot workspaces | Validates initial demand and onboarding. |
| Goal-to-task linkage | At least 60% of pilot tasks linked to an initiative where relevant | Tests the core product differentiator. |
| Weekly active users | At least 50% of invited users active weekly | Measures recurring usefulness. |
| Weekly check-in completion | At least 60% of active pilot teams | Tests review and accountability workflow. |
| Task completion visibility | Users can reliably see due, overdue and completed work | Validates core execution functionality. |

Targets are hypotheses for pilot validation, not guaranteed benchmarks.

# 5. Target Users and Personas

| Persona | Needs | Primary capabilities |
| --- | --- | --- |
| Individual contributor | Know what to do today and how work supports goals. | My Day, assigned tasks, personal objectives, progress updates. |
| Team lead | Coordinate team priorities and remove blockers. | Team objectives, task assignment, initiative tracking, check-ins. |
| Workspace admin / manager | Set direction and understand organizational progress. | Workspace setup, teams, aligned OKRs, dashboards, member management. |
| Independent professional | Manage personal goals and daily execution. | Personal workspace, objectives, key results, tasks and weekly reviews. |

# 6. Product Scope and Information Architecture

Primary navigation:

- Dashboard

- OKRs

- Initiatives

- My Tasks

- My Day

- Teams

- Reports

- Settings

Core hierarchy:

Workspace → Objective → Key Result → Initiative → Task → Subtask

An initiative belongs to a key result in the initial model. A task may optionally belong to an initiative. Tasks without an initiative are valid for operational or personal work. Avoid treating task completion as automatic key-result progress: outcomes must be updated using measured values or explicit check-ins.

# 7. Functional Requirements

FR-01 Workspace management: A user can create a personal or organization workspace. A user may belong to multiple workspaces. Workspace data must be isolated. Admins can invite members and assign roles.

FR-02 Authentication: Users can register, log in, log out, refresh sessions, and reset passwords. APIs must authenticate requests and enforce authorization.

FR-03 Teams and membership: Workspace admins can create teams, add members, and assign a team lead. Members can belong to one or more teams if enabled by the workspace model.

FR-04 Objectives: Authorized users can create, view, edit, archive, and assign objectives. Objectives have title, description, owner, period, start date, end date, status, and optional team association.

FR-05 Key results: An objective can contain multiple key results. Each key result has a metric type, unit, start value, current value, target value, owner, and status. Progress is calculated according to metric direction/type.

FR-06 Initiatives: Users can create initiatives linked to a key result, assign an owner, set dates and status, and view related tasks.

FR-07 Task management: Users can create, edit, assign, prioritize, schedule, move status, and delete/archive tasks subject to permissions. Tasks support descriptions, due dates, optional initiative, labels, and subtasks.

FR-08 Task views: Users can view tasks in list and Kanban formats and filter by assignee, status, priority, due date, initiative, and label.

FR-09 My Day: Users can see tasks due today, overdue tasks, and tasks explicitly planned for today. Users can add or remove tasks from their daily plan without changing the task's due date.

FR-10 Check-ins: Users can record key-result progress, confidence, narrative update, blockers, and next steps. Check-ins are timestamped and attributable to a user.

FR-11 Dashboard: The dashboard shows objective and key-result progress, active initiatives, assigned open tasks, overdue tasks, and daily/weekly task completion.

FR-12 Comments and activity: Users can comment on tasks and view a chronological activity history for key task and goal events.

FR-13 Permissions: The system enforces workspace membership and role permissions on every API endpoint and object lookup.

FR-14 Search and filters: Users can search and filter objectives, initiatives, and tasks within their active workspace.

FR-15 Notifications - basic: The MVP may provide in-app notification records for task assignment, mentions, and due-date reminders. Email/push delivery is deferred unless pilot feedback makes it essential.

# 8. Key User Workflows

## Onboard a workspace

1. Register or sign in.

1. Create a personal or organization workspace.

1. Set workspace name and basic preferences.

1. Invite members or skip invitations.

1. Land on the workspace dashboard.

## Create and align an OKR

1. Create an objective and select a period and owner.

1. Add one or more measurable key results.

1. Create an initiative under a key result.

1. Assign an initiative owner and dates.

1. Review the objective and alignment view.

## Plan and complete daily work

1. Open My Day.

1. Review overdue and due-today tasks.

1. Add tasks to today's plan.

1. Update status, priority, or due date as needed.

1. Complete tasks and review daily completion.

## Run a weekly check-in

1. Open a key result.

1. Enter the latest measured value.

1. Set confidence/status and add a progress note.

1. Record blockers and next steps.

1. Review historical check-ins and objective health.

# 9. Business Rules and Calculations

## 9.1 Key-result progress

For a simple increasing metric where target differs from start:

Progress % = ((Current − Start) / (Target − Start)) × 100

For decreasing metrics, calculate progress in the opposite direction. For binary or milestone metrics, use an explicitly defined completion rule. Clamp displayed progress to 0–100% by default, but retain the raw values and consider showing overachievement separately. Validate that the target is not equal to the start value.

## 9.2 Objective progress

For MVP, calculate objective progress as the unweighted average of its active key-result progress values. Document this as a product rule and make it consistent across the UI and API. Weighted key results can be considered later.

## 9.3 Task completion

Daily completion = completed tasks in the selected daily plan / total tasks in that plan × 100. Do not mix overdue tasks outside the daily plan into the denominator unless the UI explicitly labels the metric differently.

## 9.4 Status rules

- Task statuses: To Do, In Progress, In Review, Done. Workspace customization is out of scope for MVP.

- Task priorities: Low, Medium, High, Urgent.

- Objective statuses: Draft, On Track, At Risk, Off Track, Completed, Archived.

- Initiative statuses: Planned, In Progress, Blocked, Completed, Archived.

- A completed task does not automatically increase a key result's measured value.

# 10. Data Requirements and Core Entities

| Entity | Key fields / relationships |
| --- | --- |
| User | Email, password hash, name, active state, timezone; use a custom Django user model. |
| Workspace | Name, slug, type (personal/organization), timezone, created_by. |
| WorkspaceMembership | Workspace, user, role, membership status, joined_at. |
| Team | Workspace, name, description, lead. |
| TeamMembership | Team, user, membership role. |
| Objective | Workspace, optional team, owner, title, description, period, dates, status. |
| KeyResult | Objective, owner, title, metric type, unit, start/current/target values, status. |
| Initiative | Key result, owner, title, description, dates, status. |
| Task | Workspace, optional initiative, creator, assignee, title, description, status, priority, due date. |
| Subtask | Parent task, title, assignee (optional), status, position. |
| DailyPlanItem | User, workspace, task, planned_for date, position; unique task/user/date as appropriate. |
| CheckIn | Key result, author, measured value, confidence, note, blockers, created_at. |
| Comment | Task, author, body, created_at, edited_at. |
| ActivityLog | Workspace, actor, object type/id, event type, metadata, timestamp. |

All workspace-owned records must carry a workspace relationship directly or be reachable through a parent whose workspace is validated. Add created_at/updated_at fields where appropriate, database constraints, indexes for common filters, and soft-delete/archive behavior where history matters.

# 11. Roles and Permissions

| Capability | Workspace Admin | Team Lead | Member |
| --- | --- | --- | --- |
| Manage workspace settings and members | Yes | No | No |
| Create/manage teams | Yes | Limited / assigned teams | No |
| Create objectives | Yes | Yes | Yes, if permitted |
| Edit any workspace objective | Yes | Assigned teams | Own / permitted |
| Create and manage tasks | Yes | Yes | Yes |
| Assign tasks to members | Yes | Team members | Limited by workspace policy |
| View workspace dashboards | Yes | Team scope | Personal / permitted scope |

Permission decisions must be enforced on the server, not only by hiding frontend controls.

# 12. UX and UI Requirements

- Responsive web interface with desktop-first productivity layouts and usable tablet/mobile views.

- Persistent workspace switcher, primary navigation, global create action, and user menu.

- Consistent loading, empty, error, success, and permission-denied states.

- Keyboard-accessible forms, dialogs, menus, and Kanban interactions.

- Use clear progress labels and avoid communicating false precision.

- Provide contextual links between objective, key result, initiative, and task detail pages.

- Keep task creation fast: title, status, priority, assignee, due date, and optional initiative.

# 13. Technical Requirements and Architecture

| Layer | MVP choice | Responsibilities |
| --- | --- | --- |
| Frontend | Angular 21 + TypeScript | Standalone feature components, routing, forms, API services, signals/state, responsive UI. |
| UI components | PrimeNG + Tailwind CSS | Accessible component primitives and consistent styling. |
| Backend | Django + Django REST Framework | Domain models, validation, business logic, permissions, REST APIs. |
| Authentication | JWT access/refresh | Secure authentication, token rotation/expiry, logout/session handling. |
| Database | PostgreSQL | Relational data, constraints, indexes, transactions, tenant ownership. |
| API documentation | drf-spectacular / OpenAPI | Discoverable API contracts and frontend integration. |
| Testing | Django tests + Angular test tooling | Unit, API, component, permission, and end-to-end critical-flow tests. |
| Deployment | Docker optional; AWS/Nginx later | Repeatable environments, HTTPS, backups, logs, deployment configuration. |

## 13.1 Suggested Django apps

- accounts – custom user, authentication, profile.

- workspaces – workspace, membership, teams, roles.

- okrs – objectives, key results, periods, check-ins.

- initiatives – initiatives and their key-result relationships.

- tasks – tasks, subtasks, labels, comments, daily plan.

- dashboard – aggregated read endpoints and reporting.

- activity – activity log and basic notifications.

## 13.2 API conventions

- Use versioned REST endpoints, e.g. /api/v1/workspaces/ and /api/v1/tasks/.

- Use consistent pagination, filtering, sorting, validation errors, and response formats.

- Resolve active workspace explicitly and verify membership for every request.

- Use transactions for multi-record operations and prevent cross-workspace object references.

- Generate and maintain OpenAPI documentation.

# 14. Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| Security | HTTPS in production; secure password hashing; JWT expiry/rotation; server-side authorization; protection against IDOR and cross-tenant access. |
| Privacy | Collect only necessary personal data; provide account/workspace deletion process; define retention for logs and deleted records. |
| Performance | Target common list/detail API responses under 500 ms at pilot scale, excluding network latency and heavy analytics. |
| Reliability | Automated database backups before production launch; documented restore procedure. |
| Scalability | Start as a modular monolith; index workspace_id, assignee, status, due_date, and common foreign keys. |
| Accessibility | Aim for WCAG 2.1 AA for core flows; keyboard navigation, labels, contrast, and focus states. |
| Observability | Structured application logs, error reporting, health endpoint, and basic uptime monitoring. |
| Compatibility | Support current stable Chrome, Edge, Firefox, and Safari versions. |

# 15. MVP Acceptance Criteria

- A new user can register, log in, and create a workspace.

- A workspace admin can invite a member and assign a role.

- A permitted user can create an objective with dates and an owner.

- A user can add measurable key results and record progress check-ins.

- A user can create an initiative under a key result and create tasks under that initiative.

- A user can also create an unlinked task for general work.

- A user can assign a task, set a due date and priority, and move it through the defined statuses.

- A user can view and update tasks in list and Kanban views.

- My Day distinguishes planned tasks, due-today tasks, and overdue tasks.

- Dashboard metrics match backend calculations and respect user permissions.

- A user from one workspace cannot access another workspace's records by changing IDs or API parameters.

- Core workflows have automated tests and API documentation.

# 16. Delivery Plan and Milestones

| Milestone | Scope | Exit criteria |
| --- | --- | --- |
| M1 – Foundation | Repo setup, environments, custom user, auth, workspace, membership. | User can authenticate and create/switch workspace. |
| M2 – OKRs | Objectives, key results, progress rules, check-ins. | End-to-end objective and key-result workflow works. |
| M3 – Execution | Initiatives, tasks, subtasks, statuses, assignments, filters. | Users can manage work and link it to outcomes. |
| M4 – Daily workflow | My Day, daily plan, list/Kanban views. | Users can plan and complete daily work. |
| M5 – Visibility | Dashboard, comments, activity, basic notifications. | Managers and members see appropriate progress. |
| M6 – Pilot launch | Security review, tests, deployment, onboarding feedback. | Pilot users can use the product reliably. |

A six-week schedule may be used as an initial planning assumption, but the release should be milestone/acceptance-driven rather than date-driven.

# 17. Risks, Assumptions and Open Decisions

## 17.1 Risks

- Scope creep from attempting to match every feature in mature products such as ClickUp.

- Incorrect tenant isolation could expose one customer's data to another.

- Ambiguous OKR progress calculations could undermine user trust.

- Too many configuration options could make onboarding difficult.

- Task completion may be mistaken for measurable outcome progress.

## 17.2 Assumptions

- The first release is a responsive web application, not a native mobile app.

- The product supports both personal and organization workspaces.

- A user can belong to multiple workspaces.

- The initial objective hierarchy supports company/team/individual ownership, with alignment represented through explicit relationships and workspace/team scope.

- The initial release uses a modular Django monolith and a relational PostgreSQL database.

## 17.3 Decisions to confirm before implementation

| Decision | Recommended MVP default |
| --- | --- |
| Product name | Infraon Flow is a working name only. |
| Workspace types | Personal and organization. |
| Objective alignment | Company/team/individual ownership with explicit parent alignment where required. |
| Key-result metric types | Increasing, decreasing, binary/milestone. |
| Daily planning | Separate daily plan date from task due date. |
| Notifications | In-app basics first; email reminders later. |
| Billing | Defer until pilot validation; keep workspace plan field extensible. |

# 18. Recommended Build Sequence

1. Approve this PRD and lock MVP scope.

1. Create the entity relationship diagram and confirm relationship cardinality.

1. Define Django models, custom user model, workspace scoping, and permission tests.

1. Define API contracts and OpenAPI documentation.

1. Build Angular app shell, routing, authentication, and workspace switcher.

1. Implement OKRs and check-ins end to end.

1. Implement initiatives, tasks, My Day, and task views.

1. Add dashboard metrics, activity, testing, and pilot deployment.

# Appendix A – Glossary

| Term | Meaning |
| --- | --- |
| Objective | A qualitative statement describing an outcome to achieve. |
| Key Result | A measurable indicator that shows whether an objective is being achieved. |
| Initiative | A project or body of work intended to influence a key result. |
| Task | A discrete action assigned to a person, with status and optional due date. |
| Daily plan | A user's selected set of tasks for a particular date; distinct from task due dates. |
| Check-in | A dated update to a key result's value, confidence, and narrative progress. |
| Workspace | A personal or organizational tenant boundary for users and business data. |
