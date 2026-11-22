import { Page, Section, Text, BulletList, Table, Diagram, Steps, Select, Segmented, Input, Toggle, Status, TableOfContents, useState, useMemo } from "grok/canvas";
import type { ReactNode } from "grok/canvas";

type D = "B" | "I" | "A";
type Q = [string, D, string, string, string, string?, string?, string?];

const T: Record<string, string> = {
  s28: "28. CSV Bulk Import",
  s29: "29. Study Transfer Safety Guard",
  s30: "30. Release Management",
  s31: "31. Agile / Leadership",
  s32: "32. Java / Spring Boot",
  s33: "33. Behavioral / HR",
  s34: "34. Resume Verification",
};
const ORDER = ["s28", "s29", "s30", "s31", "s32", "s33", "s34"];
const DL: Record<D, string> = { B: "Basic", I: "Intermediate", A: "Advanced" };

const QS: Q[] = [
  // 28. CSV
  ["s28", "I", "Did you process the CSV import synchronously or asynchronously?", "Synchronously within the request, because files are capped at [5 MB, about 10,000 rows] and parsing is streamed, so validation finishes in [a few seconds] and users get the preview immediately. The I/O is fully async (async/await). For much larger files I would switch to a background job returning 202 and a job id.", "Small capped file: answer now; big file: job and poll.", "", "", "810"],
  ["s28", "I", "How did you secure uploaded files?", "Authorised endpoint with role checks per study; size limit and .csv extension plus content check; files processed in memory or temp storage, never executed or served back; CSV-injection protection when exporting error reports; antivirus scanning per platform policy; every import audited with user and import id.", "Who, how big, what type, never executed.", "", "", "814"],
  ["s28", "I", "How did you optimize large CSV processing?", "Streamed parsing with CsvHelper instead of loading the file; validation in stages with early stop on header errors; database lookups (existing sites, countries, depots) loaded once into dictionaries instead of per row; batched inserts inside one transaction; AsNoTracking for reads.", "Stream, preload lookups, batch writes.", "", "", "815"],
  ["s28", "I", "How did you test the import?", "Unit tests per validation rule (missing fields, bad types, duplicates in file and database, invalid country or depot); integration tests saving a file into a test database and checking rollback on failure; Playwright E2E tests for upload, preview and confirm; FV with large and broken files.", "Every rule, the whole save, the real UI.", "", "", "816"],
  ["s28", "I", "How did you handle concurrent imports?", "Only one import per study at a time, enforced with a lock row checked inside the transaction; a second user gets a clear 'import in progress' message; the file hash also blocks the same file being imported twice.", "One study, one import at a time.", "", "", "817"],
  ["s28", "I", "What happens if the import fails halfway through?", "Nothing is saved: all rows are written in one transaction, so any failure (database error, timeout) rolls everything back; the user sees an error and can retry; the audit log records the failed attempt.", "All or nothing means halfway = nothing.", "", "", "818"],
  ["s28", "A", "How would you redesign it for millions of records?", "Upload directly to S3 with a presigned URL; a background worker (ECS or Lambda) streams and validates in chunks; stage rows in a staging table with SqlBulkCopy; validate set-based in SQL; then merge into live tables in controlled batches; progress via job status; errors written to a downloadable report.", "S3, worker, staging table, bulk copy, merge.", "csvbig", "", "819"],
  // 29. Transfer guard
  ["s29", "I", "How did you test the study transfer safety guard?", "Unit tests for each of the five checks, pass and fail (live study with randomized subjects, version mismatch, wrong direction, transfer in progress, missing role or change request); integration tests for the transaction and lock with two concurrent transfers; FV scripts with evidence.", "Each rule pass and fail, plus the race.", "", "", "826"],
  ["s29", "I", "How did you audit blocked transfers?", "Every attempt, allowed or blocked, writes an audit record: user, source and target study and environment, change request reference, which check failed and why, timestamp. Validators and support can report on blocked attempts.", "Blocked attempts are evidence, not noise.", "", "", "828"],
  // 30. Release
  ["s30", "B", "What is release integration?", "Bringing together every team's changes for a release (application, APIs, database scripts, UI), merging them into the release branch, resolving conflicts, tagging one version and producing a consistent set of artifacts for validation.", "Many teams in, one tagged release out.", "", "", "830"],
  ["s30", "I", "How do you validate releases and promote from UAT to production?", "Validate: automated tests, smoke tests after install, version checks on every node, FV scripts with evidence, UAT sign-off.|Promote: the same tagged artifacts that passed UAT go to production under an approved change request, deployed by TechOps or the controlled pipeline in the agreed window, followed by verification.", "Same artifact, proven in UAT, approved for production.", "relpromote", "", "833,836"],
  ["s30", "I", "How do you coordinate application, API, database and UI releases?", "One release version and checklist; order of deployment: backward-compatible database scripts first, then APIs, then application services, then UI; feature flags for incomplete work; a daily status check with each team before FV.", "DB first, then API, then app, then UI.", "", "", "839"],
  ["s30", "I", "Why use Python and Shell automation?", "Our nodes run Linux-based install steps where Shell is natural; Python handles logic such as reading manifests, comparing versions and calling APIs; with Ansible they make installs repeatable and identical on every node, and the MCP tools call the same scripts.", "Scripts make every node identical.", "", "", "841"],
  ["s30", "I", "How do you perform multi-node deployments and ensure all nodes run the same version?", "Ansible playbooks with Python and Shell run the install steps across [4 to 6] nodes in order, stopping on failure.|Version consistency: every node reports its installed version (version file and health endpoint) and a check compares them with the release tag; any mismatch fails verification.", "Same playbook everywhere, then compare versions.", "", "", "842,843"],
  ["s30", "B", "How do you verify a deployment?", "Version check on every node, health endpoints green, smoke tests of key flows (login, randomize in a test study, shipment list), logs and dashboards free of new errors, then sign-off in the release record.", "Version, health, smoke, logs, sign-off.", "", "", "844"],
  // 31. Agile
  ["s31", "B", "What is Agile, and Scrum vs Kanban?", "Agile: deliver in small increments, get feedback often and adapt.|Scrum: fixed-length sprints with roles, planning, review and retrospective.|Kanban: continuous flow with work-in-progress limits and no sprints; good for support and operations work.", "Scrum = timeboxes; Kanban = flow.", "", "", "846,847"],
  ["s31", "B", "What happens during sprint planning, and what is a retrospective?", "Planning: the team picks prioritised, groomed stories that fit its capacity, agrees a sprint goal and breaks stories into tasks.|Retrospective: at the end of the sprint, the team discusses what went well, what did not and agrees one or two improvements to try.", "Plan what to do; reflect on how we did it.", "", "", "848,851"],
  ["s31", "I", "How do you handle changing requirements?", "Clarify the reason and impact with the product owner and BA, estimate the change, agree what moves out of the sprint, update acceptance criteria and traceability (important in GxP), and design code to be easy to change (clean boundaries, tests).", "Welcome the change, trade the scope.", "", "", "853"],
  ["s31", "I", "How do you conduct code reviews, and handle disagreement during review?", "Review for correctness, security, readability, tests and design, in small pull requests; comment on code not people, explain why, separate must-fix from suggestions.|Disagreement: discuss with data (benchmarks, docs, team standards), talk briefly in person if comments go back and forth, and involve the lead or agree a team rule if still stuck.", "Review the code, respect the coder.", "", "", "856,858"],
  ["s31", "I", "Tell me about a technical decision you influenced.", "Situation: release deployments needed about 6 people and 6 hours.|Task: I proposed automating them through an MCP server, which nobody had asked for.|Action: I built a read-only prototype in [two weeks], demoed it to my lead and the release manager, addressed their safety concerns (per-user PATs, approvals kept), and measured before and after.|Result: the team adopted the CIRT MCP server for most release deployments: 6 hours to 2, 6 people to 1.", "Prototype, demo, address fears, measure.", "", "", "859"],
  ["s31", "I", "How do you handle production pressure?", "Stay calm and structured: mitigate first, communicate status on a regular cadence, split work clearly when several people help, avoid risky changes under pressure, and do the root-cause work afterwards. Checklists and runbooks reduce panic.", "Calm, mitigate, communicate, then fix properly.", "", "", "861"],
  ["s31", "I", "How do you communicate technical problems to non-technical stakeholders?", "Lead with impact (who is affected, how badly), then what we are doing and when the next update comes, using plain language and analogies, no jargon; give options with trade-offs when they must decide.", "Impact, action, next update.", "", "", "862"],
  // 32. Java
  ["s32", "B", "What is Spring Boot?", "An opinionated framework on top of Spring for building Java services quickly: auto-configuration, embedded server (Tomcat), starter dependencies and production features (Actuator). The Java counterpart of ASP.NET Core.", "Spring Boot = ASP.NET Core for Java.", "javanet", "", "863"],
  ["s32", "I", "Dependency injection and the IoC container in Spring; @Autowired?", "The Spring IoC container (ApplicationContext) creates beans and injects their dependencies, like the .NET service provider.|Prefer constructor injection; @Autowired marks an injection point and is optional on a single constructor.", "Same DI idea, different annotations.", "", "", "865,866,868"],
  ["s32", "B", "@Component vs @Service vs @Repository?", "All register beans through component scanning. @Component is generic; @Service marks business logic (semantic only); @Repository marks data access and translates database exceptions into Spring's DataAccessException.", "Same bean, different labels; Repository also translates errors.", "", "", "867"],
  ["s32", "B", "How do you build a Spring Boot REST controller?", "@RestController class with @RequestMapping(\"/api/shipments\"); methods with @GetMapping, @PostMapping; @PathVariable, @RequestParam, @RequestBody with @Valid; return ResponseEntity with status codes.", "@RestController = [ApiController].", "", "", "869"],
  ["s32", "B", "Spring Boot configuration and profiles?", "Configuration in application.yml or .properties, environment variables and @ConfigurationProperties classes (like the options pattern).|Profiles (dev, uat, prod) load application-{profile}.yml and activate beans with @Profile, chosen with spring.profiles.active.", "Profiles = appsettings.{Environment}.json.", "", "", "870,871"],
  ["s32", "I", "Spring Data JPA, Hibernate, and JPA vs EF Core?", "JPA is the Java persistence specification; Hibernate is its most common implementation (the ORM); Spring Data JPA adds repository interfaces that generate queries from method names.|Versus EF Core: similar ideas (entities, change tracking via the persistence context, lazy loading, migrations via Flyway or Liquibase rather than built in); EF Core uses LINQ, JPA uses JPQL or the Criteria API.", "JPA = spec, Hibernate = engine, Spring Data = shortcuts.", "", "", "872,873,874"],
  ["s32", "I", "Spring Boot exception handling and security?", "Exceptions: @RestControllerAdvice with @ExceptionHandler methods returning ProblemDetail responses, like .NET exception middleware.|Security: Spring Security filter chain, OAuth2 resource server for JWT validation, method security with @PreAuthorize roles.", "ControllerAdvice = global handler; Spring Security = auth middleware.", "", "", "875,876"],
  ["s32", "I", "Java vs C#?", "Very similar: statically typed, garbage collected, object-oriented.|C# added features earlier (LINQ, async/await, properties, records, pattern matching), has value types and real generics at runtime; Java has a huge ecosystem, virtual threads (Java 21) and runs on many JVM vendors.", "Cousins: same family, different habits.", "", "", "877"],
  ["s32", "I", "Why choose Spring Boot over .NET, or .NET over Spring Boot?", "Spring Boot: when the organisation's platform, libraries and people are Java, or a specific JVM ecosystem (big data, certain vendors) matters.|.NET: when the team and code base are .NET, for strong performance, LINQ and EF Core productivity, and first-class Azure and tooling support. Both are excellent; team skills and existing systems decide.", "Choose the platform your team and systems already speak.", "", "", "879,880"],
  // 33. HR
  ["s33", "B", "Why this role?", "It matches what I do best and want to grow: backend .NET services on cloud and event-driven systems, with ownership of design and delivery, plus room for the developer-tooling and AI-assisted engineering work I have been doing. [Mention one specific thing about their product or team.]", "My skills, their problems, my growth.", "", "", "883"],
  ["s33", "B", "What are your career goals?", "Short term: a senior engineer who owns services end to end and raises the team's engineering standards. Longer term: technical lead or architect for distributed systems, keeping hands-on and helping teams use AI tools safely.", "Senior owner, then tech lead.", "", "", "887"],
  ["s33", "I", "Tell me about a difficult manager.", "Situation: in [2023] a [project lead] wanted very frequent status updates and changed priorities mid-sprint, which disrupted the team.|Task: keep delivery on track while respecting his need for visibility.|Action: I asked what he needed the updates for (client reporting), offered a short written update every [morning] and a shared board, and suggested routing mid-sprint changes through the product owner.|Result: interruptions dropped, he had what he needed for the client, and we delivered the release on time. I learned to look for the need behind a behaviour.", "Find the need behind the behaviour.", "", "", "890"],
  ["s33", "I", "Tell me about a failure, and how do you deal with failure?", "Situation: in [2023] my first estimate for [a shipment reporting API] was one sprint; it took two.|Task: I owned the estimate and the delivery.|Action: I had missed the validation documentation and FV preparation needed in GxP. I told the product owner as soon as I saw it [mid-sprint], split the work so the core endpoint shipped on time and the export followed, and started adding validation effort to every estimate.|Result: the client got the core report on the planned date; my later estimates included documentation and were much closer.|How I deal with failure: own it early, fix what I can, learn the lesson and turn it into a habit or checklist.", "Own it early, fix, learn, make it a habit.", "", "", "891,910"],
  ["s33", "I", "Tell me about a time you missed a deadline.", "Situation: [the shipment reporting API in 2023]: I had estimated one sprint and it needed two because I missed GxP validation documentation.|Task: limit the impact.|Action: I raised it [mid-sprint], not on the last day; with the product owner we split scope so the core endpoint went out on time and the export came next sprint.|Result: no impact on the client's plan, and I now include validation effort in every estimate.", "Warn early, split scope, deliver the core.", "", "", "893"],
  ["s33", "I", "Tell me about a time you handled pressure.", "Situation: [the quarterly release in 2024] with a merge conflict in a shared database script and a failing integration test [two days] before FV.|Task: deliver a clean build into FV on time as release integrator.|Action: prioritised, resolved the conflict with the owners in [one hour], got the test fixed, ran the FV install overnight, and flagged one incomplete feature early so it moved to the next release.|Result: FV started on time and the release reached production on its date.", "Prioritise, communicate, deliver.", "", "", "894"],
  ["s33", "I", "Tell me about a time you took ownership.", "Situation: release deployments took about 6 hours and 6 people, and nobody owned improving them.|Task: I decided to fix it myself.|Action: I built the CIRT MCP server in my own time at first, then with my lead's support: about 77 tools, safety controls, packaging, documentation and training for the team.|Result: 6 hours to 2 and 6 people to 1, and I still own and maintain the tool.", "Saw the pain, owned the fix.", "", "", "895"],
  ["s33", "B", "What would your manager and teammates say about you?", "Manager: reliable and takes ownership: releases and production issues are in safe hands, and I bring improvements like the MCP server without being asked. [Maybe: sometimes takes on too much.]|Teammates: helpful and approachable, good at explaining, reviews carefully, and the person to ask about deployments and AI tools.", "Manager: dependable owner; team: helpful explainer.", "", "", "902,903"],
  ["s33", "B", "What kind of team do you prefer, what motivates you and what frustrates you?", "Team: collaborative, honest reviews, clear ownership, and engineers who care about quality and learning.|Motivates me: solving real problems with visible impact, like cutting deployments from 6 hours to 2, and learning new technology.|Frustrates me: repeated manual work that could be automated, and unclear requirements; I respond by automating or by asking questions early.", "Team that cares, impact that shows, automate the boring.", "", "", "904,905,906"],
  // 34. Resume verification
  ["s34", "A", "You wrote 'designed and built scalable microservices.' Design one for me.", "Example: the Shipment service. REST API for create, get and list shipments; its own SQL Server database; publishes ShipmentStatusChanged events through an outbox to Kafka; consumes depot status files via the SFTP integration; idempotent handlers; runs stateless on ECS with autoscaling; Redis for reference data; CloudWatch metrics, logs and traces; Polly for vendor calls.", "API, own DB, outbox events, stateless, observable.", "shipsvc", "", "914"],
  ["s34", "I", "You wrote '.NET 6/8/10.' What changed between these versions?", ".NET 6 (LTS, 2021): minimal APIs, unified platform, hot reload.|.NET 8 (LTS, 2023): big performance gains, native AOT for more apps, TimeProvider, keyed DI services, built-in identity endpoints, C# 12 primary constructors.|.NET 10 (LTS, November 2025): C# 14 (extension members, the field keyword), more performance and AOT work, built-in validation for minimal APIs, OpenAPI 3.1. Upgrades: change target framework, update packages, fix breaking changes, retest.", "6 minimal, 8 fast, 10 newest LTS.", "netver", "", "915"],
  ["s34", "I", "You wrote 'AWS ECS.' Explain your ECS architecture.", "Each .NET service is a Docker image in ECR and an ECS service with a task definition (CPU, memory, environment, secrets from Secrets Manager, task role), running across two availability zones in private subnets behind an ALB with health checks; autoscaling on CPU and request count; logs to CloudWatch; deployed by Azure DevOps with rolling updates.", "Image, task definition, service, ALB, autoscale.", "", "", "917"],
  ["s34", "I", "You wrote 'Terraform and CloudFormation.' Why both?", "[The core platform stacks were already in CloudFormation, owned by the platform team], so we extended them there; [newer, smaller pieces and tooling used Terraform modules] for reuse and multi-provider support. I can read and change both, and would standardise on one for new work.", "Inherited CloudFormation, newer Terraform.", "", "", "918"],
  ["s34", "I", "You wrote 'Kubernetes.' What exactly did you deploy using Kubernetes?", "Production IRT services run on ECS. Kubernetes YAML was used for [some internal workloads, such as the Node.js build-log summariser and the FastAPI vendor-file validator in a shared non-production cluster]: Deployments, Services, ConfigMaps, probes. I am honest that my production container experience is mainly ECS.", "Production on ECS, some workloads on Kubernetes.", "", "", "919"],
  ["s34", "I", "You wrote 'Kafka and RabbitMQ.' Give me a real use case for each.", "Kafka: shipment status events consumed by several services (supply, notifications, reporting), needing ordering per shipment key and replay.|RabbitMQ: task-style messages such as sending notifications and generating reports, where per-message acks, routing and retries matter; this is where I root-caused the outage fixed with publisher confirms.", "Kafka for shared event history; Rabbit for jobs to do.", "", "", "920"],
  ["s34", "I", "You wrote 'Agentic AI orchestration.' What exactly did you orchestrate?", "Release deployments: an AI agent in Cursor or Claude Code uses the CIRT MCP server's tools in a loop (queue build, create release, deploy to environment, poll node status, summarise failures, retry a node) with humans confirming and approving.|Also an [AutoGen experiment] with coder and reviewer agents drafting unit tests.", "I orchestrated deployments, not chat.", "", "", "926"],
  ["s34", "I", "You wrote 'RAG workflows.' Explain your RAG architecture.", "[An internal assistant over release runbooks, deployment guides and past incident notes]: documents chunked and embedded into a vector index; questions embedded, top-k chunks retrieved and re-ranked, sent with the question to Azure OpenAI, answers cite the source documents; evaluated against [a set of 30] real team questions. No patient data is included.", "Runbooks in, cited answers out.", "", "", "927"],
  ["s34", "I", "You wrote 'React reusable components.' Give me an example.", "[A configurable data table component] used across IRT screens: typed columns, sorting, paging, filtering, loading and empty states, row actions with role checks, accessible keyboard navigation; documented with examples and tested with React Testing Library, reused on [several] screens instead of copy-pasted tables.", "One table, many screens.", "", "", "930"],
  ["s34", "B", "You wrote 'Python FastAPI.' Why FastAPI?", "For the vendor file pre-validation service: Pydantic models give quick, readable schema validation, automatic OpenAPI docs, async support and high performance, and the integration team already knew Python.", "Pydantic validation plus free docs.", "", "", "931"],
  ["s34", "B", "You wrote 'Node.js microservices.' Why Node.js alongside .NET?", "For I/O-bound glue such as the build-log summariser: fetch logs, parse text, return JSON. Node handles that well, and TypeScript MCP and HTTP libraries made it quick. Core domain services stay in .NET.", "Right tool per job.", "", "", "932"],
  ["s34", "I", "You wrote 'regulated GxP platform.' What does GxP mean technically?", "Audit trails on every data change (who, when, old and new values, reason), role-based access and e-signature rules (21 CFR Part 11), validated releases with traceability from requirement to test, change control, controlled environments with no direct production edits, and data integrity (ALCOA+).", "Audit, access, validation, change control, integrity.", "", "", "935"],
  ["s34", "I", "You wrote 'mentored developers.' How many and how?", "Directly [two graduate developers in 2024]: architecture walkthrough, pairing for [two sprints], then reviews and weekly check-ins; they shipped their first pull requests in [week two].|More broadly, [3 to 4 teammates] through code reviews and showing them the MCP server and safe AI-tool use.", "Two directly, a few more through reviews.", "", "", "937"],
  ["s34", "B", "You wrote '100-member engineering team.' What was your actual team's size?", "The IRT engineering organisation is roughly 100 people across several scrum teams; my own scrum team is [about 8: 5 developers, 2 QA engineers and a BA, with a scrum master shared]. As release integrator I coordinate with [around 5] teams each release.", "100 in the org, about 8 in my team.", "", "", "938"],
];

