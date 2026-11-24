### nodex | process.nextTick vs setImmediate vs setTimeout: in what order do they run? | nexttick vs setimmediate, microtask vs macrotask, event loop phases node, settimeout 0, promise then order
So they all schedule code to run later, but they go into different queues.

Microtasks run as soon as the current operation finishes, before the event loop moves on. In Node, process.nextTick callbacks run first, then promise callbacks, like then handlers and the continuation after await. Both queues get drained completely before anything else happens.

Macrotasks run in the event loop's phases. setTimeout and setInterval callbacks run in the timers phase, once their delay has passed. setTimeout of zero actually means at least about one millisecond. setImmediate callbacks run in the check phase, right after the poll phase, where I/O callbacks are processed.

So within the same synchronous block, nextTick runs first, then promises, then the timers and immediates. Between setTimeout zero and setImmediate, the order from the main module isn't guaranteed, because it depends on how fast the loop starts. But inside an I/O callback, setImmediate always runs before setTimeout zero, since the check phase comes right after poll. That's a classic interview trick, actually.

In browsers there's no nextTick or setImmediate. Promise microtasks run before the next macrotask, like a timer or a rendering step.

The practical lesson is, recursively scheduling nextTick or promise callbacks can starve the event loop, because I/O never gets a turn. When I need to yield so I/O can run, I use setImmediate.

### nodex | Worker threads vs child processes vs cluster in Node.js: when do you use each? | worker threads, child process node, cluster module, cpu intensive node, multi core node, pm2 cluster
See, Node runs JavaScript on a single main thread, so CPU-heavy work blocks everything else, and one process uses only one CPU core for JavaScript. These three deal with that in different ways.

Worker threads run JavaScript in separate threads inside the same process, each with its own event loop and memory. They talk through message passing, and can share memory with SharedArrayBuffer. They're for CPU-intensive tasks, parsing a large file, image processing, encryption, complex calculations, so the main thread stays responsive. A pool of workers, with a library like Piscina, saves the cost of starting threads over and over.

Child processes start separate OS processes with spawn, exec or fork. They're for running external programs, like a command-line tool or a Python script, or isolating risky work, since a crash doesn't take down the parent. More overhead than threads though.

The cluster module starts several copies of the whole Node server, usually one per CPU core, sharing the same port, with the primary process distributing connections. It's for using all cores to handle more HTTP requests. PM2 does this for you.

In containers though, I usually prefer one Node process per container and scaling the number of containers with the orchestrator, like ECS or Kubernetes. That's simpler, and you get better health checks and restarts. Then workers are only for specific CPU-heavy tasks. That's how I'd set it up.

### nodex | What are streams in Node.js, and how does backpressure work with pipeline? | node streams, readable writable transform, backpressure node, stream pipeline, process large file node
Basically streams process data piece by piece, in chunks, instead of loading it all into memory. You've got four types. Readable, like reading a file or an HTTP request. Writable, like writing a file or an HTTP response. Duplex, both, like a TCP socket. And Transform, a duplex that modifies data passing through, like gzip compression or CSV parsing.

With streams, you can process a 5 GB file with a few megabytes of memory, and start sending output before the input is fully read.

Backpressure is what keeps memory under control when the writer is slower than the reader. A writable stream's write method returns false when its internal buffer is full. A well-behaved producer then pauses until the drain event says it can carry on. If code ignores that and keeps writing, data piles up in memory and the process can crash.

The pipe method handles backpressure automatically, but it was bad with errors. An error in one stream didn't destroy the others, so you got leaks. So the recommended way is stream.pipeline, or the promise version from stream/promises. It connects the streams, handles backpressure, forwards errors, and cleans up every stream when any of them fails or finishes.

Readable streams are also async iterable, so for await over a stream is a clean way to process chunks one by one, with backpressure handled naturally.

[I used a pipeline of a file read stream, a CSV parser and a batching transform to load large extract files without memory spikes.]

### nodex | What is a Buffer in Node.js? | buffer node, binary data node, buffer vs string, buffer encoding, buffer.from, uint8array
So a Buffer represents raw binary data in Node.js, a fixed-size sequence of bytes. JavaScript strings are text, made of UTF-16 characters, so they're not suitable for binary stuff like files, images, network packets, encrypted or compressed data. Buffers fill that gap. These days Buffer is a subclass of Uint8Array, so it works with the standard typed array APIs too.

