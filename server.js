// server.js
const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

app.use(express.json());                     // for JSON bodies
app.use(express.urlencoded({ extended: true })); // for form bodies

// Demo credentials
const users = { test: 'test123', demo: 'demo123' };

// Demo user data keyed by phone number (exact match)
const sampleUsers = {
  '+1234567890': {
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    email: 'john.doe@example.com',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipcode: '10001'
    }
  },
  '+1987654321': {
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1987654321',
    email: 'jane.smith@example.com',
    address: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      zipcode: '90001'
    }
  }
};

// In-memory token store: token -> expiryTimestamp
const tokens = new Map();
function generateToken() { return crypto.randomBytes(24).toString('hex'); }
function cleanExpired() {
  const now = Date.now();
  for (const [t, exp] of tokens.entries()) if (exp <= now) tokens.delete(t);
}
setInterval(cleanExpired, 10 * 60 * 1000);

// Root GET — helpful info so visiting the URL doesn't confuse you
app.get('/', (req, res) => {
  res.type('html').send(`
    <h2>Token API</h2>
    <p>POST /login -> returns plain-text token</p>
    <p>POST /userinfo -> requires header: Authorization: Bearer &lt;token&gt; and JSON body { "phone": "+123..." }</p>
  `);
});

// POST /login -> accepts JSON or x-www-form-urlencoded; returns plain-text token
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).send('username and password required');

  if (!users[username] || users[username] !== password) {
    return res.status(401).send('Invalid credentials');
  }

  const token = generateToken();
  tokens.set(token, Date.now() + TOKEN_TTL_MS);
  res.type('text/plain').send(token);
});

// POST /userinfo -> requires Authorization Bearer <token>, phone in JSON body
app.post('/userinfo', (req, res) => {
  const auth = (req.get('authorization') || '');
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  const token = auth.split(' ')[1];
  const expiry = tokens.get(token);
  if (!expiry || expiry < Date.now()) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'phone field required in body' });
  }

  const user = sampleUsers[phone];
  if (!user) {
    return res.status(404).json({ error: 'No user found for that phone' });
  }

  res.json(user);
});

// Start
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
