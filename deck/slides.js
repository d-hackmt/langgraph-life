// Slide content. Types: title | map | diagram | quiz | demo | summary
const D = (n) => `../diagrams/${n}.png`;

window.SLIDES = [
  { type: "title", section: "Intro", title: "LangGraph", sub: "From your first graph to multimodal RAG, one diagram at a time.",
    chips: ["Graphs", "Tools & agents", "Workflows", "Human in the loop", "RAG", "Multimodal"],
    notes: "Welcome. Everything today is taught from the notebooks in this folder; every slide has the matching diagram and a code tab (press C)." },

  { type: "map", section: "Intro", kicker: "the plan", title: "Your learning path", img: D("00-course-map"),
    notes: "Seven milestones. Each one is a notebook section. We start with the graph primitives and end with multimodal RAG." },

  // ---------------- Graph basics ----------------
  { type: "diagram", section: "Graph basics", kicker: "notebook 01 · simple graph", title: "State, nodes, edges", img: D("01-stategraph"),
    points: ["<b>State</b> is shared memory every node can read.", "<b>Nodes</b> are plain Python functions that return updates.", "<b>Edges</b> decide what runs next; <code>START</code> and <code>END</code> bound the graph."],
    code: `from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    graph_info: str

def start_play(state: State):
    return {"graph_info": state["graph_info"] + " I am planning to play"}

builder = StateGraph(State)
builder.add_node("start_play", start_play)
builder.add_edge(START, "start_play")
builder.add_edge("start_play", END)

graph = builder.compile()
graph.invoke({"graph_info": "Hey"})`,
    notes: "Stress: a node returns only the keys it changes. compile() validates the graph and gives you invoke/stream." },

  { type: "diagram", section: "Graph basics", kicker: "notebook 01 · simple graph", title: "Conditional edges", img: D("02-conditional-edge"),
    points: ["A <b>routing function</b> returns the name of the next node.", "Use it for branching: decisions, retries, loops.", "Annotate the return type with <code>Literal</code> so the graph can be drawn."],
    code: `import random
from typing import Literal

def random_play(state: State) -> Literal["cricket", "badminton"]:
    return "cricket" if random.random() > 0.5 else "badminton"

builder.add_conditional_edges("start_play", random_play)
builder.add_edge("cricket", END)
builder.add_edge("badminton", END)`,
    notes: "The routing function is not a node. It only chooses the next step." },

  { type: "diagram", section: "Graph basics", kicker: "notebook 01 · chatbot", title: "Reducers: append, don't overwrite", img: D("03-chatbot-reducer"),
    points: ["By default a node's return value <b>replaces</b> the state key.", "A <b>reducer</b> says how updates merge.", "<code>add_messages</code> appends, which is what chat history needs."],
    code: `from typing import Annotated
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]   # append, don't overwrite

def superbot(state: State):
    return {"messages": [llm.invoke(state["messages"])]}`,
    notes: "Next slide is a live demo of exactly this. Let students predict the result before you click." },

  { type: "demo", section: "Graph basics", kicker: "try it", title: "Reducer live demo",
    notes: "Run once with 'overwrite', then reset and run with 'append'. The message list only survives with a reducer." },

  // ---------------- Components ----------------
  { type: "diagram", section: "Components", kicker: "notebook 02 · streaming", title: "Streaming and memory", img: D("04-streaming"),
    points: ["<code>values</code>: the full state after each step.", "<code>updates</code>: only what each node changed.", "A <b>checkpointer</b> plus <code>thread_id</code> gives the graph memory across calls."],
    code: `from langgraph.checkpoint.memory import MemorySaver

graph = builder.compile(checkpointer=MemorySaver())
config = {"configurable": {"thread_id": "1"}}

for chunk in graph.stream({"messages": "Hi, I like cricket"},
                          config, stream_mode="updates"):
    print(chunk)`,
    notes: "Same thread_id means same conversation. A new thread_id starts fresh." },

  { type: "diagram", section: "Components", kicker: "notebook 02 · schemas", title: "Three ways to define state", img: D("05-state-schemas"),
    points: ["<b>TypedDict</b>: simple, no runtime checks.", "<b>dataclass</b>: attribute access, e.g. <code>state.name</code>.", "<b>Pydantic</b>: validates input and rejects bad data."],
    code: `class TypedDictState(TypedDict):
    name: str              # {"name": 123} is accepted silently

@dataclass
class DataClassState:
    name: str              # access with state.name

class PydanticState(BaseModel):
    name: str              # {"name": 123} raises ValidationError`,
    notes: "Pick Pydantic when input comes from outside your code." },

  { type: "diagram", section: "Components", kicker: "notebook 02 · chains", title: "An LLM that can call tools", img: D("06-tool-calling"),
    points: ["<code>bind_tools</code> tells the model which tools exist.", "The model answers with a <b>tool call</b>, it does not run it.", "<code>tools_condition</code> routes to <code>ToolNode</code>, which runs it."],
    code: `from langgraph.prebuilt import ToolNode, tools_condition

llm_with_tools = llm.bind_tools([add])

builder.add_node("llm_tool", llm_tool)
builder.add_node("tools", ToolNode([add]))
builder.add_edge(START, "llm_tool")
builder.add_conditional_edges("llm_tool", tools_condition)
builder.add_edge("tools", END)`,
    notes: "Key idea: the LLM only proposes a tool call. Your graph executes it." },

  { type: "diagram", section: "Components", kicker: "notebook 02 · multiple tools", title: "Many tools, one model", img: D("07-multi-tool"),
    points: ["The model <b>chooses</b> which tool fits the question.", "A tool is just a typed function with a docstring.", "Same graph, more tools in the list."],
    code: `from langchain_core.tools import tool

@tool
def wikipedia_search(query: str) -> str:
    """Look up a topic on Wikipedia and return a short summary."""
    ...

tools = [arxiv_search, wikipedia_search, web_search]
llm_with_tools = llm.bind_tools(tools)`,
    notes: "The docstring is the tool description the model reads, so write it carefully." },

  { type: "diagram", section: "Components", kicker: "notebook 02 · ReAct", title: "The ReAct agent loop", img: D("08-react-agent"),
    points: ["<b>Think</b>, <b>act</b>, <b>observe</b>, repeat until done.", "One edge from tools back to the model makes the loop.", "<code>create_agent</code> builds all of this for you."],
    code: `builder.add_edge("tools", "tool_calling_llm")   # the loop

# or the prebuilt shortcut:
from langchain.agents import create_agent

agent = create_agent(model=llm, tools=tools,
                     system_prompt="You are a helpful assistant.",
                     checkpointer=MemorySaver())`,
    notes: "create_agent replaces the older create_react_agent. It returns a compiled LangGraph graph." },

  { type: "quiz", section: "Components", kicker: "quick check", title: "Check",
    q: "Which function decides whether to run the tools or finish?",
    options: ["add_messages", "tools_condition", "compile", "MemorySaver"], answer: 1,
    explain: "tools_condition looks at the last message: tool calls go to the tools node, otherwise the graph ends." },

  // ---------------- Workflows ----------------
  { type: "diagram", section: "Workflows", kicker: "notebook 04 · workflows", title: "Prompt chaining", img: D("10-prompt-chaining"),
    points: ["Break a task into <b>small sequential steps</b>.", "Add a <b>gate</b> to retry before moving on.", "Each step gets a simpler job, so quality rises."],
    code: `builder.add_edge(START, "generate")
builder.add_conditional_edges("generate", check_conflict,
                              {"Pass": "improve", "Fail": "generate"})
builder.add_edge("improve", "polish")
builder.add_edge("polish", END)`,
    notes: "Use when a task decomposes cleanly into fixed steps." },

  { type: "diagram", section: "Workflows", kicker: "notebook 04 · workflows", title: "Parallelization", img: D("11-parallelization"),
    points: ["Independent steps run <b>at the same time</b>.", "Fan out from <code>START</code>, merge in one node.", "Faster than a chain when steps don't depend on each other."],
    code: `builder.add_edge(START, "character")
builder.add_edge(START, "setting")
builder.add_edge(START, "premise")
builder.add_edge("character", "combine")
builder.add_edge("setting", "combine")
builder.add_edge("premise", "combine")`,
    notes: "Three edges out of START is all it takes." },

  { type: "diagram", section: "Workflows", kicker: "notebook 04 · workflows", title: "Routing", img: D("12-routing"),
    points: ["A model <b>classifies</b> the input.", "Structured output gives a clean, typed decision.", "Each route is a specialist node."],
    code: `class Route(BaseModel):
    step: Literal["poem", "story", "joke"]

router = llm.with_structured_output(Route)

def route_decision(state):
    return {"poem": "llm_call_3", "story": "llm_call_1",
            "joke": "llm_call_2"}[state["decision"]]`,
    notes: "with_structured_output is what makes routing reliable." },

  { type: "diagram", section: "Workflows", kicker: "notebook 04 · workflows", title: "Orchestrator and workers", img: D("13-orchestrator-worker"),
    points: ["The orchestrator <b>plans at run time</b>: how many workers is not fixed.", "<code>Send</code> creates one worker per task.", "A shared list with a reducer collects the results."],
    code: `from langgraph.types import Send

def assign_workers(state):
    return [Send("llm_call", {"section": s}) for s in state["sections"]]

class State(TypedDict):
    completed_sections: Annotated[list, operator.add]`,
    notes: "Send is imported from langgraph.types in current versions." },

  { type: "diagram", section: "Workflows", kicker: "notebook 04 · workflows", title: "Evaluator and optimizer", img: D("14-evaluator-optimizer"),
    points: ["One model <b>writes</b>, another <b>judges</b>.", "Feedback loops back until the result is accepted.", "Add a retry cap in real projects."],
    code: `builder.add_conditional_edges(
    "llm_call_evaluator", route_joke,
    {"Accepted": END, "Rejected + Feedback": "llm_call_generator"},
)`,
    notes: "Mention recursion_limit as the safety net against endless loops." },

  { type: "quiz", section: "Workflows", kicker: "quick check", title: "Check",
    q: "Which pattern creates a different number of workers each run?",
    options: ["Prompt chaining", "Parallelization", "Orchestrator and workers", "Routing"], answer: 2,
    explain: "The orchestrator decides the plan at run time and uses Send to spawn one worker per task." },

  // ---------------- Human in the loop ----------------
  { type: "diagram", section: "Human in the loop", kicker: "notebook 05", title: "Static breakpoints", img: D("15-static-breakpoints"),
    points: ["<code>interrupt_before</code> pauses ahead of a node.", "Great for <b>debugging</b> and stepping through a run.", "Needs a checkpointer; resume with <code>stream(None, thread)</code>."],
    code: `graph = builder.compile(
    interrupt_before=["assistant"],
    checkpointer=MemorySaver(),
)
for event in graph.stream(inputs, thread, stream_mode="values"):
    ...
for event in graph.stream(None, thread, stream_mode="values"):   # resume
    ...`,
    notes: "The docs recommend this for debugging, not for production approvals." },

  { type: "diagram", section: "Human in the loop", kicker: "notebook 05", title: "Approve, reject or edit", img: D("16-human-in-the-loop"),
    points: ["<code>interrupt()</code> pauses <b>inside a node</b> and saves state.", "The human's answer comes back via <code>Command(resume=...)</code>.", "Always resume on the <b>same</b> <code>thread_id</code>."],
    code: `from langgraph.types import Command, interrupt

def human_approval(state) -> Command[Literal["tools", "assistant"]]:
    decision = interrupt({"question": "Approve this tool call?"})
    if decision == "approve":
        return Command(goto="tools")
    return Command(goto="assistant",
                   update={"messages": [HumanMessage(decision)]})

graph.invoke(Command(resume="approve"), thread)`,
    notes: "On resume the node restarts from the top, so keep code before interrupt() side-effect free." },

  { type: "quiz", section: "Human in the loop", kicker: "quick check", title: "Check",
    q: "What must stay the same to resume a paused graph?",
    options: ["The graph object name", "The thread_id", "The LLM model", "The node order"], answer: 1,
    explain: "The checkpoint is stored per thread_id, so resuming needs the same one." },

  // ---------------- Debugging ----------------
  { type: "diagram", section: "Debugging", kicker: "folder 03", title: "Debug in LangGraph Studio", img: D("09-debugging-studio"),
    points: ["<code>langgraph.json</code> points at your graph.", "<code>langgraph dev</code> starts a local server.", "Studio shows the graph, state and traces step by step."],
    code: `{
  "dependencies": ["."],
  "graphs": { "openai_agent": "./openai_agent.py:agent" },
  "env": "../.env"
}

$ langgraph dev`,
    notes: "Pair it with LangSmith tracing (LANGSMITH_TRACING=true) for full run traces." },

  // ---------------- RAG ----------------
  { type: "diagram", section: "RAG", kicker: "notebook 06", title: "The RAG pipeline", img: D("17-rag-basics"),
    points: ["<b>Load</b>, <b>split</b>, <b>embed</b>, <b>store</b>.", "At question time: <b>retrieve</b> then <b>generate</b>.", "The model answers from your documents, not just its memory."],
    code: `from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import OpenAIEmbeddings

splits = splitter.split_documents(docs)
store = InMemoryVectorStore.from_documents(splits, OpenAIEmbeddings())
retriever = store.as_retriever()`,
    notes: "We use an in-memory store so there is nothing extra to install." },

  { type: "diagram", section: "RAG", kicker: "notebook 06", title: "Agentic RAG", img: D("18-agentic-rag"),
    points: ["The agent <b>decides</b> whether to retrieve at all.", "Retrieved docs are <b>graded</b> for relevance.", "Irrelevant? <b>Rewrite</b> the question and try again."],
    code: `retriever_tool = create_retriever_tool(retriever, "search_docs",
                                       "Search LangGraph docs")

builder.add_conditional_edges("agent", tools_condition,
                              {"tools": "retrieve", END: END})
builder.add_conditional_edges("retrieve", grade_documents)  # generate | rewrite`,
    notes: "The retriever is exposed to the model as a tool." },

  { type: "diagram", section: "RAG", kicker: "notebook 06", title: "Corrective RAG", img: D("19-corrective-rag"),
    points: ["Grade <b>every</b> retrieved document.", "Any bad one triggers a <b>web search</b> fallback.", "Generate from the corrected set."],
    code: `builder.add_conditional_edges(
    "grade_documents", decide_to_generate,
    {"transform_query": "transform_query", "generate": "generate"},
)
builder.add_edge("transform_query", "web_search_node")
builder.add_edge("web_search_node", "generate")`,
    notes: "The web fallback is what makes it 'corrective'." },

  { type: "diagram", section: "RAG", kicker: "notebook 06", title: "Adaptive RAG", img: D("20-adaptive-rag"),
    points: ["A <b>router</b> picks vector store or web search.", "A <b>hallucination grader</b> checks grounding.", "An <b>answer grader</b> checks it truly answers."],
    code: `builder.add_conditional_edges(START, route_question,
    {"web_search": "web_search", "vectorstore": "retrieve"})
builder.add_conditional_edges("generate",
    grade_generation_v_documents_and_question,
    {"not supported": "generate", "useful": END, "not useful": "transform_query"})`,
    notes: "This combines routing, correction and self-checking." },

  { type: "quiz", section: "RAG", kicker: "quick check", title: "Check",
    q: "Which RAG variant adds a hallucination grader after generation?",
    options: ["Agentic RAG", "Corrective RAG", "Adaptive RAG", "Basic RAG"], answer: 2,
    explain: "Adaptive RAG routes the question, then checks the answer is grounded in the documents and answers the question." },

  // ---------------- Multimodal ----------------
  { type: "diagram", section: "Multimodal", kicker: "notebook 07", title: "Multimodal RAG with Gemini", img: D("21-multimodal-rag"),
    points: ["Keep each PDF page as an <b>image</b>.", "Gemini Embedding puts text and images in <b>one space</b>.", "A vision model reads tables and figures to answer."],
    code: `vec = gemini.models.embed_content(
    model="gemini-embedding-2",
    contents=[types.Part.from_bytes(data=png, mime_type="image/png")],
).embeddings[0].values

content = [{"type": "text", "text": question},
           {"type": "image", "base64": b64, "mime_type": "image/png"}]
llm.invoke([HumanMessage(content=content)])`,
    notes: "Embed one page per call; several images in one call produce one combined vector." },

  { type: "quiz", section: "Multimodal", kicker: "quick check", title: "Check",
    q: "In page-image RAG, what do we embed and store?",
    options: ["Only the extracted text", "Images of each page", "The LLM weights", "Tool call results"], answer: 1,
    explain: "Each page is embedded as an image, so tables and charts stay intact for the vision model." },

  { type: "summary", section: "Recap", kicker: "cheat sheet", title: "What you can now build",
    cards: [
      ["◇", "Graphs", "<code>StateGraph</code>, nodes, edges, reducers"],
      ["⚙", "Agents", "<code>bind_tools</code>, <code>ToolNode</code>, <code>create_agent</code>"],
      ["⇄", "Workflows", "chain, parallel, route, orchestrate, evaluate"],
      ["✋", "Human in the loop", "<code>interrupt()</code>, <code>Command(resume)</code>"],
      ["🔍", "RAG", "agentic, corrective, adaptive"],
      ["🖼", "Multimodal", "page images + Gemini embeddings"],
      ["🧠", "Memory", "checkpointer + <code>thread_id</code>"],
      ["🐞", "Debugging", "<code>langgraph dev</code> + Studio"],
    ],
    notes: "Leave this up during Q&A." },

  { type: "title", section: "End", title: "Thank you", sub: "Questions? Press <b>O</b> to jump back to any slide.", chips: [], end: true,
    notes: "" },
];