function listLabel(ids: string): string {
  return ids.split(",").map((i: string) => (i.includes("f") ? `section ${i.split("f")[0]} follow-up ${i.split("f")[1]}` : `#${i}`)).join(", ");
}

function visual(k?: string): ReactNode {
  switch (k) {
    case "csvbig":
      return <Diagram direction="horizontal" nodes={[{ id: "u", label: "User", kind: "terminal" }, { id: "s3", label: "S3", detail: "presigned upload" }, { id: "w", label: "Worker", detail: "stream + chunk" }, { id: "stg", label: "Staging table", detail: "SqlBulkCopy" }, { id: "live", label: "Live tables", detail: "batched merge" }, { id: "rep", label: "Job status + error report" }]} edges={[{ from: "u", to: "s3" }, { from: "s3", to: "w", label: "event" }, { from: "w", to: "stg" }, { from: "stg", to: "live", label: "after validation" }, { from: "w", to: "rep" }]} />;
    case "relpromote":
      return <Steps steps={[{ title: "Tag + build", detail: "One version for app, API, DB, UI" }, { title: "FV", detail: "Scripted validation, evidence" }, { title: "TechOps", detail: "Controlled install, verification" }, { title: "UAT", detail: "Business sign-off" }, { title: "Production", detail: "Same artifacts, approved change request" }, { title: "Verify", detail: "Versions, health, smoke tests" }]} />;
    case "javanet":
      return <Table columns={["Concept", "Spring Boot", ".NET"]} rows={[["Web framework", "Spring MVC / @RestController", "ASP.NET Core / [ApiController]"], ["DI", "IoC container, @Autowired", "IServiceCollection, constructor injection"], ["Config", "application.yml + profiles", "appsettings.json + environments"], ["ORM", "JPA / Hibernate", "EF Core"], ["Errors", "@RestControllerAdvice", "Exception middleware / IExceptionHandler"], ["Security", "Spring Security", "ASP.NET Core auth + policies"]]} />;
    case "shipsvc":
      return <Diagram direction="horizontal" nodes={[{ id: "gw", label: "ALB / API Gateway" }, { id: "api", label: "Shipment service", detail: "ECS, stateless" }, { id: "db", label: "Shipments DB", detail: "SQL Server + outbox" }, { id: "k", label: "Kafka", detail: "ShipmentStatusChanged" }, { id: "sftp", label: "Depot SFTP", detail: "status files" }, { id: "cons", label: "Supply, notifications, reporting" }]} edges={[{ from: "gw", to: "api" }, { from: "api", to: "db" }, { from: "db", to: "k", label: "outbox relay" }, { from: "sftp", to: "api", label: "import" }, { from: "k", to: "cons" }]} />;
    case "netver":
      return <Table columns={["Version", "Support", "Highlights"]} rows={[[".NET 6 (2021)", "LTS", "Minimal APIs, hot reload, unified platform"], [".NET 8 (2023)", "LTS", "Performance, native AOT, TimeProvider, keyed DI"], [".NET 10 (2025)", "LTS", "C# 14, minimal API validation, OpenAPI 3.1"]]} />;
  }
  return null;
}