You create buffers with Buffer.from, from a string with an encoding, an array, or another buffer, and Buffer.alloc for a zero-filled buffer of a given size. Going back uses toString with an encoding, like utf8, base64 or hex. That's how I'd encode binary data as Base64 for JSON, or compute a hex digest.

A few things matter here. Encoding matters a lot. Reading UTF-8 bytes as Latin-1 garbles text, and cutting a buffer in the middle of a multi-byte character breaks it, which is why streams use a StringDecoder when turning chunks into text. Buffer.allocUnsafe is faster because it doesn't zero the memory, but it might contain old data, which can leak sensitive information if you don't fully overwrite it. So I only use it when I fill it immediately. Comparing buffers with secrets, like HMAC signatures, should use crypto.timingSafeEqual, not a normal equality check. And large buffers count against the process's memory, so for big data, streams beat reading whole files into buffers.

### nodex | CommonJS vs ES modules in Node.js: what are the differences? | commonjs vs esm, require vs import, es modules node, type module package.json, cjs esm interop, dual package
Okay, so CommonJS is Node's original module system. require to import, module.exports to export. It loads modules synchronously at runtime, and you can call require anywhere, even conditionally.

ES modules are the JavaScript standard, import and export statements, used in browsers and modern tooling. Imports are static and analysed before the code runs, which enables tree shaking in bundlers and top-level await. Loading is asynchronous.

In Node, a file is treated as an ES module if it has the .mjs extension, or if the nearest package.json has type set to module and the file is .js. Otherwise .js is CommonJS, and .cjs is always CommonJS.

The differences that actually bite you. In ESM, file imports need the extension, like importing from utils.js with the .js. dirname and filename globals don't exist, so you use import.meta.dirname or import.meta.url. JSON imports need an import attribute. ESM can import CommonJS packages, though named exports aren't always detected. CommonJS historically couldn't require ES modules at all, only use dynamic import, but since Node 22, requiring synchronous ES modules works, which honestly removed a lot of pain.

For TypeScript projects, the module and moduleResolution settings, like NodeNext, have to match whichever system you pick.

New projects should go with ES modules. Libraries often publish both formats, using the exports field in package.json.

### nodex | What are the important fields in package.json? | package.json fields, exports field, engines field, scripts npm, dependencies vs devdependencies vs peerdependencies, main module types
So package.json describes a Node project or package, and a handful of fields really matter.

name and version identify the package, and version follows semantic versioning when you publish.

dependencies are packages needed at runtime. devDependencies are only for development and building, like TypeScript, test frameworks and linters, and that matters because production installs can skip them. peerDependencies declare packages the consumer has to provide, like React for a component library, so only one copy exists. optionalDependencies can fail to install without failing the whole install.

scripts define commands, build, test, lint, start, which you run with npm run. Pre and post hooks run automatically, so I'm careful with install scripts, because they run for dependencies too and they're a supply-chain risk.

type set to module makes .js files ES modules.

exports is the modern way to define a package's public entry points, with conditions for import versus require, types, and subpaths. It also hides internal files, anything not listed can't be imported, which is great for library authors. main and module are the older entry fields.

types points to the TypeScript declarations. engines declares supported Node versions, and with engine-strict, npm can enforce it. files lists what gets published, and private true stops you accidentally publishing an application.

And along with package.json, the lockfile has to be committed, so installs are reproducible. That one's non-negotiable for me.

### nodex | npm install vs npm ci, and how do semantic version ranges work? | npm ci vs npm install, caret vs tilde version, semver ranges, package-lock.json, reproducible builds node
See, npm install installs dependencies from package.json, and it may update package-lock.json if versions within the allowed ranges changed, or if package.json changed. It's what developers use when adding or updating packages.

npm ci is for CI and production builds. It deletes node_modules, installs exactly the versions in package-lock.json, and fails if package.json and the lockfile don't match. It never touches the lockfile. So builds are reproducible, and usually faster too. In pipelines I always use npm ci, often with the npm cache directory cached.

