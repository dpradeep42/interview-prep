import sys;sys.path.insert(0,'tone');from check import load;A=load()
ids=list(A);a,b=sys.argv[1],sys.argv[2];i,j=ids.index(a),ids.index(b)
print(' | '.join(f"{k}:{A[k][0].split()[0]}" for k in ids[max(0,i-1):j+2]))
