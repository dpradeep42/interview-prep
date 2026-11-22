# Deep-answer job (t6u)
- Format: build/enrich/*.txt parsed by build/enrich.mjs -> enrich.json + p10.json; build.mjs merges; template renders Quick / Key points / Impress / follow-ups.
- Done batches: b00-p10, b01-b03 (p1 all 81).
- Next: p1-1.. in order, then p2..p9. Check coverage: node -e over data.json ids vs enrich.json keys.

## Status (Nov 22)
- All 670 entries enriched (quick, 4+ impress items, follow-ups; W lines on stories). Top-ups in enrich/c01..c07 using `+@id` append blocks.
- test4.mjs: 390px and 1280px, all 670 open, 182 code blocks, 54/54 mermaid SVGs, 0 JS errors, no horizontal overflow. test3.mjs passes.
