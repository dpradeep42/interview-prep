# Converts build/src17/*.md (### topic | title | aliases, then paragraphs) into enrich/n15-p17-new.txt with ids p17-1..N.
import os,re,sys,glob
W=re.compile(r"[A-Za-z0-9][A-Za-z0-9'’.\-]*")
out=[];n=0;short=[];longq=[];topics={}
for f in sorted(glob.glob(os.path.join(os.path.dirname(__file__),'src17','*.md'))):
    blocks=re.split(r'^### ',open(f).read(),flags=re.M)[1:]
    for b in blocks:
        head,*body=b.strip().split('\n')
        parts=[p.strip() for p in head.split('|')]
        topic,title=parts[0],parts[1]; al=parts[2] if len(parts)>2 else ''
        paras=[p.strip() for p in '\n'.join(body).split('\n\n') if p.strip()]
        paras=[' '.join(p.split('\n')) for p in paras]
        n+=1; topics[topic]=topics.get(topic,0)+1
        wc=len(W.findall(re.sub(r'[\[\]]','',' '.join(paras))))
        if wc<152: short.append((n,wc,title,f))
        if wc>287: longq.append((n,wc,title,f))
        out.append(f'@p17-{n}\nS: {topic}\nD: A\nT: {title}\n'+(f'K: {al}\n' if al else '')+''.join(f'X: {p}\n' for p in paras))
open(os.path.join(os.path.dirname(__file__),'enrich','n15-p17-new.txt'),'w').write(''.join(out))
print('total',n,topics)
for s in short: print('SHORT',s)
for s in longq: print('LONG',s)
