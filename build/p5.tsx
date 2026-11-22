import { Page, Section, Text, BulletList, Table, Diagram, Steps, Select, Segmented, Input, Toggle, Status, TableOfContents, useState, useMemo } from "grok/canvas";
import type { ReactNode } from "grok/canvas";

type D = "B" | "I" | "A";
type Q = [string, D, string, string, string, string?, string?, string?];

const T: Record<string, string> = {
  s6: "6. EF Core",
  s7: "7. SQL Server / Database",
  s8: "8. Microservices",
  s9: "9. AWS",
};
const ORDER = ["s6", "s7", "s8", "s9"];
const DL: Record<D, string> = { B: "Basic", I: "Intermediate", A: "Advanced" };

const QS: Q[] = [
  // 6. EF Core
  ["s6", "B", "What is Entity Framework Core?", "Microsoft's open-source ORM for .NET: it maps classes to tables, translates LINQ to SQL, tracks changes and manages migrations, with providers for SQL Server, PostgreSQL, SQLite and more.", "Objects in, SQL out.", "", "", "200"],
  ["s6", "I", "EF Core vs ADO.NET?", "ADO.NET: raw connections, commands and readers; fastest and most control, but manual SQL and mapping.|EF Core: LINQ, change tracking, migrations and productivity, with a small overhead.|Use EF Core for most CRUD, and Dapper or ADO.NET for hot paths and complex reporting SQL.", "ADO.NET = manual gearbox; EF Core = automatic.", "efado", "", "201"],
  ["s6", "B", "What is DbContext, and what is DbSet?", "DbContext: a session with the database, combining unit of work, change tracker and connection management; the model is configured in OnModelCreating.|DbSet<T>: a queryable collection that represents a table, used to query, add and remove entities.", "DbContext = the session; DbSet = a table inside it.", "", "", "202,203"],
  ["s6", "B", "Include() vs ThenInclude()?", "Include loads a navigation of the root entity; ThenInclude loads the next level from that navigation, for example `Studies.Include(s => s.Sites).ThenInclude(x => x.Shipments)`.|Deep includes can explode rows; consider AsSplitQuery or projections.", "Include = children; ThenInclude = grandchildren.", "", "", "210"],
  ["s6", "B", "How do you create EF migrations?", "`dotnet ef migrations add AddShipmentIndex` generates Up and Down code from model changes; review it like any code, then produce an idempotent script with `dotnet ef migrations script --idempotent` for the release.", "Add, review, script, release.", "", "", "212"],
  ["s6", "B", "Code First vs Database First?", "Code First: the C# model is the source of truth and migrations create the schema.|Database First: scaffold entities from an existing database (`dotnet ef dbcontext scaffold`), good for legacy schemas owned by DBAs.", "Code drives DB, or DB drives code.", "", "", "214"],
  ["s6", "B", "What is LINQ-to-Entities?", "LINQ queries over DbSet/IQueryable that EF Core translates into SQL and runs in the database; only translatable methods are allowed in the query.", "LINQ that speaks SQL.", "", "", "215"],
  ["s6", "I", "What causes client-side evaluation?", "Using methods EF cannot translate (custom C# functions, some string operations) inside a filter. EF Core 3+ throws instead of silently loading every row, except in the final Select projection.|Calling AsEnumerable or ToList too early also pulls data into memory before filtering.", "If SQL can't say it, EF won't run it in the DB.", "", "", "217"],
  ["s6", "A", "How do you optimize EF Core queries and performance?", "AsNoTracking for reads; project to DTOs with Select; filter and page in SQL; avoid N+1 with Include or projections; AsSplitQuery for large includes.|Proper indexes, compiled queries for hot paths, ExecuteUpdate/ExecuteDelete for bulk changes, DbContext pooling.|Log the generated SQL and check execution plans.", "Track less, select less, round-trip less.", "efperf", "", "218,235"],
  ["s6", "B", "What is SaveChanges(), and SaveChanges() vs SaveChangesAsync()?", "SaveChanges detects changes and writes every pending INSERT, UPDATE and DELETE in one transaction.|SaveChangesAsync does the same without blocking the thread during I/O; use it in ASP.NET Core.", "One commit for all changes; async frees the thread.", "", "", "224,225"],
  ["s6", "I", "How do you handle bulk operations?", "EF Core 7+ ExecuteUpdate and ExecuteDelete run set-based SQL without loading rows; AddRange with batching for inserts.|For very large loads use SqlBulkCopy or a bulk-extensions library, in chunks inside transactions.", "Bulk = set-based, not row by row.", "", "", "226"],
  ["s6", "A", "What are compiled queries?", "EF.CompileAsyncQuery caches the LINQ-to-SQL translation of a query shape, saving translation cost on very hot paths.|EF already caches most query plans, so use it only after measuring.", "Translate once, run many.", "", "", "228"],
  ["s6", "B", "How do you log generated SQL?", "`LogTo(Console.WriteLine)` on the options builder, or the Microsoft.EntityFrameworkCore.Database.Command log category at Information; `ToQueryString()` on a query; EnableSensitiveDataLogging only in development.", "See the SQL before you trust it.", "", "", "229"],
  ["s6", "I", "How do you handle relationships: one-to-one, one-to-many, many-to-many?", "Configure with navigations and foreign keys by convention or Fluent API (HasOne/WithMany, HasMany/WithMany).|One-to-one: Subject and ConsentRecord. One-to-many: Site and Shipments. Many-to-many: Users and Studies, with an explicit join entity when the link has data (role, assigned date).", "1:1 pair, 1:N parent, N:N join table.", "rels", "", "230,231"],
  ["s6", "I", "What are shadow properties?", "Properties that exist in the EF model and table but not in the C# class, such as LastModifiedBy or a foreign key, accessed with `EF.Property<T>(entity, name)`; handy for audit columns.", "Columns the class never sees.", "", "", "232"],
  ["s6", "I", "What is owned entity mapping?", "Value objects mapped as part of their owner with OwnsOne/OwnsMany, for example an Address inside Site stored in the Site table's columns; they have no identity of their own.", "Owned = lives inside its owner.", "", "", "233"],
  ["s6", "B", "How do you configure indexes in EF Core?", "Fluent API `HasIndex(s => new { s.StudyId, s.Status })` with IsUnique, HasFilter or IncludeProperties (SQL Server), or the [Index] attribute; created through migrations.", "Index in code, built by migration.", "", "", "234"],
  // 7. SQL Server
  ["s7", "B", "What is a primary key, and what is a foreign key?", "Primary key: uniquely identifies each row, not null, one per table (clustered by default in SQL Server).|Foreign key: a column referencing another table's primary key, enforcing referential integrity, with cascade rules.", "PK = my ID; FK = my parent's ID.", "", "", "236,237"],
  ["s7", "B", "What is a unique constraint, and primary key vs unique key?", "A unique constraint forbids duplicate values and is backed by a unique index.|One primary key vs many unique keys; the PK is not null, while a unique key allows one NULL in SQL Server; the PK is the identity, unique keys are alternate keys such as KitNumber.", "One PK, many uniques.", "pkuk", "", "238,239"],
  ["s7", "I", "What is a composite index?", "An index on several columns, such as (StudyId, Status, ShipmentDate). Column order matters: it supports seeks on the leading columns (leftmost prefix). Put equality columns first, then range columns.", "Phone book: last name, then first name.", "", "", "241"],
  ["s7", "I", "What is a filtered index?", "A non-clustered index with a WHERE clause (for example only Pending shipments): smaller and faster for queries on a hot subset. The query predicate must match the filter.", "Index only the rows you search.", "", "", "243"],
  ["s7", "I", "How do indexes improve performance, and when can they hurt?", "Help: the B-tree lets SQL Server seek rows in logarithmic time instead of scanning, cover queries and avoid sorts.|Hurt: every insert, update and delete maintains them; they use storage and memory and cause page splits; unused or low-selectivity indexes are pure cost.", "Fast reads, taxed writes.", "", "", "244,245"],
  ["s7", "I", "What is an execution plan?", "The optimizer's recipe for a query: operators (seeks, scans, join types, sorts), estimated vs actual rows and costs.|Read the actual plan (SSMS, Query Store) to find scans, key lookups, spills and bad estimates.", "The plan is the query's GPS route.", "", "", "247"],
  ["s7", "I", "Table scan vs index scan vs index seek?", "Table scan: reads every row of a heap.|Index scan: reads all or a large range of an index.|Index seek: navigates the B-tree straight to the matching rows; best for selective predicates.", "Scan = read the whole book; seek = open at the right page.", "scans", "", "248,249,250"],
  ["s7", "I", "What is query cardinality, and what are statistics?", "Cardinality estimate: how many rows the optimizer expects at each step of the plan.|Statistics: histograms of column value distribution used for those estimates. Stale statistics cause bad estimates and bad plans (our plan-regression incident).", "Wrong guess of crowd size, wrong size of venue.", "", "", "251,252"],
  ["s7", "B", "UNION vs UNION ALL?", "UNION removes duplicates, which costs a sort or hash; UNION ALL keeps every row and is faster. Use UNION ALL unless you need distinct rows.", "ALL = keep everything.", "", "", "258"],
  ["s7", "I", "EXISTS vs IN?", "EXISTS stops at the first match; IN compares against a list or subquery. Modern optimizers often produce the same plan.|NOT IN returns nothing if the subquery contains a NULL, so prefer NOT EXISTS.", "NOT IN + NULL = surprise empty result.", "", "", "259"],
  ["s7", "I", "CTE vs temporary table?", "CTE: a named query for one statement; not materialised; readable; supports recursion.|Temp table (#t): materialised in tempdb, can be indexed and reused across statements, and has statistics; better for large intermediate results.", "CTE = sticky note; temp table = scratch notebook.", "", "", "261"],
  ["s7", "I", "ROW_NUMBER() vs RANK() vs DENSE_RANK()?", "ROW_NUMBER: unique sequence even for ties.|RANK: ties share a rank and leave gaps.|DENSE_RANK: ties share a rank with no gaps.", "Number, Rank with gaps, Dense without gaps.", "ranks", "", "263"],
  ["s7", "B", "How do you find duplicate records?", "`SELECT KitNumber, COUNT(*) FROM Kits GROUP BY KitNumber HAVING COUNT(*) > 1;`|Or `ROW_NUMBER() OVER (PARTITION BY KitNumber ORDER BY Id)` and keep row 1, which also lets you delete the extras.", "GROUP BY + HAVING > 1.", "", "", "264"],
  ["s7", "I", "How do you find the second-highest or nth-highest salary?", "`SELECT DISTINCT Salary FROM Emp ORDER BY Salary DESC OFFSET N-1 ROWS FETCH NEXT 1 ROWS ONLY;`|Or `DENSE_RANK() OVER (ORDER BY Salary DESC) = N`, which handles ties.|Second highest: `SELECT MAX(Salary) FROM Emp WHERE Salary < (SELECT MAX(Salary) FROM Emp)`.", "DENSE_RANK = N, ties handled.", "", "", "265,266"],
  ["s7", "I", "How do you get the top N records per group?", "`WITH r AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY SiteId ORDER BY ShipDate DESC) AS rn FROM Shipments) SELECT * FROM r WHERE rn <= 3;`|Or CROSS APPLY with TOP N per group.", "Partition, number, filter.", "", "", "267"],
  ["s7", "B", "What are dirty, non-repeatable and phantom reads?", "Dirty read: reading uncommitted data that may be rolled back.|Non-repeatable read: the same row returns different values within one transaction because another transaction updated it.|Phantom read: re-running a range query returns new rows inserted by another transaction.", "Dirty = unsaved, non-repeatable = changed, phantom = new.", "", "", "273,274,275"],
  ["s7", "B", "What is ACID?", "Atomicity: all or nothing. Consistency: rules and constraints hold. Isolation: concurrent transactions do not interfere. Durability: committed data survives crashes, thanks to the transaction log.", "All, Correct, Alone, Durable.", "", "", "276"],
  ["s7", "I", "Optimistic vs pessimistic locking?", "Optimistic: no locks; detect conflicts at write time with a rowversion; best for low contention (EF Core concurrency tokens).|Pessimistic: lock rows up front (UPDLOCK); for high-contention critical sections such as allocating the last drug kit.", "Optimistic = check on save; pessimistic = lock before edit.", "", "", "277"],
  ["s7", "A", "How do you optimize database performance?", "Measure first (Query Store, wait stats, slow queries), then fix the top queries (indexes, SARGable predicates, rewrites).|Schema: right data types and normalisation; keep statistics and index maintenance current.|Scale reads with caching and read replicas; archive or partition old data; short transactions and connection pooling.", "Measure, fix the worst, then scale.", "", "", "278"],
  ["s7", "A", "How do you design indexes?", "Start from real query patterns. Clustered key: narrow, unique, ever-increasing.|Non-clustered on foreign keys and filter columns, equality columns first then range, INCLUDE the selected columns.|Check usage DMVs, remove unused and duplicate indexes, and weigh the write cost.", "Index for the questions you actually ask.", "", "", "279"],
  // 8. Microservices
  ["s8", "B", "What are microservices?", "An architecture of small, independently deployable services, each owning one business capability and its data, communicating over APIs or messages.", "Small teams, small services, own data.", "", "", "281"],
  ["s8", "I", "What are the advantages and disadvantages of microservices?", "Advantages: independent deploys and scaling, fault isolation, team autonomy, technology choice per service.|Disadvantages: network latency and failures, distributed data and transactions, harder testing and debugging, more DevOps and observability work.", "Freedom costs operations.", "msprocon", "", "283,284"],
  ["s8", "I", "When would you NOT use microservices?", "Small team or early product, unclear domain boundaries, low scale, no DevOps maturity (CI/CD, monitoring), or strong transactional consistency needed across the whole domain. Start with a modular monolith.", "Don't build a fleet for one passenger.", "", "", "285"],
  ["s8", "A", "How do you identify service boundaries, and what is a bounded context?", "Use Domain-Driven Design: split by business capability and bounded context, the area where one model and its language stay consistent (Randomization, Supply, Shipments, Consent).|Signals: separate data ownership, different change rates and teams, few chatty calls between them.", "One language per context, one service per context.", "", "", "286,287"],
  ["s8", "I", "How should microservices communicate?", "Synchronous REST or gRPC when the caller needs an immediate answer; asynchronous events or commands (Kafka, RabbitMQ) for decoupled workflows and notifications. Version every contract.", "Ask with REST, announce with events.", "", "", "288"],
  ["s8", "I", "REST vs messaging; synchronous vs asynchronous communication?", "Synchronous (REST/gRPC): simple, immediate result, but temporal coupling; a slow callee slows the caller.|Asynchronous (queues/events): decoupled, absorbs spikes, resilient, but eventual consistency and harder tracing.", "Phone call vs letter.", "syncasync", "", "289,290"],
  ["s8", "I", "What is service discovery?", "How services find each other's current addresses: DNS-based (Kubernetes Services, ECS Service Connect / Cloud Map) or load balancers, instead of hard-coded IPs as instances come and go.", "A live phone book for services.", "", "", "291"],
  ["s8", "I", "Why shouldn't you retry everything?", "Retrying non-idempotent operations duplicates side effects; retrying permanent errors (400, 401, validation) wastes effort; aggressive retries amplify load into retry storms.|Retry only transient errors, with backoff, jitter and limits.", "Retry the hiccup, not the refusal.", "", "", "296"],
  ["s8", "I", "What is bulkhead isolation?", "Separate resource pools per dependency (connection pools, concurrency limits, queues) so one slow dependency cannot exhaust every thread or connection, like watertight compartments in a ship.", "One flooded room doesn't sink the ship.", "", "", "297"],
  ["s8", "I", "What is distributed tracing?", "Following one request across services with a trace id and spans (timing per hop), using OpenTelemetry and the W3C traceparent header; viewed in X-Ray, Jaeger or Grafana Tempo to find where latency or errors happen.", "Breadcrumbs across services.", "", "", "298"],
  ["s8", "I", "What is eventual consistency?", "Data across services becomes consistent after a short delay rather than instantly; accepted for availability and decoupling. Design UIs and processes to tolerate it, for example with Pending statuses.", "Consistent soon, not instantly.", "", "", "303"],
  ["s8", "I", "How do you handle failures between services?", "Timeouts, retries with backoff, circuit breakers and fallbacks; asynchronous messaging with durable queues and DLQs; idempotency; sagas with compensations; monitoring and alerts.", "Expect failure, design the recovery.", "", "", "304"],
  ["s8", "I", "How do you version microservices?", "Version APIs (URL or header) and message contracts (additive changes, a schema version field); stay backward compatible; consumers tolerate unknown fields; deprecate with timelines; semantic-version the images.", "Add, don't break.", "", "", "307"],
  ["s8", "I", "How do you deploy microservices?", "Each service has its own pipeline: build, test, image, IaC. Deploy independently to ECS or Kubernetes with rolling or blue-green strategies, health checks and automated rollback.", "Own pipeline, own pace.", "", "", "308"],
  ["s8", "I", "How do you monitor microservices?", "Golden signals per service, centralised structured logs with correlation ids, distributed tracing, Grafana or CloudWatch dashboards, and alerts on SLOs, queue lag and DLQ depth.", "Metrics, logs, traces, alerts.", "", "", "309"],
  ["s8", "A", "How do you secure service-to-service communication?", "Private networking (VPC, security groups) plus mTLS where required; service identities (OAuth client-credentials tokens or IAM roles); validate tokens and scopes on every call; least privilege; secrets in a vault. Never trust a caller just because of its network location.", "Zero trust: every call shows ID.", "", "", "310"],
  ["s8", "A", "How do you prevent cascading failures?", "Timeouts everywhere, circuit breakers, bulkheads, rate limiting and load shedding, async queues to absorb spikes, caching and graceful degradation; avoid long synchronous call chains.", "Firebreaks between services.", "", "", "311"],
  ["s8", "I", "How do you test microservices?", "Unit tests; integration tests with a real database and broker in containers; consumer-driven contract tests (Pact) between services; a few end-to-end tests; load and chaos tests for resilience.", "Unit, integration, contract, a little E2E.", "", "", "312,540"],
  ["s8", "I", "How do you manage configuration across services?", "Environment variables plus central stores (AWS Parameter Store / Secrets Manager, Azure App Configuration), per-environment values managed by IaC, no secrets in images, and validation at startup.", "One source of config truth per environment.", "", "", "313"],
  ["s8", "I", "How do you handle centralized logging?", "Structured JSON logs with correlation ids shipped to one place (CloudWatch Logs, OpenSearch, Loki), common fields (service, environment, version), retention policies, and no PHI or secrets.", "All logs, one place, one format.", "", "", "314"],
  ["s8", "A", "How would you design a scalable microservices architecture?", "API gateway in front of stateless services on ECS or Kubernetes with autoscaling.|Database per service, Redis caching, read replicas.|Async events via Kafka/RabbitMQ with outbox and idempotent consumers.|Observability, CI/CD per service and resilience patterns throughout.", "Gateway, stateless services, own data, events, eyes everywhere.", "msarch", "", "315"],
  ["s8", "I", "Why did you choose REST here?", "For synchronous request/response needs: UI and partner calls that need an immediate answer (get a study, randomize a subject), where the client must know the result now. REST is simple, cacheable and widely understood.", "Need the answer now? REST.", "", "", "8f1"],
  ["s8", "I", "Why Kafka instead of REST?", "When producers should not wait for or know their consumers, several consumers need the same events, replay and retention matter, and throughput is high, for example shipment status events used by several services.", "Many listeners, replayable history? Kafka.", "", "", "8f2"],
  ["s8", "A", "What happens if Kafka is unavailable?", "Producers buffer and retry (idempotent producer, delivery timeout) and then fail, so write events to an outbox table and publish later; consumers pause and resume from committed offsets; alert on broker health.|A multi-broker cluster with replication avoids a single point of failure.", "Outbox keeps the letters until the post office reopens.", "", "", "8f3"],
  ["s8", "A", "How do you guarantee exactly-once processing?", "True end-to-end exactly-once across systems is rarely possible; achieve effectively-once with at-least-once delivery plus idempotent consumers (dedupe by message id, upserts) and the outbox pattern.|Inside Kafka, idempotent producers and transactions give exactly-once read-process-write.", "At-least-once + idempotency = effectively once.", "", "", "8f5"],
  // 9. AWS
  ["s9", "I", "Explain your AWS architecture.", "Requests come through API Gateway or an ALB to .NET Core services in Docker on ECS, in private subnets across two availability zones.|Data in RDS SQL Server (Multi-AZ) and DynamoDB, ElastiCache for caching, Lambda for event-driven pieces.|Logs and metrics in CloudWatch, dashboards in Grafana; infrastructure in CloudFormation and Terraform, deployed through Azure DevOps.", "Gateway, containers, data, events, eyes, code-defined.", "awsarch", "", "316"],
  ["s9", "B", "Why did you use AWS?", "It was the company's chosen cloud for IRT. Its managed services (ECS, RDS, Lambda, DynamoDB) reduce operations work, it supports compliance for regulated workloads, and it has global regions and mature IaC tooling.", "Managed, compliant, global.", "", "", "317"],
  ["s9", "I", "ECS vs EKS?", "ECS: AWS-native, simpler, deep IAM and ALB integration, no control-plane fee.|EKS: managed Kubernetes, portable, huge ecosystem, but more complexity and cost.|Choose ECS for AWS-only simplicity, EKS to standardise on Kubernetes.", "ECS = AWS's own; EKS = Kubernetes on AWS.", "", "", "320"],
  ["s9", "B", "What is Fargate?", "Serverless compute for containers on ECS or EKS: you set CPU and memory per task and AWS runs it, with no EC2 instances to patch or scale.", "Containers without servers to babysit.", "", "", "321"],
  ["s9", "I", "API Gateway vs Application Load Balancer?", "API Gateway: API management features: auth (JWT, Lambda authorizers), throttling, usage plans, request validation, direct Lambda integration; priced per request.|ALB: layer 7 load balancing for HTTP to ECS/EC2 targets, path and host routing, cheaper at high steady volume, fewer API features.", "Gateway = smart receptionist; ALB = traffic cop.", "apigwalb", "", "326"],
  ["s9", "B", "What is Lambda?", "Serverless functions that run on events (API Gateway, S3, SQS, DynamoDB Streams, schedules); you pay per request and duration; scaling is automatic; maximum 15 minutes per run.", "Code that wakes up on events.", "", "", "327"],
  ["s9", "I", "What is Lambda concurrency?", "The number of executions running at the same time. Accounts have a regional limit (1,000 by default); reserved concurrency caps or guarantees a function's share; provisioned concurrency keeps environments warm; excess requests are throttled.", "How many copies run at once.", "", "", "329"],
  ["s9", "B", "What is a Lambda timeout?", "The maximum run time per invocation, configurable up to 15 minutes. Set it a little above the expected duration, align it with upstream timeouts (API Gateway has a 29-second default), and move longer work to Step Functions or ECS.", "Know when to give up.", "", "", "330"],
  ["s9", "B", "What is DynamoDB?", "A fully managed NoSQL key-value and document database with single-digit millisecond latency at any scale, on-demand or provisioned capacity, streams, TTL and global tables.", "Lockers by key, any scale.", "", "", "332"],
  ["s9", "I", "What is a GSI, and what is an LSI?", "GSI (global secondary index): a different partition and sort key, its own capacity, created any time, eventually consistent reads.|LSI (local secondary index): same partition key with a different sort key, must be created with the table, supports strongly consistent reads, 10 GB per partition-key limit.", "Global = new drawer system; local = new order inside the same drawer.", "gsilsi", "", "335,336"],
  ["s9", "B", "What is RDS, and RDS vs an EC2-hosted database?", "RDS: a managed relational database (SQL Server, PostgreSQL, MySQL and others) with automated backups, patching, Multi-AZ failover and read replicas.|EC2-hosted: full control of the OS and settings, but you own patching, backups and high availability. Choose RDS unless you need that control.", "RDS = database as a service.", "", "", "339,340"],
  ["s9", "I", "Redis vs database?", "Redis: in memory, sub-millisecond reads, rich data structures and TTL; ideal for caches, sessions, rate limits and locks, but not the system of record.|Database: durable, queryable, transactional source of truth.", "Redis = desk drawer; database = filing archive.", "", "", "342"],
  ["s9", "I", "How do you secure S3?", "Block Public Access, least-privilege bucket policies and IAM, encryption at rest (SSE-KMS) and in transit (HTTPS-only policy), versioning and Object Lock where needed, presigned URLs for temporary access, access logs and CloudTrail, VPC endpoints.", "Private, encrypted, logged, time-limited.", "", "", "344"],
  ["s9", "B", "What is IAM, and IAM role vs user?", "IAM controls who can do what on which AWS resources, through users, groups, roles and policies.|User: a long-term identity with credentials, for people (prefer SSO).|Role: an assumable identity with temporary credentials, for services (ECS task role, Lambda) and cross-account access; preferred.", "User = permanent badge; role = visitor pass.", "", "", "345,346"],
  ["s9", "B", "CloudWatch Logs vs Metrics?", "Logs: detailed event records, searchable with Logs Insights.|Metrics: numeric time series (CPU, latency, errors) for graphs and alarms; metric filters can turn log patterns into metrics.", "Logs tell stories; metrics draw graphs.", "", "", "349"],
  ["s9", "B", "What are CloudWatch alarms?", "Rules that watch a metric against a threshold over periods (for example 5xx over 1 percent for 5 minutes) and change state between OK and ALARM, triggering SNS notifications, autoscaling or other actions; composite alarms reduce noise.", "A smoke detector on a metric.", "", "", "350"],
  ["s9", "I", "How do you troubleshoot an AWS production issue?", "Check scope and recent changes; CloudWatch dashboards and alarms (ALB 5xx, target health, ECS task restarts, RDS CPU and connections); Logs Insights by correlation id; ECS events (OOM kills, failed health checks); CloudTrail for config changes; AWS Health for service issues. Mitigate, then fix the cause.", "Scope, signals, logs, changes, fix.", "", "", "351"],
  ["s9", "A", "How do you design disaster recovery?", "Agree RTO and RPO with the business, then pick a strategy: backup and restore, pilot light, warm standby or active-active.|Automated backups and cross-region copies, IaC to rebuild, replicated data (RDS cross-region replica, DynamoDB global tables, S3 replication), runbooks and regular DR drills.", "RTO = how fast back; RPO = how much lost.", "dr", "", "353,804"],
  ["s9", "B", "What is autoscaling?", "Automatically adjusting capacity to load: EC2 Auto Scaling groups, ECS service scaling, DynamoDB capacity. Target tracking (keep CPU near 60 percent), step or scheduled scaling; scale out fast, scale in slowly.", "Thermostat for capacity.", "", "", "354"],
  ["s9", "I", "Security Group vs NACL?", "Security group: stateful, attached to instances or ENIs, allow rules only.|NACL: stateless, attached to subnets, allow and deny rules evaluated in order, return traffic must be allowed explicitly.", "SG = door guard who remembers you; NACL = gate that checks both ways.", "sgnacl", "", "359"],
  ["s9", "B", "What is a NAT Gateway?", "Lets resources in private subnets make outbound internet calls (package downloads, external APIs) without being reachable inbound; managed and per availability zone, charged per hour and per GB, so use VPC endpoints for AWS services.", "One-way door to the internet.", "", "", "360"],
  ["s9", "I", "How do containers access AWS services securely?", "With an ECS task role (or Pod Identity / IRSA on EKS): the SDK credential chain gets temporary credentials automatically; no access keys in images or environment variables; least-privilege policies; VPC endpoints.", "Roles, not keys.", "", "", "361"],
  ["s9", "I", "Secrets Manager vs Parameter Store?", "Secrets Manager: built for secrets, automatic rotation (RDS), cross-account sharing, priced per secret.|Parameter Store: config and secrets (SecureString), hierarchical, free standard tier, no built-in rotation.", "Secrets Manager rotates; Parameter Store stores.", "secrets", "", "363"],
  ["s9", "I", "How do you reduce AWS cost?", "Right-size tasks and instances, autoscaling and scale-to-zero for dev, Savings Plans or Reserved capacity, Spot for non-critical work, S3 lifecycle tiers, delete idle resources, VPC endpoints instead of NAT data, log retention policies, cost tags and budgets.", "Right-size, schedule, commit, clean up.", "", "", "364"],
];

