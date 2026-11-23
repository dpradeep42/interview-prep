# One-off (Nov 2026): wove MCP-in-.NET-8 and the RAG-for-Copilot/Cursor story into existing answers. Already applied; do not re-run.
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
weave('p8-12','I built the CIRT MCP server in C# on .NET, using','I built the CIRT MCP server in C# on .NET 8, the long-term support release at the time, using')
weave('p3-8',"it's written in C# with the official MCP SDK","it's written in C# on .NET 8 with the official MCP SDK")
weave('p2-55',"It's built in C# with the official MCP SDK","It's built in C# on .NET 8 with the official MCP SDK")
weave('p4-4','Step by step it grew to about 77 tools','I built it in C# on .NET 8 with the official MCP SDK. Step by step it grew to about 77 tools')
weave('p2-65','After I built the CIRT MCP server,','After I built the CIRT MCP server in .NET 8,')
weave('p9-48','The RAG workflow I built is an [internal assistant over our release runbooks, deployment guides and past incident notes]. Engineers ask questions like "what do we check if a node fails the version verification?", and get an answer grounded in our own documents, with links to the sources.',
 'My main RAG system, built in Python, gives GitHub Copilot and Cursor the context of our existing codebase and coding standards, through MCP tools like search_codebase and get_coding_standards, so their code fits the project and hallucinations drop. [Its first version was an assistant over our release runbooks and incident notes], and the same design serves both.')
weave('p9-48','The documents are collected, cleaned, and split into chunks of a sensible size, with some overlap, so each chunk has enough context.','Code is chunked by structure with tree-sitter, one method or class per chunk, and documents by headings, so each chunk has enough context.')
weave('p9-48','and stored in a vector index, along with','and stored in PostgreSQL with pgvector, along with')
weave('p9-48','the most similar chunks are retrieved from the index.','the best chunks are retrieved with hybrid vector and keyword search.')
weave('p9-48','For quality, we tested it with [30] real questions from the team, checking whether the answers were correct and cited the right documents, and adjusted the chunk size and retrieval based on the results.','For quality, I built a golden set of [about 60] real questions, and tuning chunking and retrieval lifted [recall at five from about 62 to about 88 percent].')
weave('p9-48','it only contains internal engineering documents.','it only contains internal code and engineering documents.')
weave('p2-61','For example, a RAG assistant over our release runbooks and deployment logs could answer "why did the last UAT deployment fail" with links.','In my work, I built a RAG service in Python that gives GitHub Copilot and Cursor the context of our codebase and coding standards, through MCP tools like search_codebase, so their code fits our project and hallucinations drop.')
weave('p2-58','like our logging and error handling patterns.','like our logging and error handling patterns. And through a RAG service I built in Python, exposed as MCP tools, Copilot and Cursor pull our existing code and coding standards as context, so implementations fit the project and hallucinate less.')
weave('p3-1','an internal MCP server that I designed and built on my own.','an internal MCP server that I designed and built on my own in .NET 8.')
weave('p3-1','and the people needed from 6 to 1.','and the people needed from 6 to 1. I also built a Python RAG service that gives Copilot and Cursor our codebase and standards as context.')
weave('p4-10','and deployments went from 6 hours to 2 and from 6 people to 1.','and deployments went from 6 hours to 2 and from 6 people to 1. I built it in .NET 8. Then I built a RAG service in Python that gives GitHub Copilot and Cursor the context of our codebase and coding standards, so AI-written code fits our project and hallucinates less.')
weave('p8-29','Then evaluate it with a test set.','Then evaluate it with a test set. That\'s how I built our RAG service in Python, which gives GitHub Copilot and Cursor the context of our codebase and coding standards.')
for f,L in files.items(): open(f,'w').write('\n'.join(L))
