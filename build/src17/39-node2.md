### nodex | What is the libuv thread pool in Node.js, and when does it become a bottleneck? | libuv thread pool, uv_threadpool_size, node thread pool, node fs crypto thread pool, libuv
So Node runs JavaScript on a single main thread, but underneath it's not really single-threaded. libuv, the C library behind Node's event loop, handles I/O two ways. Network I/O, sockets and HTTP, uses the operating system's non-blocking mechanisms, epoll, kqueue or IOCP, so it needs no extra threads. Other work that has no good non-blocking API runs on a small libuv thread pool. That's most file system operations, DNS lookups through dns lookup, some crypto functions like pbkdf2, scrypt and randomBytes, and zlib compression.

The default pool size is just four threads. If an app does a lot of these at once, hashing passwords for many logins, compressing responses, reading lots of files, requests queue up for the pool, and latency goes up even though CPU and the event loop look fine. A classic surprise is slow outbound HTTP calls, because dns lookup is stuck waiting behind file or crypto work.

What I do. Increase UV_THREADPOOL_SIZE, set as an environment variable before the process starts, up to 1024, sized to the workload and cores. Use the async versions of crypto and fs functions, never the Sync ones on request paths. Cache DNS results or use connection keep-alive so lookups are rare. And move heavy CPU work, big compression or image processing, to worker threads or separate services.

To diagnose it, I look at event loop delay and pool queueing in profiles or traces. If latency's climbing while CPU and event loop lag stay low, thread pool saturation is a pretty likely cause.

### nodex | How do you implement JWT authentication with guards in NestJS? | nestjs jwt auth, nestjs guards, passport jwt nestjs, nestjs authguard, nestjs roles guard
NestJS does authentication and authorisation with guards, which run before a route handler and decide whether the request can continue.

A typical setup for an API getting tokens from an identity provider like Keycloak or Cognito. You install the nestjs passport package and passport-jwt, and create a JwtStrategy. It reads the bearer token, validates the signature against the provider's JWKS endpoint with a library like jwks-rsa, and checks issuer, audience and expiry. Its validate method returns the user object, and Nest attaches that to the request.

Then you apply the JWT auth guard. I prefer registering it globally as an app guard, so every route's protected by default, and marking the few public routes with a custom Public decorator that the guard checks using the Reflector. Secure by default is just safer than remembering to add guards everywhere.

For authorisation, a RolesGuard reads the required roles from a Roles decorator, say admin, through metadata, and compares them with the roles on the user object, mapped from the token claims. For record-level checks, like "can this user see this site's data", I'd do the check in the service with the user passed in, because guards don't know the specific record.

Other pieces, a custom CurrentUser parameter decorator to get the user into handlers cleanly, tests that override the guard or generate test tokens signed with a test key, and consistent 401 versus 403 responses through an exception filter.

And honestly the same ideas, validate tokens properly, deny by default, check resource ownership, are what I apply in ASP.NET Core too.

### nodex | What are guards, interceptors, pipes and exception filters in NestJS? | nestjs guards interceptors pipes filters, nestjs request lifecycle, nestjs middleware vs interceptor, nestjs pipes validation
Right, NestJS has several building blocks that wrap route handlers. Each has a specific job and they run in a set order.

Middleware runs first, like Express middleware, with the raw request and response. Good for request logging or correlation ids, things that don't care which handler runs.

Guards decide whether the request can go ahead, returning true or false, or throwing. That's authentication and authorisation. They know the execution context, so they can read metadata like required roles from decorators.

Interceptors wrap the handler call, before and after, using RxJS. You use them for logging timings, shaping responses into a standard format, caching, timeouts, or mapping errors. They're pretty much action filters in ASP.NET Core.

Pipes transform and validate input parameters before the handler gets them. The ValidationPipe with class-validator DTOs validates request bodies, and ParseIntPipe converts route parameters. Validation failures turn into 400s automatically. Zod-based pipes are a popular alternative.

Exception filters catch exceptions thrown anywhere and turn them into HTTP responses, so you can return a consistent error format like ProblemDetails and log the unexpected ones.

The order is middleware, then guards, then interceptors before the handler, then pipes, then the handler, then interceptors after, and exception filters catch errors from any stage.

Each can be applied globally, per controller or per route. Coming from .NET the mapping's easy. Middleware is middleware, guards are authorisation filters, interceptors are action filters, pipes are model binding and validation, and exception filters are exception handlers.

