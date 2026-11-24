### nodex | process.nextTick vs setImmediate vs setTimeout: in what order do they run? | nexttick vs setimmediate, microtask vs macrotask, event loop phases node, settimeout 0, promise then order
They all schedule code to run later, but in different queues.

Microtasks run as soon as the current operation finishes, before the event loop moves on. In Node, process.nextTick callbacks run first, then promise callbacks, like then and the continuation after await. Both queues are drained completely before anything else happens.

Macrotasks run in the event loop's phases. setTimeout and setInterval callbacks run in the timers phase, once their delay has passed. setTimeout of zero actually means at least about one millisecond. setImmediate callbacks run in the check phase, right after the poll phase, where I/O callbacks are processed.

So within the same synchronous block: nextTick runs first, then promises, then the timers and immediates. Between setTimeout of zero and setImmediate, the order from the main module isn't guaranteed, because it depends on how fast the loop starts. But inside an I/O callback, setImmediate always runs before setTimeout of zero, because the check phase comes right after the poll phase.

In browsers there's no nextTick or setImmediate; promise microtasks run before the next macrotask, like a timer or a rendering step.

The practical lesson: recursively scheduling nextTick or promise callbacks can starve the event loop, because I/O never gets a turn. When I need to yield to let I/O run, I use setImmediate.

### nodex | Worker threads vs child processes vs cluster in Node.js: when do you use each? | worker threads, child process node, cluster module, cpu intensive node, multi core node, pm2 cluster
Node runs JavaScript on a single main thread, so CPU-heavy work blocks everything else, and one process only uses one CPU core for JavaScript. These three features address that in different ways.

Worker threads run JavaScript in separate threads inside the same process, each with its own event loop and memory, communicating by message passing, and able to share memory with SharedArrayBuffer. They're for CPU-intensive tasks, like parsing a large file, image processing, encryption or complex calculations, so the main thread stays responsive. A pool of workers, using a library like Piscina, avoids the cost of starting threads repeatedly.

Child processes start separate operating system processes with spawn, exec or fork. They're for running external programs, like a command-line tool or a Python script, or isolating risky work, since a crash doesn't affect the parent. They have more overhead than threads.

The cluster module starts several copies of the whole Node server, typically one per CPU core, sharing the same port, with the primary process distributing connections. It's for using all cores to handle more HTTP requests. PM2 does this for you.

In containers, though, I usually prefer running one Node process per container and scaling the number of containers with the orchestrator, like ECS or Kubernetes, which is simpler and gives better health checks and restarts. Workers are then used only for specific CPU-heavy tasks.

### nodex | What are streams in Node.js, and how does backpressure work with pipeline? | node streams, readable writable transform, backpressure node, stream pipeline, process large file node
Streams process data piece by piece, in chunks, instead of loading it all into memory. There are four types: Readable, like reading a file or an HTTP request; Writable, like writing a file or an HTTP response; Duplex, both, like a TCP socket; and Transform, a duplex that modifies data passing through, like gzip compression or CSV parsing.

With streams, I can process a 5 GB file with a few megabytes of memory, and start sending output before the input is fully read.

Backpressure is what keeps memory under control when the writer is slower than the reader. A writable stream's write method returns false when its internal buffer is full. A well-behaved producer then pauses until the drain event says it can continue. If code ignores this and keeps writing, data piles up in memory, and the process can crash.

The pipe method handles backpressure automatically, but it didn't handle errors well: an error in one stream didn't destroy the others, causing leaks. So the recommended way is stream.pipeline, or the promise version from stream/promises, which connects the streams, handles backpressure, forwards errors, and cleans up all streams when any of them fails or finishes.

Readable streams are also async iterable, so for await over a stream is a clean way to process chunks one by one, with backpressure handled naturally.

[I used a pipeline of a file read stream, a CSV parser and a batching transform to load large extract files without memory spikes.]

### nodex | What is a Buffer in Node.js? | buffer node, binary data node, buffer vs string, buffer encoding, buffer.from, uint8array
A Buffer represents raw binary data in Node.js: a fixed-size sequence of bytes. JavaScript strings are text, made of UTF-16 characters, so they aren't suitable for binary content like files, images, network packets, encrypted data or compressed data. Buffers fill that gap. Today, Buffer is a subclass of Uint8Array, so it works with standard typed array APIs too.

