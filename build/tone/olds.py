import sys,json;sys.path.insert(0,'tone');import check
A=check.load(); ids=[i for i in A if not i.startswith('p17-')]
order=sorted(ids,key=lambda i:(int(i.split('-')[0][1:]),int(i.split('-')[1])))
if sys.argv[1:]==['ids']: print(' '.join(order))
else: r=check.stats(order,A); bad=r.pop('bad'); print(json.dumps(r)); print(len(bad))
