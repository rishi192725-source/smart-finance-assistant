FROM python:3.11-slim

# Install system dependencies (Tesseract)
RUN apt-get update && \
    apt-get install -y tesseract-ocr && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 8000

# Start the ML service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