I create buffers with Buffer.from, from a string with an encoding, an array, or another buffer, and Buffer.alloc for a zero-filled buffer of a given size. Converting back uses toString with an encoding, like utf8, base64 or hex. That's how I encode binary data as Base64 for JSON, or compute a hex digest.

Some important points. Encoding matters: reading UTF-8 bytes as Latin-1 garbles text, and cutting a buffer in the middle of a multi-byte character breaks it, which is why streams use a StringDecoder when converting chunks to text. Buffer.allocUnsafe is faster because it doesn't zero the memory, but it may contain old data, which can leak sensitive information if not fully overwritten, so I only use it when I immediately fill it. Comparing buffers containing secrets, like HMAC signatures, should use crypto.timingSafeEqual, not equality checks. And large buffers held in memory count against the process's memory, so for big data, streams are better than reading whole files into buffers.

### nodex | CommonJS vs ES modules in Node.js: what are the differences? | commonjs vs esm, require vs import, es modules node, type module package.json, cjs esm interop, dual package
CommonJS is Node's original module system: require to import, module.exports to export. It loads modules synchronously, at runtime, and require can be called anywhere, even conditionally.

ES modules are the JavaScript standard: import and export statements, used in browsers and modern tooling. Imports are static and analysed before the code runs, which enables tree shaking in bundlers and top-level await. Loading is asynchronous.

In Node, a file is treated as ES module if it has the .mjs extension, or if the nearest package.json has "type": "module" and the file is .js. Otherwise .js is CommonJS, and .cjs is always CommonJS.

The differences that matter in practice. In ESM, file imports need the extension, like import from './utils.js'. __dirname and __filename don't exist; I use import.meta.dirname or import.meta.url. JSON imports need an import attribute. ESM can import CommonJS packages, though named exports may not always be detected. CommonJS historically couldn't require ES modules at all, only use dynamic import, but since Node 22, require of synchronous ES modules works, which removed a lot of pain.

For TypeScript projects, the module and moduleResolution settings, like NodeNext, must match the chosen system.

New projects should use ES modules; libraries often publish both formats, using the exports field in package.json.

### nodex | What are the important fields in package.json? | package.json fields, exports field, engines field, scripts npm, dependencies vs devdependencies vs peerdependencies, main module types
package.json describes a Node project or package, and a few fields matter a lot.

name and version identify the package; version follows semantic versioning when published.

dependencies are packages needed at runtime, devDependencies are only needed for development and building, like TypeScript, test frameworks and linters, which matters because production installs can skip them. peerDependencies declare packages the consumer must provide, like React for a component library, so only one copy exists. optionalDependencies may fail to install without failing the whole install.

scripts define commands, like build, test, lint and start, run with npm run. Pre and post hooks run automatically, so I'm careful with install scripts, which also run for dependencies and are a supply-chain risk.

type set to module makes .js files ES modules.

exports is the modern way to define a package's public entry points, with conditions for import versus require, types, and subpaths. It also hides internal files: anything not listed can't be imported, which is great for library authors. main and module are the older entry fields.

types points to the TypeScript declarations.

engines declares supported Node versions, and with engine-strict, npm can enforce it.

files lists what gets published, and private true prevents accidental publishing of an application.

Along with package.json, the lockfile, package-lock.json, must be committed, so installs are reproducible.

### nodex | npm install vs npm ci, and how do semantic version ranges work? | npm ci vs npm install, caret vs tilde version, semver ranges, package-lock.json, reproducible builds node
npm install installs dependencies from package.json and may update package-lock.json if versions within the allowed ranges have changed or if package.json changed. It's what developers use when adding or updating packages.

npm ci is for continuous integration and production builds. It deletes node_modules, installs exactly the versions recorded in package-lock.json, and fails if package.json and the lockfile don't match. It never modifies the lockfile. So builds are reproducible, and usually faster. In pipelines, I always use npm ci, often with caching of the npm cache directory.

