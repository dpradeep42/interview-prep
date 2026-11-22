# One-off (Nov 2026): wove the CIRT / on-premise Azure DevOps / AWS story into existing answers. Already applied; do not re-run.
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
weave('p3-1','Everything runs on AWS, with Docker, Terraform and Azure DevOps pipelines.','Our newer services run on AWS, with Docker and Terraform, while builds and releases run on an on-premise Azure DevOps Server, because the product started as CIRT at Cenduit before IQVIA acquired it, and IQVIA standardises on AWS.')
weave('p3-2','In July 2022 I moved to IQVIA as a Software Development Engineer 2 on IRT, our clinical-trial platform.','In July 2022 I moved to IQVIA as a Software Development Engineer 2 on IRT, our clinical-trial platform. It started as CIRT, Cenduit\'s IRT, and after IQVIA acquired Cenduit it was moving step by step from on-premise to AWS, so I\'ve worked across both.')
weave('p3-8','Why: our deployments ran on an on-premise Azure DevOps Server across many nodes, and they were largely manual.','Why: our deployments ran on an on-premise Azure DevOps Server across many nodes, and they were largely manual. That server is a legacy of CIRT, Cenduit\'s IRT, which IQVIA acquired: new services moved to AWS, but validated builds and releases stayed on-premise, where AI assistants like Copilot and Cursor couldn\'t reach.')
weave('p4-4','The situation was that our deployments ran on on-premise Azure DevOps Server across many nodes.','The situation was that our deployments ran on on-premise Azure DevOps Server across many nodes. That server came from CIRT, Cenduit\'s IRT, before IQVIA acquired it; new services moved to AWS, but validated releases stayed on-premise.')
weave('p2-25','Our pipeline is in Azure DevOps,','Our pipelines run on an on-premise Azure DevOps Server, inherited from CIRT, Cenduit\'s IRT, before IQVIA acquired it, and they deploy to both our on-premise nodes and AWS. Each pipeline is')
weave('p5-64',"AWS was the company's chosen cloud platform for IRT, so the decision was made at an organisational level,","AWS is IQVIA's standard cloud. Our product started as CIRT at Cenduit, with on-premise servers and an on-premise Azure DevOps Server, and after IQVIA acquired Cenduit, new and migrated services moved to AWS. So the decision was made at an organisational level,")
weave('p5-63',"Our IRT platform runs on AWS, and I can walk through it from the request inwards.","Our IRT platform's newer services run on AWS, while the older CIRT core and our Azure DevOps Server are still on-premise, a legacy from before IQVIA acquired Cenduit. I'll walk through the AWS side from the request inwards.")
weave('p6-30',"We deploy to AWS from Azure DevOps by","Our Azure DevOps Server is on-premise, a legacy from Cenduit's CIRT, but new services run on AWS, IQVIA's standard cloud. So we deploy to AWS from Azure DevOps by")
weave('p9-14',"Each of our environments has [4 to 6] nodes,","Each environment of our core CIRT application has [4 to 6] server nodes, [still on-premise for the validated environments],")
weave('p8-14',"One practical challenge was that the on-premise API versions differ from the cloud documentation,","That's exactly why an MCP server was needed: our Azure DevOps Server is on-premise, a legacy from Cenduit's CIRT, so cloud integrations and AI assistants couldn't reach it. One practical challenge was that the on-premise API versions differ from the cloud documentation,")
weave('p2-26',"In our environment, we have both.","In our environment, we have both, because our on-premise Azure DevOps Server grew out of Cenduit's Team Foundation Server.")
for f,L in files.items(): open(f,'w').write('\n'.join(L))
