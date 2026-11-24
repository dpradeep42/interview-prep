# dump: python3 tone/tool.py dump p17-1 p17-35   -> prints originals (id range within a prefix) 
# apply: python3 tone/tool.py apply tone/rw/xxx.txt  (blocks: "@id" line then paragraphs separated by blank lines)
import re,glob,sys,os
def p17map():
    m={};n=0
    for f in sorted(glob.glob('src17/*.md')):
        blocks=re.split(r'(?m)^(?=### )',open(f).read())
        k=0
        for b in blocks:
            if not b.startswith('### '): continue
            n+=1; m[f'p17-{n}']=(f,k); k+=1
    return m
def cards(f): return [b for b in re.split(r'(?m)^(?=### )',open(f).read()) if b.startswith('### ')], (re.split(r'(?m)^(?=### )',open(f).read())[0])
def xlines(id):
    out=[]
    for f in sorted(glob.glob('enrich/*.txt')):
        if 'n15-p17' in f: continue
        L=open(f).read().split('\n'); cur=None
        for i,l in enumerate(L):
            mm=re.match(r'^\+?@(\S+)\s*$',l)
            if mm: cur=mm.group(1); continue
            if cur==id and l.startswith('X: '): out.append((f,i))
    return out
def get(id):
    if id.startswith('p17-'):
        f,k=P[id]; cs,_=cards(f); h,b=cs[k].split('\n',1)
        return h,[' '.join(p.split()) for p in b.strip().split('\n\n') if p.strip()]
    xs=xlines(id); return None,[open(f).read().split('\n')[i][3:] for f,i in xs]
P=p17map()
def order():
    import json
    ids=list(P)
    return ids
if sys.argv[1]=='dump':
    ids=sys.argv[2:]
    for id in ids:
        h,ps=get(id); print('@'+id, '|', (h or '').split('|')[1].strip() if h else '')
        print('\n\n'.join(ps)); print()
elif sys.argv[1]=='apply':
    txt=open(sys.argv[2]).read()
    for blk in re.split(r'(?m)^@',txt):
        if not blk.strip(): continue
        id,body=blk.split('\n',1); id=id.split()[0].strip()
        paras=[' '.join(p.split()) for p in body.strip().split('\n\n') if p.strip()]
        if id.startswith('p17-'):
            f,k=P[id]; raw=open(f).read(); parts=re.split(r'(?m)^(?=### )',raw)
            idx=[j for j,b in enumerate(parts) if b.startswith('### ')][k]
            h=parts[idx].split('\n',1)[0]
            parts[idx]=h+'\n'+'\n\n'.join(paras)+'\n\n'
            open(f,'w').write(''.join(parts))
        else:
            xs=xlines(id); assert xs,id
            fs={f for f,i in xs}; assert len(fs)==1,(id,fs)
            f=xs[0][0]; L=open(f).read().split('\n'); ii=[i for _,i in xs]
            assert ii==list(range(ii[0],ii[-1]+1)),(id,'noncontig')
            L[ii[0]:ii[-1]+1]=['X: '+p for p in paras]
            open(f,'w').write('\n'.join(L))
        print('applied',id,len(' '.join(paras).split()))