Version ranges in package.json follow semantic versioning: major.minor.patch. A caret, like ^4.2.1, allows any version below the next major: 4.3.0 is fine, 5.0.0 isn't. It assumes minor and patch releases are backward compatible. For 0.x versions, caret is stricter, because 0.x minors can break. A tilde, like ~4.2.1, allows only patch updates: 4.2.9 but not 4.3.0. An exact version pins precisely.

The lockfile is what really decides what's installed; the ranges decide what updates are allowed when someone runs npm update or regenerates the lockfile.

In practice, I commit the lockfile, let Dependabot or Renovate propose updates as pull requests with the test suite running, and use exact versions for packages known to break in minor releases. pnpm and Yarn have equivalents, like pnpm install with frozen-lockfile.

### nodex | Express vs Fastify vs NestJS: how do you choose? | express vs fastify vs nestjs, node framework comparison, nestjs, fastify performance, which node framework
Express is the classic, minimal web framework for Node. It's simple, extremely well known, and has a huge ecosystem of middleware. But it's unopinionated, so large projects need their own structure, and historically it had weak async error handling and limited TypeScript support. Express 5, released in late 2024, finally handles rejected promises in route handlers properly.

Fastify is a performance-focused framework with a similar feel. It's significantly faster than Express, thanks to optimised routing and JSON serialisation using schemas. It has built-in JSON Schema validation for requests and responses, a structured plugin system with encapsulation, first-class async support, built-in logging with Pino, and good TypeScript support.

NestJS is a full application framework built on top of Express or Fastify. It brings structure inspired by Angular and ASP.NET Core: modules, controllers, providers, dependency injection with decorators, guards, interceptors, pipes for validation, and integrations for GraphQL, microservices, queues and OpenAPI. For developers coming from .NET or Angular, it feels very familiar.

My choice: a small, focused service or a simple BFF: Fastify, or Express if the team knows it well. A larger application with many developers and complex domains: NestJS, because the enforced structure and DI keep it maintainable. Performance-critical endpoints: Fastify, possibly as NestJS's underlying adapter.

### nodex | How does dependency injection work in NestJS? | nestjs dependency injection, nestjs modules providers, injectable nestjs, nestjs vs asp.net core di, provider scopes nestjs
NestJS has a dependency injection container very similar to ASP.NET Core's and Angular's.

A class marked with the Injectable decorator is a provider. I register providers in a module's providers array, and inject them through constructor parameters; Nest resolves them using TypeScript metadata about the parameter types. Controllers, guards, interceptors and pipes all get their dependencies this way.

Modules organise the app into features. Each module declares its providers and controllers, exports the providers that other modules may use, and imports other modules it depends on. A provider is private to its module unless exported, which helps keep features encapsulated. Global modules, or dynamic modules with forRoot and forFeature, are used for shared infrastructure, like configuration or database connections.

Custom providers handle more cases: useValue for constants or mocks, useClass to swap implementations, useFactory for values that need logic or async setup, like creating a database client, and injection tokens, strings or symbols, for things that aren't classes, since TypeScript interfaces don't exist at runtime.

Scopes are like .NET lifetimes: the default is singleton, shared across the app; REQUEST scope creates a new instance per request; and TRANSIENT gives each consumer its own instance. Request scope bubbles up the dependency chain and costs performance, so I use it only when needed.

Testing is easy: the testing module lets me override providers with mocks.

### nodex | How do you handle unhandled promise rejections and graceful shutdown in Node.js? | unhandled rejection node, uncaughtexception, graceful shutdown node, sigterm node, process exit node
Since Node 15, an unhandled promise rejection crashes the process by default, just like an uncaught exception. That's deliberate: continuing after an unexpected error can leave the app in an inconsistent state.

I handle errors where they happen, with try-catch around awaits and catch on promises that aren't awaited. As a safety net, I register process.on for unhandledRejection and uncaughtException to log the error with full details. But after an uncaught exception, the process state is unknown, so I log and exit with a non-zero code, and let the orchestrator, like ECS, Kubernetes or PM2, restart a fresh instance. I don't try to keep running.