Version ranges follow semantic versioning, major dot minor dot patch. A caret, like caret 4.2.1, allows anything below the next major. So 4.3.0 is fine, 5.0.0 isn't. It assumes minor and patch releases are backward compatible. For 0.x versions, caret is stricter, because 0.x minors can break things. A tilde, like tilde 4.2.1, allows only patch updates, 4.2.9 but not 4.3.0. And an exact version pins it precisely.

The thing people miss is the lockfile is what really decides what gets installed. The ranges only decide what updates are allowed when someone runs npm update or regenerates the lockfile.

In practice, I commit the lockfile, let Dependabot or Renovate propose updates as pull requests with the test suite running, and use exact versions for packages known to break in minor releases. pnpm and Yarn have equivalents, like pnpm install with frozen-lockfile.

### nodex | Express vs Fastify vs NestJS: how do you choose? | express vs fastify vs nestjs, node framework comparison, nestjs, fastify performance, which node framework
Okay, Express is the classic, minimal web framework for Node. Simple, extremely well known, huge middleware ecosystem. But it's unopinionated, so big projects need their own structure, and historically it had weak async error handling and limited TypeScript support. Express 5, which came out in late 2024, finally handles rejected promises in route handlers properly.

Fastify is a performance-focused framework with a similar feel. It's noticeably faster than Express, thanks to optimised routing and schema-based JSON serialisation. It has built-in JSON Schema validation for requests and responses, a structured plugin system with encapsulation, first-class async support, built-in logging with Pino, and good TypeScript support.

NestJS is a full application framework built on top of Express or Fastify. It brings structure inspired by Angular and ASP.NET Core. Modules, controllers, providers, dependency injection with decorators, guards, interceptors, pipes for validation, plus integrations for GraphQL, microservices, queues and OpenAPI. For someone coming from .NET or Angular, like me, it feels very familiar.

How I'd choose, a small focused service or a simple BFF, Fastify, or Express if the team already knows it well. A bigger application with many developers and a complex domain, NestJS, because the enforced structure and DI keep it maintainable. And for performance-critical endpoints, Fastify, maybe as NestJS's underlying adapter. So it really depends on the size and the team.

### nodex | How does dependency injection work in NestJS? | nestjs dependency injection, nestjs modules providers, injectable nestjs, nestjs vs asp.net core di, provider scopes nestjs
NestJS has a dependency injection container that's very similar to ASP.NET Core's and Angular's, so honestly it felt natural to me.

A class marked with the Injectable decorator is a provider. You register providers in a module's providers array and inject them through constructor parameters, and Nest resolves them using TypeScript metadata about the parameter types. Controllers, guards, interceptors and pipes all get their dependencies this way.

Modules organise the app into features. Each module declares its providers and controllers, exports the providers other modules may use, and imports the modules it depends on. A provider is private to its module unless exported, which keeps features encapsulated. Global modules, or dynamic modules with forRoot and forFeature, are for shared infrastructure, like configuration or database connections.

Custom providers cover more cases. useValue for constants or mocks, useClass to swap implementations, useFactory for values that need logic or async setup, like creating a database client. And injection tokens, strings or symbols, for things that aren't classes, since TypeScript interfaces don't exist at runtime.

Scopes are like .NET lifetimes. Default is singleton, shared across the app. REQUEST scope creates a new instance per request. TRANSIENT gives each consumer its own instance. Request scope bubbles up the dependency chain and costs performance, so I only use it when I really need it.

Testing is easy too. The testing module lets you override providers with mocks.

### nodex | How do you handle unhandled promise rejections and graceful shutdown in Node.js? | unhandled rejection node, uncaughtexception, graceful shutdown node, sigterm node, process exit node
Actually since Node 15, an unhandled promise rejection crashes the process by default, just like an uncaught exception. And that's on purpose. Carrying on after an unexpected error can leave the app in an inconsistent state.

I handle errors where they happen, try-catch around awaits, and catch on promises that aren't awaited. As a safety net, I register process.on for unhandledRejection and uncaughtException to log the error with full details. But after an uncaught exception, the process state is unknown. So I log, exit with a non-zero code, and let the orchestrator, ECS, Kubernetes or PM2, restart a fresh instance. I don't try to keep running.

Graceful shutdown is about planned stops, like deployments or scale-in. The orchestrator sends SIGTERM, and after a grace period, SIGKILL. On SIGTERM, the app should stop accepting new connections with server.close, fail its readiness check so the load balancer stops sending traffic, let in-flight requests finish, stop consuming new messages from queues and finish or release the current ones, close database pools and other connections, and then exit. A timeout forces the exit if something hangs.