### nodex | How do you add Redis caching to a Node.js service? | redis cache node, ioredis, node caching, cache aside node js, redis client node
In Node I'd use Redis through a client like ioredis or the official node-redis package, created once at startup and shared, since the client manages its own connections and pipelining.

The usual pattern is cache-aside. On a read, try the cache with a key like site, 123, summary. On a hit, parse it and return. On a miss, load from the database, store it with an expiry using SET with the EX option, and return it. On updates, delete or overwrite the related keys.

The details that matter. Key design, include a version and tenant or study identifiers, like v2, study 42, site 7, so changing the data shape or isolating data is easy.

Serialisation, JSON is simple. For big values, think about compression or storing only what's needed.

Expiry with jitter, add a bit of randomness to TTLs so loads of keys don't expire at the same moment.

Stampede protection. When a hot key expires, lots of requests might hit the database at once. Use an in-process promise map so concurrent requests for the same key share one load, or a short Redis lock. I've seen this one get missed until production traffic shows it.

Failure handling, Redis being slow or down shouldn't take the service down. Set command timeouts, catch errors and fall back to the database, add a circuit breaker if you need it.

An in-process cache as a first layer, a small LRU cache for very hot, rarely changing data, sitting in front of Redis.

Monitoring, hit ratio, latency and memory, plus Redis eviction counts.

On AWS this would be ElastiCache. The code's the same, you just configure TLS and authentication.

### nodex | How do you build a reliable message consumer in Node.js for RabbitMQ or Kafka? | node rabbitmq consumer, amqplib, kafkajs consumer, node message consumer, reliable consumer node
I mean, the principles are exactly the same as in .NET, only the libraries change.

For RabbitMQ, I'd use amqplib or a wrapper like amqp-connection-manager, which handles reconnection. For Kafka, kafkajs or the Confluent JavaScript client.

The key practices. Acknowledge after processing. In RabbitMQ use manual acks and only ack after the work and the database writes succeed. On failure, nack without requeue so the message goes to a retry or dead-letter exchange, instead of looping forever. In Kafka, commit offsets after processing, not before.

Limit concurrency. Set the RabbitMQ prefetch count, like 10, so one consumer doesn't grab thousands of messages. In Kafka, control partitions per consumer and process a batch with limited parallelism, keeping order per key where it matters.

Idempotency, because messages can arrive more than once. Record processed message ids, or make operations naturally idempotent with upserts.

Retries with backoff, delayed retry queues or a retry topic in Kafka, with a max attempt count, then dead-letter with the error details.

Validate messages. Parse with a schema like Zod and dead-letter invalid ones straight away rather than retrying them.

Graceful shutdown. On SIGTERM, stop consuming, finish in-flight messages, then close the channel and connection.

Observability, log with the message id and correlation id, propagate trace context from message headers, and monitor queue depth, consumer lag, processing time and dead-letter counts.

And don't block the event loop. CPU-heavy processing in a consumer stalls heartbeats, and the broker can decide the consumer's dead. That's a Node-specific gotcha you don't really hit in .NET.

### nodex | How do you integration-test an Express or NestJS API? | supertest, integration test express, nestjs e2e test, test node api, api testing node
Unit tests check functions. Integration tests check that routes, middleware, validation, serialisation and data access actually work together. For Node APIs I use Supertest with Jest or Vitest.

For Express, export the app without calling listen. Then in a test you use Supertest's request on the app, post to slash shipments, send a body, set the Authorization header to Bearer plus a test token, and assert the status and the body. Supertest starts the app on a random port by itself.

For NestJS, create a testing module, import the AppModule, override any providers that talk to external systems, then create the Nest application, call init, and point Supertest at the app's HTTP server. That runs guards, pipes and filters just like production, which is the whole point.

Dependencies. For the database, a real one in a container with Testcontainers, migrated before the tests and cleaned between them, gives way more confidence than mocks, especially with ORMs.

External HTTP APIs, mock them at the network level with nock or Mock Service Worker for Node, so the real HTTP client code runs.

Auth, sign test tokens with a test key and configure the app to trust it in tests, or override the guard.

Message brokers, an in-memory fake, or a containerised broker for a few key tests.

Good habits, each test arranges its own data, tests are independent so they can run in parallel, and you cover error paths, validation failures, 404s, unauthorised access, not just the happy path.

