"""One small tool, wrapped in a whole MCP server. Part 5 shows why this is overkill."""
from fastmcp import FastMCP

server = FastMCP("emi")


@server.tool
def calculate_emi(loan_amount: float, annual_rate_percent: float, months: int) -> float:
    """Calculate the monthly payment (EMI) of a loan."""
    monthly_rate = annual_rate_percent / 12 / 100
    growth = (1 + monthly_rate) ** months
    return round(loan_amount * monthly_rate * growth / (growth - 1), 2)


if __name__ == "__main__":
    server.run(transport="http", host="127.0.0.1", port=8766, show_banner=False, log_level="error")
