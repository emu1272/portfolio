const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
require('dotenv').config();

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // serves index.html, style.css, script.js, photo.jpg

// ── MongoDB Atlas connection ─────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Running without database - contact form disabled');
  });

// ── Schema & Model ───────────────────────────────────────────
const contactSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, trim: true },
  message:   { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model('Contact', contactSchema);

// ── Routes ───────────────────────────────────────────────────

// POST /api/login — admin login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;

  console.log(`🔐 Login attempt: "${username}"`);

  if (username === adminUser && password === adminPass) {
    console.log('✅ Admin login successful');
    res.json({ success: true, message: 'Login successful.' });
  } else {
    console.log('❌ Login failed — wrong credentials');
    res.status(401).json({ error: 'Invalid username or password.' });
  }
});

// POST /api/contact — called by script.js contact form
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const contact = new Contact({ name, email, message });
    await contact.save();
    console.log(`📩 New message from ${name} (${email})`);
    res.status(201).json({ success: true, message: 'Message saved.' });
  } catch (err) {
    console.error('Save error:', err.message);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

// GET /api/messages — view all saved messages
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// Fallback — serve index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${3000}`);
});