These run in CI on every pull request, same as how I run WebApplicationFactory tests for our .NET APIs.

### nodex | What is the built-in Node.js test runner, and would you use it instead of Jest? | node test runner, node:test, node --test, built in test runner node, jest vs node test
Yeah, since Node 18, and stable since 20, Node has a built-in test runner in the node test module. You import test and describe from node colon test and assertions from node colon assert, write your tests, and run them with node dash dash test, which finds test files automatically.

What it gives you, describe and it style, subtests, before and after hooks, skip and only, mocking for functions, timers and modules, watch mode, code coverage with a flag, and reporters including TAP, spec and JUnit for CI. It runs test files in separate processes, in parallel, for isolation.

The advantages are no dependencies to install, which cuts supply chain risk and setup, fast startup, and it's maintained with Node itself, so it works with the latest features like ES modules and native TypeScript type stripping without extra config.

Where Jest or Vitest are still better, the rich ecosystem and integrations, like Testing Library for React, snapshot testing, mature module mocking, a nicer watch mode, and the fact that lots of teams already know them. For front-end code, Vitest with Vite is the natural pick.

I'd say for small backend libraries, CLI tools or scripts, the built-in runner is great and keeps the project lean. For bigger backend services either works, and I'd just follow what the team already uses. For a repo with front end and back end together, Vitest everywhere gives one consistent experience.

Whatever runner you use, what matters is the same, fast, independent tests, meaningful assertions, and running them in CI on every change.

### nodex | How do you add OpenTelemetry tracing and metrics to a Node.js service? | opentelemetry node, otel nodejs, node auto instrumentation, node tracing, otel sdk node
OpenTelemetry gives Node services the same traces, metrics and log correlation I use in .NET, so you can follow a request across both stacks.

Setup, install the OpenTelemetry Node SDK and the Node auto-instrumentations package, plus an OTLP exporter. Create the NodeSDK with a resource describing the service name, version and environment, the exporters and the instrumentations, and start it before the rest of the app loads, usually with the import or require flag pointing at an instrumentation file. Loading order really matters here, because instrumentation works by patching modules like http, express, pg and ioredis when they're first loaded. Get that wrong and honestly you just see nothing.

Auto-instrumentation then creates spans for incoming HTTP requests, outgoing calls, database queries, Redis commands and messaging clients, and propagates trace context through W3C traceparent headers, so traces join up with .NET and Python services.

Custom spans, use the tracer API around important business operations and add attributes like study or site ids, while keeping personal data out.

Metrics, use the meter API for counters and histograms, like messages processed or job duration, and the instrumentations emit HTTP metrics on their own.

Logs, configure the logger, say Pino, to include trace and span ids, so logs and traces link up.

Export everything to an OpenTelemetry Collector, which forwards to Datadog, Grafana, CloudWatch or whatever backend, so vendor choice stays out of the code.

Practical tips, set sampling to control cost, check instrumentation overhead in load tests, and flush telemetry on graceful shutdown so the last spans don't get lost.

### nodex | How do you choose and upgrade Node.js versions for your services? | node lts, node version upgrade, nvmrc, node release schedule, upgrade node version
Node has a pretty predictable release schedule. A new major every six months, and the even-numbered ones become LTS, long-term support, maintained for about 30 months. Odd-numbered versions are short-lived and not meant for production.

My policy is production runs on an active LTS version, and we upgrade before it hits end of life, so we keep getting security fixes.

Keeping versions consistent, an nvmrc file or the engines field in package dot json documents the expected version. Developers use nvm, fnm or Volta to switch automatically. The Docker base image pins the same major, like node 22 slim, or a digest. And CI uses the same version, so there's no "works on my machine" nonsense.

The upgrade process. Read the release notes and breaking changes, removed APIs, changed defaults, OpenSSL updates.

Update in a branch, the Docker image, CI and local tools, then run the full test suite. Watch native modules closely, like bcrypt or database drivers, because they need builds for the new Node. That's usually where things break.

Check deprecation warnings when running tests and the app, since they tell you what'll break next.

Roll out gradually, test environments first, load tests if performance matters, then production, watching memory and latency.

Automate the reminder. Renovate or Dependabot can propose base image and version bumps.

Staying current gets you security fixes, performance improvements, and newer features like native fetch, the built-in test runner and TypeScript type stripping, which simplify the toolchain.

