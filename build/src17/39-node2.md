### nodex | What is the libuv thread pool in Node.js, and when does it become a bottleneck? | libuv thread pool, uv_threadpool_size, node thread pool, node fs crypto thread pool, libuv
Node runs JavaScript on a single main thread, but it isn't single-threaded underneath. libuv, the C library behind Node's event loop, handles I/O in two ways. Network I/O, like sockets and HTTP, uses the operating system's non-blocking mechanisms, epoll, kqueue or IOCP, so it needs no extra threads. Other work that has no good non-blocking API runs on a small libuv thread pool: most file system operations, DNS lookups with dns.lookup, some crypto functions like pbkdf2, scrypt and randomBytes, and zlib compression.

The default pool size is 4 threads. If an app does lots of these operations at once, like hashing passwords for many logins, compressing responses, or reading many files, requests queue for the pool, and latency rises even though CPU and the event loop look fine. A classic surprise is slow outbound HTTP calls caused by dns.lookup waiting behind file or crypto work.

What I do: increase UV_THREADPOOL_SIZE, set as an environment variable before the process starts, up to 1024, sized to the workload and cores; use the async versions of crypto and fs functions, never the Sync versions on request paths; cache DNS results or use connection keep-alive so lookups are rare; and move heavy CPU work, like large compression or image processing, to worker threads or separate services.

To diagnose, I look at event loop delay and pool queueing in profiles or traces; if latency rises while CPU and event loop lag stay low, thread pool saturation is a likely cause.

### nodex | How do you implement JWT authentication with guards in NestJS? | nestjs jwt auth, nestjs guards, passport jwt nestjs, nestjs authguard, nestjs roles guard
NestJS handles authentication and authorisation with guards, which run before a route handler and decide whether the request may continue.

A typical setup for an API that receives tokens from an identity provider like Keycloak or Cognito: install @nestjs/passport and passport-jwt, and create a JwtStrategy. It reads the bearer token, validates the signature using the provider's JWKS endpoint with a library like jwks-rsa, and checks issuer, audience and expiry. Its validate method returns the user object, which Nest attaches to the request.

Then apply AuthGuard('jwt'). I prefer registering it globally with APP_GUARD, so every route is protected by default, and marking the few public routes with a custom @Public() decorator that the guard checks with the Reflector. Secure by default is safer than remembering to add guards.

Authorisation: a RolesGuard reads required roles from a @Roles('admin') decorator via metadata and compares them with roles in the user object, mapped from the token claims. For record-level checks, like "can this user see this site's data", I do the check in the service, with the user passed in, because guards don't know the specific record.

Other pieces: a custom @CurrentUser() parameter decorator to get the user in handlers cleanly; tests that override the guard or generate test tokens signed with a test key; and consistent 401 versus 403 responses through an exception filter.

The same ideas, validate tokens properly, deny by default and check resource ownership, are what I apply in ASP.NET Core too.

### nodex | What are guards, interceptors, pipes and exception filters in NestJS? | nestjs guards interceptors pipes filters, nestjs request lifecycle, nestjs middleware vs interceptor, nestjs pipes validation
NestJS has several building blocks that wrap route handlers, each with a specific job, and they run in a defined order.

Middleware runs first, like Express middleware, with access to the raw request and response. Good for things like request logging or correlation ids that don't need to know which handler will run.

Guards decide whether the request may proceed, returning true or false, or throwing. Used for authentication and authorisation. They know the execution context, so they can read metadata like required roles from decorators.

Interceptors wrap the handler call, before and after, using RxJS. Used for logging timings, transforming responses into a standard shape, caching, adding timeouts, or mapping errors. They're similar to action filters in ASP.NET Core.

Pipes transform and validate input parameters before the handler gets them. The ValidationPipe with class-validator DTOs validates request bodies, and ParseIntPipe converts route parameters. Validation failures become 400 responses automatically. Zod-based pipes are a popular alternative.

Exception filters catch exceptions thrown anywhere and turn them into HTTP responses, so you can return a consistent error format, like ProblemDetails, and log unexpected errors.

The order: middleware, then guards, then interceptors before the handler, then pipes, then the handler, then interceptors after, with exception filters catching errors from any stage.

Each can be applied globally, per controller or per route. For a .NET developer, the mapping is easy: middleware is middleware, guards are authorisation filters, interceptors are action filters, pipes are model binding and validation, and exception filters are exception handlers.

