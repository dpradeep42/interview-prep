import sys;sys.path.insert(0,'tone');from check import load;A=load()
ids=list(A);ws=open(sys.argv[1]).read().split('\n');want=[l[1:].split()[0] for l in ws if l.startswith('@')]
out=[];prev=None
for w in want:
    i=ids.index(w)
    if prev is None or ids[i-1]!=prev: out.append('['+ids[i-1]+':'+A[ids[i-1]][0].split()[0]+']')
    out.append(w+':'+A[w][0].split()[0]); prev=w
j=ids.index(prev)
if j+1<len(ids): out.append('['+ids[j+1]+':'+A[ids[j+1]][0].split()[0]+']')
print(' | '.join(out))