One thing people miss in Docker, the Node process has to actually receive the signals. If it's started through npm start or a shell script, signals might not reach it. So I run node directly as the main process, or use an init like tini, or the init flag.

### nodex | How do you find a memory leak in a Node.js application? | node memory leak, heap snapshot node, inspect node memory, heap out of memory, chrome devtools node memory
So the symptom is memory growing steadily over time, until the process crashes with "JavaScript heap out of memory", or the container gets killed for going over its memory limit.

The first thing I do is confirm it's actually a leak, and not just a high but stable working set. Watching process.memoryUsage, especially heapUsed, over hours shows whether memory comes back to a baseline after garbage collection or keeps climbing.

To find the cause, I take heap snapshots. Run Node with inspect and connect Chrome DevTools, or use the inspector API, or start with the heapsnapshot-signal flag, so sending a signal writes a snapshot, which is handy in a container. I take one snapshot after warm-up, run some load, take another, and compare. The comparison view shows which object types grew, and the retainers path shows what's keeping them alive.

Common causes in Node, honestly I've seen most of these. Global or module-level caches, like a plain object or Map used as a cache with no size limit or expiry. Event listeners added repeatedly and never removed, often with the MaxListenersExceededWarning as a hint. Closures capturing big objects, held by long-lived timers or callbacks. Unbounded arrays, like collecting metrics or logs in memory. And unresolved promises piling up.

Fixes are usually bounded caches, like lru-cache, removing listeners, and clearing timers. The max-old-space-size flag only delays the crash, though you should set it to suit the container's memory.

### nodex | How do you profile CPU usage in a Node.js service? | node cpu profiling, node --prof, clinic.js, flame graph node, event loop lag, blocked event loop
See, high CPU in Node often shows up as slow responses for everyone, because one busy main thread delays every request. So the first thing I measure is event loop lag, how long callbacks wait to run, using perf_hooks' monitorEventLoopDelay or metrics from APM tools. High lag means something's blocking the loop.

To find what, I take a CPU profile. You can run with inspect and record a profile in Chrome DevTools. Or use the cpu-prof flag, which writes a profile file when the process exits. Or Clinic.js, which runs the app under load and gives you a flame graph plus a diagnosis of whether the issue is CPU, I/O or the event loop. Linux perf with perf-basic-prof works for system-level profiling, and APM tools like Datadog or New Relic offer continuous profiling in production.

In a flame graph, wide bars are functions eating lots of CPU time. What I usually find is synchronous functions like readFileSync or crypto's sync methods in request paths. JSON.parse and JSON.stringify on huge payloads. Expensive regular expressions, sometimes even vulnerable to catastrophic backtracking. Heavy loops over big arrays. And too much synchronous logging.

Fixes include switching to async APIs, streaming large payloads, caching results, moving CPU-heavy work to worker threads or another service, and simplifying regexes. Then I profile again to confirm it actually helped.

### nodex | How do you manage and validate configuration in a Node.js service? | node configuration, dotenv, validate env variables, zod env, process.env, config management node
Okay, so configuration comes from environment variables, the twelve-factor way. The same build runs everywhere, with different environment variables set by the platform, like ECS task definitions or Kubernetes ConfigMaps and Secrets.

For local development, a .env file loaded with dotenv, or Node's built-in env-file flag since Node 20, provides values. The .env file is in .gitignore, and a .env.example with dummy values documents what's needed.

The important part, honestly, is validating configuration at startup. process.env values are all strings or undefined, so a typo or a missing variable otherwise causes some confusing failure much later. I define a schema, with Zod or envalid. Like PORT as a number with a default, DATABASE_URL as a required URL, LOG_LEVEL as one of a few values, and a feature flag as a boolean parsed from the string. At startup, the app parses process.env with the schema, and if anything's missing or invalid, it logs a clear message listing the problems and exits right away. What you get is a typed config object that the rest of the app imports, instead of reading process.env all over the code.

Secrets, like database passwords and API keys, come from a secret store. Either injected as environment variables by the platform, or fetched at startup from AWS Secrets Manager or Parameter Store. And they're never logged.

