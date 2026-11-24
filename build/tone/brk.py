import re,sys
def br(f): return sorted(re.findall(r'\[[^\]]*\]|\{\{|\}\}',open(f).read()))
a,b=br(sys.argv[1]),br(sys.argv[2])
print('BRACKETS OK' if a==b else ('BRACKET MISMATCH',[x for x in a if x not in b],[x for x in b if x not in a]))