export default function App() {
  const [topic, setTopic] = useState<string>("all");
  const [diff, setDiff] = useState<"all" | D>("all");
  const [search, setSearch] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [pics, setPics] = useState<boolean>(false);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return QS.map((x, i) => ({ x, n: i + 1 })).filter(({ x }) =>
      (topic === "all" || x[0] === topic) &&
      (diff === "all" || x[1] === diff) &&
      (!pics || !!x[5]) &&
      (s === "" || (x[2] + " " + x[3] + " " + x[4]).toLowerCase().includes(s))
    );
  }, [topic, diff, search, pics]);

  const topics = ORDER.filter((t) => shown.some((s) => s.x[0] === t));

  return (
    <Page title="Pradeep — Interview Q&A Bank (9/9): Your List — CSV Import, Transfer Guard, Releases, Agile, Java, HR, Resume Verification" summary={`${QS.length} new answers for questions from your list (sections 28 to 34) that parts 1 to 3 did not already answer. Each card shows which list numbers it answers.`} width="wide">
      <TableOfContents items={[{ label: "Filter and self-quiz", id: "quiz" }, ...topics.map((t) => ({ label: T[t], id: t }))]} />
      <Section heading="Filter and self-quiz" id="quiz">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <Select label="Topic" options={[{ value: "all", label: "All topics" }, ...ORDER.map((t) => ({ value: t, label: T[t] }))]} value={topic} onChange={setTopic} />
          <Segmented options={[{ value: "all", label: "All" }, { value: "B", label: "Basic" }, { value: "I", label: "Intermediate" }, { value: "A", label: "Advanced" }]} value={diff} onChange={setDiff} />
          <Input label="Search" value={search} onChange={setSearch} placeholder="e.g. CSV, sprint, Spring" />
          <Toggle label="Reveal all answers" value={open} onChange={setOpen} />
          <Toggle label="Only questions with pictures" value={pics} onChange={setPics} />
        </div>
        <Text>{`Showing ${shown.length} of ${QS.length}. Bracketed details are suggested story details that match parts 1 to 3.`}</Text>
      </Section>
      {topics.map((t) => (
        <Section key={t} heading={T[t]} id={t}>
          {shown.filter((s) => s.x[0] === t).map(({ x, n }) => (
            <Section key={`${n}-${open ? 1 : 0}`} heading={`Q${n}. ${x[2]}`} collapsible defaultOpen={open} actions={<Status tone={x[1] === "A" ? "accent" : "neutral"}>{DL[x[1]]}</Status>}>
              <BulletList items={x[3].split("|")} />
              {visual(x[5])}
              <Text>{`Memory hook: ${x[4]}`}</Text>
              {x[6] ? <Text>Likely follow-up questions</Text> : null}
              {x[6] ? <BulletList items={x[6].split("||").map((f: string) => { const p = f.split("::"); return { text: p[0], items: [p[1] ?? ""] }; })} /> : null}
              {x[7] ? <Text>{`From your list: ${listLabel(x[7])}`}</Text> : null}
            </Section>
          ))}
        </Section>
      ))}
    </Page>
  );
}


