const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { User, DigitalTwin, Conversation, Message } = require('../models');
const os = require('os');

router.use(authMiddleware);

const appSettings = {
  appName: 'AI Digital Twin Platform',
  version: '1.0.0',
  defaultModel: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
  maxTokens: 1024,
  defaultTemperature: 0.7,
  maxConversationHistory: 20,
  enableSentimentAnalysis: true,
  enableBehaviorTracking: true,
  enableMemoryDecay: true,
  theme: 'light',
  language: 'en'
};

router.get('/', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      settings: appSettings,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Failed to get settings', details: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const allowedKeys = [
      'defaultModel', 'maxTokens', 'defaultTemperature',
      'maxConversationHistory', 'enableSentimentAnalysis',
      'enableBehaviorTracking', 'enableMemoryDecay', 'theme', 'language'
    ];

    const updates = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    Object.assign(appSettings, updates);

    if (req.body.firstName || req.body.lastName || req.body.avatar) {
      const user = await User.findByPk(req.user.id);
      const userUpdates = {};
      if (req.body.firstName) userUpdates.firstName = req.body.firstName;
      if (req.body.lastName) userUpdates.lastName = req.body.lastName;
      if (req.body.avatar) userUpdates.avatar = req.body.avatar;
      await user.update(userUpdates);
    }

    res.json({ settings: appSettings, message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings', details: err.message });
  }
});

router.get('/system-info', async (req, res) => {
  try {
    const [userCount, twinCount, conversationCount, messageCount] = await Promise.all([
      User.count(),
      DigitalTwin.count(),
      Conversation.count(),
      Message.count()
    ]);

    res.json({
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
        memoryUsage: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        cpuCount: os.cpus().length,
        totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
        freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
        hostname: os.hostname()
      },
      database: {
        totalUsers: userCount,
        totalTwins: twinCount,
        totalConversations: conversationCount,
        totalMessages: messageCount
      },
      ai: {
        provider: 'OpenRouter',
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        apiKeyConfigured: !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your-openrouter-api-key-here')
      }
    });
  } catch (err) {
    console.error('System info error:', err);
    res.status(500).json({ error: 'Failed to get system info', details: err.message });
  }
});

module.exports = router;