### nodex | PM2 vs containers: how should you run Node.js in production? | pm2, pm2 vs docker, node process manager, pm2 cluster mode, run node production
Let me compare them quickly. PM2 is a process manager for Node. It keeps the app running, restarts it on crashes, runs multiple instances in cluster mode to use all the CPU cores, handles log files, does zero-downtime reloads, and has basic monitoring. It's popular for deploying Node straight onto virtual machines.

Containers with an orchestrator, ECS, Kubernetes or Azure Container Apps, give you most of the same things at the platform level. Restarts on failure, health checks, scaling by running more containers, rolling deployments, and central logging from stdout.

My view, on VMs without containers, PM2 is a solid choice. Use its ecosystem file for configuration, cluster mode for multiple cores, startup scripts so it survives reboots, and log rotation.

With containers, in most cases don't put PM2 inside the container. Run one Node process per container, with node as the command directly, or through a small init like tini so signals get handled properly. Scale by adding containers, not processes inside one. Running PM2 in a container hides crashes from the orchestrator, because PM2 quietly restarts the process itself, it makes health and resource limits less accurate, and it complicates logging.

There are exceptions. pm2-runtime is built for containers if a team really wants PM2 features, and on a big VM-based host, cluster mode is the simplest way to use all the cores.

Either way, the app should handle SIGTERM for graceful shutdown, log structured output to stdout, and expose a health endpoint, so whatever's running it can manage it properly.

### nodex | How do you handle file uploads in a Node.js API? | file upload node, multer, busboy, stream upload to s3 node, multipart node express
Uploads come in as multipart form-data, and Express doesn't parse that by default, so you need something.

Multer is Express middleware that parses multipart requests, with memory storage that keeps files as buffers, or disk storage. Simple, but memory storage is dangerous for large files, since everything sits in RAM.

Busboy, which Multer's built on, or Fastify's multipart plugin, give you a stream per file, so you can pipe it straight to its destination without buffering the whole thing.

For larger files, what I do is stream. Pipe the upload stream to S3 with the Upload helper from the AWS SDK's lib-storage, which does a multipart upload and handles backpressure. Memory stays low however big the file is.

Even better for big files is pre-signed URLs. The API checks authorisation and hands back a pre-signed S3 URL, and the browser uploads directly to S3. The API never touches the bytes, and an S3 event triggers the processing.

Security and limits, and this is where people get burned. Limit file size, number of files and field sizes in the parser, and at the reverse proxy too. Check the content type and the file's actual signature, not just the extension. Generate storage names on the server, never use the client's file name as a path. Scan for malware before files are available, say with an async scanning step. Store files privately and serve them through authorised endpoints or short-lived signed URLs.

And error handling, clean up partial uploads on failure or when the client disconnects, and return clear errors for oversized or rejected files.

### nodex | How do you add WebSockets to a Node.js service with ws or Socket.IO? | websockets node, socket.io vs ws, node real time, socket io scaling redis adapter, websocket server node
So for real-time features in Node you've basically got two main choices.

ws is a fast, minimal WebSocket library that implements the standard protocol. Clients can be any WebSocket client, including the browser's native one. But you handle reconnection, heartbeats, rooms and message formats yourself.

Socket.IO is a higher-level framework on top of WebSockets, with a fallback to HTTP long polling, automatic reconnection, acknowledgements, rooms and namespaces, and broadcasting. Clients have to use the Socket.IO client library, because it has its own protocol.

How I'd decide, for internal apps where I want features quickly, Socket.IO saves time. For interoperability with standard clients or maximum performance, ws.

Either way, a few concerns come up. Authentication, validate a token during the connection handshake, and close connections whose tokens expire or get revoked. Don't trust data sent later without checking permissions per action.

Scaling. With several instances behind a load balancer, a message published on one instance has to reach clients connected to the others. Socket.IO's Redis adapter, or a pub-sub layer like Redis or a broker for ws, solves that. Load balancers need WebSocket support and sensible idle timeouts, plus sticky sessions for Socket.IO's polling fallback.

Heartbeats, ping and pong to detect dead connections, because proxies can drop idle connections silently. That one's caused me some head-scratching in the past.

Backpressure, don't send faster than a slow client can receive. Check the buffered amount and drop or merge updates.

And managed options like API Gateway WebSocket APIs on AWS or Azure Web PubSub take the scaling work away, which I'd look at for really large numbers of connections.

