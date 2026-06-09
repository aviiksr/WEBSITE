/* loginTest.js */
const fetch = require('node-fetch'); // fallback if needed, but Node 22 has global fetch
(async () => {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test55@gmail.com', password: 'Password123!' })
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
})();
