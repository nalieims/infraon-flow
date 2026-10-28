INFRAON FLOW

System Design &
Architecture Document

OKR Management + Daily Work Execution Platform

INTERNAL ENGINEERING DOCUMENT

| Field | Value |
| --- | --- |
| Version / status | 1.0 / Draft for engineering review |
| Date | 19 October 2026 |
| Related document | Infraon Flow Product Requirements Document v1.0 |
| Frontend | Angular 21, TypeScript, PrimeNG, Tailwind CSS |
| Backend | Python, Django, Django REST Framework |
| Database | PostgreSQL |
| Authentication | JWT access and refresh tokens |
| Hosting direction | AWS EC2 + Nginx; managed PostgreSQL recommended for production |

Confidentiality: Internal product and engineering planning document. This is a proposed architecture, not a statement that all infrastructure is already deployed.

# Document control

| Version | Date | Status | Change |
| --- | --- | --- | --- |
| 1.0 | 19 Oct 2026 | Draft | Initial architecture aligned with Infraon Flow PRD v1.0 |

The PRD defines what Infraon Flow must do. This document proposes how the MVP should be built and operated. Recommendations and assumptions must be reviewed before they become implementation policy.

# Contents

- 1. Executive summary

- 2. Goals and constraints

- 3. System context

- 4. Logical architecture

- 5. Frontend architecture

- 6. Backend architecture

- 7. Data architecture

- 8. API design

- 9. Authentication and tenancy

- 10. Core workflows and business rules

- 11. Consistency and background work

- 12. Security and privacy

- 13. Deployment

- 14. Observability

- 15. Testing

- 16. Performance

- 17. Alternatives

- 18. Implementation sequence

- 19. Risks and open decisions

- Appendices

# 1. Executive summary

Infraon Flow is a multi-tenant SaaS web application connecting personal and organizational objectives, measurable key results, initiatives and daily task execution. The MVP combines an OKR workflow with task management and daily planning.

Recommended implementation: Angular 21 SPA consuming versioned Django REST Framework APIs, backed by PostgreSQL. Run Django under Gunicorn behind Nginx. Nginx terminates HTTPS, serves compiled frontend assets and reverse-proxies API requests. AWS EC2 is the initial application hosting direction; Amazon RDS PostgreSQL is preferred for staging and production.

The architecture deliberately avoids microservices, Kubernetes, Redis, distributed queues and complex workflow engines in the MVP. The first priority is correctness: workspace isolation, permissions, trustworthy OKR calculations, clear domain boundaries and reliable task workflows.

## 1.1 Architecture decisions

| Area | MVP recommendation | Reason |
| --- | --- | --- |
| Application shape | Modular Django monolith | Simple deployment and transactions with clear domain boundaries. |
| Frontend | Angular 21 SPA | Standalone components, Router, Signals and typed API services. |
| Backend | Django + DRF | Relational modeling, serializers, permissions and admin tooling. |
| Database | PostgreSQL | Transactions, constraints, integrity and reporting. |
| API | Versioned REST / JSON | Browser integration and OpenAPI contract. |
| Authentication | JWT access + rotating refresh | Short-lived API credentials and controlled refresh. |
| Tenant model | Workspace-scoped shared database | Users can belong to multiple workspaces. |
| Hosting | AWS EC2 + Nginx; RDS preferred | Practical app hosting with managed database. |

## 1.2 Architecture invariants

- Every workspace request authorizes an active membership.

- Workspace boundaries are enforced in backend querysets, services and relationships—not frontend filtering.

- A task may exist without an initiative; operational work is valid.

- Completing a task never silently changes a key result's measured value.

- Key-result progress is calculated by backend business rules.

- Domain rules belong in backend logic, not duplicated independently in the UI.

# 2. Goals, non-goals and constraints

| Goals | Non-goals for MVP |
| --- | --- |
| Personal and organization workspaces; multi-workspace membership. | Microservices, Kubernetes or multi-region active-active. |
| Company/team/individual objective ownership and alignment. | AI-generated OKRs, AI task planning or AI coaching. |
| Measurable key results and timestamped check-ins. | Chat, video, wiki/document editor or social feed. |
| Initiatives, tasks, subtasks, My Day and list/Kanban. | Gantt, capacity planning, timesheets, billing or advanced automation. |
| Role permissions and tenant isolation. | Native mobile apps, enterprise SSO or complex custom roles. |
| Dashboards, basic activity and in-app notifications. | Deep third-party integrations in initial release. |

The first release targets a small pilot, not high-volume enterprise traffic. The PRD target of common list/detail API responses under 500 ms at pilot scale is an initial engineering objective, not a production SLO. The web application is responsive and desktop-first, supports current stable major browsers, and aims for WCAG 2.1 AA on core workflows. Production requires HTTPS, automated database backups and a documented restore procedure.