### nodex | How do you add Redis caching to a Node.js service? | redis cache node, ioredis, node caching, cache aside node js, redis client node
For caching in Node, I use Redis through a client like ioredis or the official node-redis package, created once at startup and shared, since clients maintain their own connections and pipelining.

The usual pattern is cache-aside: on a read, try the cache with a key like site:123:summary; on a hit, parse and return it; on a miss, load from the database, store it with an expiry using SET with EX, and return it. On updates, delete or overwrite the related keys.

Details that matter.

Key design: include versions or tenant and study identifiers, like v2:study:42:site:7, so changing the data shape or isolating data is easy.

Serialisation: JSON is simple; for large values, consider compression or storing only what's needed.

Expiry with jitter: add randomness to TTLs so many keys don't expire at the same moment.

Stampede protection: when a hot key expires, many requests may hit the database at once. Use an in-process promise map so concurrent requests for the same key share one load, or a short Redis lock.

Failure handling: Redis being slow or down shouldn't take the service down. Set command timeouts, catch errors and fall back to the database, and add a circuit breaker if needed.

In-process cache as a first layer: a small LRU cache, like lru-cache, for very hot, rarely changing data, in front of Redis.

Monitoring: hit ratio, latency and memory, plus Redis eviction counts.

On AWS this would be ElastiCache; the code stays the same, with TLS and authentication configured.

### nodex | How do you build a reliable message consumer in Node.js for RabbitMQ or Kafka? | node rabbitmq consumer, amqplib, kafkajs consumer, node message consumer, reliable consumer node
The principles are the same as in .NET; the libraries differ.

For RabbitMQ, I use amqplib or a wrapper like amqp-connection-manager, which handles reconnection. For Kafka, kafkajs or the Confluent JavaScript client.

Key practices.

Acknowledge after processing: in RabbitMQ, use manual acks and only ack after the work and database writes succeed. On failure, nack without requeue so the message goes to a retry or dead-letter exchange, instead of looping forever. In Kafka, commit offsets after processing, not before.

Limit concurrency: set the RabbitMQ prefetch count, like 10, so one consumer doesn't grab thousands of messages. In Kafka, control partitions per consumer and process a batch with limited parallelism, keeping order per key where it matters.

Idempotency: messages can be delivered more than once, so record processed message ids, or make operations naturally idempotent with upserts.

Retries with backoff: use delayed retry queues, or a retry topic in Kafka, with a maximum attempt count, then dead-letter with error details.

Validate messages: parse with a schema, like Zod, and dead-letter invalid ones immediately instead of retrying.

Graceful shutdown: on SIGTERM, stop consuming, finish in-flight messages, then close the channel and connection.

Observability: log with message id and correlation id, propagate trace context from message headers, and monitor queue depth, consumer lag, processing time and dead-letter counts.

Don't block the event loop: CPU-heavy processing in a consumer stalls heartbeats and can cause the broker to think the consumer died.

### nodex | How do you integration-test an Express or NestJS API? | supertest, integration test express, nestjs e2e test, test node api, api testing node
Unit tests check functions; integration tests check that routes, middleware, validation, serialisation and data access work together. For Node APIs, I use Supertest with Jest or Vitest.

Express: export the app without calling listen, then in tests call request(app).post('/shipments').send(body).set('Authorization', 'Bearer ' + testToken), and assert the status and body. Supertest starts the app on an ephemeral port automatically.

NestJS: create a testing module with Test.createTestingModule, import the AppModule, override providers that talk to external systems with overrideProvider, then create the Nest application, call init, and use Supertest against app.getHttpServer(). This exercises guards, pipes and filters just like production.

Dependencies.

Database: a real database in a container with Testcontainers, migrated before tests and cleaned between them, gives much more confidence than mocks, especially with ORMs.

External HTTP APIs: mock at the network level with nock or Mock Service Worker for Node, so the real HTTP client code runs.

Auth: sign test tokens with a test key and configure the app to trust it in tests, or override the guard.

Message brokers: an in-memory fake, or a containerised broker for a few key tests.

Good habits: each test arranges its own data, tests are independent so they can run in parallel, and cases cover error paths, like validation failures, 404s and unauthorised access, not just the happy path.

