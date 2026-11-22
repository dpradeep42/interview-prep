# One-off (Nov 2026): wove Angular/React and the "what a study is" sentence into existing answers. Already applied; do not re-run.
import re,glob,sys
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
    assert len(hits)>=1,(id,old)
    f,i=hits[0]; files[f][i]=files[f][i].replace(old,new,1)
STUDY="A study here means one clinical trial set up in our IRT system, with its protocol rules, countries and sites, treatment arms, visit schedule, drug kits and user roles."
def addstudy(id):
    for f,i in lines_of(id):
        l=files[f][i]
        if 'one clinical trial set up' in l: return
        m=re.search(r'\b(stud(y|ies)|clinical[- ]trial)\b',l,re.I)
        if not m: continue
        # end of the sentence containing the match
        e=re.search(r'[.!?](\s|$)',l[m.end():])
        pos=m.end()+(e.end() if e else len(l)-m.end())
        files[f][i]=l[:pos].rstrip()+' '+STUDY+(' '+l[pos:].lstrip() if l[pos:].strip() else '')
        return
    print('NO STUDY MENTION',id)
# --- Angular / React weaving
weave('p3-1','I also build Node and Python services and React components.','I also build Node and Python services, and front-end components. Our IRT UI is component-based: it started on Angular and is moving to React with TypeScript, so older screens are Angular and new modules are React, and I work in both.')
weave('p3-1','handles patient randomization, drug supply, shipment tracking and eConsent for global trials.','handles patient screening, randomization, drug supply, shipment tracking, eConsent and drug accountability for global trials.')
weave('p3-3','It also supports electronic consent.','It also supports electronic consent, and it tracks every kit that patients return, which we call drug accountability. Each trial is set up in IRT as a study, by our internal team using a tool called the Admin console: the hospitals, the treatment groups, the visit plan and the medicine kits.')
weave('p3-4','plus some Node, Python and React work,','plus some Node and Python work, and front-end work in both our older Angular screens and our newer React with TypeScript modules,')
weave('p3-7','which has Angular modules and newer React components,','which covers screening, randomisation, re-randomisation, eConsent and DARM for drug accountability. It is component-based, with older screens in Angular and newer modules in React with TypeScript, both calling the same .NET Web APIs, and internal teams build studies in our Admin console,')
weave('p3-22','I build responsive, reusable React components with TypeScript, and I also work on Angular modules in the older parts of the UI.','Our UI uses both frameworks and is component-based: it started on Angular, and we are moving to React with TypeScript module by module, so older screens are Angular and new modules are React, all calling the same .NET Web APIs. I build responsive, reusable React components with TypeScript, and I also work on the Angular modules.')
weave('p4-1','The frontend part is React and TypeScript components and some Angular modules in the IRT UI,','The frontend part is React and TypeScript components and some Angular modules in the IRT UI, because our component-based UI started on Angular and new modules are now built in React,')
weave('p4-11',"I've worked on Angular modules in the IRT UI,","I've worked on Angular modules in the IRT UI, since our product started on Angular and is moving to React module by module,")
weave('p1-71',"I've worked with both on IRT. I maintained Angular modules in parts of the existing UI, and built new screens in React. I can talk about how we migrated pieces between them.","I've worked with both on IRT. Our UI started on Angular and is moving to React with TypeScript, module by module. Older screens stay in Angular, new modules are built in React, both are component-based, both call the same .NET Web APIs, and a shared design system keeps them looking the same. So I maintain Angular modules and build new React screens.")
weave('p7-15',"Some of our older screens are in Angular, so I work with both.","We didn't rewrite everything at once, because it's a GxP-regulated product. Older screens stay in Angular, new modules are built in React with TypeScript, module by module, and both call the same .NET Web APIs with types from one OpenAPI contract, so I work with both.")
weave('p4-96',"Contract: DTOs, OpenAPI documentation, versioning,","Contract: DTOs, OpenAPI documentation, versioning, which matters for us because the same APIs serve both our Angular screens and our newer React modules,")
weave('p3-2',"Then I took on release integration across the application, APIs, database and UI,","Along the way I also worked on the front end, which started on Angular and is moving to React with TypeScript. Then I took on release integration across the application, APIs, database and UI,")
weave('p8-62',"there are services for each business area: study setup, randomisation, supply planning, shipments, and subjects.","there are services for each business area: study setup behind our internal Admin console, screening and subjects, randomisation and re-randomisation, eConsent, supply planning and shipments, and DARM for drug accountability. The UI is component-based, with older screens in Angular and newer modules in React with TypeScript.")
weave('p4-14',"For the UI, React with TypeScript.","For the UI, React with TypeScript, which is also where our own product is heading, moving from Angular module by module.")
for id in ["p3-15","p3-16","p3-44","p3-45","p4-5","p9-1","p9-2","p9-4","p9-5","p9-6","p9-8","p9-9","p2-67","p2-69","p7-48","p7-56","p7-58","p8-62"]:
    addstudy(id)
for f,L in files.items(): open(f,'w').write('\n'.join(L))
