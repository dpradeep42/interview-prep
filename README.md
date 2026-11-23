# Pradeep — Interview answers

A minimal, phone-first site: type a question, tap it, read the answer out loud.

- **Search only.** One search box. Results update as you type, best match first. Every question from my own list (982 items) and every question in the bank finds its answer, including alternative wordings and abbreviations (DI, JWT, k8s, EF Core, MCP...).
- **Answer only.** The question, then one complete first-person answer to say, about 60–120 seconds (150–290 words), in large type. A diagram appears below only where a picture genuinely helps (about 70 answers). No buttons, tags or extras. Back with the ← arrow, a right swipe, or the browser's back button.
- **Self-contained answers.** Each answer repeats any background it needs (for example, the custom middleware answer first explains middleware and the pipeline), so no answer depends on another.
- **Deep links:** `#q/<question-slug>`, e.g. `#q/what-is-custom-middleware-and-how-do-you-write`.
- 831 answers, including Angular, React + TypeScript, the Angular-to-React story, the IRT domain and platform (studies, Screening, Randomisation, Re-randomisation, eConsent, DARM, Admin console, integrations, Keycloak, RabbitMQ, Quartz, reports), updated with real facts from Cursor, the on-premise Azure DevOps and AWS story, AlertWatchDog, and an AI section (the CIRT MCP server in .NET 8, RAG for Copilot and Cursor in Python, the end-user RAG assistant, applied AI engineering). With the search box empty, the home screen lists every question in order (your question list first); typing switches to ranked results. Works offline after the first visit (service worker). `interview-prep.html` is the same site as one file.

Story details such as dates, team sizes and most numbers were **invented** to make the answers concrete; they are listed per answer in `NOTES-invented-details.md`. Figures from the resume (6 hours to 2, 6 people to 1, about 77 tools, the CIRT MCP server, the ~100-member organisation) are real.

Build: `cd build && node enrich.mjs && node build.mjs`. Tests: `node tsearch.mjs <url>` (search ranking) and `node tui.mjs <url>` (UI at 390 px and 1280 px, every answer, list coverage).