In NestJS, the ConfigModule supports the same validation approach.

### nodex | How do you do structured logging in Node.js? | node logging, pino, winston, structured logging node, json logs node, log correlation id node
Honestly, I always use structured logging. Each log entry is a JSON object with fields, not just a text line, so logs can be searched and filtered in a central system, by request id, user id, error type, whatever.

Pino is my preferred library, because it's very fast and does JSON by default. Logging is a hot path, and slow logging blocks the event loop. Winston is another popular option, more flexible but slower. I create one logger with the level from configuration, and child loggers that add context, like a child with the module name, or one per request with the request id.

For HTTP services, pino-http or the framework's integration logs each request with method, route, status code and duration, and attaches a request-scoped logger. To carry the request id or trace id into every log line, even deep in service code, I use AsyncLocalStorage, which keeps per-request context across async calls. Or the OpenTelemetry integration, which adds trace and span ids automatically, so logs and traces link up.

Some habits I follow. Log at sensible levels, info for significant events, and error with the full error object so the stack gets captured. Redact sensitive fields, which Pino supports with paths like headers.authorization. Don't log whole request bodies. And write to standard output and let the platform collect logs, instead of writing files inside containers.

In development, pino-pretty makes the JSON readable for humans.

### nodex | How do you validate request input in a Node.js API? | node request validation, zod express, joi validation, class-validator nestjs, json schema validation fastify, validate body node
So every request body, query string and path parameter is untrusted input, so I validate it at the edge, before it ever reaches business logic.

How depends on the framework. With Express, I use a schema library like Zod or Joi, and a small middleware that validates req.body, req.query and req.params against the route's schema. If validation fails, it responds with 400 and a structured list of errors. If it passes, it replaces the raw input with the parsed, typed values, so defaults and type coercion get applied. With Zod, the TypeScript type is inferred from the schema, so the handler is typed without separate interfaces.

Fastify has validation built in, JSON Schema on each route, compiled for speed with Ajv. Response schemas also speed up serialisation and stop extra fields leaking out. TypeBox or Zod type providers give you TypeScript types from those schemas.

NestJS uses DTO classes with class-validator decorators, like IsString and IsInt, and a global ValidationPipe with whitelist and forbidNonWhitelisted options. Those strip or reject unknown properties, which protects against mass assignment. Zod-based pipes are an alternative.

Whatever the tool, I validate types, required fields, lengths, ranges, formats and allowed values, limit body size, and reject unknown fields for sensitive endpoints. Business-rule validation, like whether a site is active, happens later in the service layer. That's how I keep the two separate.

### nodex | Prisma vs TypeORM vs Knex vs Drizzle: how do you choose a data access library in Node? | prisma vs typeorm, knex query builder, drizzle orm, node orm comparison, database access node typescript
Okay, so these are the main options for database access in Node with TypeScript, just at different levels of abstraction.

Prisma defines the data model in its own schema file, generates a fully typed client, and handles migrations. Queries are very type-safe and the autocomplete is excellent. It's productive and popular. The downsides are its own schema language, less control over the generated SQL, and some complex queries needing raw SQL anyway.

TypeORM is a classic ORM with decorators on entity classes, kind of like Entity Framework or Hibernate. It supports Active Record and Data Mapper patterns, relations and migrations. It feels familiar if you're from .NET or Java, but query type safety is weaker, and honestly it's had a reputation for bugs and slower maintenance.

Knex is a query builder, not a full ORM. You write queries in JavaScript that map closely to SQL, with migrations and seeds. Lots of control and flexibility, but not much type safety on its own.

Drizzle is a newer, lightweight, TypeScript-first ORM. Schema defined in TypeScript, queries that look like SQL but are fully typed, fast, and it works nicely in serverless environments.

How I'd pick, Prisma or Drizzle for new TypeScript services. Drizzle when I want SQL-like control and a small footprint. Plain SQL with a driver like pg for really simple services or heavy reporting.

Whatever I pick, it's parameterised queries, connection pooling, and migrations run in the pipeline.

### nodex | How should you run a Node.js app in Docker? | node docker best practices, node dockerfile, node user docker, npm ci docker, multi stage node docker, node pid 1
Honestly, for Node containers I always follow a few things, almost like a checklist.

Use an official slim base image with a specific Node LTS version, like node 22 slim or Alpine, pinned. Never latest.

