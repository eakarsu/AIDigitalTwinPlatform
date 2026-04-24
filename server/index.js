const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const twinsRoutes = require('./routes/twins');
const personalitiesRoutes = require('./routes/personalities');
const conversationsRoutes = require('./routes/conversations');
const knowledgeRoutes = require('./routes/knowledge');
const behaviorsRoutes = require('./routes/behaviors');
const sentimentsRoutes = require('./routes/sentiments');
const memoriesRoutes = require('./routes/memories');
const trainingRoutes = require('./routes/training');
const analyticsRoutes = require('./routes/analytics');
const comparisonRoutes = require('./routes/comparison');
const summarizerRoutes = require('./routes/summarizer');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT, 10) || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/personalities', personalitiesRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/behaviors', behaviorsRoutes);
app.use('/api/sentiments', sentimentsRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/comparison', comparisonRoutes);
app.use('/api/summarizer', summarizerRoutes);
app.use('/api/settings', settingsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('AI Digital Twin Platform - Backend Server');
      console.log('='.repeat(50));
      console.log(`Server running on: http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${process.env.DB_NAME || 'ai_digital_twin'}`);
      console.log(`AI Model: ${process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5'}`);
      console.log('='.repeat(50));
      console.log('API Routes:');
      console.log(`  POST   /api/auth/login`);
      console.log(`  POST   /api/auth/register`);
      console.log(`  GET    /api/auth/me`);
      console.log(`  CRUD   /api/twins`);
      console.log(`  CRUD   /api/personalities`);
      console.log(`  CRUD   /api/conversations`);
      console.log(`  CRUD   /api/knowledge`);
      console.log(`  CRUD   /api/behaviors`);
      console.log(`  CRUD   /api/sentiments`);
      console.log(`  CRUD   /api/memories`);
      console.log(`  CRUD   /api/training`);
      console.log(`  CRUD   /api/analytics`);
      console.log(`  POST   /api/comparison/compare`);
      console.log(`  POST   /api/summarizer/summarize`);
      console.log(`  GET    /api/settings`);
      console.log(`  GET    /api/health`);
      console.log('='.repeat(50));
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
