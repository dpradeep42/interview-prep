import { Page, Section, Text, BulletList, Table, Diagram, Steps, Select, Segmented, Input, Toggle, Status, TableOfContents, useState, useMemo } from "grok/canvas";
import type { ReactNode } from "grok/canvas";

type D = "B" | "I" | "A";
type Q = [string, D, string, string, string, string?, string?, string?];

const T: Record<string, string> = {
  s18: "18. React",
  s19: "19. TypeScript / JavaScript",
  s20: "20. Node.js / Python",
  s21: "21. SFTP / Integration",
  s22: "22. WCF / .NET Framework",
  s23: "23. GxP / IQVIA",
};
const ORDER = ["s18", "s19", "s20", "s21", "s22", "s23"];
const DL: Record<D, string> = { B: "Basic", I: "Intermediate", A: "Advanced" };

const QS: Q[] = [
  // 18. React
  ["s18", "B", "What is React?", "A JavaScript library for building user interfaces from reusable components; it keeps a virtual DOM and updates only what changed when state changes. Declarative: you describe the UI for a given state.", "UI = f(state).", "", "", "541"],
  ["s18", "B", "Component vs element?", "A component is a function (or class) that returns UI; an element is the plain object it returns describing what to render, for example `<Button />` creates an element of the Button component.", "Component = cookie cutter; element = the cookie.", "", "", "542"],
  ["s18", "B", "Functional vs class components?", "Functional: plain functions using hooks for state and effects; less code, easier reuse with custom hooks; the modern standard.|Class: extend React.Component with this.state and lifecycle methods; still needed only for error boundaries.", "Functions + hooks won.", "", "", "543"],
  ["s18", "B", "What are props, what is state, and props vs state?", "Props: read-only inputs passed from parent to child.|State: data owned by a component that changes over time (useState) and triggers re-render.|Props flow down and are controlled by the parent; state is local and controlled by the component.", "Props = arguments; state = memory.", "propsstate", "", "544,545,546"],
  ["s18", "I", "What is the dependency array, and what if it is empty?", "The second argument of useEffect, useMemo and useCallback: the hook re-runs when any listed value changes.|Empty array: the effect runs once after the first render (and cleans up on unmount). No array: runs after every render.", "[] = once; [x] = when x changes; none = every time.", "", "", "549,550"],
  ["s18", "I", "useMemo, useCallback, and the difference?", "useMemo caches a computed value between renders until dependencies change.|useCallback caches a function reference, so memoised children do not re-render because of a new function.|useCallback(fn, deps) equals useMemo(() => fn, deps).", "useMemo remembers the answer; useCallback remembers the function.", "", "", "551,552,553"],
  ["s18", "B", "What is useRef?", "Returns a mutable object whose .current persists across renders without causing a re-render; used for DOM references (focus an input) and for values such as timers or previous values.", "A pocket that survives renders silently.", "", "", "554"],
  ["s18", "I", "What is the Context API, and Context vs Redux?", "Context passes values (theme, current user, locale) down the tree without prop drilling.|Context is fine for low-frequency global values; Redux (Toolkit) adds a predictable store, middleware, devtools and selective subscriptions for large, frequently changing state. For server data, React Query is often better than both.", "Context = broadcast; Redux = central bank with ledger.", "", "", "555,556"],
  ["s18", "I", "How do you manage API calls and loading/error states?", "A typed API client (fetch or axios) with interceptors for tokens and errors; React Query or a custom hook to fetch, cache and retry.|Show a loading indicator, an error message with retry, and an empty state; cancel requests on unmount with AbortController.", "Loading, error, empty, data: four states, always.", "", "", "559,560"],
  ["s18", "I", "Controlled vs uncontrolled components?", "Controlled: React state holds the input value (value + onChange), giving validation and formatting on every keystroke.|Uncontrolled: the DOM holds the value, read with a ref when needed; simpler and used by libraries like React Hook Form for performance.", "Controlled = React holds the pen.", "", "", "561"],
  ["s18", "I", "What causes unnecessary re-rendering?", "A parent re-rendering re-renders its children; new object, array or function props each render; context values that change often; state kept too high in the tree. Fix with React.memo, useMemo/useCallback, splitting context and moving state down; measure with the Profiler first.", "New references look like new data.", "", "", "563"],
  ["s18", "I", "How do you handle authentication and protect routes in React?", "Login through the SSO or OIDC provider (Authorization Code with PKCE); keep tokens in memory or HttpOnly cookies, not localStorage; an auth context exposes the user and roles.|Protected routes: a wrapper component that redirects unauthenticated users to login and checks roles. The API must still enforce authorisation.", "The UI hides doors; the API locks them.", "", "", "564,565"],
  ["s18", "B", "How do you manage forms?", "React Hook Form (or Formik) for state and performance, with a schema validator (Zod or Yup) shared with types; show field errors, disable submit while saving, and map server validation errors (ProblemDetails) back to fields.", "Library for state, schema for rules.", "", "", "566"],
  ["s18", "I", "How do you structure a large React application?", "Feature-based folders (shipments/, sites/) with components, hooks, API calls and tests together; a shared library of reusable components; a typed API layer; routing with lazy-loaded features; consistent lint, formatting and testing rules.", "Group by feature, share the basics.", "", "", "567"],
  ["s18", "I", "Why React over Angular?", "React: a focused UI library, flexible, large ecosystem, easy to adopt piece by piece, simpler learning curve.|Angular: a full framework with DI, routing, forms and RxJS built in, good for large teams wanting one opinionated way.|IRT has both; for new reusable components we used React for flexibility, while Angular modules remain where they already exist.", "React = toolkit; Angular = complete workshop.", "", "", "570"],
  // 19. TS / JS
  ["s19", "B", "JavaScript var vs let vs const?", "var: function-scoped, hoisted and initialised as undefined, can be redeclared.|let: block-scoped, reassignable.|const: block-scoped, cannot be reassigned (the object it points to can still change). Default to const, use let when needed, avoid var.", "const by default, let if it changes, var never.", "varlet", "", "571"],
  ["s19", "B", "What is hoisting?", "Declarations are processed before code runs: function declarations are fully hoisted, var is hoisted as undefined, and let/const are hoisted but in the temporal dead zone until their line runs (accessing them throws).", "Declarations float up; values do not.", "", "", "572"],
  ["s19", "I", "What is a closure?", "A function that remembers variables from the scope where it was created, even after that scope has finished, for example a counter factory or a debounce function keeping its timer.", "A function with a backpack of variables.", "", "", "573"],
  ["s19", "B", "What is a Promise, and Promise vs async/await?", "A Promise represents a future value: pending, then fulfilled or rejected, handled with then/catch.|async/await is syntax over Promises that reads like synchronous code, with try/catch for errors; Promise.all still runs things in parallel.", "Promise = IOU; await = wait for the IOU.", "", "", "574,575"],
  ["s19", "B", "What is callback hell?", "Deeply nested callbacks for sequential async steps, hard to read and handle errors; solved with Promises and async/await, or by splitting into named functions.", "The pyramid of doom.", "", "", "577"],
  ["s19", "B", "Optional chaining and nullish coalescing?", "Optional chaining `user?.address?.city` returns undefined instead of throwing if something is null or undefined.|Nullish coalescing `count ?? 0` uses the default only for null or undefined, unlike `||` which also replaces 0 and empty strings.", "?. = safe step; ?? = default only for nothing.", "", "", "578,579"],
  ["s19", "I", "any vs unknown?", "any turns off type checking entirely. unknown accepts any value but forces you to narrow (typeof, instanceof, a type guard) before using it. Prefer unknown for untrusted data such as API responses or caught errors.", "any = no seatbelt; unknown = check before you drive.", "", "", "581"],
  ["s19", "I", "What are generics in TypeScript?", "Type parameters that make code reusable while keeping types, for example `function first<T>(items: T[]): T` or `ApiResponse<Shipment>`; constraints with `extends`.", "Generics = type placeholders.", "", "", "582"],
  ["s19", "I", "Union types, intersection types and type narrowing?", "Union `A | B`: a value is one of several types, such as `'Pending' | 'Shipped'`.|Intersection `A & B`: a value has all members of both.|Narrowing: TypeScript refines a union after checks (typeof, in, discriminant property, custom type guards).", "Union = either; intersection = both; narrowing = find out which.", "", "", "583,584,585"],
  ["s19", "B", "What is strict mode?", "In TypeScript, `strict: true` enables strict checks such as strictNullChecks and noImplicitAny, catching null and type bugs at compile time.|In JavaScript, 'use strict' (default in modules and classes) forbids sloppy features such as undeclared variables.", "Strict = the compiler as a pessimist.", "", "", "586"],
  // 20. Node / Python
  ["s20", "I", "Synchronous vs asynchronous Node.js?", "Node runs JavaScript on one thread with an event loop; asynchronous I/O lets it serve many requests while waiting. Synchronous calls (fs.readFileSync, heavy CPU loops) block every request, so use async APIs and worker threads for CPU work.", "Never block the single waiter.", "", "", "590"],
  ["s20", "B", "What is Express, and what is middleware in Express?", "Express is a minimal web framework for Node.js: routing, request/response helpers and middleware.|Middleware: functions (req, res, next) that run in order for logging, auth, parsing JSON, validation and error handling; error middleware has four parameters.", "Express middleware = ASP.NET Core middleware in JavaScript.", "", "", "591,592"],
  ["s20", "I", "How do you handle errors in Node.js?", "try/catch around awaited calls, a central error-handling middleware returning consistent JSON (problem details), never swallow rejections, process-level handlers for unhandledRejection to log and exit cleanly, and structured logging.", "Catch, centralise, log, never ignore.", "", "", "593"],
  ["s20", "I", "How do you secure Node.js APIs?", "JWT/OAuth validation middleware, input validation (Zod or Joi), helmet for security headers, rate limiting, CORS allow-list, parameterised queries, npm audit and dependency scanning, secrets from a vault, HTTPS.", "Same rules as .NET, different packages.", "", "", "594"],
  ["s20", "I", "Node.js vs .NET for backend development?", ".NET: strong typing, high performance, great for CPU-heavy and complex domain services, mature tooling (EF Core, DI built in).|Node.js: fast for I/O-bound glue and real-time services, shares language with the frontend, huge npm ecosystem.|I use .NET for core domain services and Node for I/O-heavy helpers such as the log summariser.", ".NET for the core, Node for the glue.", "", "", "595"],
  ["s20", "B", "Why did you use Python?", "For validation and scripting: Pydantic made vendor file schema checks quick and readable for the integration team, and Python with Shell is our release automation language alongside Ansible. Its libraries make data handling and automation fast to write.", "Python = the team's Swiss army knife.", "", "", "596"],
  ["s20", "I", "How do you structure a FastAPI application?", "app/ with routers per feature, Pydantic schemas, services for business logic, a data layer, core/ for config (pydantic-settings) and security, dependencies injected with Depends, tests with pytest and TestClient, Dockerfile and uvicorn.", "Routers, schemas, services, Depends.", "", "", "600"],
  ["s20", "I", "How do you implement authentication in FastAPI?", "OAuth2 bearer tokens: a dependency (OAuth2PasswordBearer or HTTPBearer) extracts the JWT, validates signature, issuer, audience and expiry against the identity provider's keys, and returns the user; routes declare `user = Depends(get_current_user)` and check scopes.", "A Depends that checks the badge.", "", "", "602"],
  // 21. SFTP
  ["s21", "B", "What is SFTP, and SFTP vs FTP vs FTPS?", "SFTP: file transfer over SSH (port 22): encrypted, one connection, key or password auth.|FTP: unencrypted, separate control and data connections.|FTPS: FTP over TLS with certificates; firewall-unfriendly because of data ports.", "SFTP = SSH; FTPS = FTP + TLS; FTP = postcard.", "sftpcmp", "", "603,604"],
  ["s21", "I", "How does SFTP authentication work, and password vs private-key authentication?", "The SSH handshake agrees algorithms and the client verifies the server's host key fingerprint (prevents man-in-the-middle); then the user authenticates.|Password: simple but can be guessed or leaked.|Private key: the client proves possession of a private key matching a public key on the server; stronger and automatable. We use keys, sometimes plus a password where vendors require both.", "Check the server's face, then show your key.", "", "", "605,606"],
  ["s21", "I", "How did you switch between providers?", "All three providers implement ISftpClient. A factory reads the provider name per vendor from configuration (for example `Sftp:Vendors:DepotA:Provider = Rebex`) and returns the right implementation, so switching a vendor is a config change and restart, with no code change.", "Change the setting, not the code.", "", "", "610"],
  ["s21", "I", "How did you handle connection failures and retries?", "The base class wraps operations with Polly: [3] retries with exponential backoff and jitter for transient errors (timeouts, connection resets), a fresh connection per attempt, no retry for auth or host key failures. After the last attempt the job is marked failed and an alert goes to the support channel; the next scheduled run picks it up again.", "Retry the network, not the wrong password.", "", "", "611,612"],
  ["s21", "I", "How did you validate file integrity and handle partial transfers?", "Compare the remote file size after upload with the local size, and where vendors support it a checksum (SHA-256) in a sidecar file.|Partial transfers: upload under a temporary name (.part), then rename when complete, so the vendor never picks up a half file; on download, read only files that are complete (stable size or a done marker) and verify before processing.", "Upload as .part, rename when whole.", "sftpsafe", "", "613,615"],
  ["s21", "I", "How did you handle duplicate files?", "Deterministic file names (vendor, type, timestamp, sequence), a processed-files table keyed by name and hash so the same file is never imported twice, and moving processed files to an archive folder.", "Remember every file you have eaten.", "", "", "614"],
  ["s21", "I", "How did you secure SFTP credentials?", "Private keys and passwords in [AWS Secrets Manager], read at runtime by the service role; never in config files or the repo; host key fingerprints pinned in configuration; rotation with vendors coordinated through change control; access logged.", "Keys in the vault, fingerprints pinned.", "", "", "616"],
  ["s21", "I", "What problems did you face with SFTP?", "Situation: vendor servers differ.|Task: keep transfers reliable.|Action and examples: [a depot vendor disabled ssh-rsa with SHA-1], which broke ComponentPro and led us to Rebex; [a vendor moved their pickup folder] without telling our team, so we added post-upload checks and alerts; [timeouts on large files over slow links], fixed with longer operation timeouts and resumable uploads.|Result: [no failed transfers caused by the switch], and faster diagnosis when vendors change things.", "Algorithms, folders, timeouts.", "", "", "618"],
  ["s21", "I", "How would you test an SFTP integration?", "Unit tests with a mocked ISftpClient for the business flow; integration tests against a containerised OpenSSH test server in CI (upload, download, list, rename, wrong key, bad host key, timeouts, a large file); contract checks against each vendor's test endpoint before go-live.", "Mock for logic, real server in a container for the wire.", "", "", "619"],
  // 22. WCF
  ["s22", "I", "WCF vs Web API?", "WCF: .NET Framework framework for SOAP services over many transports (HTTP, TCP, named pipes) with WS-* security and transactions; heavy configuration.|Web API: lightweight HTTP/REST with JSON, cross-platform on ASP.NET Core, easy for browsers and mobile. New work uses Web API or gRPC; CoreWCF exists for migrations.", "WCF = envelope with forms; Web API = simple JSON note.", "wcfapi", "", "621"],
  ["s22", "B", "What is SOAP?", "Simple Object Access Protocol: an XML messaging protocol with an envelope, header and body, described by a WSDL contract, supporting WS-Security and reliable messaging.", "XML in an envelope with a strict contract.", "", "", "623"],
  ["s22", "B", "What are service contracts, operation contracts and data contracts?", "[ServiceContract]: marks an interface as a WCF service.|[OperationContract]: marks a method in it as an exposed operation.|[DataContract] and [DataMember]: mark classes and properties that are serialised in messages.", "Service = the shop; operation = the counter; data = the parcel.", "", "", "625,626,627"],
  ["s22", "I", "What is dependency injection in .NET Framework?", "There is no built-in container in classic .NET Framework apps, so teams used Unity, Autofac, Ninject or Castle Windsor, wiring them into WCF with a custom instance provider or into MVC with a dependency resolver. ASP.NET Core made DI built in.", "Framework: bring your own container.", "", "", "628"],
  ["s22", "I", "Why migrate from WCF, and what challenges occur?", "Why: WCF server is not in modern .NET, Windows/IIS-bound, heavy configuration, and clients prefer REST/JSON; moving to .NET 8+ gives performance, containers and support.|Challenges: existing SOAP clients that cannot change (use CoreWCF or a facade), WS-* security and transactions, contract compatibility, testing every operation, and running old and new side by side during cut-over.", "Leave the old house, but keep the old address forwarding.", "", "", "630,632"],
  // 23. GxP
  ["s23", "B", "What does IRT mean?", "Interactive Response Technology: the system clinical trials use to randomise patients to treatment arms and manage drug supply, kit dispensing and shipments to sites (also called RTSM).", "IRT decides who gets which kit, and makes sure it is there.", "", "", "634"],
  ["s23", "B", "What is GxP, and why is it important?", "GxP: 'good practice' regulations (GCP, GMP, GLP) and related rules such as FDA 21 CFR Part 11 for electronic records.|Important because patient safety and trial data integrity depend on the software being correct, controlled and auditable; failures can invalidate trial data or harm patients.", "GxP = prove it is right, and prove nobody changed it.", "", "", "636,637"],
  ["s23", "I", "How does GxP affect software development?", "Documented requirements traced to tests, formal validation (FV) and UAT with evidence, change control for every release, code review and approvals, audit trails, access control, and no direct production changes. It slows releases but makes them predictable.", "Every change has a ticket, a test and a signature.", "gxpflow", "", "638"],
  ["s23", "B", "What are validation, traceability and auditability?", "Validation: documented evidence that the system does what it is intended to do, consistently.|Traceability: links from requirement to design, code, test and release.|Auditability: every create, change and delete is recorded with who, when, what and why, and cannot be altered.", "Proves it works, shows why, records who.", "", "", "639,640,641"],
  ["s23", "B", "What is change control?", "A formal process where every change to a validated system is requested, assessed for impact and risk, approved, tested, documented and released in a controlled way, with rollback plans.", "No change without paperwork and approval.", "", "", "642"],
  ["s23", "B", "What are UAT, FV and TechOps?", "FV (formal validation): the validation team executes scripted tests against requirements and records evidence.|TechOps: the operations team that installs and verifies releases in controlled environments and production.|UAT (user acceptance testing): business users or the client confirm the release meets their needs before production.", "FV proves, TechOps installs, UAT accepts.", "", "", "644,645,646,834,835"],
  ["s23", "I", "How do you ensure production changes are controlled?", "Only approved, versioned artifacts from the pipeline; change requests with approvals; deployment by TechOps or the controlled pipeline, never manual edits; separation of duties; verification after deployment; everything logged.", "Approved artifact, approved person, approved window.", "", "", "647"],
  ["s23", "I", "How do you maintain software quality in a regulated environment?", "Automated tests (unit, integration, Playwright E2E), SonarQube quality gates, mandatory reviews, definition of done that includes validation documents, FV and UAT, root-cause analysis for defects, and small, well-understood changes.", "Quality is built in, then proven.", "", "", "648"],
  ["s23", "I", "How do you handle security in clinical-trial software?", "SSO with role-based access and least privilege, blinding protection (who may see treatment assignments), encryption in transit and at rest, audit trails, secure coding and scans, protection of PHI and patient data, regular penetration tests and fast patching.", "Protect patients, protect the blind.", "", "", "649"],
  ["s23", "I", "How does shipment tracking integrate with external systems?", "IRT creates shipment orders and sends them to depot and courier vendors via SFTP files or APIs; vendors return status files or webhooks (dispatched, in transit, delivered, temperature excursion); IRT validates, updates shipment status, raises events (Kafka/RabbitMQ) and notifies sites.", "Order out, status back, events inside.", "shiptrack", "", "652"],
  ["s23", "I", "What external integrations does your system have?", "Depot and courier vendors (SFTP files and APIs for shipments), EDC and clinical systems (subject data), SSO identity provider, email and notification services, and sponsor reporting exports. Each has validation, retries, monitoring and audit.", "Depots, couriers, EDC, identity, notifications.", "", "", "653"],
  ["s23", "I", "How do you ensure data integrity?", "ALCOA+ principles (attributable, legible, contemporaneous, original, accurate); database constraints and transactions; validation at the API; immutable audit trails; idempotent processing; backups; reconciliation reports with vendors; restricted direct database access.", "ALCOA: who, readable, when, original, right.", "", "", "654"],
];