# 3. System context and boundaries

| Boundary | Responsibilities | Must not be trusted for |
| --- | --- | --- |
| Browser / Angular | Screens, forms, UI state and API calls. | Authorization, tenant filtering or authoritative progress. |
| Nginx / edge | TLS, static assets, reverse proxy, request limits and headers. | Business permissions or domain validation. |
| Django / DRF | Authentication, authorization, validation, domain logic, transactions and APIs. | Client-supplied workspace/object links without validation. |
| PostgreSQL | Durable state, constraints, indexes and transactions. | Application role policy alone. |
| External providers (later) | Email, object storage and integrations through adapters. | Direct database credentials. |

## 3.1 Core hierarchy

Workspace → Objective → Key Result → Initiative → Task → Subtask

An objective may align to a parent objective in the same workspace. A key result belongs to an objective. An initiative belongs to a key result in the initial model. A task may optionally belong to an initiative. A task without an initiative is valid. Subtasks are child Task records using parent_task_id.

## 3.2 Main actors

| Actor | Primary scope |
| --- | --- |
| Individual contributor | Own/assigned tasks, personal OKRs, My Day and permitted team work. |
| Team lead | Assigned team objectives, team tasks, initiative coordination and blockers. |
| Workspace admin | Workspace settings, members, roles, teams and workspace administration. |
| Independent professional | Personal workspace, objectives, key results, tasks and reviews. |

# 4. Logical architecture

USER BROWSER
 Angular 21 SPA | PrimeNG | Tailwind | Signals
             │ HTTPS
             ▼
NGINX / EDGE
 TLS termination | static assets | /api reverse proxy
             │ /api/v1
             ▼
DJANGO REST API (Gunicorn)
 Accounts | Workspaces | OKRs | Initiatives | Tasks | Activity | Dashboard
             │ SQL
             ▼
POSTGRESQL
 Durable records | constraints | indexes | transactions

Cross-cutting: CI/CD • secrets • structured logs • metrics • health checks • backups

Figure 1. Logical production architecture. Optional later components include private S3 object storage for exports/attachments and an email provider adapter.

| Component | Responsibility | Failure behavior |
| --- | --- | --- |
| Angular SPA | Navigation, feature screens, forms, Signals state and API calls. | Show useful error state; retain safe unsaved input where practical. |
| Nginx | HTTPS, static files, API reverse proxy and security headers. | Controlled 4xx/5xx; do not expose upstream internals. |
| Django REST API | REST endpoints, serializers, auth, permissions and orchestration. | Structured errors; rollback failed writes. |
| Domain modules | Workspace, OKR, initiative, task, dashboard and activity rules. | Reject invalid transitions and cross-workspace relationships. |
| PostgreSQL | Durable source of truth, constraints, transactions and indexes. | Fail writes safely; recover from verified backups. |
| Observability | Structured logs, metrics, health checks and alerts. | Alert on sustained failures; never log secrets. |

Recommended pilot topology: EC2 application instances, Nginx serving Angular build and proxying /api/ to Gunicorn/Django. PostgreSQL should preferably run on Amazon RDS in private networking. A database on the same EC2 host is a temporary development-only compromise.

Keep one deployable backend for the MVP. Extract services only when independent scaling, ownership or availability requirements justify the cost.

# 5. Frontend architecture

| Area | Responsibilities |
| --- | --- |
| Core | Authentication/session, HTTP interceptors, workspace context, route guards, global errors and app shell. |
| Shared | Reusable UI, pipes, directives, form controls, loading/empty/error states and design tokens. |
| Dashboard | Workspace summary, OKR progress, overdue tasks and completion summaries. |
| OKRs | Objective list/detail, key-result editing, alignment and check-in forms. |
| Initiatives | Initiative list/detail, ownership, dates, status and linked tasks. |
| Tasks | Task list, Kanban, detail, subtasks, comments, filters and actions. |
| My Day | Daily plan, due today, overdue and planned task sections. |
| Teams / Settings | Team management, members, roles and profile/workspace preferences. |

## 5.1 Frontend conventions

- Use standalone components and lazy-loaded feature routes.

- Use Angular Signals for local and feature-level UI state; defer global state framework until justified.

- Use typed API DTOs and generate or validate them against OpenAPI where practical.

- Centralize token attachment, refresh coordination, correlation IDs and error normalization in HTTP interceptors.

- Use reactive forms for complex forms; backend validation remains authoritative.

- Use PrimeNG for accessible components and Tailwind for layout with clear CSS ownership.

- Route guards improve navigation but are not an authorization boundary.