These run in CI on every pull request, the same way I run WebApplicationFactory tests for .NET APIs.

### nodex | What is the built-in Node.js test runner, and would you use it instead of Jest? | node test runner, node:test, node --test, built in test runner node, jest vs node test
Since Node 18, and stable since Node 20, Node has a built-in test runner in the node:test module. You import test and describe from node:test and assertions from node:assert, write tests, and run them with node --test, which finds test files automatically.

What it offers: describe and it style, subtests, before and after hooks, skipping and only, mocking of functions, timers and modules, watch mode, code coverage with a flag, and reporters including TAP, spec and JUnit for CI. It runs test files in separate processes for isolation, in parallel.

Advantages: no dependencies to install, which reduces supply chain risk and setup; fast startup; and it's maintained with Node itself, so it works with the latest Node features, like ES modules and native TypeScript type stripping, without extra configuration.

Where Jest or Vitest are still better: rich ecosystem and integrations, like Testing Library for React; snapshot testing; mature mocking of modules; better watch mode experience; and many teams already know them. For front-end code, Vitest with Vite is the natural choice.

My choice: for small backend libraries, CLI tools or scripts, the built-in runner is great, and keeps the project lean. For larger backend services, either works, and I'd follow the team's existing tool. For a repo with both front end and back end, using Vitest everywhere gives one consistent experience.

Whatever the runner, the important things are the same: fast, independent tests, meaningful assertions, and running them in CI on every change.

### nodex | How do you add OpenTelemetry tracing and metrics to a Node.js service? | opentelemetry node, otel nodejs, node auto instrumentation, node tracing, otel sdk node
OpenTelemetry gives Node services the same traces, metrics and log correlation that I use in .NET, so a request can be followed across both stacks.

Setup: install @opentelemetry/sdk-node and @opentelemetry/auto-instrumentations-node, plus an OTLP exporter. Create the NodeSDK with a resource describing the service name, version and environment, the exporters and the instrumentations, and start it before the rest of the app loads, usually with the --import or --require flag pointing to an instrumentation file. Loading order matters, because instrumentation works by patching modules like http, express, pg and ioredis when they're first required.

Auto-instrumentation then creates spans for incoming HTTP requests, outgoing calls, database queries, Redis commands and messaging clients, and propagates trace context through W3C traceparent headers, so traces connect with .NET and Python services.

Custom spans: use the tracer API around important business operations, adding attributes like study or site ids, while avoiding personal data.

Metrics: use the meter API for counters and histograms, like messages processed or job duration, and the instrumentations emit HTTP metrics.

Logs: configure the logger, like Pino, to include trace and span ids, so logs and traces link together.

Export: send everything to an OpenTelemetry Collector, which forwards to Datadog, Grafana, CloudWatch or another backend, keeping vendor choice out of the code.

Practical tips: set sampling to control cost, check the instrumentation overhead in load tests, and flush telemetry on graceful shutdown so the last spans aren't lost.

### nodex | How do you choose and upgrade Node.js versions for your services? | node lts, node version upgrade, nvmrc, node release schedule, upgrade node version
Node has a predictable release schedule: a new major version every six months, and even-numbered versions become LTS, long-term support, maintained for about 30 months. Odd-numbered versions are short-lived and not for production.

My policy: production services run on an active LTS version, and we upgrade before the version reaches end of life, so we keep getting security fixes.

Keeping versions consistent: an .nvmrc or the engines field in package.json documents the expected version; developers use nvm, fnm or Volta to switch automatically; the Docker base image pins the same major version, like node:22-slim or a digest; and CI uses the same version, so there are no "works on my machine" differences.

Upgrade process.

Read the release notes and breaking changes, like removed APIs, changed defaults or OpenSSL updates.

Update in a branch: Docker image, CI and local tools, then run the full test suite. Pay special attention to native modules, like bcrypt or database drivers, which need versions built for the new Node.

Check deprecation warnings when running tests and the app, since they show what will break next.

Roll out gradually: deploy to test environments, run load tests if performance matters, then production, with monitoring for memory and latency changes.

Automate the reminder: Renovate or Dependabot can propose base image and version updates.

Benefits of staying current: security fixes, performance improvements, and newer features like native fetch, the built-in test runner, and type stripping for TypeScript, which simplify the toolchain.

