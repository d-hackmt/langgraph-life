# 07. Multimodal RAG

![Multimodal RAG](../diagrams/21-multimodal-rag.png)

## What is inside

| Notebook | What it shows |
|---|---|
| [1-MultimodalRAG](../07-multimodal/1-MultimodalRAG.ipynb) | Ask questions about a PDF by searching its **page images** |

## The big idea, in simple words

Normal RAG turns a PDF into plain text. But tables, charts and figures **lose their shape** when turned into text.

**Multimodal** means more than one kind of data, here **text and images**. So we keep each PDF page **as a picture**:

1. Turn every page into an image.
2. Turn each image into numbers (an *embedding*) with **Gemini Embedding 2**. It puts text and images in the **same space**, so a text question can find a matching picture.
3. When you ask a question, find the closest pages.
4. Show those page images to a **vision model**, which reads the tables and figures and answers.

Think of asking a librarian a question: they pull out the right **page**, and you read the table on it, instead of someone retyping it badly.

## Example from the notebook

The data is a real public paper, *Attention Is All You Need*.

| Question | What happens |
|---|---|
| "What BLEU score did the big Transformer get on English-to-German?" | Finds the results table page, answers **28.4** |
| "Describe the Transformer architecture figure" | Finds the page with the figure, describes the encoder and decoder stacks |

## The code, simplified

```python
# 1. embed a page image (one page per call)
vec = gemini.models.embed_content(
    model="gemini-embedding-2",
    contents=[types.Part.from_bytes(data=page_png, mime_type="image/png")],
).embeddings[0].values

# 2. send text + images to a vision model
content = [{"type": "text", "text": question},
           {"type": "image", "base64": b64, "mime_type": "image/png"}]
llm.invoke([HumanMessage(content=content)])
```

The graph is tiny: `retrieve` then `answer`.

## Good to know

- Embed **one page per call**. Several images in one call give you a single combined result.
- A free Gemini key has a small daily limit for text generation, so the notebook answers with OpenAI. An optional last cell shows the same thing with Gemini.
- Want more data? Public benchmarks such as ViDoRe and MMDocIR are made for this kind of search.

## What you should learn

- [ ] Why page images keep tables and charts intact
- [ ] How text and images can live in one embedding space
- [ ] How to send images to a model in a message
- [ ] How the same `retrieve` then `answer` graph pattern works for images

## Official docs

- [Messages: multimodal input](https://docs.langchain.com/oss/python/langchain/messages#multimodal)
- [RAG](https://docs.langchain.com/oss/python/langchain/rag)

## Try it yourself

Replace the paper with another public PDF (a report with charts works well) and ask a question whose answer is only in a chart.

**Previous:** [06](06-rag.md) · **Back to** [docs home](README.md)
