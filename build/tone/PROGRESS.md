# Spoken-tone rewrite (t28u)
- Tools: tone/check.py (AI-tell checker; args like p17-1:35, -v), tone/tool.py dump IDs / apply tone/rw/NNN.txt
- Baseline before (all 1873): ban_ans 281, spoken_ans 203, spoken_open 9, contr/100w 1.40, burst 0.479, consec_open 149
- Done: ALL p17 (rw 001..087); old o00..o03 (p1-1..48, rw 088..091). Next: old batch o04 (bash tone/ob.sh 4), rw 092. Before-stats old: tone/before-old.txt
- Order: p17-36.. then p1..p16
- NOTE: box refresh wipes build/ (untracked + gitignored files incl. tone/orig, node_modules). Commit locally after EVERY batch; restore with git restore build/ + npm install in build/.