Use a multi-stage build. The build stage installs all dependencies with npm ci and compiles TypeScript. The final stage copies only the compiled output and production dependencies, installed with npm ci omitting dev, so dev tools and source files don't end up in the image.

Order the Dockerfile for caching. Copy package.json and the lockfile first, install dependencies, then copy the source. That way code changes don't reinstall everything.

A .dockerignore to exclude node_modules, .git, .env files and test files.

Don't run as root. The official images have a node user, and I switch to it with USER node.

Set NODE_ENV to production, which lots of libraries use to turn on optimisations.

Handle signals properly. Start with node dist/server.js directly as the CMD, not npm start, so the Node process gets SIGTERM for graceful shutdown. Or use tini, or docker run with the init flag, to handle PID 1 duties like reaping zombie processes.

Set memory limits consistently. Node's heap limit should fit inside the container's memory limit, using max-old-space-size if needed.

Add a health check endpoint for the orchestrator, and log to standard output.

And on top of all that, scan the image for vulnerabilities in the pipeline. So that's my usual setup.

### nodex | How do you run TypeScript in Node.js: tsc, tsx, or native type stripping? | run typescript node, ts-node vs tsx, node type stripping, tsc build node, typescript node 22 23
So basically you've got a few ways now, and they fit different stages.

Compiling with tsc is the traditional one. TypeScript compiles .ts files to JavaScript in a dist folder, and Node runs the JavaScript. It's the reliable production approach, and tsc also does full type checking, which the runtime tools skip.

Running directly in development with a loader is the next one. ts-node was the original tool, but it's slower and had ES module issues. tsx, which uses esbuild, is popular now. tsx watch on your server file runs TypeScript directly, very fast, with reload on changes. It strips types without checking them, so I run tsc with noEmit separately, in the editor or the pipeline.

Then native type stripping. Since Node 22.6 behind a flag, and on by default from Node 23.6 and later 22.x versions, Node can run .ts files directly by removing type annotations. It only supports erasable syntax, meaning types you can simply delete. Features that generate code, like enums, namespaces, and parameter properties in constructors, aren't supported unless you use the transform option, and TypeScript added the erasableSyntaxOnly setting to flag them. It doesn't read tsconfig paths and it doesn't type-check.

Bundlers like esbuild or tsup can also produce a single optimised JavaScript file, which is great for Lambda functions.

My setup is tsx or native stripping for development, tsc type checking in CI, and compiled JavaScript or a bundle in production images.

### nodex | What is AsyncLocalStorage in Node.js? | asynclocalstorage, async context node, request context node, correlation id node, cls hooked
Okay, so AsyncLocalStorage, from the async_hooks module, lets you store data that's available throughout an async call chain, without passing it explicitly through every function. It's similar to AsyncLocal in .NET, or thread-local storage, but it follows async operations instead of threads.

You create one AsyncLocalStorage instance. At the start of each request, a middleware calls run with a context object, like the request id, the user id and a request-scoped logger, and the rest of the request handling runs inside that callback. Then anywhere deeper in the code, services, repositories, the logger, getStore returns the context for the current request. Even after lots of awaits, timers and promise chains. And concurrent requests each see their own context.

Where I use it, adding the correlation or trace id to every log line automatically. Tracking the current user or tenant for auditing or multi-tenant data access. And request-scoped caching. OpenTelemetry's Node SDK actually uses it to track the active span, which is how traces propagate automatically.

A few cautions. Context can get lost with some older callback-based libraries or custom thenables, though that's rare now. It adds a small performance cost. And it's easy to overuse. For core business data, explicit parameters are clearer, so I keep it for cross-cutting things like logging and tracing.

Node 24 improved its implementation and performance too.

### nodex | Why does Node warn about MaxListenersExceeded, and how do EventEmitters leak? | eventemitter memory leak, maxlistenersexceededwarning, remove event listener node, eventemitter node, once listener
See, EventEmitter is Node's built-in publish-subscribe mechanism. Lots of core objects, streams, servers, sockets, are emitters, and code subscribes with on and unsubscribes with off or removeListener.