### nodex | How do you write efficient Node.js Lambda functions? | node lambda, lambda nodejs best practices, lambda cold start node, aws sdk v3 lambda, lambda handler node
Node's one of the best runtimes for Lambda because it starts quickly. A few habits make functions faster and cheaper.

Initialise outside the handler. Create SDK clients, database connections and config at module level, so they get reused across invocations on a warm environment. Only per-request work goes inside the handler. I'd say that's the single biggest win.

Keep the bundle small. Use AWS SDK v3's modular clients, importing only what you need, and bundle with esbuild, which tree-shakes everything into one small file. Smaller packages load faster on cold starts. And avoid heavy frameworks inside functions unless you really need them.

Use async handlers properly. Return a promise or use async functions, and don't leave work running after you return, because the environment freezes and that work might never finish. People get bitten by that with fire-and-forget logging.

Connections, reuse HTTP connections with keep-alive, which SDK v3 does by default. For relational databases, use RDS Proxy so you don't exhaust connections when lots of functions scale out.

Memory setting. CPU scales with memory, so bumping memory often makes functions faster and sometimes cheaper overall. Lambda Power Tuning finds the sweet spot.

Timeouts, set them close to what's needed, and shorter than upstream timeouts like API Gateway's.

Error handling, for SQS triggers report partial batch failures so only the failed messages get retried, and use dead-letter queues or destinations for async invocations.

Observability, structured JSON logs, Powertools for AWS Lambda for logging, metrics and tracing, and X-Ray or OpenTelemetry.

For latency-sensitive endpoints that need predictability, provisioned concurrency removes cold starts, at extra cost.

### nodex | How does database connection pooling work in Node.js? | node connection pool, pg pool, node postgres pool, mysql2 pool, connection pool size node
Opening a database connection is expensive, there's TCP, TLS and authentication. A pool keeps a set of open connections and lends them out to queries, then takes them back.

In Node, with Postgres say, you create one Pool from the pg library at startup with settings like max connections, idle timeout and connection timeout, and run queries with pool query, which grabs a connection, runs the query and releases it. For transactions, you check out a client with pool connect, run BEGIN, the queries and COMMIT, and always release it in a finally block. Otherwise the pool leaks connections and eventually every request just waits forever. ORMs like Prisma, TypeORM and Knex manage a pool internally.

Sizing is the interesting bit. Because Node handles lots of concurrent requests in one process, it's easy to throw more queries at the database than it can handle. The pool's max limits concurrency per process. Total connections are max times the number of processes and containers, and that has to stay under the database's limit. A smaller pool often gives better throughput than a big one, because databases do best with limited concurrent queries. That one can catch people out.

Common problems. Pool exhaustion, where slow queries or leaked clients mean requests wait for a connection, so monitor waiting counts and acquisition times. Serverless, where each Lambda instance has its own pool, so scaling out can open thousands of connections. Use RDS Proxy or a pooler like PgBouncer and keep the per-instance pool small. And connection timeouts, set them so requests fail fast instead of hanging.

On shutdown, call pool end to close connections cleanly.

### nodex | How do you run background jobs and queues in Node.js with BullMQ? | bullmq, node background jobs, node job queue, redis queue node, repeatable jobs node
Long-running or deferred work, sending emails, generating reports, calling slow third-party APIs, shouldn't run inside HTTP requests. In Node, BullMQ is a popular job queue built on Redis.

How it works, the API adds a job to a named queue with data and options and returns straight away. Separate worker processes take jobs off the queue and run a processor function. Jobs move through states like waiting, active, completed, failed and delayed, all stored in Redis.

The features I find useful. Retries with backoff, you set attempts and an exponential backoff so transient failures retry on their own. Delayed jobs, like a reminder in two hours. Repeatable jobs on cron-style schedules, where BullMQ makes sure only one instance runs each scheduled job even with several workers, which fixes the classic "job ran twice" problem. Concurrency per worker and rate limiting to protect downstream APIs. And priorities, job dependencies with flows, progress reporting, and events for completed or failed jobs.

Good practices from what I've seen. Keep job data small, ids rather than whole objects. Make processors idempotent, since a job can run again after a crash. Set removeOnComplete and removeOnFail limits so Redis doesn't fill up, which is easy to forget. Run workers as separate deployments from the API so they scale independently. Handle graceful shutdown with worker close so active jobs finish. And monitor queue length, failure rates and job duration, with a dashboard like Bull Board.

