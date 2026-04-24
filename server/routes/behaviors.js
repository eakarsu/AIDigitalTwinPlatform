const express = require('express');
const router = express.Router();
const { BehaviorPattern, DigitalTwin } = require('../models');
const { authMiddleware } = require('../middleware/auth');
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

    const { count, rows } = await BehaviorPattern.findAndCountAll({
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
      patterns: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    console.error('List behaviors error:', err);
    res.status(500).json({ error: 'Failed to list behavior patterns', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pattern = await BehaviorPattern.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id },
        attributes: ['id', 'name']
      }]
    });

    if (!pattern) {
      return res.status(404).json({ error: 'Behavior pattern not found' });
    }

    res.json({ pattern });
  } catch (err) {
    console.error('Get behavior error:', err);
    res.status(500).json({ error: 'Failed to get behavior pattern', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { twinId, patternName, description, triggerConditions, responseTemplate, frequency, confidence, category } = req.body;

    if (!twinId || !patternName) {
      return res.status(400).json({ error: 'twinId and patternName are required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const pattern = await BehaviorPattern.create({
      twinId,
      patternName,
      description,
      triggerConditions: triggerConditions || {},
      responseTemplate,
      frequency: frequency || 0,
      confidence: confidence || 0.5,
      category: category || 'general'
    });

    res.status(201).json({ pattern });
  } catch (err) {
    console.error('Create behavior error:', err);
    res.status(500).json({ error: 'Failed to create behavior pattern', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pattern = await BehaviorPattern.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!pattern) {
      return res.status(404).json({ error: 'Behavior pattern not found' });
    }

    const { patternName, description, triggerConditions, responseTemplate, frequency, confidence, category } = req.body;

    await pattern.update({
      patternName: patternName !== undefined ? patternName : pattern.patternName,
      description: description !== undefined ? description : pattern.description,
      triggerConditions: triggerConditions !== undefined ? triggerConditions : pattern.triggerConditions,
      responseTemplate: responseTemplate !== undefined ? responseTemplate : pattern.responseTemplate,
      frequency: frequency !== undefined ? frequency : pattern.frequency,
      confidence: confidence !== undefined ? confidence : pattern.confidence,
      category: category !== undefined ? category : pattern.category
    });

    res.json({ pattern });
  } catch (err) {
    console.error('Update behavior error:', err);
    res.status(500).json({ error: 'Failed to update behavior pattern', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pattern = await BehaviorPattern.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!pattern) {
      return res.status(404).json({ error: 'Behavior pattern not found' });
    }

    await pattern.destroy();
    res.json({ message: 'Behavior pattern deleted successfully' });
  } catch (err) {
    console.error('Delete behavior error:', err);
    res.status(500).json({ error: 'Failed to delete behavior pattern', details: err.message });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const { twinId, interactions } = req.body;

    if (!twinId || !interactions) {
      return res.status(400).json({ error: 'twinId and interactions are required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const patternData = await openRouterService.generateBehaviorPattern(twin, interactions);

    const pattern = await BehaviorPattern.create({
      twinId,
      patternName: patternData.patternName,
      description: patternData.description,
      triggerConditions: patternData.triggerConditions,
      responseTemplate: patternData.responseTemplate,
      frequency: 1,
      confidence: patternData.confidence || 0.5,
      category: patternData.category || 'ai-analyzed'
    });

    res.status(201).json({ pattern, message: 'Behavior pattern analyzed via AI' });
  } catch (err) {
    console.error('Analyze behavior error:', err);
    res.status(500).json({ error: 'Failed to analyze behavior pattern', details: err.message });
  }
});

module.exports = router;
