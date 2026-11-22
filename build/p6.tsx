import { Page, Section, Text, BulletList, Table, Diagram, Steps, Select, Segmented, Input, Toggle, Status, TableOfContents, useState, useMemo } from "grok/canvas";
import type { ReactNode } from "grok/canvas";

type D = "B" | "I" | "A";
type Q = [string, D, string, string, string, string?, string?, string?];

const T: Record<string, string> = {
  s10: "10. CloudFormation / Terraform",
  s11: "11. Docker",
  s12: "12. Kubernetes",
  s13: "13. CI/CD / Azure DevOps",
  s14: "14. Kafka",
  s15: "15. RabbitMQ",
  s16: "16. Production Troubleshooting",
  s17: "17. Testing",
};
const ORDER = ["s10", "s11", "s12", "s13", "s14", "s15", "s16", "s17"];
const DL: Record<D, string> = { B: "Basic", I: "Intermediate", A: "Advanced" };

const QS: Q[] = [
  // 10. IaC
  ["s10", "A", "What happens if Terraform state is lost?", "Terraform forgets which real resources it manages: the next plan tries to create everything again, causing duplicates or name conflicts.|Recover from the backend's versioning (S3 versioning) or re-import resources with `terraform import` or import blocks.|Prevent it: remote backend (S3 with versioning and encryption, DynamoDB or native locking), restricted access, backups.", "No state, no memory: Terraform thinks the world is empty.", "", "", "373"],
  ["s10", "B", "What are Terraform modules?", "Reusable packages of Terraform code with input variables and outputs, for example a standard ECS service or VPC module, called from each environment with different values; versioned in a registry or Git tag.", "Modules = functions for infrastructure.", "", "", "374"],
  ["s10", "I", "How do you manage and structure environments in Terraform?", "Shared modules plus one folder (root module) per environment, such as envs/dev, envs/uat, envs/prod, each with its own backend state and tfvars.|Same module versions promoted dev to prod; workspaces only for near-identical copies.|Separate AWS accounts per environment for blast-radius control.", "Same modules, different values, separate state.", "tfenvs", "", "375,380"],
  ["s10", "I", "How do you manage secrets in Terraform?", "Never hard-code them in .tf or tfvars. Reference AWS Secrets Manager or Parameter Store (data sources), let services read them at runtime, mark variables sensitive, encrypt and restrict the state file (it can contain secret values), and inject pipeline credentials from secure variables.", "Secrets live in a vault, not in code or state you share.", "", "", "376"],
  ["s10", "I", "How do you safely deploy infrastructure changes?", "Pull request with `terraform plan` (or a CloudFormation change set) attached for review; apply the reviewed plan from the pipeline only; lower environment first; approvals for production; state locking; watch for destroy or replace actions; small, frequent changes.", "Plan, review, approve, apply, watch.", "", "", "379"],
  // 11. Docker
  ["s11", "B", "What is Docker?", "A platform for packaging an application and its dependencies into an image, and running it as an isolated container that behaves the same on a laptop, CI and production.", "Ship the whole kitchen, not just the recipe.", "", "", "381"],
  ["s11", "I", "What is a Docker layer?", "Each Dockerfile instruction (FROM, COPY, RUN) creates a read-only layer; layers are cached and shared between images. Order instructions so rarely changed steps (restore packages) come before often changed ones (copy source) to reuse the cache.", "Layers are a stack of transparent sheets.", "", "", "384"],
  ["s11", "B", "COPY vs ADD?", "COPY copies local files into the image. ADD also extracts local tar archives and can fetch URLs. Prefer COPY for clarity and security; use ADD only for auto-extracting archives.", "COPY is plain; ADD has surprises.", "", "", "385"],
  ["s11", "I", "CMD vs ENTRYPOINT?", "ENTRYPOINT is the fixed executable the container runs; CMD supplies default arguments (or the default command) that `docker run` arguments override.|Typical .NET: `ENTRYPOINT [\"dotnet\", \"Shipments.Api.dll\"]`.", "ENTRYPOINT = the program; CMD = default arguments.", "cmdentry", "", "386"],
  ["s11", "I", "How do you reduce image size?", "Multi-stage builds (SDK image to build, small runtime image to run), slim or chiseled/alpine base images, .dockerignore, combine and clean up RUN steps, publish only needed files (trimmed or self-contained when useful).", "Build in the workshop, ship only the product.", "", "", "389"],
  ["s11", "B", "What is Docker Compose?", "A YAML file that defines and runs several containers together (API, SQL Server, RabbitMQ, Redis) with networks, volumes and environment variables; `docker compose up` for local development and integration tests.", "One file, whole local stack.", "", "", "390"],
  ["s11", "I", "Container networking and volumes?", "Networking: containers on the same user-defined bridge network reach each other by service name; ports are published to the host with -p; host and overlay networks for special cases.|Volumes: persistent storage managed by Docker that outlives containers (database data); bind mounts map host folders for development.", "Networks connect, volumes remember.", "", "", "391,392"],
  ["s11", "I", "How do you secure and scan Docker images?", "Minimal, pinned and trusted base images; run as a non-root user; no secrets in layers; read-only filesystem where possible; rebuild often for patches.|Scan in the pipeline with Trivy, ECR image scanning or Snyk, and fail the build on critical vulnerabilities; sign images and keep an SBOM.", "Small, non-root, scanned, signed.", "", "", "393,394,770"],
  ["s11", "I", "How do you troubleshoot a container?", "`docker ps -a` and `docker logs` for the exit code and error; `docker inspect` for config, environment and health; `docker exec -it ... sh` into a running container; check resource limits (exit 137 = OOM killed), ports, networks and mounted config.", "Logs, inspect, exec, limits.", "", "", "395"],
  ["s11", "I", "What happens when a container crashes?", "The main process exits and the container stops with an exit code. A restart policy (Docker), ECS service or Kubernetes restarts it; repeated crashes lead to backoff (CrashLoopBackOff) and failed health checks remove it from the load balancer.", "Process dies, orchestrator revives.", "", "", "396"],
  ["s11", "B", "How do you configure environment variables and pass secrets to containers?", "Environment variables: `-e`, env files, Compose `environment`, or the ECS task definition; ASP.NET Core reads them (Section__Key).|Secrets: inject at runtime from Secrets Manager or Parameter Store (ECS `secrets`), Kubernetes Secrets or Docker secrets; never bake them into the image.", "Config by env, secrets by vault at runtime.", "", "", "397,398"],
  // 12. Kubernetes
  ["s12", "B", "What is Kubernetes?", "An open-source container orchestrator that schedules containers (pods) across a cluster, keeps the desired number running, handles service discovery, rolling updates, scaling and self-healing.", "A manager that keeps your containers alive and in place.", "", "", "399"],
  ["s12", "I", "ClusterIP vs NodePort vs LoadBalancer?", "ClusterIP: internal virtual IP, reachable only inside the cluster (default).|NodePort: opens a port on every node.|LoadBalancer: provisions a cloud load balancer for external traffic. An Ingress usually fronts several services.", "Inside, through the node, or through a cloud LB.", "k8ssvc", "", "403"],
  ["s12", "B", "What is a ReplicaSet?", "It keeps a specified number of identical pod replicas running. Deployments create and manage ReplicaSets, one per version, which enables rolling updates and rollbacks.", "ReplicaSet = headcount keeper.", "", "", "404"],
  ["s12", "I", "What is a rolling deployment, and what is a rollback?", "Rolling: new pods replace old ones gradually (maxSurge, maxUnavailable), with readiness probes gating traffic, so there is no downtime.|Rollback: return to the previous ReplicaSet with `kubectl rollout undo`, or redeploy the previous image tag from the pipeline.", "Replace one by one; undo if it hurts.", "", "", "414,415"],
  ["s12", "B", "What happens if a Pod crashes?", "The kubelet restarts the container per the restart policy with exponential backoff (CrashLoopBackOff if it keeps failing). If a node dies, the ReplicaSet creates replacement pods elsewhere; failing readiness removes it from Service endpoints.", "Kubernetes revives, then reschedules.", "", "", "417"],
  ["s12", "I", "How does Kubernetes perform service discovery?", "Each Service gets a stable ClusterIP and a DNS name (orders.default.svc.cluster.local) from CoreDNS; kube-proxy routes traffic to healthy pod endpoints selected by labels.", "Stable name in front of moving pods.", "", "", "419"],
  ["s12", "A", "How do you secure Kubernetes?", "RBAC with least privilege, separate namespaces; network policies; Pod Security Standards (non-root, no privileged); secrets encrypted (or external secrets manager); signed, scanned images from a private registry; private API endpoint; audit logging; regular upgrades.", "Who can do what, who can talk to whom, what can run.", "", "", "421,771"],
  ["s12", "I", "How do you deploy a .NET application to Kubernetes?", "Multi-stage Dockerfile, push to ECR or ACR; Deployment YAML (or Helm chart) with image tag, resources, liveness and readiness probes on /health, ConfigMaps and Secrets; Service and Ingress; the pipeline runs `kubectl apply` or `helm upgrade` per environment and watches the rollout.", "Image, manifest, probes, pipeline.", "k8sdeploy", "", "422"],
  // 13. CI/CD
  ["s13", "B", "How do you run unit tests in CI?", "A pipeline step runs `dotnet test` (DotNetCoreCLI task) with coverage collection, publishes results and coverage to Azure DevOps, and fails the build on any failed test; it runs on every pull request through branch policies.", "Every PR, every test, red stops the line.", "", "", "427"],
  ["s13", "B", "What is SonarQube?", "A static analysis platform that scans code for bugs, code smells, security hotspots, duplication and coverage, and applies a quality gate that can fail the pipeline.", "A strict code reviewer that never sleeps.", "", "", "429"],
  ["s13", "I", "How do you prevent bad code from reaching production?", "Branch policies with required reviewers, build validation (compile, tests, SonarQube gate, dependency scans), environments promoted in order (dev, FV, UAT, production), approvals and change control, feature flags, smoke tests and fast rollback.", "Many gates, each catching something.", "", "", "431"],
  ["s13", "B", "What is an artifact, and how do you version it?", "An artifact is the build output promoted between environments: zip packages, NuGet packages, Docker images, scripts.|Version with semantic versions or the build number plus Git commit (1.8.3+abc123), immutable, so the same artifact goes from FV to production.", "Build once, promote the same box.", "", "", "432,433"],
  ["s13", "I", "How do you build Docker images in a pipeline?", "Docker task or `docker build` with the version tag, run tests and scans (Trivy), log in to ECR with a service connection, push; use layer caching and multi-stage builds; tag with build number and commit, not only latest.", "Build, scan, tag, push.", "", "", "434"],
  ["s13", "I", "How do you deploy to AWS from Azure DevOps?", "An AWS service connection (an IAM role with least privilege, ideally OIDC federation instead of long-lived keys) and the AWS Toolkit tasks or AWS CLI: push images to ECR, deploy CloudFormation or Terraform, update ECS services, with environment approvals.", "Azure DevOps drives, an IAM role opens the AWS door.", "", "", "435"],
  ["s13", "I", "How do you manage environment variables and secrets in CI/CD?", "Variable groups per environment and pipeline variables for non-secrets; secrets as secret variables or linked from Azure Key Vault or AWS Secrets Manager, masked in logs, scoped to the environments that need them; services read runtime secrets from the vault, not from the pipeline.", "Variables per environment, secrets from a vault, masked.", "", "", "436,437"],
  ["s13", "I", "How do you implement deployment approvals?", "Azure DevOps environments or release stages with pre-deployment approvals and checks (named approvers, business hours, change-request reference, required tests passed); production approval by release manager and QA; every approval is logged for the audit trail.", "No production without a named yes.", "", "", "438"],
  // 14. Kafka
  ["s14", "B", "What is Kafka, and what are broker, topic, partition, offset, producer and consumer?", "Kafka is a distributed, durable, append-only event log.|Broker: a Kafka server. Topic: a named stream of events. Partition: an ordered shard of a topic. Offset: a record's position in a partition.|Producer writes records; consumer reads them, tracking committed offsets, usually in a consumer group.", "A post office of append-only logbooks.", "kafka", "", "445,448,449,450,451,452,453"],
  ["s14", "I", "How does Kafka achieve scalability and fault tolerance?", "Scalability: topics split into partitions spread across brokers; consumers in a group share partitions; sequential disk writes and batching.|Fault tolerance: each partition is replicated (replication factor, often 3) with one leader and followers; if the leader's broker fails, an in-sync follower becomes leader.", "Split for speed, copy for safety.", "", "", "455,456"],
  ["s14", "I", "What are replication factor and leader/follower?", "Replication factor: how many copies of each partition exist across brokers.|Leader: the replica that handles reads and writes; followers copy it and form the in-sync replica set (ISR). With acks=all and min.insync.replicas=2, a write survives one broker loss.", "One leader writes, followers keep copies.", "", "", "457,458"],
  ["s14", "I", "What is partition ordering, and can Kafka guarantee message ordering?", "Order is guaranteed only within a partition, not across a topic.|Use a key (such as ShipmentId) so all events for one entity go to the same partition; enable the idempotent producer to keep order during retries.", "Same key, same lane, same order.", "", "", "459,460"],
  ["s14", "I", "What are retention and log compaction?", "Retention: Kafka keeps records for a time or size limit (for example 7 days), whether consumed or not, allowing replay.|Log compaction: keeps at least the latest record per key, useful for current-state topics; a null value (tombstone) deletes a key.", "Retention = keep for a while; compaction = keep the latest per key.", "", "", "461,462"],
  ["s14", "I", "What happens if a consumer crashes?", "Its group rebalances and its partitions move to the remaining consumers, which resume from the last committed offset. Messages processed but not committed are reprocessed, so consumers must be idempotent.", "Someone else picks up your logbook at your last bookmark.", "", "", "465"],
  ["s14", "I", "What is consumer lag, and how do you troubleshoot it?", "Lag = latest offset minus the committed offset: how far a consumer group is behind.|Troubleshoot: check which partitions lag (hot keys), slow processing (downstream DB or API), errors and retries, frequent rebalances, too few consumers; fix by optimising processing, batching, adding partitions and consumers.", "Lag = the unread pile.", "", "", "466,467"],
  ["s14", "I", "How do you scale consumers, and what if there are more consumers than partitions?", "Add consumers to the group up to the partition count, increase partitions (key ordering changes for new data), or process in parallel inside a consumer while keeping per-key order.|Extra consumers beyond the partition count sit idle as hot standbys.", "One partition, one consumer per group.", "", "", "468,469"],
  ["s14", "A", "How do you design Kafka topics?", "One topic per event type or business stream (shipment-status-changed), with a clear naming convention and versioned schema (Avro or JSON Schema with a registry); a partition key that matches the ordering need; partition count for peak throughput; retention by replay need; replication factor 3.", "Name, schema, key, partitions, retention.", "", "", "470"],
  ["s14", "I", "How do you handle poison messages, retries and dead-letter topics?", "Poison message: one that always fails and blocks the partition.|Retry transient errors a few times with backoff (in-process or via retry topics with delays); then publish the message with error details to a dead-letter topic and commit the offset so the partition keeps moving; alert on and replay the DLT after fixing.", "Retry a little, park it, move on, fix later.", "", "", "471,472,473"],
  ["s14", "I", "How do you secure and monitor Kafka?", "Secure: TLS in transit, SASL (SCRAM or IAM on Amazon MSK) authentication, ACLs per topic and group, encryption at rest, private networking.|Monitor: consumer lag, under-replicated partitions, broker disk and CPU, request latency, producer errors, DLT volume, with alerts in CloudWatch or Grafana.", "Lock the topics, watch the lag.", "", "", "474,475"],
  // 15. RabbitMQ
  ["s15", "B", "What is RabbitMQ, and what are queues and bindings?", "RabbitMQ is a message broker (AMQP) that routes messages from producers to consumers.|Queue: stores messages until consumers process them.|Binding: a rule linking an exchange to a queue, often with a routing key or pattern.", "Exchange = sorting office, binding = address rule, queue = mailbox.", "", "", "476,479,480"],
  ["s15", "I", "What is acknowledgement, and publisher confirm vs consumer acknowledgement?", "Consumer ack: the consumer tells RabbitMQ it processed the message so it can be deleted; nack or no ack requeues or dead-letters it.|Publisher confirm: RabbitMQ tells the publisher the message was safely received (persisted); they cover the two different halves of the trip.", "Confirm = broker got it; ack = consumer handled it.", "rabbitack", "", "482,484"],
  ["s15", "I", "What are message durability and persistent messaging?", "Durable queue or exchange: its definition survives a broker restart.|Persistent message (delivery mode 2): the message is written to disk. You need both, plus quorum queues and publisher confirms, for messages to survive failures.", "Durable box + persistent letter.", "", "", "485,486"],
  ["s15", "I", "What happens if RabbitMQ goes down?", "Publishers cannot send: they should retry with backoff or use an outbox table; consumers reconnect automatically when it returns. Durable queues and persistent messages survive a restart; a cluster with quorum queues keeps serving when one node fails.", "Outbox holds mail while the post office is closed.", "", "", "487"],
  ["s15", "I", "How do you implement retries in RabbitMQ?", "Transient errors: retry in-process a few times, then nack to a retry queue with a TTL that dead-letters back to the main queue (delayed retry), counting attempts in a header; after the limit, route to a dead-letter queue and alert.", "Wait queue, try again, then DLQ.", "", "", "491"],
  ["s15", "I", "How do you prevent message loss?", "Publisher confirms (the fix in our outage), durable queues, persistent messages, quorum queues, manual consumer acks after processing, dead-letter queues instead of dropping, and an outbox for publish-after-commit.", "Confirm, persist, ack late, never drop.", "", "", "493"],
  ["s15", "I", "How do you scale and monitor RabbitMQ?", "Scale: more competing consumers per queue with prefetch tuned, clustering with quorum queues, split hot queues, Amazon MQ or a bigger node.|Monitor: queue depth, publish and ack rates, unacked messages, consumer count, memory and disk alarms, DLQ size (management plugin, Prometheus, CloudWatch).", "Add consumers; watch depth and unacked.", "", "", "494,495"],
  // 16. Troubleshooting
  ["s16", "I", "How do you identify whether an issue is application, database or infrastructure related?", "Start from symptoms and scope, then follow the request: application errors and exceptions in logs; database waits, blocking, slow queries and CPU; infrastructure CPU, memory, network, disk, container restarts and AWS health.|Correlate timing with deployments or config changes; the layer whose signals change first is usually the cause.", "Follow the request down the stack.", "triage", "", "498"],
  ["s16", "I", "How do you trace a request across microservices?", "A correlation or trace id generated at the edge and passed in headers (W3C traceparent) through HTTP calls and message headers; every log line includes it; OpenTelemetry or X-Ray shows the spans so I can search one id across all services.", "One id, every hop.", "", "", "501"],
  ["s16", "B", "What logs do you check first?", "Application error logs for the affected service and time window (exceptions, 5xx), then load balancer or gateway logs (status codes, latency), then dependency logs (database, queue consumers), and recent deployment and change logs.", "Errors first, then the edges, then dependencies.", "", "", "502"],
  ["s16", "I", "How do you distinguish symptoms from root cause?", "Keep asking why (5 whys) until you reach something that, if fixed, prevents the whole chain; check that the cause explains all symptoms and timing, and confirm by reproducing or by the fix removing the symptoms. Example: slow API (symptom) - pool exhausted - unclosed connections (cause).", "Symptom = fever; root cause = infection.", "", "", "506"],
  ["s16", "I", "How do you handle production incidents and prevent recurrence?", "Acknowledge, assess impact and severity, communicate early, mitigate first (rollback, scale, disable a feature), then find the root cause.|Prevent recurrence: blameless post-mortem, fix the cause, add tests, alerts and runbooks, and track action items to closure.", "Stop the bleeding, find the cause, vaccinate.", "", "", "507,508"],
  ["s16", "I", "Tell me about the reverse-tabnabbing issue and how you fixed it.", "Situation: in [2024] a security review flagged that external links in the IRT UI opened with target=_blank but without rel=noopener, so the opened page could change our tab through window.opener (phishing risk).|Task: I took ownership of the fix.|Action: I searched the React and Angular code and fixed [about 40] links with rel=\"noopener noreferrer\", updated window.open calls to pass noopener, and turned on the ESLint rule react/jsx-no-target-blank so it fails the build if it returns. Tests and review, then the regulated release.|Result: passed security retest with no regressions, and the lint rule guards it.", "Open a new tab, but don't hand it your remote control.", "", "What was the impact?::No exploitation was found; the risk was a malicious external page redirecting a logged-in user's IRT tab to a fake login page.||How did you detect it?::A [security review] scan and manual review flagged target=_blank links without rel=noopener.||What logs did you check?::Web server and CloudWatch access logs for unusual referrers or redirects from those pages, to confirm no exploitation.||What metrics did you check?::Security scan findings count before and after, and the lint rule count in the build (zero after the fix).||What was the root cause?::No standard for external links and no lint rule, so each developer wrote links differently.||What alternatives did you consider?::A global Cross-Origin-Opener-Policy header only, or relying on modern browser defaults; I did both the explicit rel fix and the header plan, because older browsers and window.open do not default safely.||What was the fix?::rel=\"noopener noreferrer\" on every external link, noopener in window.open, and a shared ExternalLink component.||How did you validate the fix?::Unit tests on the component, manual testing that window.opener is null in the new tab, and the security retest.||How did you prevent recurrence?::ESLint rule in CI, the shared component, and an item in the review checklist.||What would you do differently today?::Add the lint rule and a security header baseline at project start rather than after a review.", "513,759,16f1,16f2,16f3,16f4,16f5,16f6,16f7,16f8,16f9,16f10"],
  // 17. Testing
  ["s17", "B", "What is mocking, and mock vs stub vs fake?", "Mocking replaces a real dependency with a test double so you can test a unit in isolation.|Stub: returns canned answers. Mock: also verifies it was called as expected. Fake: a working lightweight implementation, such as an in-memory repository.", "Stub answers, mock checks, fake works.", "doubles", "", "520,521"],
  ["s17", "I", "How do you test a service with dependencies?", "Depend on interfaces, inject them, and in unit tests pass Moq mocks or fakes (repository, clock, HTTP client) to cover business logic; then integration tests with real dependencies in containers (Testcontainers) for the wiring.", "Mock at the boundary, test the logic.", "", "", "524"],
  ["s17", "I", "How do you test controllers?", "Keep controllers thin and test logic in services. For controllers, use WebApplicationFactory integration tests that send HTTP requests and assert status codes, bodies, validation and auth; unit tests on actions only for special logic.", "Test controllers through HTTP.", "", "", "525"],
  ["s17", "I", "How do you test EF Core code?", "Prefer a real database: SQL Server in Testcontainers or a test database, with migrations applied and data reset between tests. SQLite in-memory is quicker but behaves differently; the EF InMemory provider is not a relational database and can hide bugs.", "Test against the real engine.", "", "", "526"],
  ["s17", "I", "Playwright vs Cucumber?", "Playwright: a browser automation framework that drives Chromium, Firefox and WebKit for end-to-end tests.|Cucumber: a BDD tool that runs Given/When/Then scenarios written in Gherkin. They combine: Cucumber scenarios whose steps call Playwright, as we did.", "Cucumber writes the story; Playwright acts it out.", "", "", "530"],
  ["s17", "I", "What is a flaky test, and how do you handle it?", "A test that passes and fails without code changes, usually from timing, shared state, order dependence, real time or network calls.|Handle: quarantine it so it does not block others, reproduce with repeated runs, fix the cause (await properly, isolate data, fake the clock, auto-waiting locators), then restore it.", "Flaky = untrusted; fix it or it trains people to ignore red.", "", "", "531,532"],
  ["s17", "I", "What is test coverage, and is 100 percent coverage desirable?", "Coverage: the percentage of lines or branches executed by tests.|100 percent is rarely worth it: coverage shows what ran, not whether it was checked. Aim for high coverage on business logic (around [80 percent] for new code in our quality gate) and meaningful assertions.", "Coverage measures visits, not checks.", "", "", "533,534"],
  ["s17", "B", "How do you design good unit tests, and what is Arrange-Act-Assert?", "Good tests are fast, isolated, repeatable, readable and test one behaviour, with clear names (Method_Scenario_Expected).|Arrange-Act-Assert: set up inputs and doubles, call the method, then verify the outcome.", "Arrange, Act, Assert.", "", "", "535,536"],
  ["s17", "I", "How do you test asynchronous code and exception handling?", "Async: make test methods async Task and await the call; never use .Result; control time with TimeProvider fakes; test cancellation.|Exceptions: `await Assert.ThrowsAsync<ValidationException>(() => sut.ImportAsync(file))`, and in APIs assert the ProblemDetails status and body.", "Await in tests; assert the throw.", "", "", "537,538"],
  ["s17", "A", "How do you test Kafka and RabbitMQ integrations?", "Unit-test handlers with the message as input and dependencies mocked.|Integration tests start a real broker in Testcontainers, publish a message and assert the side effect, including retries, DLQ routing and idempotency on duplicates; contract tests on message schemas between teams.", "Real broker in a container, assert the effect.", "", "", "539"],
];

