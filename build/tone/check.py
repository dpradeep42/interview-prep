# AI-tell checker for spoken answers. Usage: python3 tone/check.py [idprefix ...]  (reads enrich/*.txt X lines)
import re,glob,sys,statistics as st,json,collections
def load():
    A=collections.OrderedDict(); cur=None
    for f in sorted(glob.glob('enrich/*.txt')):
        for l in open(f):
            m=re.match(r'^\+?@(\S+)\s*$',l)
            if m: cur=m.group(1); continue
            if cur and l.startswith('X: '): A.setdefault(cur,[]).append(l[3:].strip())
    return A
BAN=[r'\badditionally\b',r'\bfurthermore\b',r'\bmoreover\b',r'\bin conclusion\b',r"\bit'?s important to note\b",r'\bit is important to\b',r'\bleverag',r'\brobust\b',r'\bseamless',r'\bcrucial\b',r'\bdelve',r'\bin summary\b',r'\bfirstly\b',r'\bsecondly\b',r'\bthirdly\b',r'(?:^|[.!?] )finally,',r'\boverall,',r'\butiliz',r'\bpivotal\b',r'\bin today\'s\b',r'\bplays a (?:key|vital|crucial) role\b',r'\bfoster',r'\bholistic\b',r'\bstreamlin',r'\bempower',r'\bnuanced?\b',r'\bin essence\b',r'\bthe key takeaway\b',r'\bensures?\b',r'\bensuring\b',r'(?:^|[.!?] )(?:first|second|third),',r'\bthe main reasons? (?:is|are)\b',r'\ba few practical points\b',r'\bthe benefits? (?:is|are)\b',r'\bthe trade-?off is\b',r'\bthere are (?:a few|several|two|three) (?:ways|approaches|options|kinds|types|levels)\b']
SPOKEN=r"\b(so basically|basically|actually|honestly|i mean|you know|see,|okay,? so|let me|so yeah|like i said|to be honest|i'd say|what we did|in my team|in my project|the hard way|kind of|pretty much|i think|i remember|if i remember|right\?|depends on|that's how|that's usually|so that's|here's the catch|the thing is|one thing|people (?:forget|miss|mix)|same idea|no question|that's it|i'd say|let me|i'll be honest|for me)\b"
OPEN=['so basically','okay so','okay, so','see,','actually','honestly','so,','so ','let me','yeah','right,','well,','good question','in my project','one thing','to be honest','sure','hmm']
def sents(t): return [s for s in re.split(r'(?<=[.!?])\s+',t) if s.strip()]
def stats(ids,A):
    r=dict(n=0,ban=0,ban_ans=0,spoken_ans=0,spoken_open=0,contr=0,words=0,burst=[],consec_open=0,bad=[])
    prev=None; hits=collections.Counter()
    for i in ids:
        t=' '.join(A[i]); tl=t.lower(); r['n']+=1
        b=0
        for p in BAN:
            c=len(re.findall(p,tl,flags=re.M))
            if p.startswith(r'\bensure'): c=max(0,c-1)
            if c: hits[p]+=c; b+=c
        r['ban']+=b; r['ban_ans']+= b>0
        sp=len(re.findall(SPOKEN,tl)); r['spoken_ans']+= sp>0
        op=' '.join(tl.split()[:2]); fo=next((o for o in OPEN if tl.startswith(o)),None); r['spoken_open']+= fo is not None
        key=tl.split()[0] if tl.split() else ''
        if prev is not None and key==prev: r['consec_open']+=1
        prev=key
        w=len(t.split()); r['words']+=w; r['contr']+=len(re.findall(r"\b\w+'(?:s|t|re|ve|ll|d|m)\b",tl))
        L=[len(s.split()) for s in sents(t)]
        if len(L)>2: r['burst'].append(st.pstdev(L)/st.mean(L))
        if b or sp==0: r['bad'].append((i,b,sp))
    r['burst']=round(st.mean(r['burst']),3) if r['burst'] else 0
    r['contr_per100w']=round(100*r['contr']/max(1,r['words']),2)
    r['top_banned']=hits.most_common(8)
    return r
if __name__=='__main__':
    A=load(); pre=sys.argv[1:]
    pre=[p for p in pre if p!='-v']; ids=[]
    for p in pre:
        if ':' in p:
            b,r=p.rsplit('-',1); a,z=map(int,r.split(':')); ids+= [f'{b}-{k}' for k in range(a,z+1) if f'{b}-{k}' in A]
        else: ids+=[i for i in A if i.startswith(p)]
    if not pre: ids=list(A)
    r=stats(ids,A); bad=r.pop('bad'); print(json.dumps(r)); 
    if '-v' in sys.argv: print(bad[:40])