function listLabel(ids: string): string {
  return ids.split(",").map((i: string) => (i.includes("f") ? `section ${i.split("f")[0]} follow-up ${i.split("f")[1]}` : `#${i}`)).join(", ");
}

function visual(k?: string): ReactNode {
  switch (k) {
    case "propsstate":
      return <Table columns={["", "Props", "State"]} rows={[["Owned by", "Parent", "The component"], ["Changeable by component", "No (read-only)", "Yes (setState)"], ["Triggers re-render", "When parent passes new value", "When updated"], ["Example", "<KitRow kit={kit} />", "const [open, setOpen] = useState(false)"]]} />;
    case "varlet":
      return <Table columns={["", "var", "let", "const"]} rows={[["Scope", "Function", "Block", "Block"], ["Reassign", "Yes", "Yes", "No"], ["Redeclare", "Yes", "No", "No"], ["Before declaration", "undefined", "Error (TDZ)", "Error (TDZ)"]]} />;
    case "sftpcmp":
      return <Table columns={["", "FTP", "FTPS", "SFTP"]} rows={[["Encryption", "None", "TLS", "SSH"], ["Ports", "21 + data ports", "21/990 + data ports", "22 only"], ["Auth", "Password", "Password / certificate", "Password / SSH key"], ["Firewall friendly", "No", "No", "Yes"]]} />;
    case "sftpsafe":
      return <Steps steps={[{ title: "Upload as .part", detail: "orders_20240612.csv.part" }, { title: "Verify", detail: "Remote size or checksum matches" }, { title: "Rename", detail: "Atomic rename to final name" }, { title: "Record", detail: "Log name + hash in processed table" }, { title: "Archive", detail: "Move local copy to archive" }]} />;
    case "wcfapi":
      return <Table columns={["", "WCF", "ASP.NET Core Web API"]} rows={[["Protocol", "SOAP (and others)", "HTTP / REST"], ["Format", "XML", "JSON (and others)"], ["Transports", "HTTP, TCP, named pipes, MSMQ", "HTTP"], ["Platform", ".NET Framework, Windows", "Cross-platform .NET"], ["Config", "Heavy XML", "Code-first, light"]]} />;
    case "gxpflow":
      return <Steps steps={[{ title: "Requirement", detail: "Documented and approved" }, { title: "Design + code", detail: "Reviewed, traced to requirement" }, { title: "Tests", detail: "Automated + scripted, evidence kept" }, { title: "FV", detail: "Formal validation" }, { title: "UAT", detail: "Business acceptance" }, { title: "Change-controlled release", detail: "Approved, logged, verified" }]} />;
    case "shiptrack":
      return <Diagram direction="horizontal" nodes={[{ id: "irt", label: "IRT", detail: "creates shipment order" }, { id: "dep", label: "Depot vendor", detail: "SFTP / API" }, { id: "cour", label: "Courier" }, { id: "st", label: "Status files / webhooks" }, { id: "ev", label: "Events + site notifications" }]} edges={[{ from: "irt", to: "dep", label: "order file" }, { from: "dep", to: "cour", label: "dispatch" }, { from: "cour", to: "st", label: "tracking" }, { from: "st", to: "irt", label: "validated update" }, { from: "irt", to: "ev" }]} />;
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
    <Page title="Pradeep — Interview Q&A Bank (7/9): Your List — React, TypeScript, Node/Python, SFTP, WCF, GxP" summary={`${QS.length} new answers for questions from your list (sections 18 to 23) that parts 1 to 3 did not already answer. Each card shows which list numbers it answers.`} width="wide">
      <TableOfContents items={[{ label: "Filter and self-quiz", id: "quiz" }, ...topics.map((t) => ({ label: T[t], id: t }))]} />
      <Section heading="Filter and self-quiz" id="quiz">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <Select label="Topic" options={[{ value: "all", label: "All topics" }, ...ORDER.map((t) => ({ value: t, label: T[t] }))]} value={topic} onChange={setTopic} />
          <Segmented options={[{ value: "all", label: "All" }, { value: "B", label: "Basic" }, { value: "I", label: "Intermediate" }, { value: "A", label: "Advanced" }]} value={diff} onChange={setDiff} />
          <Input label="Search" value={search} onChange={setSearch} placeholder="e.g. useMemo, SFTP, validation" />
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


