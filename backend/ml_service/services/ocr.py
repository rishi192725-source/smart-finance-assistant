import pytesseract
from PIL import Image
import cv2
import numpy as np
import io
import re
import logging
from datetime import datetime
from thefuzz import fuzz

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def preprocess_image(image_bytes: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode == 'RGBA':
        background = Image.new('RGBA', image.size, (255, 255, 255))
        image = Image.alpha_composite(background, image)
        
    return image.convert('L')

def extract_receipt_data(image_bytes: bytes) -> dict:
    image = preprocess_image(image_bytes)
    text = pytesseract.image_to_string(image, config='--psm 6')
    logger.info(f"--- RAW OCR TEXT START ---\n{text}\n--- RAW OCR TEXT END ---")
    
    amount = extract_amount(text)
    merchant = extract_merchant(text)
    date = extract_date(text)
    
    return {
        "text": text,
        "amount": amount,
        "merchant": merchant,
        "date": date
    }

def extract_amount(text: str):
    keywords = ['TOTAL', 'GRAND TOTAL', 'AMOUNT DUE', 'BALANCE DUE', 'NET AMOUNT', 'FINAL TOTAL', 'PAYABLE', 'SUBTOTAL', 'AMOUNT', 'BALANCE', 'SUM']
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    best_match_amounts = []
    
    for line in lines:
        upper_line = line.upper()
        matched_kw = False
        
        words = upper_line.split()
        for kw in keywords:
            for word in words:
                if fuzz.ratio(kw, word) >= 70:
                    matched_kw = True
                    break
            if fuzz.partial_ratio(kw, upper_line) >= 75:
                matched_kw = True
                
        if matched_kw:
            amounts_in_line = re.findall(r'[\$€₹]?\s*([\d,]+\.\d{1,2})', upper_line)
            if amounts_in_line:
                best_match_amounts.extend([float(m.replace(',', '')) for m in amounts_in_line])
            else:
                # Extreme fallback for bad OCR: if it dropped the decimal point (e.g. t1700 -> 17.00)
                clean_line = re.sub(r'[^0-9\s]', ' ', upper_line)
                digits = re.findall(r'\b\d{3,5}\b', clean_line)
                for d in digits:
                    val = float(d) / 100.0
                    best_match_amounts.append(val)
                    
    if best_match_amounts:
        return max(best_match_amounts)
        
    matches = re.findall(r'[\$€₹]?\s*([\d,]+\.\d{1,2})', text)
    if matches:
        amounts = [float(m.replace(',', '')) for m in matches]
        return max(amounts)
        
    # Final global fallback: if absolutely NO decimals were found, find any large digit block and divide by 100
    clean_text = re.sub(r'[^0-9\s]', ' ', text)
    all_digits = re.findall(r'\b\d{3,5}\b', clean_text)
    if all_digits:
        return max([float(d) / 100.0 for d in all_digits])
        
    return None

def extract_merchant(text: str):
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    for line in lines:
        # Ignore dates, times, purely numeric, or tax ID looking lines
        if re.search(r'\d{2}[/-]\d{2}[/-]\d{2,4}', line):
            continue
        if re.search(r'\d{2}:\d{2}', line):
            continue
        if re.match(r'^[\d\W]+$', line):
            continue
        if 'tax' in line.lower() or 'gst' in line.lower() or 'vat' in line.lower():
            continue
            
        # If it has some alphabet characters and isn't a known generic word
        if re.search(r'[a-zA-Z]{3,}', line):
            if line.lower() not in ['receipt', 'invoice', 'bill', 'cash', 'card', 'copy']:
                return line
                
    return None

def extract_date(text: str):
    # 1. Standard MM/DD/YYYY or DD-MM-YYYY (with 2 or 4 digit year)
    match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
    if match:
        return match.group(1).replace('/', '-')
        
    # 2. YYYY/MM/DD
    match = re.search(r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})', text)
    if match:
        return match.group(1).replace('/', '-')
        
    # 3. Alphabetic Months (e.g. Jan 15, 2023 or 15-Jan-2023)
    match = re.search(r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-zA-Z]*[\s-]+\d{1,2}(?:st|nd|rd|th)?[\s,]+-?\d{2,4})', text, re.IGNORECASE)
    if match:
        return match.group(1)
        
    # 4. DD Month YYYY (e.g. 15 Jan 2023)
    match = re.search(r'(\d{1,2}(?:st|nd|rd|th)?[\s-]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-zA-Z]*[\s,-]+\d{2,4})', text, re.IGNORECASE)
    if match:
        return match.group(1)
        
    return None