### nodex | PM2 vs containers: how should you run Node.js in production? | pm2, pm2 vs docker, node process manager, pm2 cluster mode, run node production
PM2 is a process manager for Node: it keeps the app running, restarts it on crashes, runs multiple instances in cluster mode to use all CPU cores, handles log files, supports zero-downtime reloads, and offers basic monitoring. It's popular for deploying Node directly on virtual machines.

Containers with an orchestrator, like ECS, Kubernetes or Azure Container Apps, provide most of the same features at the platform level: restarts on failure, health checks, scaling by running more containers, rolling deployments, and central logging from stdout.

My view: on VMs without containers, PM2 is a solid choice. Use its ecosystem file for configuration, cluster mode for multiple cores, startup scripts so it survives reboots, and log rotation.

With containers, don't use PM2 inside the container in most cases. Run one Node process per container, with node as the command directly or through a small init like tini so signals are handled correctly. Scale by adding containers, not processes inside one container. Running PM2 inside containers hides crashes from the orchestrator, because PM2 restarts the process itself, makes health and resource limits less accurate, and complicates logging.

Exceptions: pm2-runtime is designed for containers if a team really wants PM2 features, and on a large VM-based host, cluster mode is the simplest way to use all cores.

Either way, the app should handle SIGTERM for graceful shutdown, log to stdout in a structured format, and expose a health endpoint, so whichever runner is used can manage it properly.

### nodex | How do you handle file uploads in a Node.js API? | file upload node, multer, busboy, stream upload to s3 node, multipart node express
File uploads arrive as multipart/form-data, which Express doesn't parse by default.

Options.

Multer: Express middleware that parses multipart requests, with memory storage, keeping files as buffers, or disk storage. Simple, but memory storage is dangerous for large files, since everything is held in RAM.

Busboy, which Multer is built on, or Fastify's multipart plugin: give you a stream for each file, so you can pipe it directly to its destination without buffering the whole file.

For larger files, I stream: pipe the upload stream to S3 with the AWS SDK's Upload helper from lib-storage, which does a multipart upload and handles backpressure. Memory stays low no matter how big the file is.

Even better for large files: pre-signed URLs. The API checks authorisation and returns a pre-signed S3 URL, and the browser uploads directly to S3. The API never handles the bytes; an S3 event then triggers processing.

Security and limits.

Limit file size, number of files and field sizes in the parser, and at the reverse proxy.

Check the content type and the file's actual signature, not just the extension.

Generate storage names on the server; never use the client's file name as a path.

Scan for malware before making files available, for example with an asynchronous scanning step.

Store files privately and serve them through authorised endpoints or short-lived signed URLs.

Error handling: clean up partial uploads on failure or client disconnect, and return clear errors for oversized or rejected files.

### nodex | How do you add WebSockets to a Node.js service with ws or Socket.IO? | websockets node, socket.io vs ws, node real time, socket io scaling redis adapter, websocket server node
For real-time features in Node, there are two main choices.

ws is a fast, minimal WebSocket library implementing the standard protocol. Clients can be any WebSocket client, including the browser's native WebSocket. You handle reconnection, heartbeats, rooms and message formats yourself.

Socket.IO is a higher-level framework on top of WebSockets, with fallbacks to HTTP long polling, automatic reconnection, acknowledgements, rooms and namespaces, and broadcasting. Clients must use the Socket.IO client library, because it has its own protocol.

How I'd decide: for internal apps where I want features quickly, Socket.IO saves time. For interoperability with standard clients or maximum performance, ws.

Important concerns either way.

Authentication: validate a token during the connection handshake, and close connections whose tokens expire or are revoked. Don't trust data sent later without checking permissions per action.

Scaling: with several instances behind a load balancer, a message published on one instance must reach clients connected to others. Socket.IO's Redis adapter, or a pub/sub layer like Redis or a broker for ws, solves this. Load balancers need WebSocket support and suitable idle timeouts, and sticky sessions for Socket.IO's polling fallback.

Heartbeats: ping and pong to detect dead connections, since proxies may drop idle connections silently.

Backpressure: don't send faster than a slow client can receive; check buffered amounts and drop or coalesce updates.

Managed options, like API Gateway WebSocket APIs on AWS or Azure Web PubSub, remove the scaling work, which I'd consider for large numbers of connections.