Graceful shutdown is about handling planned stops, like deployments or scale-in. The orchestrator sends SIGTERM, and after a grace period, SIGKILL. On SIGTERM, the app should stop accepting new connections, with server.close; fail its readiness check, so the load balancer stops sending traffic; let in-flight requests finish; stop consuming new messages from queues, and finish or release the current ones; close database pools and other connections; and then exit. A timeout forces exit if something hangs.

In Docker, the Node process must receive the signals. If it's started through npm start or a shell script, signals may not reach it, so I run node directly as the main process, or use an init like tini, or the --init flag.

### nodex | How do you find a memory leak in a Node.js application? | node memory leak, heap snapshot node, inspect node memory, heap out of memory, chrome devtools node memory
The symptom is memory that grows steadily over time, until the process crashes with "JavaScript heap out of memory", or the container is killed for exceeding its memory limit.

First, I confirm it's a leak and not just a high but stable working set. Monitoring process.memoryUsage, especially heapUsed, over hours shows whether memory returns to a baseline after garbage collection or keeps climbing.

To find the cause, I take heap snapshots. I run Node with --inspect and connect Chrome DevTools, or use the inspector API, or start with --heapsnapshot-signal, so sending a signal writes a snapshot, which is handy in a container. I take one snapshot after warm-up, run some load, take another, and compare them. The comparison view shows which object types grew, and the retainers path shows what's keeping them alive.

Common causes in Node. Global or module-level caches, like a plain object or Map used as a cache without any size limit or expiry. Event listeners added repeatedly and never removed, often with the MaxListenersExceededWarning as a hint. Closures that capture large objects, held by long-lived timers or callbacks. Unbounded arrays, like collecting metrics or logs in memory. And unresolved promises that pile up.

Fixes are usually bounded caches, like lru-cache, removing listeners, and clearing timers. The --max-old-space-size flag only delays the crash, though it's important to set it to suit the container's memory.

### nodex | How do you profile CPU usage in a Node.js service? | node cpu profiling, node --prof, clinic.js, flame graph node, event loop lag, blocked event loop
High CPU in Node often shows up as slow responses for everyone, because one busy main thread delays every request. So first I measure event loop lag, how long callbacks wait to run, using perf_hooks' monitorEventLoopDelay or metrics from APM tools. High lag means something is blocking the loop.

To find what, I take a CPU profile. Options: run with --inspect and record a profile in Chrome DevTools' Performance or Profiler tab; use --cpu-prof, which writes a profile file when the process exits; or use Clinic.js, which runs the app under load and produces a flame graph and a diagnosis of whether the issue is CPU, I/O or the event loop. Linux perf with --perf-basic-prof works for system-level profiling, and APM tools like Datadog or New Relic offer continuous profiling in production.

In a flame graph, wide bars are functions that use a lot of CPU time. Typical findings: synchronous functions like readFileSync or crypto's sync methods in request paths; JSON.parse and JSON.stringify of very large payloads; expensive regular expressions, sometimes vulnerable to catastrophic backtracking; heavy loops over large arrays; and logging too much, synchronously.

Fixes include switching to async APIs, streaming large payloads, caching results, moving CPU-heavy work to worker threads or another service, and simplifying regexes.

### nodex | How do you manage and validate configuration in a Node.js service? | node configuration, dotenv, validate env variables, zod env, process.env, config management node
Configuration comes from environment variables, following the twelve-factor approach: the same build runs everywhere, with different environment variables set by the platform, like ECS task definitions or Kubernetes ConfigMaps and Secrets.

For local development, a .env file loaded with dotenv, or Node's built-in --env-file flag since Node 20, provides values. The .env file is in .gitignore, and a .env.example with dummy values documents what's needed.

The important part is validating configuration at startup. process.env values are all strings or undefined, so a typo or a missing variable otherwise causes a confusing failure much later. I define a schema, with Zod or envalid, for example PORT as a number with a default, DATABASE_URL as a required URL, LOG_LEVEL as one of a few values, and FEATURE_X as a boolean parsed from the string. At startup, the app parses process.env with the schema; if anything is missing or invalid, it logs a clear message listing the problems and exits immediately. The result is a typed config object that the rest of the app imports, instead of reading process.env all over the code.

Secrets, like database passwords and API keys, come from a secret store, injected as environment variables by the platform or fetched at startup from AWS Secrets Manager or Parameter Store, and are never logged.

