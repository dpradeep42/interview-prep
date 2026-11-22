## Shared story details used across many answers (added Nov 2026)

These are assumed or invented so the answers hang together. Change them here and in the answers if your real project differs.

**Front end: Angular to React**
- The IRT web UI started on Angular and is moving to React with TypeScript, module by module (no big-bang rewrite, because re-validation in a GxP product is costly).
- Today both run side by side: older screens in Angular, new modules in React + TypeScript. Both are component-based and call the same .NET Web APIs.
- A thin web shell owns login, top navigation and routes; each module (Angular or React) is mounted under its own route. One SSO session.
- One design system: shared design tokens (CSS variables) for colours, spacing and fonts; common components have one written behaviour spec, built in React first, Angular follows.
- TypeScript types for both front ends are generated from the same OpenAPI documents.
- Reasons for React: team and hiring skills, lightweight libraries (React Query, React Hook Form, Redux Toolkit), older Angular code on an older version with NgModules that needed redesign anyway.
- Your part: typed API client (token, correlation id, ProblemDetails mapping), reusable React components (configurable data table, import error grid), short guidelines on typing, hooks and testing; you keep maintaining Angular modules (the ~40-link tabnabbing fix covered both).
- Woven into: Tell me about yourself, Walk me through your resume, Explain IRT to a non-technical person, Your role, Architecture, Front-end work, Backend vs frontend split, Full-stack, Angular vs React, Why React over Angular, Production-ready API, Platform design, Technology choice.

**IRT domain**
- Client-facing modules: Screening, Randomisation, Re-randomisation, eConsent, DARM (Drug Accountability and Return Management); internal Admin console builds and configures studies.
- Assumed module split: Screening and Randomisation screens are older Angular; eConsent and DARM screens are newer React modules.
- Admin console flow: create, configure, validate (config checks + UAT), transfer to production (protected by the study-transfer guard), go live. The CSV site import is described as part of study setup in the Admin console.
- Screening details entered (date of birth, gender, consent date) are typical examples, not confirmed for your product.
- Backend: same as the existing architecture answer (ASP.NET Core microservices on AWS ECS, SQL Server on RDS, Kafka for events, RabbitMQ work queues, outbox, SFTP vendor integrations).
- The one-sentence "what a study is" definition was added to answers that talk about studies (CSV import, study-transfer guard, randomisation design, IRT meaning, security, integrations, platform design and others).

**On-premise Azure DevOps and AWS (CIRT story)**
- Real (from you): the product began as CIRT (Cenduit IRT); IQVIA acquired Cenduit; IQVIA standardises on AWS; you still use both on-premise Azure DevOps Server / TFS (variable groups, build and release pipelines) and AWS.
- Invented phases: (1) before you joined, TFS upgraded to Azure DevOps Server (still on-premise) and TFVC moved to Git with YAML builds; (2) from about 2022, new .NET services built on AWS (ECS, RDS, Secrets Manager, Parameter Store, Terraform) but still built and released from the same on-premise Azure DevOps Server; (3) older workloads moving lowest-risk first: lower environments (FV, TechOps) before UAT and production.
- Still on-premise today (invented specifics): the Azure DevOps Server with its repos, pipelines, variable groups and approval history (kept because it is validation evidence); parts of the validated core CIRT environments (multi-node installs on 4 to 6 nodes); some older WCF integrations.
- Agents that deploy to AWS run on EC2 in your AWS account, registered with the on-premise server, and use IAM roles; on-premise agents install the core.
- Releases have not moved to CodePipeline; you deploy to AWS from Azure DevOps.
- Why the MCP server: AI assistants (Copilot, Cursor) and ready-made integrations target cloud Azure DevOps Services and could not reach the on-premise server (older API versions, inside the company network); the server runs locally inside the network.
- Migration STAR: the existing UAT "missing setting" incident (about 8% errors, rolled back in 15 minutes) is now explained as config drift between variable groups and Parameter Store; fixes: ValidateOnStart, a per-service configuration manifest, and a configuration parity check tool in the CIRT MCP server; no configuration-related release failures since.
- Woven into: Tell me about yourself, Walk me through your resume, MCP server (why), Most challenging project, Azure DevOps pipeline and release flow, YAML vs classic, Explain your AWS architecture, Why AWS, Deploy to AWS from Azure DevOps, Multi-node deployments, How MCP interacts with Azure DevOps.

**AWS experience and AlertWatchDog**
- AlertWatchDog is not on the resume, the question list or earlier answers, so the whole story is invented (the resume does list Microsoft Azure: App Service, Azure OpenAI). Change anything that differs from the real tool.
- Invented: a C# Azure Functions app (.NET isolated worker) on a Premium plan with network integration; a timer trigger every 5 minutes runs checks (scheduled job success windows, vendor SFTP file arrival, RabbitMQ queue depth and dead letters, health endpoints, failed Azure DevOps releases); findings go to a storage queue; a queue-triggered rules function (thresholds, dedupe, 30-minute suppression); a Durable Functions escalation (notify Teams and email, wait 15 minutes for an ack, then escalate to on-call); managed identity and Key Vault; it alerts on its own silence through Application Insights; read-only and outside the validated product, so no GxP re-validation; background failures detected in minutes instead of hours.
- STAR (invented): early 2025, Saturday; a depot vendor's shipment-status file was missing for its 2-hour window because the vendor moved the folder during maintenance; fixed by changing configuration in about 2 hours, before Monday, with no stale data at sites; an empty-folder check was added afterwards.
- AWS self-rating: about 7 out of 10 (around 8 for application workloads, 5 to 6 for the account-level platform); mentions you would happily take the AWS Developer Associate certification.
- AlertWatchDog was woven into: Tell me about yourself, CloudWatch and Grafana, Monitoring microservices, What makes a good alert, CloudWatch alarms, the Azure-to-AWS mapping overview, and App Insights vs CloudWatch.

