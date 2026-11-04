# 09. MCP: share tools, and know when not to

## What is inside

| File | What it is |
|---|---|
| [mcp_end_to_end.ipynb](../09-mcp/mcp_end_to_end.ipynb) | The full story, from hand-written tools to MCP and back |
| [project_research_bot/tavily_tools.py](../09-mcp/project_research_bot/tavily_tools.py) | Hand-written Tavily tools |
| [project_support_bot/tavily_tools.py](../09-mcp/project_support_bot/tavily_tools.py) | A copy of the same tools that has drifted apart |
| [servers/support_server.py](../09-mcp/servers/support_server.py) | Our own MCP server: tickets and a knowledge base |
| [servers/emi_server.py](../09-mcp/servers/emi_server.py) | One small tool in a whole server, to show overkill |

## The big idea, in simple words

**MCP (Model Context Protocol)** is a standard way for an AI app to talk to tools.

Think of a phone charger. Before USB-C, every phone needed its own cable. With one standard plug, any charger works with any phone. MCP is that plug for AI tools.

```
Without MCP:  every app writes its own code for every tool
With MCP:     tool makers run one server, and every app connects to it
```

| Word | Means | Example |
|---|---|---|
| **Server** | Owns the tools | Tavily's server, or our `support_server.py` |
| **Client** | Connects and uses them | Our agent, Claude Code, Cursor |

## The story in the notebook

### 1. Write tools by hand

Wrap each Tavily feature in a `@tool` function and give the list to an agent. This is the normal way, and it works.

### 2. Feel the pain

A second project needs the same tools, so the file gets copied. Later one copy improves and the other doesn't. The notebook prints the difference between the two files. That is what breaking **DRY** (Don't Repeat Yourself) looks like.

A shared Python package fixes this for Python projects. But it can't reach a JavaScript app or Claude Code.

### 3. MCP: tools become a URL

```python
from langchain.mcp import MCPAdapter

tavily_server = {
    "url": "https://mcp.tavily.com/mcp/",
    "headers": {"Authorization": f"Bearer {os.environ['TAVILY_API_KEY']}"},
}

async with MCPAdapter({"mcpServers": {"tavily": tavily_server}}) as tavily_adapter:
    tavily_tools = await tavily_adapter.list_tools()

search_only_tools = [mcp_tool for mcp_tool in tavily_tools if mcp_tool.name == "tavily_search"]

agent = create_agent(model="openai:gpt-4.1-mini", tools=search_only_tools)
```

No tool code. The tools, their descriptions and their arguments all come from the server.

The server also decides how much text a tool returns, so give each agent only the tools it needs. Reading a whole page can return a lot of text, and every word costs tokens.

### 4. A simple real use case

A support agent needs private company tools and the public web. We put the private tools on our own server, using `FastMCP`:

```python
from fastmcp import FastMCP

server = FastMCP("support")

@server.tool
def get_ticket(ticket_id: str) -> str:
    """Get a customer support ticket by its ID, for example T-4049."""
    ...

server.run(transport="http", host="127.0.0.1", port=8765)
```

Then we connect to it and combine the tool lists:

```python
async with MCPAdapter("http://127.0.0.1:8765/mcp") as support_adapter:
    support_tools = await support_adapter.list_tools()

support_agent_tools = support_tools + search_only_tools
```

Any MCP client can now use the same server, with no new code:

```bash
claude mcp add --transport http support http://127.0.0.1:8765/mcp
```

### 5. When MCP is overkill

One app needs one small EMI calculator. A plain `@tool` is a few lines. Through MCP, the same function also needs a server file, a process to keep running, a port, a connection and `await`.

The notebook measures both and prints the real numbers. Expect about 1 ms per call for the plain tool and tens of milliseconds for MCP. For one small tool used by one app, that cost buys nothing.

## When should you use MCP?

| Your situation | Use |
|---|---|
| One app, one language, a few small tools | Plain `@tool` |
| Several Python projects share tools | A shared Python package, or MCP |
| Different languages or AI apps need the same tools | **MCP** |
| A vendor already runs a server (like Tavily) | **MCP** |
| One team owns tools that other teams use | **MCP** |

**Simple rule:** start with `@tool`. Move to MCP when a second kind of app needs the same tools.

## Tracing with Rius

`rius.init()` also traces MCP calls, so nothing else is needed on the client. Each call shows up as an `execute_tool <name>` step.

Our support server calls `rius.init()` too. Because of that, its steps appear **inside the agent's trace**, giving you one view across both programs. See the [Rius guide](08-observability-with-rius.md).

## Tips

- **Get a free Tavily key** at [app.tavily.com](https://app.tavily.com) and add it to `.env` as `TAVILY_API_KEY`. The free plan includes 1,000 credits a month with no card.
- **Skip keyless mode for this notebook.** Tavily offers keyless access to search and extract, but it has a low limit, and crawl and map need a key anyway.
- **`langchain.mcp` is in beta**, so its API may change. It needs `langchain[mcp]>=1.4.0`.
- **Use one adapter per server.** A config with several servers also works, but it adds a prefix to tool names and prints extra logs.
- **On Windows, run your server over HTTP in notebooks.** Launching a server as a stdio subprocess inside Jupyter failed in our test with a `fileno` error.
- **Models can call two tools at once.** If one tool needs another tool's result, set `parallel_tool_calls` to `False`, as Part 4 does. Without it, our agent often searched before it had read the ticket.
- **Never share a URL with a key in it.** Send the key in a header, and keep it in `.env`.

## What you should learn

- [ ] Why copied tool code drifts apart
- [ ] What a shared package fixes, and where it stops working
- [ ] What an MCP server and client are
- [ ] How to connect an agent to a server with `MCPAdapter`
- [ ] How to build a small server with `FastMCP`
- [ ] When a plain `@tool` is the better choice

## Official docs

- [MCP in LangChain](https://docs.langchain.com/oss/python/langchain/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [FastMCP](https://gofastmcp.com)
- [Tavily MCP server](https://docs.tavily.com/documentation/mcp)
- [Tracing MCP with Rius](https://docs.glassflow.ai/rius/sdk/integrations/mcp)

## Try it yourself

Add a `close_ticket` tool to `servers/support_server.py`, restart the server, and ask the agent to close a ticket. Notice that the client code doesn't change at all.

**Previous:** [08. Observability with Rius](08-observability-with-rius.md) · **Back to** [docs home](README.md)
