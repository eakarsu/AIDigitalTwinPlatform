const express = require('express');
const router = express.Router();
const { TrainingData, DigitalTwin } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const openRouterService = require('../services/openrouter');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (req.query.twinId) whereClause.twinId = req.query.twinId;
    if (req.query.category) whereClause.category = req.query.category;
    if (req.query.verified !== undefined) whereClause.verified = req.query.verified === 'true';

    const { count, rows } = await TrainingData.findAndCountAll({
      where: whereClause,
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id },
        attributes: ['id', 'name']
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      trainingData: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    console.error('List training data error:', err);
    res.status(500).json({ error: 'Failed to list training data', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await TrainingData.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id },
        attributes: ['id', 'name']
      }]
    });

    if (!data) {
      return res.status(404).json({ error: 'Training data not found' });
    }

    res.json({ trainingData: data });
  } catch (err) {
    console.error('Get training data error:', err);
    res.status(500).json({ error: 'Failed to get training data', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { twinId, inputText, expectedOutput, category, quality, verified } = req.body;

    if (!twinId || !inputText || !expectedOutput) {
      return res.status(400).json({ error: 'twinId, inputText, and expectedOutput are required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const data = await TrainingData.create({
      twinId,
      inputText,
      expectedOutput,
      category: category || 'general',
      quality: quality || 0.5,
      verified: verified || false,
      usageCount: 0
    });

    res.status(201).json({ trainingData: data });
  } catch (err) {
    console.error('Create training data error:', err);
    res.status(500).json({ error: 'Failed to create training data', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = await TrainingData.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!data) {
      return res.status(404).json({ error: 'Training data not found' });
    }

    const { inputText, expectedOutput, category, quality, verified } = req.body;

    await data.update({
      inputText: inputText !== undefined ? inputText : data.inputText,
      expectedOutput: expectedOutput !== undefined ? expectedOutput : data.expectedOutput,
      category: category !== undefined ? category : data.category,
      quality: quality !== undefined ? quality : data.quality,
      verified: verified !== undefined ? verified : data.verified
    });

    res.json({ trainingData: data });
  } catch (err) {
    console.error('Update training data error:', err);
    res.status(500).json({ error: 'Failed to update training data', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const data = await TrainingData.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!data) {
      return res.status(404).json({ error: 'Training data not found' });
    }

    await data.destroy();
    res.json({ message: 'Training data deleted successfully' });
  } catch (err) {
    console.error('Delete training data error:', err);
    res.status(500).json({ error: 'Failed to delete training data', details: err.message });
  }
});

router.post('/generate', aiRateLimiter, async (req, res) => {
  try {
    const { twinId, category } = req.body;

    if (!twinId) {
      return res.status(400).json({ error: 'twinId is required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const pairData = await openRouterService.generateTrainingPair(twin, category);

    const data = await TrainingData.create({
      twinId,
      inputText: pairData.inputText,
      expectedOutput: pairData.expectedOutput,
      category: pairData.category || category || 'ai-generated',
      quality: pairData.quality || 0.7,
      verified: false,
      usageCount: 0
    });

    res.status(201).json({ trainingData: data, message: 'Training pair generated via AI' });
  } catch (err) {
    console.error('Generate training data error:', err);
    res.status(500).json({ error: 'Failed to generate training data', details: err.message });
  }
});

module.exports = router;
