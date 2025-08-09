// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Temporary in-memory token
let currentToken = null;

// 1. Login endpoint to get token
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'test' && password === 'test123') {
        currentToken = Math.random().toString(36).substr(2);
        return res.send(currentToken); // Plain text token
    }
    res.status(401).send('Invalid credentials');
});

// 2. Protected endpoint to get user details
app.get('/userdata', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${currentToken}`) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json({
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
        emailAddress: "john.doe@example.com",
        address: {
            streetName: "123 Main St",
            city: "Springfield",
            state: "IL",
            country: "USA",
            zipcode: "62704"
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