### nodex | How do you write efficient Node.js Lambda functions? | node lambda, lambda nodejs best practices, lambda cold start node, aws sdk v3 lambda, lambda handler node
Node is one of the best runtimes for Lambda because it starts quickly. A few practices make functions faster and cheaper.

Initialise outside the handler: create SDK clients, database connections and configuration at module level, so they're reused across invocations on a warm execution environment. Only per-request work goes inside the handler.

Keep the bundle small: use AWS SDK v3 modular clients, importing only what's needed, and bundle with esbuild, which tree-shakes code into one small file. Smaller packages load faster on cold starts. Avoid heavy frameworks inside functions unless needed.

Use async handlers properly: return a promise, or use async functions, and don't leave work running after returning, because the environment freezes and that work may never finish.

Connections: reuse HTTP connections with keep-alive, which SDK v3 enables by default. For relational databases, use RDS Proxy to avoid exhausting connections when many functions scale out.

Memory setting: CPU scales with memory, so increasing memory often makes functions faster and sometimes cheaper overall. Tools like Lambda Power Tuning find the best setting.

Timeouts: set timeouts close to what's needed, and shorter than upstream timeouts like API Gateway's.

Error handling: for SQS triggers, report partial batch failures so only failed messages are retried; use dead-letter queues or destinations for async invocations.

Observability: structured JSON logs, Powertools for AWS Lambda for logging, metrics and tracing, and X-Ray or OpenTelemetry.

For predictable latency-sensitive endpoints, provisioned concurrency removes cold starts, at extra cost.

### nodex | How does database connection pooling work in Node.js? | node connection pool, pg pool, node postgres pool, mysql2 pool, connection pool size node
Opening a database connection is expensive: TCP, TLS and authentication. A pool keeps a set of open connections and lends them to queries, returning them afterwards.

In Node, with Postgres for example, you create one Pool from the pg library at startup with settings like max connections, idle timeout and connection timeout, and run queries with pool.query, which takes a connection, runs the query and releases it. For transactions, you check out a client with pool.connect, run BEGIN, the queries and COMMIT, and always release it in a finally block, otherwise the pool leaks connections and eventually every request waits forever. ORMs like Prisma, TypeORM and Knex manage a pool internally.

Sizing: because Node handles many concurrent requests on one process, it's easy to send more queries than the database can handle. The pool's max limits concurrency per process. Total connections are max multiplied by the number of processes and containers, which must stay under the database's limit. A smaller pool often gives better throughput than a large one, because databases do best with limited concurrent queries.

Common problems.

Pool exhaustion: slow queries or leaked clients mean requests wait for a connection. Monitor waiting counts and acquisition times.

Serverless: each Lambda instance has its own pool, so scaling out can open thousands of connections; use RDS Proxy or a pooler like PgBouncer, and keep the per-instance pool small.

Connection timeouts: set them so requests fail fast rather than hanging.

On shutdown, call pool.end to close connections cleanly.

### nodex | How do you run background jobs and queues in Node.js with BullMQ? | bullmq, node background jobs, node job queue, redis queue node, repeatable jobs node
Long-running or deferred work, like sending emails, generating reports or calling slow third-party APIs, shouldn't run inside HTTP requests. In Node, BullMQ is a popular job queue built on Redis.

How it works: the API adds a job to a named Queue with data and options, and returns immediately. Separate Worker processes take jobs from the queue and run a processor function. Jobs move through states like waiting, active, completed, failed and delayed, stored in Redis.

Useful features.

Retries with backoff: set attempts and an exponential backoff, so transient failures are retried automatically.

Delayed jobs: run at a later time, like a reminder in two hours.

Repeatable jobs: cron-style schedules, with BullMQ making sure only one instance runs each scheduled job even with several workers, which solves the "job ran twice" problem.

Concurrency per worker and rate limiting, to protect downstream APIs.

Priorities, job dependencies with flows, progress reporting, and events for completed or failed jobs.

Good practices: keep job data small, like ids rather than whole objects; make processors idempotent, since a job may run again after a crash; set removeOnComplete and removeOnFail limits so Redis doesn't fill up; run workers as separate deployments from the API, so they scale independently; handle graceful shutdown with worker.close so active jobs finish; and monitor queue length, failure rates and job duration, with a dashboard like Bull Board.