- Do not store long-lived secrets in localStorage. Prefer HttpOnly, Secure, SameSite refresh cookie where feasible.

## 5.2 Request lifecycle

1. App shell checks session state.

1. Workspace context is resolved and sent with requests (recommended X-Workspace-ID header).

1. Interceptor attaches short-lived access token and request ID.

1. Feature service calls versioned API and maps DTOs to view models.

1. Component updates Signals and renders loading, success, empty or error state.

1. A 401 triggers one coordinated refresh attempt; failed refresh clears session.

# 6. Backend architecture

| Django app | Owns | Responsibilities |
| --- | --- | --- |
| accounts | User, profile and authentication | Custom user, login/refresh/logout, profile and password reset. |
| workspaces | Workspace, membership, team and role | Lifecycle, invitations, active membership and tenant context. |
| okrs | Objective, KeyResult, CheckIn and period | Alignment, metric definitions, progress and check-in history. |
| initiatives | Initiative | Key-result association, owner, dates and lifecycle. |
| tasks | Task, label, daily plan and comment | Task lifecycle, subtasks, assignment, filters and My Day. |
| activity | ActivityLog and Notification | Business events and in-app notifications. |
| dashboard | Read-only aggregation | Workspace and personal dashboard summaries. |

## 6.1 Backend layering

| Layer | Belongs here | Avoid |
| --- | --- | --- |
| API / views | HTTP method, serializer, status, pagination and permission entry point. | Large business rules in view methods. |
| Serializers | Input validation and API representation. | Cross-domain orchestration. |
| Selectors | Workspace-scoped reads and aggregations. | Unscoped convenience querysets. |
| Domain services | Transactional workflows, progress and state transitions. | HTTP response construction. |
| Models | Entity fields, local invariants and relationships. | Complex multi-domain orchestration. |
| Permissions | Workspace role and object-scope checks. | Frontend-only permission assumptions. |

create_objective(workspace, actor, validated_data)
record_key_result_checkin(workspace, actor, key_result_id, measured_value, note)
create_task(workspace, actor, assignee_id, initiative_id=None, parent_task_id=None)
move_task_status(workspace, actor, task_id, new_status)
get_dashboard_summary(workspace, actor, date_range)

Every service must verify membership, object scope and role permissions, even if its caller already performed checks. Django Admin is an internal staff tool, not the primary customer workflow; restrict it and use workspace-aware querysets.

# 7. Data architecture

PostgreSQL is the source of truth. Use UUID primary keys for externally exposed entities, UTC timestamps for persisted event times, explicit date fields for business dates, and created_at/updated_at on mutable records. Use database constraints for uniqueness and referential integrity.

## 7.1 Conceptual entity relationships

User 1—N WorkspaceMembership N—1 Workspace
Workspace 1—N Team / Objective / Task
Objective 1—N KeyResult; Objective 0..1—1 parent Objective
KeyResult 1—N Initiative; KeyResult 1—N CheckIn
Initiative 0..1—N Task; Task 0..1—N child Task
UserMembership 1—N DailyPlanItem; Task 1—N DailyPlanItem

| Entity | Key fields / relationships | Design notes |
| --- | --- | --- |
| User | id, email, password_hash, display_name, is_active, timezone | Custom Django user model from first migration. |
| Workspace | id, name, slug, type, timezone, created_by_id | type = personal or organization. |
| WorkspaceMembership | workspace_id, user_id, role, status, joined_at | Unique(workspace_id, user_id); admin/team_lead/member. |
| Team | id, workspace_id, name, description, lead_membership_id | Unique name/slug within workspace. |
| TeamMembership | team_id, workspace_membership_id, role | Team and membership must share workspace. |
| Objective | workspace_id, parent_objective_id, team_id, owner_membership_id, period_id, title, status, dates | Optional parent/team; same-workspace validation. |
| KeyResult | workspace_id, objective_id, owner_membership_id, metric_type, direction, unit, start/current/target | Decimal precision; explicit binary/milestone semantics. |
| Initiative | workspace_id, key_result_id, owner_membership_id, title, status, dates | One key result association in initial model. |
| Task | workspace_id, initiative_id nullable, parent_task_id nullable, creator/assignee membership, title, status, priority, due_at | Unlinked tasks valid; subtasks are child Task rows. |
| DailyPlanItem | workspace_id, user_membership_id, task_id, planned_for, position | Unique(user, task, date); due date independent. |
| CheckIn | workspace_id, key_result_id, author_membership_id, measured_value, confidence, note, blockers, next_steps | Prefer append-only progress history. |
| Comment | workspace_id, task_id, author_membership_id, body, timestamps | Workspace-scoped and permission-checked. |
| ActivityLog | workspace_id, actor_membership_id, object_type/id, event_type, metadata, created_at | Allowlisted metadata; no secrets. |
| Notification | workspace_id, recipient_membership_id, type, payload, read_at, created_at | Basic in-app notifications. |