function listLabel(ids: string): string {
  return ids.split(",").map((i: string) => (i.includes("f") ? `section ${i.split("f")[0]} follow-up ${i.split("f")[1]}` : `#${i}`)).join(", ");
}

function visual(k?: string): ReactNode {
  switch (k) {
    case "efado":
      return <Table columns={["", "ADO.NET / Dapper", "EF Core"]} rows={[["SQL", "Hand-written", "Generated from LINQ"], ["Mapping", "Manual / Dapper", "Automatic"], ["Change tracking", "None", "Built in"], ["Migrations", "Separate scripts", "Built in"], ["Best for", "Hot paths, reports", "Most CRUD"]]} />;
    case "efperf":
      return <Steps steps={[{ title: "AsNoTracking", detail: "Read-only queries skip the change tracker" }, { title: "Project with Select", detail: "Only the columns the DTO needs" }, { title: "Filter and page in SQL", detail: "Where, OrderBy, Skip/Take before ToList" }, { title: "Kill N+1", detail: "Include, projections or AsSplitQuery" }, { title: "Bulk in SQL", detail: "ExecuteUpdate / ExecuteDelete" }, { title: "Measure", detail: "Log SQL, read the plan, add indexes" }]} />;
    case "rels":
      return <Table columns={["Type", "Example", "Fluent API"]} rows={[["One-to-one", "Subject - ConsentRecord", "HasOne().WithOne()"], ["One-to-many", "Site - Shipments", "HasMany().WithOne()"], ["Many-to-many", "Users - Studies", "HasMany().WithMany() or join entity"]]} />;
    case "pkuk":
      return <Table columns={["", "Primary key", "Unique key"]} rows={[["Per table", "One", "Many"], ["NULLs", "Not allowed", "One NULL allowed (SQL Server)"], ["Default index", "Clustered", "Non-clustered"], ["Role", "Row identity", "Alternate key, e.g. KitNumber"]]} />;
    case "scans":
      return <Table columns={["Operator", "Reads", "Good when"]} rows={[["Table scan", "Every row of a heap", "Tiny tables"], ["Index scan", "Whole index or big range", "Returning most rows"], ["Index seek", "Only matching rows via B-tree", "Selective filters"]]} />;
    case "ranks":
      return <Table columns={["Salary", "ROW_NUMBER", "RANK", "DENSE_RANK"]} rows={[["100", "1", "1", "1"], ["90", "2", "2", "2"], ["90", "3", "2", "2"], ["80", "4", "4", "3"]]} />;
    case "msprocon":
      return <Table columns={["Advantages", "Disadvantages"]} rows={[["Independent deploys", "Network latency and failures"], ["Scale per service", "Distributed data and transactions"], ["Fault isolation", "Harder testing and debugging"], ["Team autonomy", "More DevOps and monitoring"]]} />;
    case "syncasync":
      return <Table columns={["", "Synchronous (REST/gRPC)", "Asynchronous (queue/events)"]} rows={[["Caller waits", "Yes", "No"], ["Coupling", "Temporal coupling", "Decoupled"], ["Failure impact", "Callee down = caller fails", "Messages wait in queue"], ["Consistency", "Immediate", "Eventual"], ["Use for", "Queries, immediate answers", "Workflows, notifications"]]} />;
    case "msarch":
      return <Diagram direction="horizontal" nodes={[{ id: "c", label: "Clients", kind: "terminal" }, { id: "gw", label: "API gateway", detail: "auth, rate limit" }, { id: "a", label: "Service A", detail: "stateless, autoscaled" }, { id: "b", label: "Service B" }, { id: "dba", label: "DB A" }, { id: "dbb", label: "DB B" }, { id: "bus", label: "Kafka / RabbitMQ", detail: "outbox + idempotent consumers" }, { id: "obs", label: "Logs, metrics, traces" }]} edges={[{ from: "c", to: "gw" }, { from: "gw", to: "a" }, { from: "gw", to: "b" }, { from: "a", to: "dba" }, { from: "b", to: "dbb" }, { from: "a", to: "bus", label: "events" }, { from: "bus", to: "b" }, { from: "a", to: "obs", dashed: true }]} />;
    case "awsarch":
      return <Diagram direction="horizontal" nodes={[{ id: "u", label: "Users / vendors", kind: "terminal" }, { id: "gw", label: "API Gateway / ALB" }, { id: "ecs", label: "ECS services", detail: ".NET Core containers, 2 AZs" }, { id: "lam", label: "Lambda", detail: "event handlers" }, { id: "rds", label: "RDS SQL Server", detail: "Multi-AZ" }, { id: "ddb", label: "DynamoDB" }, { id: "ec", label: "ElastiCache" }, { id: "cw", label: "CloudWatch + Grafana" }]} edges={[{ from: "u", to: "gw" }, { from: "gw", to: "ecs" }, { from: "gw", to: "lam" }, { from: "ecs", to: "rds" }, { from: "ecs", to: "ec" }, { from: "lam", to: "ddb" }, { from: "ecs", to: "cw", dashed: true }]} />;
    case "apigwalb":
      return <Table columns={["", "API Gateway", "ALB"]} rows={[["Auth", "JWT / Lambda authorizers, IAM", "OIDC on listener rules"], ["Throttling, usage plans", "Yes", "No"], ["Targets", "Lambda, HTTP, AWS services", "ECS, EC2, IP, Lambda"], ["Pricing", "Per request", "Per hour + LCU"], ["Best for", "Public APIs, serverless", "Container services, high volume"]]} />;
    case "gsilsi":
      return <Table columns={["", "GSI", "LSI"]} rows={[["Partition key", "Different", "Same as table"], ["Create", "Any time", "Only with the table"], ["Consistency", "Eventual", "Strong or eventual"], ["Capacity", "Its own", "Shares the table's"], ["Size limit", "None", "10 GB per partition key"]]} />;
    case "dr":
      return <Table columns={["Strategy", "RTO", "Cost", "How"]} rows={[["Backup and restore", "Hours", "Lowest", "Snapshots + IaC rebuild"], ["Pilot light", "Tens of minutes", "Low", "Data replicated, minimal core running"], ["Warm standby", "Minutes", "Medium", "Scaled-down full copy running"], ["Active-active", "Near zero", "Highest", "Both regions serve traffic"]]} />;
    case "sgnacl":
      return <Table columns={["", "Security Group", "NACL"]} rows={[["Level", "Instance / ENI", "Subnet"], ["State", "Stateful", "Stateless"], ["Rules", "Allow only", "Allow and deny, ordered"], ["Return traffic", "Automatic", "Must be allowed"]]} />;
    case "secrets":
      return <Table columns={["", "Secrets Manager", "Parameter Store"]} rows={[["Built for", "Secrets", "Config + SecureString"], ["Rotation", "Built in", "Manual / custom"], ["Cost", "Per secret per month", "Standard tier free"], ["Cross-account", "Yes", "Limited"]]} />;
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
    <Page title="Pradeep — Interview Q&A Bank (5/9): Your List — EF Core, SQL, Microservices, AWS" summary={`${QS.length} new answers for questions from your list (sections 6 to 9) that parts 1 to 3 did not already answer. Each card shows which list numbers it answers.`} width="wide">
      <TableOfContents items={[{ label: "Filter and self-quiz", id: "quiz" }, ...topics.map((t) => ({ label: T[t], id: t }))]} />
      <Section heading="Filter and self-quiz" id="quiz">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <Select label="Topic" options={[{ value: "all", label: "All topics" }, ...ORDER.map((t) => ({ value: t, label: T[t] }))]} value={topic} onChange={setTopic} />
          <Segmented options={[{ value: "all", label: "All" }, { value: "B", label: "Basic" }, { value: "I", label: "Intermediate" }, { value: "A", label: "Advanced" }]} value={diff} onChange={setDiff} />
          <Input label="Search" value={search} onChange={setSearch} placeholder="e.g. index, saga, Lambda" />
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


