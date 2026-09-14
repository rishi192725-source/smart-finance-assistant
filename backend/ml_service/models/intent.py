import re

def parse_intent(query: str) -> dict:
    q = query.lower()
    
    # Very constrained whitelist parsing
    # Intents: total_spending, biggest_expense, category_spending, monthly_savings
    
    if "biggest expense" in q or "largest expense" in q:
        return {"intent": "biggest_expense"}
        
    if "save" in q or "savings" in q:
        return {"intent": "monthly_savings"}
        
    # Match category spending (e.g. "spend on food", "spent on transport")
    category_match = re.search(r'spend on (\w+)|spent on (\w+)', q)
    if category_match:
        cat = category_match.group(1) or category_match.group(2)
        return {"intent": "category_spending", "category": cat.capitalize()}
        
    if "total" in q or "how much did i spend" in q or "spending" in q:
        return {"intent": "total_spending"}
        
    # Unsupported
    return {"intent": "unsupported", "reason": "I don't understand that query yet."}