## 7.2 Tenant-safe relational rules

- A user may belong to many workspaces through WorkspaceMembership.

- A workspace owns its teams, objectives, key results, initiatives, tasks and activity records.

- Parent objectives, teams, key results, initiatives, assignees and parent tasks must belong to the same workspace as the record being changed.

- Include workspace_id directly on workspace-owned models where it improves safe filtering; validate it against parent relationships.

- Use database constraints where feasible and service validation with tests otherwise.

## 7.3 Indexes and constraints

| Index / constraint | Purpose |
| --- | --- |
| Unique(workspace_id, user_id) on membership | Prevent duplicate membership. |
| Index task(workspace_id, status, due_at) | Task board, due and overdue queries. |
| Index task(workspace_id, assignee_membership_id, status) | My Tasks and team views. |
| Index objective(workspace_id, period_id, status) | OKR period/status filtering. |
| Index key_result(objective_id); initiative(key_result_id) | OKR detail navigation. |
| Unique(user_membership_id, task_id, planned_for) | Prevent duplicate daily plan item. |
| Foreign keys and check constraints | Protect required references and valid ranges. |

Prefer archive/soft-delete for objectives, initiatives and tasks where history matters. Define workspace/user deletion and log retention before production; do not cascade-delete check-in or activity history without explicit policy.

# 8. API design and contracts

- Base path /api/v1/; JSON bodies; plural resource names and UUID identifiers.

- Use consistent pagination, filtering, sorting and validation errors.

- Recommended workspace context: X-Workspace-ID, validated against active membership.

- Use ISO 8601 timestamps with offsets; persist timestamps in UTC.

- Publish OpenAPI using drf-spectacular; update schema and tests with every behavior change.

- Prefer additive optional fields; breaking changes require coordinated versioning.

| Domain | Example endpoints | Purpose |
| --- | --- | --- |
| Auth | POST /auth/register, /auth/login, /auth/refresh, /auth/logout | Session lifecycle. |
| Workspaces | GET/POST /workspaces; POST /workspaces/{id}/members | Workspace and membership. |
| Teams | GET/POST /teams; POST /teams/{id}/members | Team setup. |
| Objectives | GET/POST /objectives; GET/PATCH /objectives/{id} | Objective lifecycle. |
| Key results | GET/POST /objectives/{id}/key-results; PATCH /key-results/{id} | Metric definition/value. |
| Check-ins | GET/POST /key-results/{id}/check-ins | Progress history. |
| Initiatives | GET/POST /initiatives; GET/PATCH /initiatives/{id} | Initiative lifecycle. |
| Tasks | GET/POST /tasks; GET/PATCH /tasks/{id}; POST /tasks/{id}/status | Task lifecycle. |
| My Day | GET /my-day?date=YYYY-MM-DD; POST /my-day/items | Daily planning. |
| Dashboard | GET /dashboard/summary | Role-filtered summary. |
| Activity | GET /activity; GET /notifications; POST /notifications/{id}/read | Activity and alerts. |

## 8.1 Example create-task contract

POST /api/v1/tasks/
Authorization: Bearer <access-token>
X-Workspace-ID: <workspace-uuid>
{
  "title": "Prepare weekly service review",
  "status": "todo", "priority": "medium",
  "assignee_id": "<membership-uuid>",
  "due_at": "2026-10-23T12:00:00Z",
  "initiative_id": null, "parent_task_id": null
}

201 Created
{ "id": "<task-uuid>", "workspace_id": "<workspace-uuid>",
  "title": "Prepare weekly service review", "status": "todo",
  "priority": "medium", "initiative_id": null }

## 8.2 Error contract

{"error":{"code":"permission_denied","message":"You do not have permission.","details":{},"request_id":"correlation-id"}}

| HTTP | Meaning |
| --- | --- |
| 400 | Malformed request or validation failure. |
| 401 | Missing, invalid or expired authentication. |
| 403 | Authenticated user lacks required role/action. |
| 404 | Resource unavailable in active workspace; avoid confirming cross-tenant existence. |
| 409 | Conflicting transition or uniqueness conflict. |
| 500 | Unexpected error; generic client message and logged request ID. |

# 9. Authentication, authorization and tenancy

## 9.1 Authentication lifecycle

1. User registers or signs in over HTTPS; password verification uses Django supported hashing.

1. Backend issues short-lived access token and refresh token.

1. Access token accompanies API requests; refresh token uses secure storage, preferably HttpOnly Secure SameSite cookie where feasible.

