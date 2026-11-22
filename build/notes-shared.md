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

