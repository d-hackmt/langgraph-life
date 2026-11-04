"""Tavily tools for the research bot."""
import os
from dotenv import load_dotenv
from langchain.tools import tool
from tavily import TavilyClient

load_dotenv()
tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])


@tool
def search_web(query: str, max_results: int = 3) -> str:
    """Search the web for up-to-date information."""
    response = tavily_client.search(query, max_results=max_results)
    return "\n\n".join(f"{page['title']}\n{page['url']}\n{page['content']}" for page in response["results"])


@tool
def extract_page(url: str) -> str:
    """Read the text of one web page."""
    response = tavily_client.extract(url)
    return response["results"][0]["raw_content"][:2000]


@tool
def crawl_site(url: str, instructions: str) -> str:
    """Crawl a website and return the pages that match the instructions."""
    response = tavily_client.crawl(url, instructions=instructions, limit=3)
    return "\n\n".join(f"{page['url']}\n{page['raw_content'][:500]}" for page in response["results"])


@tool
def map_site(url: str) -> str:
    """List the page URLs of a website."""
    response = tavily_client.map(url, limit=10)
    return "\n".join(response["results"])
