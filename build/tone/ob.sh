# usage: tone/ob.sh N  -> dumps batch N (0-based, 12 per batch) of older ids into tone/orig/oNN.txt
n=$1; ids=$(tr ' ' '\n' < tone/old-ids.txt | sed -n "$((n*12+1)),$((n*12+12))p")
python3 tone/tool.py dump $ids > tone/orig/o$(printf %02d $n).txt; echo $ids
