import re
from thefuzz import fuzz

text = "ARBOUNT t1700\nsuaTORAL $1800"
keywords = ['TOTAL', 'GRAND TOTAL', 'AMOUNT DUE', 'BALANCE DUE', 'NET AMOUNT', 'FINAL TOTAL', 'PAYABLE', 'SUBTOTAL', 'AMOUNT', 'BALANCE', 'SUM']

lines = [line.strip() for line in text.split('\n') if line.strip()]
best_match_amounts = []

for line in lines:
    upper_line = line.upper()
    matched_kw = False
    
    words = upper_line.split()
    for kw in keywords:
        for word in words:
            score = fuzz.ratio(kw, word)
            print(f"ratio({kw}, {word}) = {score}")
            if score > 80:
                matched_kw = True
                break
        part_score = fuzz.partial_ratio(kw, upper_line)
        print(f"partial_ratio({kw}, {upper_line}) = {part_score}")
        if part_score > 85:
            matched_kw = True
            
    if matched_kw:
        amounts_in_line = re.findall(r'[\$€₹]?\s*([\d,]+\.\d{1,2})', upper_line)
        if amounts_in_line:
            best_match_amounts.extend([float(m.replace(',', '')) for m in amounts_in_line])
        else:
            clean_line = re.sub(r'[^0-9\s]', ' ', upper_line)
            digits = re.findall(r'\b\d{3,5}\b', clean_line)
            for d in digits:
                val = float(d) / 100.0
                best_match_amounts.append(val)

print(f"Matched amounts: {best_match_amounts}")
if best_match_amounts:
    print(f"Max: {max(best_match_amounts)}")