If guaranteed durability or cross-language consumers matter more, a message broker like RabbitMQ or SQS may be a better fit than a Redis-based queue.

### nodex | How do you debug a Node.js application locally and in production? | debug node, node inspect, chrome devtools node, vscode debug node, node production debugging
Locally: start Node with the --inspect flag, or --inspect-brk to pause on the first line, and attach Chrome DevTools via chrome://inspect, or the VS Code debugger, which can also launch the app directly from a launch configuration. Then set breakpoints, step through code, inspect variables and the call stack, and use conditional breakpoints and logpoints, which print values without changing code. For TypeScript, source maps make breakpoints work on the original .ts files. In tests, Vitest and Jest can also be run under the debugger.

In containers: expose the inspector port only to localhost and use port forwarding, like kubectl port-forward, never exposing it publicly, because the inspector allows running arbitrary code.

In production, attaching a debugger to a live service is risky and rarely allowed, so I rely on other tools.

Structured logs with correlation ids, and log levels that can be raised temporarily through configuration.

Distributed traces to see where time goes across calls.

Metrics like event loop delay, heap usage and garbage collection.

Heap snapshots and CPU profiles: Node can write a heap snapshot on a signal or when memory is near the limit, with flags like --heapsnapshot-near-heap-limit, and CPU profiles with --cpu-prof, which you analyse in DevTools afterwards.

Diagnostic reports: process.report or --report-on-fatalerror writes a JSON report with stack, heap and system information when the process crashes.

Reproducing locally with production-like data and configuration, once the evidence narrows the problem down.

### nodex | Deno and Bun vs Node.js: would you use them for production services? | deno vs node, bun vs node, javascript runtimes, bun runtime, deno runtime
Deno and Bun are newer JavaScript runtimes competing with Node.

Deno, from Node's original creator, focuses on security and modern defaults: permissions are off by default, so a script can't access the network, files or environment unless allowed; TypeScript runs out of the box; it includes a formatter, linter and test runner; and it now supports npm packages and Node APIs for compatibility.

Bun focuses on speed and an all-in-one toolkit: a very fast runtime built on JavaScriptCore, a package manager that installs much faster than npm, a bundler, a test runner and native TypeScript support. It aims for high Node compatibility, so many Node apps run unchanged.

Would I use them in production? It depends on risk tolerance. Node has the largest ecosystem, long-term support releases, mature tooling for observability and profiling, and support from every cloud and platform. Its gaps have narrowed too: native fetch, a test runner, watch mode, and running TypeScript with type stripping.

For core business services in a regulated enterprise, I'd stay on Node LTS, because stability, support and compatibility with monitoring, security scanning and hosting matter more than raw speed.

Where the others make sense: Bun as a fast package manager or test runner in development, or for internal tools and scripts; Deno for scripts where its permission model adds safety, or edge platforms built around it.

I'd evaluate them on a real service with benchmarks and compatibility tests before committing, rather than choosing based on headline performance numbers.

### nodex | How do you hash passwords securely in Node.js? | password hashing node, bcrypt vs argon2, scrypt node, hash passwords nodejs, password storage
Passwords must never be stored in plain text or with fast hashes like MD5 or SHA-256, because attackers with a leaked database can try billions of guesses per second. Password hashing algorithms are deliberately slow and use a unique salt per password.

Options in Node.

Argon2id, through the argon2 package: the current recommendation from OWASP, memory-hard, which makes GPU and specialised hardware attacks expensive. Configure memory, iterations and parallelism to take a reasonable time on your servers.

bcrypt, through bcrypt or bcryptjs: widely used and still acceptable, with a cost factor of at least 10 to 12. It has a 72-byte input limit, so very long passwords are truncated.

scrypt, built into Node's crypto module: memory-hard and needs no native dependencies.

Usage: hash on registration, and verify with the library's verify function, which uses constant-time comparison. Store the full encoded hash, which includes the algorithm, parameters and salt, so you can upgrade parameters later: when a user logs in successfully with an old-parameter hash, rehash with the new parameters.

Performance: hashing is intentionally CPU-heavy. Use the async versions, which run on the libuv thread pool, never the sync versions on request paths, and consider increasing the thread pool size, otherwise a burst of logins blocks other work. Rate-limit login attempts too.

Other practices: check new passwords against breached password lists, and require MFA for sensitive systems.

