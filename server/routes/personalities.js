const express = require('express');
const router = express.Router();
const { Personality, DigitalTwin } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const openRouterService = require('../services/openrouter');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Personality.findAndCountAll({
      include: [{
        model: DigitalTwin,
        as: 'twin',
        where: { userId: req.user.id },
        attributes: ['id', 'name', 'industry']
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      personalities: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    console.error('List personalities error:', err);
    res.status(500).json({ error: 'Failed to list personalities', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const personality = await Personality.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin,
        as: 'twin',
        where: { userId: req.user.id },
        attributes: ['id', 'name', 'industry']
      }]
    });

    if (!personality) {
      return res.status(404).json({ error: 'Personality not found' });
    }

    res.json({ personality });
  } catch (err) {
    console.error('Get personality error:', err);
    res.status(500).json({ error: 'Failed to get personality', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { twinId, traits, communicationStyle, emotionalProfile, values, temperament, creativity, analyticalSkill, empathy } = req.body;

    if (!twinId) {
      return res.status(400).json({ error: 'twinId is required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const existing = await Personality.findOne({ where: { twinId } });
    if (existing) {
      return res.status(409).json({ error: 'Personality already exists for this twin. Use PUT to update.' });
    }

    const personality = await Personality.create({
      twinId,
      traits: traits || {},
      communicationStyle: communicationStyle || 'Professional',
      emotionalProfile: emotionalProfile || {},
      values: values || [],
      temperament: temperament || 'Balanced',
      creativity: creativity || 0.5,
      analyticalSkill: analyticalSkill || 0.5,
      empathy: empathy || 0.5
    });

    res.status(201).json({ personality });
  } catch (err) {
    console.error('Create personality error:', err);
    res.status(500).json({ error: 'Failed to create personality', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const personality = await Personality.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin,
        as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!personality) {
      return res.status(404).json({ error: 'Personality not found' });
    }

    const { traits, communicationStyle, emotionalProfile, values, temperament, creativity, analyticalSkill, empathy } = req.body;

    await personality.update({
      traits: traits !== undefined ? traits : personality.traits,
      communicationStyle: communicationStyle !== undefined ? communicationStyle : personality.communicationStyle,
      emotionalProfile: emotionalProfile !== undefined ? emotionalProfile : personality.emotionalProfile,
      values: values !== undefined ? values : personality.values,
      temperament: temperament !== undefined ? temperament : personality.temperament,
      creativity: creativity !== undefined ? creativity : personality.creativity,
      analyticalSkill: analyticalSkill !== undefined ? analyticalSkill : personality.analyticalSkill,
      empathy: empathy !== undefined ? empathy : personality.empathy
    });

    res.json({ personality });
  } catch (err) {
    console.error('Update personality error:', err);
    res.status(500).json({ error: 'Failed to update personality', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const personality = await Personality.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin,
        as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!personality) {
      return res.status(404).json({ error: 'Personality not found' });
    }

    await personality.destroy();
    res.json({ message: 'Personality deleted successfully' });
  } catch (err) {
    console.error('Delete personality error:', err);
    res.status(500).json({ error: 'Failed to delete personality', details: err.message });
  }
});

router.post('/generate', aiRateLimiter, async (req, res) => {
  try {
    const { twinId } = req.body;

    if (!twinId) {
      return res.status(400).json({ error: 'twinId is required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const personalityData = await openRouterService.generatePersonality(
      twin.name,
      twin.description,
      twin.industry
    );

    let personality = await Personality.findOne({ where: { twinId } });

    if (personality) {
      await personality.update({
        traits: personalityData.traits,
        communicationStyle: personalityData.communicationStyle,
        emotionalProfile: personalityData.emotionalProfile,
        values: personalityData.values,
        temperament: personalityData.temperament,
        creativity: personalityData.creativity,
        analyticalSkill: personalityData.analyticalSkill,
        empathy: personalityData.empathy
      });
    } else {
      personality = await Personality.create({
        twinId,
        traits: personalityData.traits,
        communicationStyle: personalityData.communicationStyle,
        emotionalProfile: personalityData.emotionalProfile,
        values: personalityData.values,
        temperament: personalityData.temperament,
        creativity: personalityData.creativity,
        analyticalSkill: personalityData.analyticalSkill,
        empathy: personalityData.empathy
      });
    }

    res.json({ personality, message: 'Personality generated via AI' });
  } catch (err) {
    console.error('Generate personality error:', err);
    res.status(500).json({ error: 'Failed to generate personality', details: err.message });
  }
});

module.exports = router;