In NestJS, the ConfigModule supports the same validation approach.

### nodex | How do you do structured logging in Node.js? | node logging, pino, winston, structured logging node, json logs node, log correlation id node
I use structured logging: each log entry is a JSON object with fields, not just a text line, so logs can be searched and filtered in a central system, like by request id, user id or error type.

Pino is my preferred library, because it's very fast and produces JSON by default. Logging is a hot path, and slow logging blocks the event loop. Winston is another popular option, more flexible but slower. I create one logger configured with the level from configuration, and child loggers that add context, like logger.child with the module name, or per request with the request id.

For HTTP services, pino-http or the framework's integration logs each request with method, route, status code and duration, and attaches a request-scoped logger. To carry the request id or trace id into every log line, including deep in service code, I use AsyncLocalStorage, which keeps per-request context across async calls, or the OpenTelemetry integration, which adds trace and span ids automatically, so logs and traces link up.

Good practices: log at appropriate levels, info for significant events and error with the full error object, so the stack is captured; redact sensitive fields, which Pino supports with paths like headers.authorization; avoid logging whole request bodies; and write to standard output, letting the platform collect logs, rather than writing files inside containers.

In development, pino-pretty makes the JSON human-readable.

### nodex | How do you validate request input in a Node.js API? | node request validation, zod express, joi validation, class-validator nestjs, json schema validation fastify, validate body node
Every request body, query string and path parameter is untrusted input, so I validate it at the edge, before it reaches business logic.

The approach depends on the framework. With Express, I use a schema library like Zod or Joi, and a small middleware that validates req.body, req.query and req.params against the route's schema. If validation fails, it responds with 400 and a structured list of errors; if it passes, it replaces the raw input with the parsed, typed values, so defaults and type coercion are applied. With Zod, the TypeScript type is inferred from the schema, so the handler is typed without separate interfaces.

Fastify has validation built in using JSON Schema on each route, compiled for speed with Ajv. Response schemas also speed up serialisation and prevent leaking extra fields. TypeBox or Zod type providers give TypeScript types from those schemas.

NestJS uses DTO classes with class-validator decorators, like IsString and IsInt, and a global ValidationPipe with whitelist and forbidNonWhitelisted options, which strip or reject unknown properties, protecting against mass assignment. Zod-based pipes are an alternative.

Whatever the tool, I validate types, required fields, lengths, ranges, formats and allowed values, limit body size, and reject unknown fields for sensitive endpoints. Business-rule validation, like whether a site is active, happens later, in the service layer.

### nodex | Prisma vs TypeORM vs Knex vs Drizzle: how do you choose a data access library in Node? | prisma vs typeorm, knex query builder, drizzle orm, node orm comparison, database access node typescript
These are the main options for database access in Node with TypeScript, at different levels of abstraction.

Prisma defines the data model in its own schema file, generates a fully typed client, and handles migrations. Queries are very type-safe, and autocomplete is excellent. It's productive and popular. The trade-offs are its own schema language, less control over generated SQL, and some complex queries needing raw SQL.

TypeORM is a classic ORM with decorators on entity classes, similar to Entity Framework or Hibernate, supporting Active Record and Data Mapper patterns, relations and migrations. It's familiar for developers from .NET or Java, but its type safety for queries is weaker, and it has had a reputation for bugs and slower maintenance.

Knex is a query builder, not a full ORM. I write queries in JavaScript that map closely to SQL, with migrations and seeds. It gives control and flexibility, but little type safety by itself.

Drizzle is a newer, lightweight, TypeScript-first ORM. The schema is defined in TypeScript, queries look like SQL but are fully typed, it's fast, and it works well in serverless environments.

My choice: Prisma or Drizzle for new TypeScript services, Drizzle when I want SQL-like control and small footprint, plain SQL with a driver like pg for very simple services or heavy reporting.

In all cases, I use parameterised queries, connection pooling, and migrations run in the pipeline.

### nodex | How should you run a Node.js app in Docker? | node docker best practices, node dockerfile, node user docker, npm ci docker, multi stage node docker, node pid 1
There are a few practices I always follow for Node containers.

