import re,glob,sys
stop=set("what is the a an of and in to how do you does for with on between difference your it are can why when which would we i be use or".split())
def tok(s): return set(w for w in re.findall(r"[a-z0-9#+.]+",s.lower()) if w not in stop)
old=[l.rstrip('\n').split('\t') for l in open('/tmp/titles.txt')]
new=[]
for f in sorted(glob.glob('src17/*.md')):
    for m in re.finditer(r'^### (\w+) \| (.+?) \|',open(f).read(),re.M): new.append((f,m.group(2)))
th=float(sys.argv[1]) if len(sys.argv)>1 else 0.6
for f,t in new:
    a=tok(t)
    for o in old:
        b=tok(o[2]); j=len(a&b)/max(1,len(a|b))
        if j>=th: print(f"{j:.2f} | {t} || {o[0]} {o[2]}")
seen={}
for f,t in new:
    a=frozenset(tok(t))
    for t2,b in seen.items():
        j=len(a&b)/max(1,len(a|b))
        if j>=th: print(f"SELF {j:.2f} | {t} || {t2}")
    seen[t]=a
