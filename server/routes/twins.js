const express = require('express');
const router = express.Router();
const { DigitalTwin, User, Personality, Conversation, KnowledgeBase, BehaviorPattern, Sentiment, Memory, TrainingData, Analytics } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const openRouterService = require('../services/openrouter');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await DigitalTwin.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        { model: Personality, as: 'personalityProfile' },
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      twins: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('List twins error:', err);
    res.status(500).json({ error: 'Failed to list twins', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: Personality, as: 'personalityProfile' },
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ]
    });

    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    res.json({ twin });
  } catch (err) {
    console.error('Get twin error:', err);
    res.status(500).json({ error: 'Failed to get twin', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, avatar, status, personality, purpose, industry } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const twin = await DigitalTwin.create({
      userId: req.user.id,
      name,
      description,
      avatar,
      status: status || 'active',
      personality,
      purpose,
      industry
    });

    res.status(201).json({ twin });
  } catch (err) {
    console.error('Create twin error:', err);
    res.status(500).json({ error: 'Failed to create twin', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const { name, description, avatar, status, personality, purpose, industry } = req.body;

    await twin.update({
      name: name !== undefined ? name : twin.name,
      description: description !== undefined ? description : twin.description,
      avatar: avatar !== undefined ? avatar : twin.avatar,
      status: status !== undefined ? status : twin.status,
      personality: personality !== undefined ? personality : twin.personality,
      purpose: purpose !== undefined ? purpose : twin.purpose,
      industry: industry !== undefined ? industry : twin.industry
    });

    res.json({ twin });
  } catch (err) {
    console.error('Update twin error:', err);
    res.status(500).json({ error: 'Failed to update twin', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    await twin.destroy();
    res.json({ message: 'Digital twin deleted successfully' });
  } catch (err) {
    console.error('Delete twin error:', err);
    res.status(500).json({ error: 'Failed to delete twin', details: err.message });
  }
});

router.post('/:id/generate-personality', async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const personalityData = await openRouterService.generatePersonality(
      twin.name,
      twin.description,
      twin.industry
    );

    let existingPersonality = await Personality.findOne({ where: { twinId: twin.id } });

    if (existingPersonality) {
      await existingPersonality.update({
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
      existingPersonality = await Personality.create({
        twinId: twin.id,
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

    await twin.update({ status: 'active' });

    res.json({ personality: existingPersonality, message: 'Personality generated successfully' });
  } catch (err) {
    console.error('Generate personality error:', err);
    res.status(500).json({ error: 'Failed to generate personality', details: err.message });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const [conversationCount, knowledgeCount, behaviorCount, sentimentCount, memoryCount, trainingCount, analyticsCount] = await Promise.all([
      Conversation.count({ where: { twinId: twin.id } }),
      KnowledgeBase.count({ where: { twinId: twin.id } }),
      BehaviorPattern.count({ where: { twinId: twin.id } }),
      Sentiment.count({ where: { twinId: twin.id } }),
      Memory.count({ where: { twinId: twin.id } }),
      TrainingData.count({ where: { twinId: twin.id } }),
      Analytics.count({ where: { twinId: twin.id } })
    ]);

    const personality = await Personality.findOne({ where: { twinId: twin.id } });

    res.json({
      twin: {
        id: twin.id,
        name: twin.name,
        status: twin.status
      },
      stats: {
        conversations: conversationCount,
        knowledgeEntries: knowledgeCount,
        behaviorPatterns: behaviorCount,
        sentimentAnalyses: sentimentCount,
        memories: memoryCount,
        trainingPairs: trainingCount,
        analyticsRecords: analyticsCount,
        hasPersonality: !!personality
      }
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Failed to get stats', details: err.message });
  }
});

module.exports = router;
