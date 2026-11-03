require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const planesRoutes = require('./routes/planes');
const adminRoutes = require('./routes/admin');
const votosRoutes = require('./routes/votos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/votos', votosRoutes);

// Fallback to frontend
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.listen(PORT, () => {
  console.log(`Planazo disponible en http://localhost:${PORT}/login.html`);
});
