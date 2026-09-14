import requests

url = 'http://localhost:8000/api/ml/ocr'
file_path = r'C:\Users\NAMAN\.gemini\antigravity-ide\brain\70639ae0-d3e1-4802-ab21-993b4c04db39\.user_uploaded\media_1789376881438.png'

with open(file_path, 'rb') as f:
    files = {'file': f}
    response = requests.post(url, files=files)
    
print(response.json())