// Official documentation links, one list so a moved page is a one-line fix.
const DOC = "https://docs.langchain.com/oss/python/";
window.DOCS = {
  "State, nodes, edges": [["Graph API", "langgraph/graph-api"], ["Use the Graph API", "langgraph/use-graph-api"]],
  "Conditional edges": [["Graph API", "langgraph/graph-api"], ["Use the Graph API", "langgraph/use-graph-api"]],
  "Reducers: append, don't overwrite": [["Graph API", "langgraph/graph-api"]],
  "Reducer live demo": [["Graph API", "langgraph/graph-api"]],
  "Streaming and memory": [["Streaming", "langgraph/streaming"], ["Persistence", "langgraph/persistence"], ["Add memory", "langgraph/add-memory"]],
  "Three ways to define state": [["Graph API", "langgraph/graph-api"]],
  "An LLM that can call tools": [["Tools", "langchain/tools"]],
  "Many tools, one model": [["Tools", "langchain/tools"]],
  "The ReAct agent loop": [["Agents", "langchain/agents"]],
  "Prompt chaining": [["Workflows and agents", "langgraph/workflows-agents"]],
  "Parallelization": [["Workflows and agents", "langgraph/workflows-agents"]],
  "Routing": [["Workflows and agents", "langgraph/workflows-agents"]],
  "Orchestrator and workers": [["Workflows and agents", "langgraph/workflows-agents"]],
  "Evaluator and optimizer": [["Workflows and agents", "langgraph/workflows-agents"]],
  "Static breakpoints": [["Interrupts", "langgraph/interrupts"]],
  "Approve, reject or edit": [["Interrupts", "langgraph/interrupts"]],
  "Debug in LangGraph Studio": [["Studio", "langgraph/studio"], ["Run a local server", "langgraph/local-server"]],
  "The RAG pipeline": [["RAG", "langchain/rag"], ["Retrieval", "langchain/retrieval"]],
  "Agentic RAG": [["Agentic RAG", "langgraph/agentic-rag"]],
  "Corrective RAG": [["Agentic RAG", "langgraph/agentic-rag"], ["RAG", "langchain/rag"]],
  "Adaptive RAG": [["Agentic RAG", "langgraph/agentic-rag"], ["RAG", "langchain/rag"]],
  "Multimodal RAG with Gemini": [["Messages: multimodal", "langchain/messages#multimodal"], ["RAG", "langchain/rag"]],
  "What you can now build": [["LangGraph overview", "langgraph/overview"], ["Graph API", "langgraph/graph-api"], ["Agents", "langchain/agents"],
                              ["Workflows", "langgraph/workflows-agents"], ["Interrupts", "langgraph/interrupts"], ["RAG", "langchain/rag"]],
};
