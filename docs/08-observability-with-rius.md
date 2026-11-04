# 08. Observability with Rius

## What is inside

| File | What it is |
|---|---|
| [everything_with_rius.ipynb](../08-end%20to%20end/everything_with_rius.ipynb) | Eight real-world examples (LCEL, agents, tools, memory, summarization, multi-agent, subgraphs, evaluation), all traced with Rius |
| [everything_langchain_langgraph.ipynb](../08-end%20to%20end/everything_langchain_langgraph.ipynb) | The same examples traced with LangSmith, to compare |
| [data/](../08-end%20to%20end/data) | Made-up sample data for every example |

## The big idea, in simple words

An agent is a black box: a question goes in, an answer comes out. When the answer is wrong, slow or expensive, you need to **see inside**: which model was called, which tool ran, how many tokens it used, what it cost.

That is **observability**. [Rius](https://docs.glassflow.ai/rius) records every step of every run and shows it in a web console.

Think of it as the **flight recorder** for your agent: it writes everything down, so after a problem you can replay exactly what happened.

## Four words to know

| Word | Means | Example from the notebook |
|---|---|---|
| **Trace** | one complete run | "Support conversation" |
| **Span** | one step inside a run | one LLM call, one `search_web` tool call |
| **Session** | one conversation, across many runs | `session-101` |
| **User** | the person the run served | `priya@alice-corp.example` |

## How it works

**1. Install and add your key.** Put `RIUS_API_KEY=ri_...` in the `.env` file. Never write the key in code.

```bash
uv pip install "glassflow-rius[langchain]"
```

**2. Turn it on once.** This one call hooks into LangChain and LangGraph, so every model, tool and agent call is recorded from now on.

```python
import rius
from rius import SpanKind

rius_client = rius.init(service_name="langgraph-life-end-to-end")
```

**3. One flow = one trace.** Calling an agent three times makes three separate traces. Wrap the flow in a function with `@rius.observe` and everything inside becomes **one** trace:

```python
@rius.observe(name="Expense compliance checks", kind=SpanKind.AGENT)
def check_expenses(questions):
    answers = []
    for question in questions:
        result = compliance_agent.invoke({"messages": [{"role": "user", "content": question}]})
        answers.append(result["messages"][-1].content)
    return answers
```

**4. Tag conversations and customers.** Every span inside the `with` block gets the session and user, so you can filter by them later:

```python
with rius.session("session-101"), rius.user("priya@alice-corp.example"):
    run_support_conversation(support_turns, thread_id="session-101")
```

**5. Send everything before you stop.** Spans are sent in the background in small batches. In a short script, flush before exiting:

```python
rius_client.flush()   # True means Rius accepted everything
```

## The span kinds

`kind=` tells Rius what a step is, so the console can badge and group it.

| Kind | Use for |
|---|---|
| `SpanKind.AGENT` | a whole agent run or a multi-agent flow |
| `SpanKind.CHAIN` | a pipeline or a plain function (the default) |
| `SpanKind.LLM` | a model call (Rius adds these for you) |
| `SpanKind.TOOL` | a tool call (Rius adds these for you) |
| `SpanKind.RETRIEVER` | a search over your documents |

## What to look at in the console

| View | What it shows |
|---|---|
| **Traces** | Every run, with tokens, cost and latency |
| **Waterfall** | Every step of one run on a timeline |
| **Map** | The same run as a graph; switch the lens to cost or latency to find the expensive step |
| **Session link** | All the steps from one conversation |
| **Users** | Everything done for one customer |
| **Agents** | Which agent processes are alive right now (heartbeat) |

Rius works out **cost** and **tokens** for you from the model name and usage. You never send them yourself.

## Rius or LangSmith?

Both record traces of LangChain and LangGraph apps. The notebook folder has one version for each, so you can compare.

| | LangSmith | Rius |
|---|---|---|
| Turn on | `LANGSMITH_TRACING=true` | `rius.init()` |
| Group a flow | `@traceable` | `@rius.observe` |
| Conversations | metadata `thread_id` | `rius.session(...)` |
| Built on | LangSmith's own format | OpenTelemetry (an open standard) |
| Evaluation | datasets and experiments built in | run your checks in code; each run is a trace |

## Tips

- **Ingest-only keys.** A key from Settings → API keys can send traces but not read them. To query traces from code or an AI client (the Rius MCP server), create a key with the `read` scope via **Connect an agent**.
- **Free trial.** New organizations get 30 days or 500,000 spans, whichever comes first, with no card. One full run of the notebook is a few hundred spans. After the trial, new spans are refused with HTTP 402 until you pick a plan. See **Settings → Plan & usage**.
- **Private data.** Set `capture_content=False` in `rius.init()` to send timings and token counts without prompts and answers.
- The variable must be named exactly `RIUS_API_KEY`.

## What you should learn

- [ ] What a trace, span, session and user are
- [ ] How `rius.init()` traces LangChain and LangGraph automatically
- [ ] How `@rius.observe` turns a whole flow into one trace
- [ ] How to tag runs with `rius.session` and `rius.user`
- [ ] How to find the slowest or most expensive step with the Map view

## Official docs

- [Rius overview](https://docs.glassflow.ai/rius)
- [Quickstart](https://docs.glassflow.ai/rius/quickstart)
- [Tracing your code: `observe`, sessions, users](https://docs.glassflow.ai/rius/sdk/tracing)
- [LangChain integration](https://docs.glassflow.ai/rius/sdk/integrations/langchain)
- [Exploring traces](https://docs.glassflow.ai/rius/platform/exploring-traces)
- [Billing and trial](https://docs.glassflow.ai/rius/platform/billing)

## Try it yourself

Run the notebook, open the **Support conversation** trace, and switch to the Map view with the latency lens. Which step took the longest: the model, the knowledge base, or the Exa web search?

**Previous:** [07. Multimodal](07-multimodal.md) · **Next:** [09. MCP](09-mcp.md) · **Back to** [docs home](README.md)
