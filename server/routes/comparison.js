const express = require('express');
const router = express.Router();
const { DigitalTwin, Personality } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const openRouterService = require('../services/openrouter');

router.use(authMiddleware);

router.post('/compare', aiRateLimiter, async (req, res) => {
  try {
    const { twin1Id, twin2Id } = req.body;

    if (!twin1Id || !twin2Id) {
      return res.status(400).json({ error: 'twin1Id and twin2Id are required' });
    }

    const twin1 = await DigitalTwin.findOne({
      where: { id: twin1Id, userId: req.user.id },
      include: [{ model: Personality, as: 'personalityProfile' }]
    });

    const twin2 = await DigitalTwin.findOne({
      where: { id: twin2Id, userId: req.user.id },
      include: [{ model: Personality, as: 'personalityProfile' }]
    });

    if (!twin1) {
      return res.status(404).json({ error: 'First digital twin not found' });
    }

    if (!twin2) {
      return res.status(404).json({ error: 'Second digital twin not found' });
    }

    const comparison = await openRouterService.compareTwins(twin1, twin2);

    res.json({
      twin1: { id: twin1.id, name: twin1.name, industry: twin1.industry },
      twin2: { id: twin2.id, name: twin2.name, industry: twin2.industry },
      comparison
    });
  } catch (err) {
    console.error('Compare twins error:', err);
    res.status(500).json({ error: 'Failed to compare twins', details: err.message });
  }
});

module.exports = router;
