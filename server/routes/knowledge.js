const express = require('express');
const router = express.Router();
const { KnowledgeBase, DigitalTwin } = require('../models');
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

    const { count, rows } = await KnowledgeBase.findAndCountAll({
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
      entries: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    console.error('List knowledge error:', err);
    res.status(500).json({ error: 'Failed to list knowledge entries', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const entry = await KnowledgeBase.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id },
        attributes: ['id', 'name']
      }]
    });

    if (!entry) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }

    res.json({ entry });
  } catch (err) {
    console.error('Get knowledge error:', err);
    res.status(500).json({ error: 'Failed to get knowledge entry', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { twinId, title, content, category, source, tags, relevanceScore } = req.body;

    if (!twinId || !title || !content) {
      return res.status(400).json({ error: 'twinId, title, and content are required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const entry = await KnowledgeBase.create({
      twinId,
      title,
      content,
      category: category || 'general',
      source: source || 'manual',
      tags: tags || [],
      relevanceScore: relevanceScore || 0.5
    });

    res.status(201).json({ entry });
  } catch (err) {
    console.error('Create knowledge error:', err);
    res.status(500).json({ error: 'Failed to create knowledge entry', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const entry = await KnowledgeBase.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!entry) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }

    const { title, content, category, source, tags, relevanceScore } = req.body;

    await entry.update({
      title: title !== undefined ? title : entry.title,
      content: content !== undefined ? content : entry.content,
      category: category !== undefined ? category : entry.category,
      source: source !== undefined ? source : entry.source,
      tags: tags !== undefined ? tags : entry.tags,
      relevanceScore: relevanceScore !== undefined ? relevanceScore : entry.relevanceScore
    });

    res.json({ entry });
  } catch (err) {
    console.error('Update knowledge error:', err);
    res.status(500).json({ error: 'Failed to update knowledge entry', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const entry = await KnowledgeBase.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!entry) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }

    await entry.destroy();
    res.json({ message: 'Knowledge entry deleted successfully' });
  } catch (err) {
    console.error('Delete knowledge error:', err);
    res.status(500).json({ error: 'Failed to delete knowledge entry', details: err.message });
  }
});

router.post('/generate', aiRateLimiter, async (req, res) => {
  try {
    const { twinId, topic, context } = req.body;

    if (!twinId || !topic) {
      return res.status(400).json({ error: 'twinId and topic are required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const knowledgeData = await openRouterService.generateKnowledge(
      topic,
      context || `For a ${twin.industry || 'general'} digital twin named ${twin.name}`
    );

    const entry = await KnowledgeBase.create({
      twinId,
      title: knowledgeData.title || topic,
      content: knowledgeData.content,
      category: knowledgeData.category || 'ai-generated',
      source: knowledgeData.source || 'AI Generated',
      tags: knowledgeData.tags || [topic],
      relevanceScore: knowledgeData.relevanceScore || 0.7
    });

    res.status(201).json({ entry, message: 'Knowledge entry generated via AI' });
  } catch (err) {
    console.error('Generate knowledge error:', err);
    res.status(500).json({ error: 'Failed to generate knowledge entry', details: err.message });
  }
});

module.exports = router;
