const fs = require('fs');
const FormData = require('form-data');

async function run() {
  const file = fs.readFileSync('C:\\Users\\NAMAN\\.gemini\\antigravity-ide\\brain\\70639ae0-d3e1-4802-ab21-993b4c04db39\\.user_uploaded\\media_1789376881438.png');
  const form = new FormData();
  form.append('file', file, 'receipt.png');

  try {
    const res = await fetch('http://localhost:8000/api/ml/ocr', {
      method: 'POST',
      headers: form.getHeaders(),
      body: form
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
run();
