# One-off (Nov 2026): wove AlertWatchDog into existing answers. Already applied; do not re-run.
import re,glob
files={f:open(f).read().split('\n') for f in sorted(glob.glob('enrich/*.txt'))}
def lines_of(id):
    out=[]
    for f,L in files.items():
        cur=None
        for i,l in enumerate(L):
            m=re.match(r'^\+?@(\S+)\s*$',l)
            if m: cur=m.group(1); continue
            if cur==id and l.startswith('X: '): out.append((f,i))
    return out
def weave(id,old,new):
    hits=[(f,i) for f,i in lines_of(id) if old in files[f][i]]
    assert hits,(id,old)
    f,i=hits[0]; files[f][i]=files[f][i].replace(old,new,1)
weave('p3-1',"I also own production issues, for example I root-caused a RabbitMQ outage and fixed it with publisher confirms.","I also own production issues: I root-caused a RabbitMQ outage and fixed it with publisher confirms, and I built AlertWatchDog, an Azure Functions tool that alerts us when background jobs or queues fail.")
weave('p2-33',"The principle I follow is alert on symptoms users feel,","For background work, like scheduled jobs, vendor files and dead-letter queues, I also built AlertWatchDog, a small Azure Functions tool that checks them every few minutes and alerts the team in Teams, escalating if nobody responds. The principle I follow is alert on symptoms users feel,")
weave('p5-52',"I can explain how we tune alerts to avoid noise.","We also run AlertWatchDog, a monitoring tool I built with Azure Functions, which watches scheduled jobs, vendor files and dead-letter queues, and escalates to on-call if an alert isn't acknowledged.")
weave('p2-36',"because silence was the symptom.","because silence was the symptom. The same idea drives AlertWatchDog, the Azure Functions monitoring tool I built: it alerts when an expected job run or vendor file doesn't happen.")
weave('p14-8',"In practice, we still use Azure DevOps to deploy into AWS, so I use both sides of this map every day.","In practice, we still use Azure DevOps to deploy into AWS, and my AlertWatchDog monitoring tool runs on Azure Functions, which would map to Lambda, EventBridge Scheduler, SQS and Step Functions on AWS.")
weave('p14-15',"Whatever the tool, the key is in the code:","I've used both: our AWS services report to CloudWatch, while AlertWatchDog, the monitoring tool I built on Azure Functions, reports its own health to Application Insights. Whatever the tool, the key is in the code:")
weave('p5-78',"I can explain how we tuned them.","For things a metric can't show, like a scheduled job or vendor file that never ran, AlertWatchDog, the Azure Functions tool I built, raises the alert instead.")
for f,L in files.items(): open(f,'w').write('\n'.join(L))