By default, an emitter warns when more than 10 listeners get added for the same event. "MaxListenersExceededWarning, possible EventEmitter memory leak detected." It's a heuristic, not an error, but honestly it usually points to a real bug. Code that adds a listener repeatedly, like on every request or every retry, without removing it. Each listener stays referenced by the emitter, along with everything its closure captured, so memory grows. And the handler runs many times per event, so you get duplicate work.

Typical examples I've seen. Adding an error or close listener to a long-lived shared connection inside a request handler. Subscribing to process events in a function that gets called again and again. Or a reconnection loop that re-registers handlers every time.

The fixes, register listeners once at setup time, not per operation. Use once for listeners that should only fire one time. Always remove listeners when the work's done, in a finally block or a cleanup function. And use AbortSignal with events.on or the signal option, which removes listeners automatically when aborted. events.once also returns a promise if you're waiting on a single event.

Raising the limit with setMaxListeners is only right when many listeners are genuinely expected, not just to silence the warning.

### nodex | How does error handling work for async route handlers in Express? | express async error handling, express 5 promises, express error middleware, async handler express, unhandled rejection express
Actually in Express 4, if an async route handler threw an error or a promise rejected, Express didn't catch it. The rejection went unhandled, the request hung until it timed out, and in modern Node, the unhandled rejection could crash the whole process. So everyone wrapped handlers with try-catch and called next with the error, or used a helper like express-async-handler, or the express-async-errors package, which patches Express.

Express 5, which became the stable release in late 2024, fixed this. When a handler or middleware returns a rejected promise, Express automatically passes the error to the error-handling middleware. So async handlers can just throw.

Either way, I have one central error-handling middleware, the special four-argument function, registered after all the routes. It maps known error types to responses. A ValidationError to 400 with details, NotFoundError to 404, and a custom AppError with its own status code and error code. For anything unexpected, it logs the full error with the request id and returns a generic 500 without internal details. Responses use a consistent format, like Problem Details.

I also add a 404 handler for unknown routes. And I make sure errors in streams or background callbacks are handled right where they happen, because they're not part of the request's promise, so the central handler never sees them. That one's caught people out in my team.

### nodex | How do you avoid blocking the event loop in Node.js? | blocking event loop, sync functions node, json parse large, redos, cpu work node, event loop blocked
So Node runs all JavaScript for all requests on one thread. If one operation takes 200 milliseconds of CPU, every other request waits 200 milliseconds. So keeping each piece of work short is really critical.

The common ways the loop gets blocked, and what I do about each.

Synchronous APIs in request paths. readFileSync, existsSync, execSync, and crypto's sync functions, like pbkdf2Sync. I use the async versions. Sync APIs are fine only during startup.

Large JSON. JSON.parse and JSON.stringify are synchronous and can take a long time on very big payloads. I limit payload sizes, paginate, or stream JSON.

Heavy computation. Big loops, sorting huge arrays, image processing, compression, PDF generation. These go to worker threads, a separate service, or a job queue.

Catastrophic regular expressions. Certain regex patterns with nested quantifiers take exponential time on crafted input, that's the ReDoS attack. I keep regexes simple, limit input length, and use linting tools that detect unsafe patterns.

Processing a large collection in one go. I split the work into chunks and yield between them with setImmediate, so other requests get a turn.

To catch blocking, I monitor event loop delay with perf_hooks and alert when it's high, and use CPU profiles to find the culprit. Honestly, that monitoring has saved us more than once.

### nodex | What is prototype pollution, and how do you protect a Node.js app? | prototype pollution, __proto__ attack, object merge vulnerability, javascript security, json parse proto
Okay, prototype pollution is a JavaScript-specific vulnerability. Every object inherits from Object.prototype. If an attacker can make the app set a property on Object.prototype itself, that property suddenly shows up on every object in the process. That can change application logic, like an isAdmin property becoming true everywhere, bypass security checks, crash the app, or in some cases lead to remote code execution through template engines or child process options. Scary stuff.

It usually happens through unsafe recursive merge, deep clone, or set-by-path functions that copy user-controlled JSON into objects. If the input has a key like underscore-underscore proto, or constructor.prototype, a naive merge walks into the prototype and writes there. Plenty of popular libraries had bugs like this over the years.