1. Refresh rotation issues a new refresh token and invalidates the previous token; detect reuse where supported.

1. Logout revokes/blacklists refresh token or session family.

1. Password reset uses time-limited single-use token and does not reveal whether an email exists.

Select a maintained JWT package compatible with the chosen Django version (for example, Simple JWT after compatibility review). Configure lifetimes, rotation, blacklist behavior, signing-key management and clock skew explicitly.

## 9.2 MVP role model

| Role | Workspace settings / members | Team management | Objectives / tasks |
| --- | --- | --- | --- |
| Workspace Admin | Full administration | All teams | Workspace-wide management within product rules. |
| Team Lead | No workspace settings by default | Assigned teams | Assigned team objectives and coordinated tasks. |
| Member | No workspace settings | No team administration by default | Own/permitted objectives and tasks. |

## 9.3 Mandatory tenant enforcement

- Resolve workspace and verify active membership before workspace-scoped queries.

- Use workspace-scoped selectors/querysets by default; avoid unscoped object lookup in request paths.

- Validate every foreign key (assignee, team, objective, key result, initiative, parent task) against same workspace.

- Apply object permissions after workspace scoping.

- Never trust client workspace_id, role, owner_id or assignee_id without policy checks.

- Return safe 404 for out-of-scope objects when existence disclosure is a risk.

- Add cross-tenant tests for every major resource and nested endpoint.

request → validate JWT → resolve workspace → verify membership
→ scope queryset → check role/object permission → validate related IDs
→ execute domain service → respond

# 10. Core workflows and business rules

## 10.1 Create an objective

1. Client submits title, period, owner and optional parent objective/team.

1. API authenticates actor and resolves workspace membership.

1. Serializer validates required fields and date range.

1. Service validates owner, team and parent objective are in same workspace and actor may create.

1. Transaction creates objective and activity event; API returns objective DTO.

## 10.2 Record key-result check-in

1. Client submits measured value, confidence, narrative, blockers and next steps.

1. API verifies membership and permission.

1. Service safely updates key-result row in a transaction to prevent lost updates.

1. Service creates CheckIn history and updates current measured value.

1. Backend calculates progress using metric type/direction; activity event is recorded.

## 10.3 Create and complete a task

1. Client submits title, status, priority, assignee, due date and optional initiative/parent task.

1. API verifies assignee, initiative and parent task belong to same workspace.

1. Service creates task and activity event in one transaction.

1. Status updates validate allowed transitions and actor permissions.

1. Completing the task updates task state/activity only; it does not alter key-result values.

## 10.4 My Day semantics

My Day is a date-specific plan, not a due-date editor. Return distinct groups: planned_for_selected_date, due_on_selected_date and overdue_as_of_selected_date. A task may appear in multiple groups; label them clearly and avoid misleading duplicate counts. Adding a task creates DailyPlanItem and must not mutate due_at.

## 10.5 Dashboard

Dashboard endpoints are read-only and permission-filtered. Start with indexed PostgreSQL queries and bounded aggregation. Define time zone, date range, archived-record treatment and role scope for every metric.

## 10.6 Progress formulas

Increasing metric: ((current - start) / (target - start)) × 100
Decreasing metric: reverse direction for the metric
Objective progress: unweighted average of active key-result progress
Daily completion: completed tasks in selected daily plan / total plan items × 100

Clamp displayed progress to 0–100% by default while retaining raw values. Reject target equal to start for linear metrics. Binary/milestone metrics need explicit completion semantics. Define rounding consistently. Task completion is not a proxy for outcome progress.

# 11. Consistency and background work

| Operation | Expected guarantee |
| --- | --- |
| Objective + activity | Commit both or neither. |
| Check-in + current value + activity | Commit atomically; prevent lost updates. |
| Task + activity | Commit atomically. |
| Invite member | Persist invitation state transactionally; email can be asynchronous later. |
| Mark notification read | Idempotent update; repeated request remains safe. |

- Use unique constraints for membership and daily-plan duplicates.

- Use atomic transactions and select_for_update where concurrent updates could overwrite state.

- Consider Idempotency-Key for retry-prone create operations with external side effects.

- Use optimistic concurrency where silent edits are unacceptable.

- Do not assume browser retries are harmless for non-idempotent POST requests.

No task queue is required initially if email/push delivery and scheduled reminders remain deferred. Persist basic in-app notification records with the triggering action where feasible. If invitations, reminders, exports or recurring jobs become necessary, introduce Celery with Redis or a managed queue as a separate decision. Consider an outbox pattern when reliable event delivery becomes important.

# 12. Security and privacy

