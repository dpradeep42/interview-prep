# One-off (Nov 2026): align CIRT-context answers with real facts (on-prem IIS, SQL Server per study, RabbitMQ, Redis, Splunk).
# Already applied; do not re-run.
import os,re,sys
D='enrich'
files=sorted(f for f in os.listdir(D) if f.endswith('.txt'))
data={f:open(os.path.join(D,f)).read().split('\n') for f in files}
def locs(id):
    out=[]
    for f in files:
        cur=None
        for n,l in enumerate(data[f]):
            if l.startswith('+@') or l.startswith('@'): cur=l.lstrip('+@').strip(); continue
            if cur==id and l.startswith('X:'): out.append((f,n))
    return out
miss=[]
def R(id,old,new):
    hits=[(f,n) for f,n in locs(id) if old in data[f][n]]
    if len(hits)!=1:
        # try bracket-insensitive
        for f,n in locs(id):
            if old in data[f][n].replace('[','').replace(']',''): print('BRACKET',id,'|',data[f][n][:3000]); break
        miss.append((id,old[:70],len(hits))); return
    f,n=hits[0]; data[f][n]=data[f][n].replace(old,new,1)
def SET(id,lineno_contains,newline):
    hits=[(f,n) for f,n in locs(id) if lineno_contains in data[f][n]]
    if len(hits)!=1: miss.append((id,'SET '+lineno_contains,len(hits))); return
    f,n=hits[0]; data[f][n]='X: '+newline
exec(open('fix6_list.py').read())
if miss:
    for m in miss: print('MISS',m)
    sys.exit(1)
for f in files: open(os.path.join(D,f),'w').write('\n'.join(data[f]))
print('ok')
