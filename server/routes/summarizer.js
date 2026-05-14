const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const openRouterService = require('../services/openrouter');

router.use(authMiddleware);

router.post('/summarize', aiRateLimiter, async (req, res) => {
  try {
    const { text, style, maxLength } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    if (text.length < 20) {
      return res.status(400).json({ error: 'Text is too short to summarize. Provide at least 20 characters.' });
    }

    const summary = await openRouterService.summarizeText(text, {
      style: style || 'concise',
      maxLength: maxLength || 200
    });

    res.json({ summary });
  } catch (err) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: 'Failed to summarize text', details: err.message });
  }
});

module.exports = router;