| Area | Required controls |
| --- | --- |
| Transport | HTTPS only; HTTP redirect; secure cookies; HSTS after TLS verified. |
| Passwords | Django password hashing; rate-limit authentication attempts. |
| Tokens / secrets | Keep signing keys and credentials outside source control; AWS Secrets Manager or SSM. |
| Authorization | Enforce membership, role and object permissions in backend APIs and services. |
| Tenant isolation | Scope querysets, validate related IDs, test IDOR/cross-tenant access. |
| Input validation | Validate length, type, ranges, dates, enums and rich text/HTML handling. |
| Browser security | CSP, X-Content-Type-Options, Referrer-Policy, frame restrictions and narrow CORS. |
| Data minimization | Collect necessary data; avoid sensitive content in logs/activity metadata. |
| Auditability | Record important changes and actor identity; restrict operational log access. |
| Backups | Encrypt backups, restrict access, test restores and define retention. |

## 12.1 Security test cases

- Workspace A member tries to read/update Workspace B task by changing UUID.

- User supplies assignee UUID from another workspace.

- User creates initiative referencing another workspace key result.

- Team lead edits objective outside assigned team scope.

- Expired access token, refresh rotation and logout behave correctly.

- Oversized payload, invalid enum, malformed date and unsafe text are rejected.

# 13. Deployment and infrastructure

| Environment | Purpose | Data/access |
| --- | --- | --- |
| Local | Daily development and tests. | Local PostgreSQL; synthetic data. |
| Development / integration | Shared API integration and QA. | Non-production DB; restricted team access. |
| Staging / pilot | Production-like release verification. | Isolated data; controlled pilot access. |
| Production | Customer workspaces and business data. | Private DB networking, least privilege, backups and monitoring. |

## 13.1 Production request path

