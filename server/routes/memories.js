const express = require('express');
const router = express.Router();
const { Memory, DigitalTwin } = require('../models');
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
    if (req.query.memoryType) whereClause.memoryType = req.query.memoryType;

    const { count, rows } = await Memory.findAndCountAll({
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
      memories: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    console.error('List memories error:', err);
    res.status(500).json({ error: 'Failed to list memories', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const memory = await Memory.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id },
        attributes: ['id', 'name']
      }]
    });

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    await memory.update({
      lastAccessed: new Date(),
      accessCount: memory.accessCount + 1
    });

    res.json({ memory });
  } catch (err) {
    console.error('Get memory error:', err);
    res.status(500).json({ error: 'Failed to get memory', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { twinId, memoryType, content, importance, associations } = req.body;

    if (!twinId || !memoryType || !content) {
      return res.status(400).json({ error: 'twinId, memoryType, and content are required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const memory = await Memory.create({
      twinId,
      memoryType,
      content,
      importance: importance || 0.5,
      associations: associations || [],
      lastAccessed: new Date(),
      accessCount: 0,
      decay: 0.0
    });

    res.status(201).json({ memory });
  } catch (err) {
    console.error('Create memory error:', err);
    res.status(500).json({ error: 'Failed to create memory', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const memory = await Memory.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    const { memoryType, content, importance, associations, decay } = req.body;

    await memory.update({
      memoryType: memoryType !== undefined ? memoryType : memory.memoryType,
      content: content !== undefined ? content : memory.content,
      importance: importance !== undefined ? importance : memory.importance,
      associations: associations !== undefined ? associations : memory.associations,
      decay: decay !== undefined ? decay : memory.decay
    });

    res.json({ memory });
  } catch (err) {
    console.error('Update memory error:', err);
    res.status(500).json({ error: 'Failed to update memory', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const memory = await Memory.findByPk(req.params.id, {
      include: [{
        model: DigitalTwin, as: 'twin',
        where: { userId: req.user.id }
      }]
    });

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    await memory.destroy();
    res.json({ message: 'Memory deleted successfully' });
  } catch (err) {
    console.error('Delete memory error:', err);
    res.status(500).json({ error: 'Failed to delete memory', details: err.message });
  }
});

router.post('/assess-importance', async (req, res) => {
  try {
    const { twinId, memoryId, content, memoryType } = req.body;

    if (!twinId) {
      return res.status(400).json({ error: 'twinId is required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    let memoryData;
    if (memoryId) {
      memoryData = await Memory.findByPk(memoryId);
      if (!memoryData) {
        return res.status(404).json({ error: 'Memory not found' });
      }
    } else if (content) {
      memoryData = { content, memoryType: memoryType || 'semantic', accessCount: 0 };
    } else {
      return res.status(400).json({ error: 'Either memoryId or content is required' });
    }

    const twinContext = `${twin.name} - ${twin.industry || 'general'} - ${twin.purpose || 'general assistant'}`;
    const assessment = await openRouterService.analyzeMemoryImportance(memoryData, twinContext);

    if (memoryId && memoryData.update) {
      await memoryData.update({
        importance: assessment.importance,
        associations: assessment.associations || memoryData.associations,
        decay: assessment.suggestedDecay || memoryData.decay
      });
    }

    res.json({ assessment, message: 'Memory importance assessed via AI' });
  } catch (err) {
    console.error('Assess memory importance error:', err);
    res.status(500).json({ error: 'Failed to assess memory importance', details: err.message });
  }
});

module.exports = router;
