const express = require('express');
const router = express.Router();
const { Sentiment, DigitalTwin } = require('../models');
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
    if (req.query.sentiment) whereClause.sentiment = req.query.sentiment;

    const { count, rows } = await Sentiment.findAndCountAll({
      where: whereClause,
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id },
        attributes: ['id', 'name']
      }],
      limit,
      offset,
      order: [['analyzedAt', 'DESC']]
    });

    res.json({
      sentiments: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    console.error('List sentiments error:', err);
    res.status(500).json({ error: 'Failed to list sentiments', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sentiment = await Sentiment.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id },
        attributes: ['id', 'name']
      }]
    });

    if (!sentiment) {
      return res.status(404).json({ error: 'Sentiment record not found' });
    }

    res.json({ sentiment });
  } catch (err) {
    console.error('Get sentiment error:', err);
    res.status(500).json({ error: 'Failed to get sentiment', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { twinId, sourceText, sentiment, confidence, emotions, keywords } = req.body;

    if (!twinId || !sourceText || !sentiment) {
      return res.status(400).json({ error: 'twinId, sourceText, and sentiment are required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const record = await Sentiment.create({
      twinId,
      sourceText,
      sentiment,
      confidence: confidence || 0.5,
      emotions: emotions || {},
      keywords: keywords || [],
      analyzedAt: new Date()
    });

    res.status(201).json({ sentiment: record });
  } catch (err) {
    console.error('Create sentiment error:', err);
    res.status(500).json({ error: 'Failed to create sentiment', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const record = await Sentiment.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!record) {
      return res.status(404).json({ error: 'Sentiment record not found' });
    }

    const { sourceText, sentiment, confidence, emotions, keywords } = req.body;

    await record.update({
      sourceText: sourceText !== undefined ? sourceText : record.sourceText,
      sentiment: sentiment !== undefined ? sentiment : record.sentiment,
      confidence: confidence !== undefined ? confidence : record.confidence,
      emotions: emotions !== undefined ? emotions : record.emotions,
      keywords: keywords !== undefined ? keywords : record.keywords
    });

    res.json({ sentiment: record });
  } catch (err) {
    console.error('Update sentiment error:', err);
    res.status(500).json({ error: 'Failed to update sentiment', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const record = await Sentiment.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!record) {
      return res.status(404).json({ error: 'Sentiment record not found' });
    }

    await record.destroy();
    res.json({ message: 'Sentiment record deleted successfully' });
  } catch (err) {
    console.error('Delete sentiment error:', err);
    res.status(500).json({ error: 'Failed to delete sentiment', details: err.message });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const { twinId, text } = req.body;

    if (!twinId || !text) {
      return res.status(400).json({ error: 'twinId and text are required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const analysis = await openRouterService.analyzeSentiment(text);

    const record = await Sentiment.create({
      twinId,
      sourceText: text,
      sentiment: analysis.sentiment || 'neutral',
      confidence: analysis.confidence || 0.5,
      emotions: analysis.emotions || {},
      keywords: analysis.keywords || [],
      analyzedAt: new Date()
    });

    res.status(201).json({ sentiment: record, analysis, message: 'Sentiment analyzed via AI' });
  } catch (err) {
    console.error('Analyze sentiment error:', err);
    res.status(500).json({ error: 'Failed to analyze sentiment', details: err.message });
  }
});

module.exports = router;