If guaranteed durability or consumers in other languages matter more, a broker like RabbitMQ or SQS might fit better than a Redis-based queue.

### nodex | How do you debug a Node.js application locally and in production? | debug node, node inspect, chrome devtools node, vscode debug node, node production debugging
Locally it's pretty easy. Start Node with the inspect flag, or inspect-brk to pause on the first line, and attach Chrome DevTools through the chrome inspect page, or the VS Code debugger, which can also launch the app straight from a launch configuration. Then set breakpoints, step through, look at variables and the call stack, and use conditional breakpoints and logpoints, which print values without changing code. For TypeScript, source maps make breakpoints work on the original ts files. Vitest and Jest can run under the debugger too.

In containers, expose the inspector port only to localhost and use port forwarding, like kubectl port-forward. Never expose it publicly, because the inspector lets anyone run arbitrary code.

In production, attaching a debugger to a live service is risky and rarely allowed, so I lean on other tools.

Structured logs with correlation ids, and log levels you can raise temporarily through configuration.

Distributed traces to see where the time goes across calls.

Metrics like event loop delay, heap usage and garbage collection.

Heap snapshots and CPU profiles. Node can write a heap snapshot on a signal or when memory's near the limit, with the heapsnapshot-near-heap-limit flag, and CPU profiles with the cpu-prof flag, and you analyse them in DevTools afterwards.

Diagnostic reports, where process report or the report-on-fatalerror flag writes a JSON report with the stack, heap and system info when the process crashes.

And then once the evidence narrows it down, I try to reproduce it locally with production-like data and configuration. That's usually where it finally clicks.

### nodex | Deno and Bun vs Node.js: would you use them for production services? | deno vs node, bun vs node, javascript runtimes, bun runtime, deno runtime
Deno and Bun are the newer JavaScript runtimes competing with Node.

Deno comes from Node's original creator and focuses on security and modern defaults. Permissions are off by default, so a script can't touch the network, files or environment unless you allow it. TypeScript runs out of the box, there's a built-in formatter, linter and test runner, and it now supports npm packages and Node APIs for compatibility.

Bun's about speed and being all-in-one. A very fast runtime on JavaScriptCore, a package manager that installs much faster than npm, a bundler, a test runner and native TypeScript. It aims for high Node compatibility, so a lot of Node apps run unchanged.

Would I use them in production? Depends on risk tolerance, honestly. Node has the biggest ecosystem, LTS releases, mature tooling for observability and profiling, and support from every cloud and platform. And its gaps have narrowed, native fetch, a test runner, watch mode, running TypeScript with type stripping.

For core business services in a regulated enterprise, I'd stay on Node LTS, because stability, support and compatibility with monitoring, security scanning and hosting matter more than raw speed.

Where the others make sense, Bun as a fast package manager or test runner in development, or for internal tools and scripts. Deno for scripts where its permission model adds safety, or edge platforms built around it.

And I'd test them on a real service with benchmarks and compatibility tests before committing, not pick based on headline performance numbers.

### nodex | How do you hash passwords securely in Node.js? | password hashing node, bcrypt vs argon2, scrypt node, hash passwords nodejs, password storage
Passwords should never be stored in plain text or with fast hashes like MD5 or SHA-256, because someone with a leaked database can try billions of guesses a second. Password hashing algorithms are slow on purpose and use a unique salt per password.

In Node you've got three good options. Argon2id, through the argon2 package, is the current OWASP recommendation. It's memory-hard, which makes GPU and specialised hardware attacks expensive. You configure memory, iterations and parallelism so it takes a reasonable time on your servers.

bcrypt, through bcrypt or bcryptjs, is widely used and still fine, with a cost factor of at least 10 to 12. It has a 72-byte input limit though, so very long passwords get truncated. Not many people know that.

scrypt is built into Node's crypto module, memory-hard and no native dependencies.

Usage, hash on registration, and verify with the library's verify function, which does a constant-time comparison. Store the full encoded hash, which includes the algorithm, parameters and salt, so you can upgrade parameters later. When a user logs in successfully with an old-parameter hash, rehash with the new ones.

Performance, hashing is intentionally CPU-heavy. Use the async versions, which run on the libuv thread pool, never the sync ones on request paths, and maybe raise the thread pool size, otherwise a burst of logins blocks other work. Rate-limit login attempts too.