function listLabel(ids: string): string {
  return ids.split(",").map((i: string) => (i.includes("f") ? `section ${i.split("f")[0]} follow-up ${i.split("f")[1]}` : `#${i}`)).join(", ");
}

function visual(k?: string): ReactNode {
  switch (k) {
    case "tfenvs":
      return <Diagram direction="horizontal" nodes={[{ id: "m", label: "modules/", detail: "vpc, ecs-service, rds" }, { id: "d", label: "envs/dev", detail: "own state + tfvars" }, { id: "u", label: "envs/uat", detail: "own state + tfvars" }, { id: "p", label: "envs/prod", detail: "own state, approval" }]} edges={[{ from: "m", to: "d" }, { from: "m", to: "u" }, { from: "m", to: "p" }]} />;
    case "cmdentry":
      return <Table columns={["Dockerfile", "docker run img", "docker run img --verbose"]} rows={[["ENTRYPOINT [\"dotnet\",\"app.dll\"]", "dotnet app.dll", "dotnet app.dll --verbose"], ["CMD [\"dotnet\",\"app.dll\"]", "dotnet app.dll", "--verbose (replaces CMD)"]]} />;
    case "k8ssvc":
      return <Table columns={["Type", "Reachable from", "Typical use"]} rows={[["ClusterIP", "Inside the cluster", "Service-to-service"], ["NodePort", "NodeIP:30000-32767", "Testing, behind your own LB"], ["LoadBalancer", "Internet / VPC via cloud LB", "Public entry point"]]} />;
    case "k8sdeploy":
      return <Steps steps={[{ title: "Dockerfile", detail: "Multi-stage, runtime image" }, { title: "Push to registry", detail: "ECR / ACR with version tag" }, { title: "Manifests or Helm", detail: "Deployment, Service, Ingress, probes, resources" }, { title: "Config", detail: "ConfigMaps and Secrets" }, { title: "Pipeline deploy", detail: "helm upgrade / kubectl apply, watch rollout" }]} />;
    case "kafka":
      return <Diagram direction="horizontal" nodes={[{ id: "p", label: "Producer", kind: "terminal" }, { id: "p0", label: "Partition 0", detail: "offsets 0,1,2..." }, { id: "p1", label: "Partition 1" }, { id: "p2", label: "Partition 2" }, { id: "c1", label: "Consumer A", detail: "group shipments" }, { id: "c2", label: "Consumer B", detail: "group shipments" }]} edges={[{ from: "p", to: "p0", label: "key hash" }, { from: "p", to: "p1" }, { from: "p", to: "p2" }, { from: "p0", to: "c1" }, { from: "p1", to: "c1" }, { from: "p2", to: "c2" }]} />;
    case "rabbitack":
      return <Diagram direction="horizontal" nodes={[{ id: "pub", label: "Publisher", kind: "terminal" }, { id: "b", label: "RabbitMQ", detail: "exchange to queue" }, { id: "c", label: "Consumer", kind: "terminal" }]} edges={[{ from: "pub", to: "b", label: "publish" }, { from: "b", to: "pub", label: "publisher confirm", dashed: true }, { from: "b", to: "c", label: "deliver" }, { from: "c", to: "b", label: "consumer ack", dashed: true }]} />;
    case "triage":
      return <Table columns={["Layer", "Signals to check"]} rows={[["Application", "Exceptions, 5xx, latency per endpoint, thread pool, GC"], ["Database", "Slow queries, waits, blocking, deadlocks, CPU, connections"], ["Infrastructure", "CPU, memory, restarts, network, disk, AWS Health"], ["Change", "Deployments, config, certificates, vendor changes"]]} />;
    case "doubles":
      return <Table columns={["Double", "Does", "Example"]} rows={[["Stub", "Returns canned data", "GetSite returns a fixed site"], ["Mock", "Returns data and verifies calls", "Verify SendEmail called once"], ["Fake", "Real but lightweight logic", "In-memory repository"]]} />;
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
    <Page title="Pradeep — Interview Q&A Bank (6/9): Your List — IaC, Docker, Kubernetes, CI/CD, Kafka, RabbitMQ, Troubleshooting, Testing" summary={`${QS.length} new answers for questions from your list (sections 10 to 17) that parts 1 to 3 did not already answer. Each card shows which list numbers it answers.`} width="wide">
      <TableOfContents items={[{ label: "Filter and self-quiz", id: "quiz" }, ...topics.map((t) => ({ label: T[t], id: t }))]} />
      <Section heading="Filter and self-quiz" id="quiz">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <Select label="Topic" options={[{ value: "all", label: "All topics" }, ...ORDER.map((t) => ({ value: t, label: T[t] }))]} value={topic} onChange={setTopic} />
          <Segmented options={[{ value: "all", label: "All" }, { value: "B", label: "Basic" }, { value: "I", label: "Intermediate" }, { value: "A", label: "Advanced" }]} value={diff} onChange={setDiff} />
          <Input label="Search" value={search} onChange={setSearch} placeholder="e.g. offset, Dockerfile, mock" />
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