Use an official, slim base image with a specific Node LTS version, like node:22-slim or Alpine, pinned, never latest.

Use a multi-stage build. The build stage installs all dependencies with npm ci and compiles TypeScript. The final stage copies only the compiled output and production dependencies, installed with npm ci --omit=dev, so dev tools and source files aren't in the image.

Order the Dockerfile for caching: copy package.json and package-lock.json first, install dependencies, then copy the source. Then code changes don't reinstall dependencies.

Use a .dockerignore to exclude node_modules, .git, .env files and test files.

Don't run as root: the official images have a node user, and I switch to it with USER node.

Set NODE_ENV to production, which many libraries use to enable optimisations.

Handle signals properly: start with CMD node dist/server.js directly, not npm start, so the Node process receives SIGTERM for graceful shutdown. Or use tini, or docker run with --init, to handle PID 1 duties like reaping zombie processes.

Set memory limits consistently: Node's heap limit should fit within the container's memory limit, using --max-old-space-size if needed.

Add a health check endpoint for the orchestrator, and log to standard output.

Finally, scan the image for vulnerabilities in the pipeline.

### nodex | How do you run TypeScript in Node.js: tsc, tsx, or native type stripping? | run typescript node, ts-node vs tsx, node type stripping, tsc build node, typescript node 22 23
There are now several ways, and they fit different stages.

Compile with tsc: TypeScript compiles .ts files to JavaScript in a dist folder, and Node runs the JavaScript. It's the traditional, reliable production approach. tsc also does full type checking, which runtime tools skip.

Run directly in development with a loader. ts-node was the original tool, but it's slower and had ES module issues. tsx, which uses esbuild, is now popular: tsx watch src/server.ts runs TypeScript directly, very fast, with reload on changes. It strips types without checking them, so I run tsc --noEmit separately in the editor or pipeline.

Native type stripping: since Node 22.6 behind a flag, and enabled by default from Node 23.6 and later 22.x versions, Node can run .ts files directly by removing type annotations. It only supports erasable syntax, meaning types that can simply be deleted. Features that generate code, like enums, namespaces and parameter properties in constructors, aren't supported unless using the transform option, and TypeScript added the erasableSyntaxOnly setting to flag them. It doesn't read tsconfig paths and doesn't type-check.

Bundlers like esbuild or tsup can also produce a single optimised JavaScript file, which is great for Lambda functions.

My setup: tsx or native stripping for development, tsc type checking in CI, and compiled JavaScript or a bundle in production images.

### nodex | What is AsyncLocalStorage in Node.js? | asynclocalstorage, async context node, request context node, correlation id node, cls hooked
AsyncLocalStorage, from the async_hooks module, lets me store data that's available throughout an asynchronous call chain, without passing it explicitly through every function. It's similar to AsyncLocal in .NET, or thread-local storage, but follows async operations instead of threads.

I create one AsyncLocalStorage instance. At the start of each request, a middleware calls run with a context object, like the request id, the user id and a request-scoped logger, and the rest of the request handling runs inside that callback. Anywhere deeper in the code, in services, repositories, or the logger, getStore returns the context for the current request, even after many awaits, timers and promise chains, and different concurrent requests each see their own context.

Common uses: adding the correlation or trace id to every log line automatically; tracking the current user or tenant for auditing or multi-tenant data access; and request-scoped caching. OpenTelemetry's Node SDK uses it to keep track of the active span, which is how traces propagate automatically.

Some cautions. Context can be lost with some older callback-based libraries or custom thenables, though that's rare now. It adds a small performance cost. And it's easy to overuse; explicit parameters are clearer for core business data, so I keep it for cross-cutting concerns like logging and tracing.

Node 24 improved its implementation and performance.

### nodex | Why does Node warn about MaxListenersExceeded, and how do EventEmitters leak? | eventemitter memory leak, maxlistenersexceededwarning, remove event listener node, eventemitter node, once listener
EventEmitter is Node's built-in publish-subscribe mechanism. Many core objects, like streams, servers and sockets, are emitters, and code subscribes with on and unsubscribes with off or removeListener.