Best of all, for most business apps, delegate authentication to an identity provider like Keycloak, Cognito or Entra ID, so the application never handles passwords.

### nodex | What is tRPC, and when would you use it instead of REST or GraphQL? | trpc, type safe api typescript, trpc vs rest, trpc vs graphql, end to end type safety
tRPC lets a TypeScript backend expose procedures that a TypeScript front end calls with full type safety, without writing an API schema or generating code. You define a router on the server with queries and mutations, each with an input validator, usually Zod, and a resolver. The client imports only the router's type, and calls procedures like functions, such as trpc.shipments.byId.query({ id }). If the server changes an input or output type, the front end gets a compile error immediately.

Benefits: end-to-end type safety with almost no boilerplate, great developer experience with autocomplete, and integration with TanStack Query for caching and loading states in React.

Limits.

TypeScript on both ends: it only works when the client and server are both TypeScript, ideally in the same monorepo. It doesn't suit public APIs or other languages, like a .NET or mobile client.

Coupling: the front end and back end are tightly linked, which is fine for one product team but not for APIs shared across teams.

Tooling: REST with OpenAPI has better support for documentation, gateways, caching and monitoring.

When I'd use it: a full-stack TypeScript app, like Next.js with a Node backend, owned by one team, where speed of development matters.

When I wouldn't: our architecture, where the backends are .NET and the API is consumed by multiple front ends and partners. There, OpenAPI with generated TypeScript clients gives similar type safety across languages, which is what I'd recommend instead.

### nodex | How do you call .NET or other services from Node.js with gRPC? | grpc node, grpc-js, node grpc client, protobuf node, cross language grpc
gRPC works well across languages, because the contract is a .proto file shared by all services. A .NET service can expose a gRPC API, and a Node service can call it, or the other way around.

In Node, the official library is @grpc/grpc-js, which is pure JavaScript. There are two ways to use the .proto file: load it at runtime with @grpc/proto-loader, which is quick to start but gives no types; or generate TypeScript code with tools like ts-proto or protobuf-es with Connect, which gives typed clients and messages, my preference for TypeScript services.

Creating a client: point it at the service address with TLS credentials, and call methods. Unary calls return a single response; server streaming returns a stream you read with async iteration; client and bidirectional streaming are also supported.

Important settings.

Deadlines on every call, so a slow service doesn't hang the caller; they propagate across hops.

Retries and keep-alive configuration through the service config, with care for idempotency.

Metadata for auth tokens and correlation ids.

Error handling with gRPC status codes, mapped to meaningful errors, like NOT_FOUND to 404 if the Node service exposes REST.

Contract management: keep .proto files in a shared repository or package, version them, and follow protobuf compatibility rules: never reuse field numbers, and add new fields instead of changing existing ones.

For browser clients, gRPC needs gRPC-Web or Connect, so I'd normally keep REST at the edge and gRPC for internal service-to-service calls where performance or streaming matters.

### nodex | What changed in Express 5, and should you upgrade? | express 5, express 5 changes, express v5 migration, express async errors, upgrade express 4 to 5
Express 5 was finally released as stable after many years of Express 4. The changes are mostly about modernising and removing old behaviour.

Key changes.

Async error handling: if an async route handler or middleware returns a rejected promise, Express 5 passes the error to the error-handling middleware automatically. In Express 4, an unhandled rejection in an async handler could hang the request or crash the process, unless you wrapped handlers or used a helper package. This alone is a strong reason to upgrade.

Path matching: the route path syntax moved to a newer path-to-regexp version. Some patterns changed, like wildcards needing names and optional parameters having new syntax, and regular-expression characters in strings are no longer supported. Routes need review during upgrade.

Removed deprecated APIs: things like app.del, res.send with a status number, and several older method signatures were removed, and req.query is now read-only by default with a simpler parser.

Node version: requires a modern Node version, dropping very old ones.

Body parsing changes: the built-in urlencoded parser defaults changed, and some behaviour is stricter.

Should you upgrade? For active services, yes, planned like any major upgrade: read the migration guide, run the codemods where available, update route patterns, run the full integration test suite, and check middleware packages for compatibility.

For new projects, I'd also consider Fastify or NestJS, which offer built-in validation, better performance or structure. But if the team knows Express well, Express 5 is a reasonable, simpler choice than before.