What I do to protect against it. Validate input with a schema that only allows expected properties, like Zod or JSON Schema, which also strips unknown keys. Don't write your own deep merge of untrusted data, and keep libraries like lodash updated. Block the dangerous keys, proto, constructor and prototype, in any code that sets properties by a dynamic key. Use Map instead of plain objects for user-keyed data, or objects created with Object.create of null, which have no prototype. Freezing Object.prototype at startup is strong but blunt, and it can break some libraries. Node also has a flag to disable proto.

And dependency scanning catches the known vulnerable package versions.

### nodex | How do you protect a Node.js project from npm supply chain attacks? | npm supply chain attack, malicious npm package, typosquatting, npm audit, lockfile security, install scripts risk
Honestly, the npm ecosystem has had a lot of supply chain attacks. Typosquatted package names, maintainer accounts compromised and malicious versions published, and in 2025, self-spreading worms that stole tokens through install scripts. A typical project has hundreds of transitive dependencies, so the risk is very real.

What I do about it. Commit the lockfile and install with npm ci, so builds use exactly the reviewed versions, and a newly published malicious version doesn't sneak in automatically. Review new dependencies before adding them. Is it needed, is it maintained, how popular is it, and is the name spelled right? Fewer dependencies is better. Disable or restrict install scripts, which run arbitrary code at install time, with ignore-scripts, or pnpm's approach of only allowing scripts for approved packages. Run dependency scanning, npm audit, Dependabot, Snyk or Socket, in the pipeline, failing on high-severity issues. Hold off on brand-new versions for a few days, since malicious releases are usually caught quickly, and tools like Renovate support a minimum release age. Use a private registry or proxy, like Azure Artifacts or AWS CodeArtifact, so packages come through a controlled source. And protect our own publishing with 2FA and short-lived tokens, and publish with provenance from CI.

One more, CI build agents shouldn't have more secrets than they need, because a malicious package runs with the agent's permissions. People forget that part.

### nodex | What is the native fetch API in Node.js, and how do you use it well? | fetch in node, undici, node 18 fetch, http client node, axios vs fetch, fetch timeout abortsignal
See, since Node 18, fetch is available globally, stable since Node 21, implemented by the undici library. So for HTTP calls you don't need axios or node-fetch anymore, and the same API works in browsers and Node.

But using it well on a server needs a few things fetch doesn't do by default.

Timeouts. fetch has no default timeout, so a hanging server can hold the request forever. I pass a signal from AbortSignal.timeout of, say, 5,000 milliseconds, or combine signals with AbortSignal.any to support cancellation too.

Error handling. fetch only rejects on network errors. A 404 or 500 response resolves successfully, so I always check response.ok or the status, and throw or handle errors explicitly. That catches people a lot.

Consuming the body. If you don't read or cancel the response body, the connection might not go back to the pool, so I always read it, even on errors.

Connection pooling and keep-alive are handled by undici's global agent, and for heavy use, you can configure an undici Agent or Pool with connection limits.

Retries, backoff and circuit breaking aren't built in, so I add them with a small wrapper or a library, and only retry safe requests.

Axios is still a fine choice in existing code, especially for its interceptors, which our React apps use for adding tokens. In Node services though, I go with native fetch plus a thin wrapper.

### nodex | How do you choose between Promise.all, allSettled, race and any? | promise.all vs allsettled, promise race, promise any, parallel promises javascript, promise combinators
So these all take several promises and combine them, but they resolve or reject differently.

Promise.all resolves with an array of all results once every promise resolves, and rejects immediately if any one rejects, with that first error. The other operations keep running, but their results get ignored. I use it when every result is required, like loading a page's essential data in parallel.

Promise.allSettled waits for all of them, success or not, and resolves with an array of objects, each with a status, fulfilled or rejected, and a value or reason. It never rejects. I use it when operations are independent and I want each outcome. Like sending notifications to several recipients, or loading optional dashboard widgets, where one failure shouldn't hide the rest.

Promise.race settles as soon as the first promise settles, whether it resolves or rejects. The classic use was a timeout, racing the operation against a timer, though AbortSignal.timeout is cleaner now because it also cancels the operation.

Promise.any resolves with the first promise that fulfils, ignoring rejections, and only rejects, with an AggregateError, if all of them reject. Handy for redundancy, like trying several mirrors or replicas and taking the fastest successful response.

And one thing people forget, none of them limit concurrency. For hundreds of operations, I use a concurrency limiter, like p-limit, instead of firing them all at once.