By default, an emitter warns when more than 10 listeners are added for the same event: "MaxListenersExceededWarning: Possible EventEmitter memory leak detected". It's a heuristic, not an error, but it usually points to a real bug: code that adds a listener repeatedly, like on every request or every retry, without removing it. Each listener stays referenced by the emitter, along with everything its closure captures, so memory grows, and the handler runs many times for each event, causing duplicate work.

Typical examples: adding an error or close listener to a long-lived shared connection inside a request handler; subscribing to process events in a function that's called repeatedly; or a reconnection loop that re-registers handlers.

Fixes: register listeners once, at setup time, rather than per operation; use once for listeners that should only fire one time; always remove listeners when the work is done, in a finally block or cleanup function; and use AbortSignal with events.on or the signal option, which removes listeners automatically when aborted. events.once also returns a promise for waiting on a single event.

Raising the limit with setMaxListeners is only appropriate when many listeners are genuinely expected, not to silence the warning.

### nodex | How does error handling work for async route handlers in Express? | express async error handling, express 5 promises, express error middleware, async handler express, unhandled rejection express
In Express 4, if an async route handler threw an error or a promise rejected, Express didn't catch it. The rejection was unhandled, the request hung until it timed out, and in modern Node, the unhandled rejection could crash the process. So everyone wrapped handlers with try-catch and called next with the error, or used a helper like express-async-handler, or the express-async-errors package, which patches Express.

Express 5, which became the stable release in late 2024, fixed this. When a handler or middleware returns a rejected promise, Express automatically passes the error to the error-handling middleware. So async handlers can simply throw.

Either way, I have one central error-handling middleware, the special four-argument function, registered after all routes. It maps known error types to responses, like a ValidationError to 400 with details, NotFoundError to 404, and a custom AppError with its own status code and error code, and for anything unexpected, logs the full error with the request id and returns a generic 500 without internal details. Responses use a consistent format, like Problem Details.

I also add a 404 handler for unknown routes, and make sure errors in streams or background callbacks are handled where they occur, since they aren't part of the request's promise.

### nodex | How do you avoid blocking the event loop in Node.js? | blocking event loop, sync functions node, json parse large, redos, cpu work node, event loop blocked
Node handles all JavaScript for all requests on one thread. If one operation takes 200 milliseconds of CPU, every other request waits 200 milliseconds. So keeping each piece of work short is critical.

Common ways the loop gets blocked, and the fixes.

Synchronous APIs in request paths: readFileSync, existsSync, execSync, and crypto's sync functions, like pbkdf2Sync. I use the async versions. Sync APIs are fine during startup only.

Large JSON: JSON.parse and JSON.stringify are synchronous and can take a long time for very large payloads. I limit payload sizes, paginate, or stream JSON.

Heavy computation: big loops, sorting huge arrays, image processing, compression, PDF generation. I move these to worker threads, a separate service, or a job queue.

Catastrophic regular expressions: certain regex patterns with nested quantifiers take exponential time on crafted input, which is the ReDoS attack. I keep regexes simple, limit input length, and use linting tools that detect unsafe patterns.

Processing large collections in one go: I split work into chunks and yield between them with setImmediate, so other requests get a turn.

To detect blocking, I monitor event loop delay with perf_hooks and alert when it's high, and use CPU profiles to find the culprit.

### nodex | What is prototype pollution, and how do you protect a Node.js app? | prototype pollution, __proto__ attack, object merge vulnerability, javascript security, json parse proto
Prototype pollution is a JavaScript-specific vulnerability. Every object inherits from Object.prototype. If an attacker can make the application set a property on Object.prototype itself, that property suddenly appears on every object in the process. This can change application logic, like an isAdmin property becoming true everywhere, bypass security checks, crash the app, or in some cases lead to remote code execution through template engines or child process options.

It usually happens through unsafe recursive merge, deep clone or set-by-path functions that copy user-controlled JSON into objects. If the input contains a key like __proto__ or constructor.prototype, a naive merge walks into the prototype and writes there. Many popular libraries had such bugs over the years.

Protections. Validate input with a schema that only allows expected properties, like Zod or JSON Schema, which also strips unknown keys. Avoid writing your own deep merge of untrusted data, and keep libraries like lodash updated. Block dangerous keys, __proto__, constructor and prototype, in any code that sets properties by dynamic key. Use Map instead of plain objects for user-keyed data, or objects created with Object.create of null, which have no prototype. Object.freeze of Object.prototype at startup is a strong but blunt option, which can break some libraries. Node also has a flag to disable __proto__.