Browser
  └─ HTTPS → Nginx / edge
       ├─ /           → Angular compiled static assets
       └─ /api/v1/*   → Gunicorn → Django REST Framework
                                   └─ private network → PostgreSQL (RDS preferred)

| Component | Recommended setup | Notes |
| --- | --- | --- |
| EC2 app host | Linux, Nginx, Gunicorn, Django runtime and Angular build. | systemd/process supervisor; unprivileged app process. |
| PostgreSQL | Amazon RDS PostgreSQL preferred. | Private subnet/security group; automated encrypted backups. |
| Static assets | Nginx initially; S3 + CloudFront later if useful. | Cache hashed assets; do not cache authenticated APIs. |
| TLS | ACM with ALB/CloudFront or approved Nginx certificate flow. | Renewal monitoring and HTTPS redirect. |
| Secrets | AWS Secrets Manager / SSM. | IAM role retrieval; rotate credentials. |
| CI/CD | Build, lint, test, migrate, deploy and smoke test. | Staged rollout and rollback. |

## 13.2 Release procedure

1. Build frontend/backend artifacts from tagged commit; run lint, unit, API and security checks.

1. Confirm recent database recovery point and migration compatibility.

1. Apply backward-compatible migrations before code that requires them.

1. Deploy backend/frontend and restart Gunicorn gracefully.

1. Run health checks and critical workflow smoke tests.

1. Monitor errors, latency and DB health; rollback application if gates fail.

1. Use expand-and-contract migrations for multi-release schema changes.

Docker is optional and should not delay domain delivery. Do not run a production database in an ephemeral application container.

# 14. Observability and operations

| Signal | Initial expectation | Response |
| --- | --- | --- |
| Availability | Health endpoint and uptime checks; alert on sustained downtime. | Check edge, process and DB. |
| Latency | Track p50/p95; target common list/detail under 500 ms at pilot scale. | Profile slow queries/serialization. |
| Errors | Separate 4xx from 5xx; alert on sustained 5xx increase. | Correlate request ID and release. |
| Database | Monitor connections, CPU, storage, locks, slow queries and backups. | Capacity and query review. |
| Auth anomalies | Track repeated failures and refresh failures. | Review rate limits/account protection. |
| Tenant denials | Log denied access with actor/workspace/request ID, no payload leakage. | Investigate policy defects. |
| Restore test | Schedule isolated restore verification. | Validate recoverability. |

- Structured JSON logs: timestamp, severity, service, environment, request_id, route, status and duration.

- Never log passwords, JWTs, refresh/reset tokens, secrets or sensitive request bodies.

- Define retention and access policy for application, access and database logs.

RPO and RTO are not yet approved. Before pilot, select recovery objectives, confirm backup configuration, test restore into isolation and document recovery ownership.

# 15. Testing and quality strategy

| Test layer | Coverage |
| --- | --- |
| Backend unit | Progress formulas, transitions, permissions, validators and service rules. |
| Backend API | Authentication, CRUD, filters, pagination, validation and error contract. |
| Tenant isolation | Cross-workspace reads/writes, nested IDs, FK substitution and list filtering. |
| Database | Unique constraints, FKs, check constraints, transactions and concurrency. |
| Frontend unit | Components, Signals, forms, pipes, route behavior and error/loading states. |
| Frontend integration | HTTP services, interceptors, workspace switching and refresh coordination. |
| End-to-end | Register/login, workspace, OKR, initiative, task, My Day and check-in. |
| Accessibility | Keyboard navigation, focus order, labels, contrast and screen-reader semantics. |
| Performance | Task list, dashboard, objective detail and search representative workloads. |

## 15.1 Minimum release gates

- No known critical/high tenant-isolation or authentication defects.

- Core journeys pass automated end-to-end tests.

- OpenAPI schema is current and frontend integration validated.

- Database backup and restore procedure has been exercised.

- Health checks, structured logs and error reporting are operational.

- Responsive and keyboard-accessible behavior verified for core screens.

# 16. Performance and scalability

Optimize measured bottlenecks rather than introducing infrastructure pre-emptively. At pilot scale, a Django application tier and PostgreSQL should be sufficient if queries are workspace-scoped, indexed and paginated.

- Paginate task, activity, member and objective collections; set maximum page size.

- Use select_related and prefetch_related to avoid N+1 queries.

- Index workspace_id with frequent filters such as status, assignee, due date and period.

- Bound dashboard date ranges and aggregation scope; cache only after profiling.

- Avoid large nested serializers that load entire objective/task trees by default.

- Introduce connection pooling, Redis, workers or read replicas only when measured demand justifies them.

- Scale app instances behind a load balancer before considering service decomposition.

# 17. Alternatives and trade-offs

| Alternative | Benefit | Why not selected now |
| --- | --- | --- |
| Microservices | Independent deployment and scaling. | Network failures, distributed transactions and overhead too early. |
| Node.js backend | Shared TypeScript language. | Django/DRF is selected and fits relational workflows/admin. |
| MongoDB | Flexible document structure. | Core domain is relational with membership, constraints and reporting. |
| Database per workspace | Stronger tenant boundary. | Operational/migration complexity not justified for pilot. |
| Redis + Celery immediately | Background jobs and cache. | Email/reminders deferred; add when requirements justify. |
| Global state framework | Centralized client state. | Signals and feature services are adequate initially. |

A modular monolith keeps deployment, transactions and local development simple while preserving domain boundaries. Extract services only when independent scaling, ownership or availability requirements justify the cost.

# 18. Implementation sequence

| Milestone | Scope | Exit criteria |
| --- | --- | --- |
| M1 — Foundation | Repo, environments, custom user, auth, workspace and membership. | User authenticates and switches workspace; tenant tests pass. |
| M2 — OKRs | Objectives, periods, key results, progress rules and check-ins. | End-to-end OKR workflow and progress tests pass. |
| M3 — Execution | Initiatives, tasks, subtasks, status, priority, assignment and filters. | Linked/unlinked tasks work; permissions pass. |
| M4 — Daily workflow | My Day, daily plan, list and Kanban. | Planned/due/overdue semantics correct. |
| M5 — Visibility | Dashboard, comments, activity and in-app notifications. | Role-scoped metrics and activity accurate. |
| M6 — Pilot readiness | Security review, tests, deployment, backups and monitoring. | Pilot gates pass; rollback and restore verified. |

1. Create repos/configuration and establish linting, formatting and test commands.

1. Create custom User model before first production migration.

1. Implement workspace membership and tenant-safe query helpers before domain endpoints.

1. Implement models/migrations in dependency order; tests alongside each domain.

1. Build Angular shell, authentication and workspace switching.

1. Deliver vertical slices: API + UI + permissions + tests.

1. Deploy staging early; validate migration and rollback before pilot.

# 19. Risks, assumptions and open decisions

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Cross-tenant data leakage | Critical trust/privacy failure. | Scoped querysets, same-tenant FK validation and IDOR tests. |
| Ambiguous OKR progress | Loss of reporting trust. | Define metric types, direction, rounding, binary rules and history. |
| Scope expansion | MVP delay and maintenance burden. | Keep roadmap aligned to PRD non-goals. |
| Dashboard query growth | Slow pages. | Index, paginate, profile and bound aggregations. |
| Token handling defects | Account compromise or broken sessions. | Secure cookie strategy, rotation, revocation and tests. |
| Single-host failure | Pilot downtime. | Managed DB, backups, restore test and repeatable deployment. |

## 19.1 Assumptions

- Infraon Flow is an internal product initiative; this document is for internal engineering use.

- MVP supports personal and organization workspaces; users may belong to multiple workspaces.

- Company/team/individual objective alignment uses explicit parent relationships and team association.

- Backend is modular Django monolith; database PostgreSQL; frontend Angular 21 SPA.

- AWS EC2 and Nginx are initial app hosting; managed PostgreSQL is recommended for production.

- Advanced integrations, email/push delivery, AI and background automation are deferred.

## 19.2 Decisions to confirm

| Decision | Recommended default | Owner |
| --- | --- | --- |
| Workspace context | X-Workspace-ID validated on every request. | Backend/API |
| Refresh token storage | HttpOnly Secure SameSite cookie; access token in memory. | Security/backend |
| Objective alignment | Optional parent_objective_id and team_id; same-workspace enforcement. | Product/backend |
| KR metric types | Increasing/decreasing plus binary/milestone with explicit rules. | Product |
| Team lead scope | Assigned teams only; no workspace settings by default. | Product |
| Database hosting | Amazon RDS PostgreSQL for staging/production. | DevOps |
| Attachments | Out of MVP; private S3 signed URLs if later needed. | Product |
| RPO / RTO | Set before pilot. | Product/DevOps |

# 20. Decision and next steps

Recommended decision: approve a modular Django monolith with Angular 21, PostgreSQL and versioned REST APIs as the Infraon Flow MVP baseline. The highest-priority architecture gate is tenant isolation; the highest-priority product logic gate is explicit, trustworthy key-result progress calculation.

Start with custom user, authentication, workspace membership and tenant-safe API foundation before implementing OKR or task features.

| Next step | Deliverable | Exit criteria |
| --- | --- | --- |
| 1. Architecture review | Confirm open decisions in Section 19.2. | Agreement on tenant context, token strategy, objective alignment and KR types. |
| 2. Database design | Detailed ERD and Django model specification. | Entities, constraints, indexes and deletion reviewed. |
| 3. API specification | OpenAPI endpoint contract and error schema. | Frontend/backend agree on DTOs and workspace context. |
| 4. UI architecture | Angular route map, feature folders and wireframes. | Core navigation mapped to API contracts. |
| 5. Foundation build | Auth, workspace, membership and CI pipeline. | Tenant tests pass; staging deployment repeatable. |

# Appendix A. Suggested repository structure

backend/
  config/                 # settings, urls, ASGI/WSGI
  apps/
    accounts/             # user, auth, profile
    workspaces/           # workspace, membership, teams
    okrs/                 # objectives, key results, check-ins
    initiatives/          # initiative domain
    tasks/                # tasks, subtasks, daily plan, comments
    activity/             # activity and notifications
    dashboard/            # read-only aggregates
  common/                 # pagination, exceptions, middleware
  manage.py
  requirements/

frontend/src/app/
  core/                   # auth, interceptors, guards, workspace context
  shared/                 # reusable UI, pipes, directives, controls
  layout/                 # shell, sidebar, topbar, workspace switcher
  features/
    dashboard/ okrs/ initiatives/ tasks/
    my-day/ teams/ settings/
  app.routes.ts

# Appendix B. Initial endpoint inventory

| Method | Path | Notes |
| --- | --- | --- |
| POST | /api/v1/auth/register/ | Create user; verification policy to confirm. |
| POST | /api/v1/auth/login/ | Issue access and refresh credentials. |
| POST | /api/v1/auth/refresh/ | Rotate refresh token and issue access token. |
| POST | /api/v1/auth/logout/ | Revoke refresh token/session. |
| GET / POST | /api/v1/workspaces/ | List accessible workspaces / create workspace. |
| GET / PATCH | /api/v1/workspaces/{id}/ | Read/update workspace settings. |
| GET / POST | /api/v1/objectives/ | List/create objectives in active workspace. |
| GET / PATCH | /api/v1/objectives/{id}/ | Read/update objective. |
| GET / POST | /api/v1/key-results/ | List/create key results. |
| GET / POST | /api/v1/key-results/{id}/check-ins/ | Read/create check-in history. |
| GET / POST | /api/v1/initiatives/ | List/create initiatives. |
| GET / POST | /api/v1/tasks/ | List/create tasks. |
| GET / PATCH | /api/v1/tasks/{id}/ | Read/update task. |
| POST | /api/v1/tasks/{id}/status/ | Validated status transition. |
| GET | /api/v1/my-day/?date=YYYY-MM-DD | Planned, due and overdue groups. |
| POST / DELETE | /api/v1/my-day/items/ | Add/remove task from daily plan. |
| GET | /api/v1/dashboard/summary/ | Role-scoped dashboard. |

End of document. This is a proposed MVP baseline and should be revised through engineering review as implementation evidence and pilot requirements emerge.
