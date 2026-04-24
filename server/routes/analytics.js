const express = require('express');
const router = express.Router();
const { Analytics, DigitalTwin, Conversation, Message, KnowledgeBase, Memory, TrainingData, Sentiment } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (req.query.twinId) whereClause.twinId = req.query.twinId;
    if (req.query.metricType) whereClause.metricType = req.query.metricType;
    if (req.query.metricName) whereClause.metricName = req.query.metricName;

    const { count, rows } = await Analytics.findAndCountAll({
      where: whereClause,
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id },
        attributes: ['id', 'name']
      }],
      limit,
      offset,
      order: [['recordedAt', 'DESC']]
    });

    res.json({
      analytics: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    console.error('List analytics error:', err);
    res.status(500).json({ error: 'Failed to list analytics', details: err.message });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const userTwins = await DigitalTwin.findAll({
      where: { userId: req.user.id },
      attributes: ['id', 'name', 'status', 'industry', 'createdAt']
    });

    const twinIds = userTwins.map(t => t.id);

    if (twinIds.length === 0) {
      return res.json({
        totalTwins: 0,
        activeTwins: 0,
        totalConversations: 0,
        totalMessages: 0,
        totalKnowledge: 0,
        totalMemories: 0,
        totalTraining: 0,
        totalSentiments: 0,
        twins: [],
        recentAnalytics: []
      });
    }

    const [totalConversations, totalMessages, totalKnowledge, totalMemories, totalTraining, totalSentiments] = await Promise.all([
      Conversation.count({ where: { twinId: { [Op.in]: twinIds } } }),
      Message.count({
        include: [{
          model: Conversation,
          as: 'conversation',
          where: { twinId: { [Op.in]: twinIds } },
          attributes: []
        }]
      }),
      KnowledgeBase.count({ where: { twinId: { [Op.in]: twinIds } } }),
      Memory.count({ where: { twinId: { [Op.in]: twinIds } } }),
      TrainingData.count({ where: { twinId: { [Op.in]: twinIds } } }),
      Sentiment.count({ where: { twinId: { [Op.in]: twinIds } } })
    ]);

    const recentAnalytics = await Analytics.findAll({
      where: { twinId: { [Op.in]: twinIds } },
      order: [['recordedAt', 'DESC']],
      limit: 20,
      include: [{
        model: DigitalTwin, as: 'twin',
        attributes: ['id', 'name']
      }]
    });

    res.json({
      totalTwins: userTwins.length,
      activeTwins: userTwins.filter(t => t.status === 'active').length,
      totalConversations,
      totalMessages,
      totalKnowledge,
      totalMemories,
      totalTraining,
      totalSentiments,
      twins: userTwins,
      recentAnalytics
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const record = await Analytics.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id },
        attributes: ['id', 'name']
      }]
    });

    if (!record) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }

    res.json({ analytics: record });
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: 'Failed to get analytics', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { twinId, metricName, metricValue, metricType, dimensions, period } = req.body;

    if (!twinId || !metricName || metricValue === undefined || !metricType) {
      return res.status(400).json({ error: 'twinId, metricName, metricValue, and metricType are required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const record = await Analytics.create({
      twinId,
      metricName,
      metricValue,
      metricType,
      dimensions: dimensions || {},
      period: period || 'daily',
      recordedAt: new Date()
    });

    res.status(201).json({ analytics: record });
  } catch (err) {
    console.error('Create analytics error:', err);
    res.status(500).json({ error: 'Failed to create analytics', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const record = await Analytics.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!record) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }

    const { metricName, metricValue, metricType, dimensions, period } = req.body;

    await record.update({
      metricName: metricName !== undefined ? metricName : record.metricName,
      metricValue: metricValue !== undefined ? metricValue : record.metricValue,
      metricType: metricType !== undefined ? metricType : record.metricType,
      dimensions: dimensions !== undefined ? dimensions : record.dimensions,
      period: period !== undefined ? period : record.period
    });

    res.json({ analytics: record });
  } catch (err) {
    console.error('Update analytics error:', err);
    res.status(500).json({ error: 'Failed to update analytics', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const record = await Analytics.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!record) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }

    await record.destroy();
    res.json({ message: 'Analytics record deleted successfully' });
  } catch (err) {
    console.error('Delete analytics error:', err);
    res.status(500).json({ error: 'Failed to delete analytics', details: err.message });
  }
});

module.exports = router;