And dependency scanning catches known vulnerable package versions.

### nodex | How do you protect a Node.js project from npm supply chain attacks? | npm supply chain attack, malicious npm package, typosquatting, npm audit, lockfile security, install scripts risk
The npm ecosystem has had many supply chain attacks: typosquatted package names, maintainer accounts compromised and malicious versions published, and in 2025, self-spreading worms that stole tokens through install scripts. A typical project has hundreds of transitive dependencies, so the risk is real.

The protections I use. Commit the lockfile and install with npm ci, so builds use exactly the reviewed versions, and a newly published malicious version doesn't slip in automatically. Review new dependencies before adding them: is it necessary, is it maintained, how popular is it, and is the name spelled correctly? Fewer dependencies is better. Disable or restrict install scripts, which run arbitrary code at install time, using ignore-scripts, or pnpm's approach of only allowing scripts for approved packages. Run dependency scanning, like npm audit, Dependabot, Snyk or Socket, in the pipeline, failing on high-severity issues. Delay adopting brand-new versions for a few days, since malicious releases are usually caught quickly; tools like Renovate support a minimum release age. Use a private registry or proxy, like Azure Artifacts or AWS CodeArtifact, so packages come through a controlled source. Protect our own publishing with 2FA and short-lived tokens, and publish with provenance from CI.

And CI build agents shouldn't have more secrets than they need, because a malicious package runs with the agent's permissions.

### nodex | What is the native fetch API in Node.js, and how do you use it well? | fetch in node, undici, node 18 fetch, http client node, axios vs fetch, fetch timeout abortsignal
Since Node 18, fetch is available globally, stable since Node 21, implemented by the undici library. So for HTTP calls, I no longer need axios or node-fetch, and the same API works in browsers and Node.

Using it well in a server requires a few things that fetch doesn't do by default.

Timeouts: fetch has no default timeout, so a hanging server can hold the request forever. I pass signal equals AbortSignal.timeout of, say, 5,000 milliseconds, or combine signals with AbortSignal.any to support cancellation as well.

Error handling: fetch only rejects on network errors. A 404 or 500 response resolves successfully, so I always check response.ok or the status, and throw or handle errors explicitly.

Consuming the body: if I don't read or cancel the response body, the connection may not be released back to the pool, so I always read it, even on errors.

Connection pooling and keep-alive are handled by undici's global agent, and for heavy use, I can configure an undici Agent or Pool with connection limits.

Retries, backoff and circuit breaking aren't built in, so I add them with a small wrapper or a library, only retrying safe requests.

Axios is still a fine choice in existing code, especially for its interceptors, which our React apps use for adding tokens; in Node services, I prefer native fetch with a thin wrapper.

### nodex | How do you choose between Promise.all, allSettled, race and any? | promise.all vs allsettled, promise race, promise any, parallel promises javascript, promise combinators
These all take several promises and combine them, but they resolve or reject differently.

Promise.all resolves with an array of all results once every promise resolves, and rejects immediately if any one rejects, with that first error. The other operations keep running, but their results are ignored. I use it when every result is required, like loading a page's essential data in parallel.

Promise.allSettled waits for all of them, regardless of success, and resolves with an array of objects, each with a status, fulfilled or rejected, and a value or reason. It never rejects. I use it when operations are independent and I want to know the outcome of each, like sending notifications to several recipients, or loading optional dashboard widgets, where one failure shouldn't hide the others.

Promise.race settles as soon as the first promise settles, whether it resolves or rejects. The classic use was implementing a timeout, racing the operation against a timer, though AbortSignal.timeout is cleaner today, because it also cancels the operation.

Promise.any resolves with the first promise that fulfils, ignoring rejections, and only rejects, with an AggregateError, if all of them reject. It's useful for redundancy, like trying several mirrors or replicas and taking the fastest successful response.

Important: none of them limit concurrency. For hundreds of operations, I use a concurrency limiter, like p-limit, rather than starting them all at once.
