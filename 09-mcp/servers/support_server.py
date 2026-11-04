"""Our own MCP server: the company's support tools, in one place."""
import csv
import json
from pathlib import Path

import rius
from dotenv import load_dotenv
from fastmcp import FastMCP

load_dotenv()
rius.init(service_name="support-mcp-server")

DATA_FOLDER = Path(__file__).parent.parent / "data"
knowledge_base = json.loads((DATA_FOLDER / "knowledge_base.json").read_text())

with open(DATA_FOLDER / "tickets.csv", newline="") as file:
    tickets = {ticket["ticket_id"]: ticket for ticket in csv.DictReader(file)}

server = FastMCP("support")


@server.tool
def lookup_knowledge_base(query: str) -> str:
    """Search the internal knowledge base. Pass the error code or a keyword, for example '503' or 'webhook'."""
    query = query.lower()
    for article in knowledge_base:
        if any(keyword in query for keyword in article["keywords"]):
            return f"{article['id']} - {article['title']}: {article['solution']}"
    return "No matching article in the knowledge base."


@server.tool
def get_ticket(ticket_id: str) -> str:
    """Get a customer support ticket by its ID, for example T-4049."""
    ticket = tickets.get(ticket_id)
    if ticket is None:
        return f"No ticket found with ID {ticket_id}."
    return f"{ticket['ticket_id']} from {ticket['customer']} ({ticket['tier']} tier): {ticket['message']}"


if __name__ == "__main__":
    server.run(transport="http", host="127.0.0.1", port=8765, show_banner=False, log_level="error")
