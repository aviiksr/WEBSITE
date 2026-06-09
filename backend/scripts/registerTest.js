// registerTest.js - script to register a new user via API
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fetch = require('node-fetch');
const baseUrl = `http://localhost:${process.env.PORT || 5000}`;

(async () => {
  try {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User3', email: 'testuser3@example.com', password: 'Pass123!' })
    });
    const data = await res.json();
    console.log('Register response status:', res.status);
    console.log('Response data:', data);
  } catch (err) {
    console.error('Error registering:', err);
  }
})();