Also check new passwords against breached password lists, and require MFA for sensitive systems.

But really, for most business apps I'd say delegate authentication to an identity provider like Keycloak, Cognito or Entra ID, so the app never handles passwords at all.

### nodex | What is tRPC, and when would you use it instead of REST or GraphQL? | trpc, type safe api typescript, trpc vs rest, trpc vs graphql, end to end type safety
tRPC lets a TypeScript backend expose procedures that a TypeScript front end calls with full type safety, without writing an API schema or generating code. On the server you define a router with queries and mutations, each with an input validator, usually Zod, and a resolver. The client imports only the router's type and calls procedures like functions, so something like trpc dot shipments dot byId dot query with an id. If the server changes an input or output type, the front end gets a compile error straight away.

What's nice is end-to-end type safety with almost no boilerplate, great autocomplete, and it plugs into TanStack Query for caching and loading states in React.

The limits. It needs TypeScript on both ends, ideally in the same monorepo. It doesn't suit public APIs or other languages, like a .NET or mobile client.

The front end and back end are tightly coupled, which is fine for one product team but not for APIs shared across teams.

And tooling, REST with OpenAPI has much better support for docs, gateways, caching and monitoring.

When I'd use it, a full-stack TypeScript app, like Next.js with a Node backend, owned by one team, where speed of development matters.

When I wouldn't is basically our kind of architecture, where the backends are .NET and the API is consumed by multiple front ends and partners. There, OpenAPI with generated TypeScript clients gives similar type safety across languages, and that's what I'd recommend instead.

### nodex | How do you call .NET or other services from Node.js with gRPC? | grpc node, grpc-js, node grpc client, protobuf node, cross language grpc
Okay, gRPC works really well across languages, because the contract is a proto file shared by every service. A .NET service can expose a gRPC API and a Node service can call it, or the other way round.

In Node, the official library is grpc-js, which is pure JavaScript. You can use the proto file two ways. Load it at runtime with proto-loader, which is quick to start with but gives you no types. Or generate TypeScript code with tools like ts-proto or protobuf-es with Connect, which gives typed clients and messages. For TypeScript services I'd go with that one.

Creating a client, you point it at the service address with TLS credentials and call methods. Unary calls return a single response, server streaming gives you a stream you read with async iteration, and client and bidirectional streaming are supported too.

Important settings. Deadlines on every call, so a slow service doesn't hang the caller, and they propagate across hops. Retries and keep-alive through the service config, with care for idempotency. Metadata for auth tokens and correlation ids. And error handling with gRPC status codes, mapped to meaningful errors, like NOT_FOUND to a 404 if the Node service exposes REST.

Contract management, keep proto files in a shared repo or package, version them, and follow the protobuf compatibility rules. Never reuse field numbers, and add new fields instead of changing existing ones.

For browser clients, gRPC needs gRPC-Web or Connect, so I'd normally keep REST at the edge and use gRPC for internal service-to-service calls where performance or streaming matters.

### nodex | What changed in Express 5, and should you upgrade? | express 5, express 5 changes, express v5 migration, express async errors, upgrade express 4 to 5
Express 5 finally went stable after years and years of Express 4. The changes are mostly about modernising and removing old behaviour.

The big one for me is async error handling. If an async route handler or middleware returns a rejected promise, Express 5 passes the error to the error-handling middleware automatically. In Express 4, an unhandled rejection in an async handler could hang the request or crash the process, unless you wrapped every handler or used a helper package. That alone is a strong reason to upgrade.

Path matching moved to a newer path-to-regexp version. Some patterns changed, wildcards need names now, optional parameters have new syntax, and regex characters in strings aren't supported anymore. So routes need a review during the upgrade.

Deprecated APIs got removed, things like app dot del, res send with a status number, and several older method signatures. And req query is read-only by default now with a simpler parser.

It needs a modern Node version, very old ones are dropped. And body parsing changed a bit, the built-in urlencoded parser defaults are different and some behaviour's stricter.

Should you upgrade? For active services, yes, planned like any major upgrade. Read the migration guide, run the codemods where they exist, update route patterns, run the full integration test suite, and check middleware packages for compatibility.

For new projects I'd also look at Fastify or NestJS, which give built-in validation, better performance or more structure. But if the team knows Express well, Express 5 is a reasonable, simpler choice than it used to be.

