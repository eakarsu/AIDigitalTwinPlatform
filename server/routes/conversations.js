const express = require('express');
const router = express.Router();
const { Conversation, Message, DigitalTwin, Personality, User, KnowledgeBase } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const openRouterService = require('../services/openrouter');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (req.query.twinId) {
      whereClause.twinId = req.query.twinId;
    }
    if (req.query.status) {
      whereClause.status = req.query.status;
    }

    const { count, rows } = await Conversation.findAndCountAll({
      where: whereClause,
      include: [
        { model: DigitalTwin, as: 'twin', attributes: ['id', 'name', 'industry'] },
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      conversations: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'Failed to list conversations', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: DigitalTwin, as: 'twin', attributes: ['id', 'name', 'industry'] },
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ]
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ error: 'Failed to get conversation', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { twinId, title, context } = req.body;

    if (!twinId || !title) {
      return res.status(400).json({ error: 'twinId and title are required' });
    }

    const twin = await DigitalTwin.findOne({ where: { id: twinId, userId: req.user.id } });
    if (!twin) {
      return res.status(404).json({ error: 'Digital twin not found' });
    }

    const conversation = await Conversation.create({
      twinId,
      userId: req.user.id,
      title,
      status: 'active',
      messageCount: 0,
      context: context || {}
    });

    res.status(201).json({ conversation });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Failed to create conversation', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { title, status, context } = req.body;

    await conversation.update({
      title: title !== undefined ? title : conversation.title,
      status: status !== undefined ? status : conversation.status,
      context: context !== undefined ? context : conversation.context
    });

    res.json({ conversation });
  } catch (err) {
    console.error('Update conversation error:', err);
    res.status(500).json({ error: 'Failed to update conversation', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await Message.destroy({ where: { conversationId: conversation.id } });
    await conversation.destroy();
    res.json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({ error: 'Failed to delete conversation', details: err.message });
  }
});

router.get('/:id/messages', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Message.findAndCountAll({
      where: { conversationId: conversation.id },
      limit,
      offset,
      order: [['createdAt', 'ASC']]
    });

    res.json({
      messages: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    console.error('List messages error:', err);
    res.status(500).json({ error: 'Failed to list messages', details: err.message });
  }
});

router.post('/:id/messages', aiRateLimiter, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const twin = await DigitalTwin.findByPk(conversation.twinId);
    const personality = await Personality.findOne({ where: { twinId: twin.id } });

    // Fetch relevant knowledge base entries for context injection
    const { Op } = require('sequelize');
    const knowledgeEntries = await KnowledgeBase.findAll({
      where: { twinId: twin.id, relevanceScore: { [Op.gt]: 0.5 } },
      order: [['relevanceScore', 'DESC']],
      limit: 3,
      attributes: ['title', 'content']
    });

    const userMessage = await Message.create({
      conversationId: conversation.id,
      role: 'user',
      content,
      tokens: null,
      latency: null,
      model: null
    });

    const previousMessages = await Message.findAll({
      where: { conversationId: conversation.id },
      order: [['createdAt', 'ASC']],
      limit: 20
    });

    const conversationHistory = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const aiResponse = await openRouterService.generateResponse(
      twin,
      personality,
      conversationHistory.slice(0, -1),
      content,
      knowledgeEntries
    );

    const assistantMessage = await Message.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: aiResponse.content,
      tokens: aiResponse.tokens,
      latency: aiResponse.latency,
      model: aiResponse.model
    });

    const messageCount = await Message.count({ where: { conversationId: conversation.id } });
    await conversation.update({
      messageCount,
      lastMessageAt: new Date()
    });

    res.status(201).json({
      userMessage,
      assistantMessage,
      conversation: {
        id: conversation.id,
        messageCount
      }
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
});

router.post('/:id/messages/stream', aiRateLimiter, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const twin = await DigitalTwin.findByPk(conversation.twinId);
    const personality = await Personality.findOne({ where: { twinId: twin.id } });

    const { Op } = require('sequelize');
    const knowledgeEntries = await KnowledgeBase.findAll({
      where: { twinId: twin.id, relevanceScore: { [Op.gt]: 0.5 } },
      order: [['relevanceScore', 'DESC']],
      limit: 3,
      attributes: ['title', 'content']
    });

    // Save user message
    await Message.create({
      conversationId: conversation.id,
      role: 'user',
      content,
      tokens: null,
      latency: null,
      model: null
    });

    const previousMessages = await Message.findAll({
      where: { conversationId: conversation.id },
      order: [['createdAt', 'ASC']],
      limit: 20
    });

    const personalityContext = personality ? `
Your personality traits: ${JSON.stringify(personality.traits || {})}
Communication style: ${personality.communicationStyle || 'Professional'}
Temperament: ${personality.temperament || 'Balanced'}
Values: ${JSON.stringify(personality.values || [])}` : '';

    const knowledgeContext = knowledgeEntries.length > 0 ? `\n\nKnowledge Base:\n${knowledgeEntries.map(e => `- ${e.title}: ${e.content}`).join('\n')}` : '';

    const systemPrompt = `You are "${twin.name}", a digital twin AI assistant.
Description: ${twin.description || 'A helpful digital twin'}
Industry: ${twin.industry || 'General'}
Purpose: ${twin.purpose || 'To assist and provide expert guidance'}
${personalityContext}${knowledgeContext}

Respond in character, maintaining your personality consistently.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...previousMessages.slice(0, -1).map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content }
    ];

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const streamResponse = await openRouterService.chatStream(messages, {
      temperature: personality ? personality.creativity || 0.7 : 0.7
    });

    let fullContent = '';
    const startTime = Date.now();

    const decoder = new TextDecoder();
    for await (const chunk of streamResponse.body) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullContent += delta;
              res.write(`data: ${JSON.stringify({ delta })}\n\n`);
            }
          } catch (e) {
            // skip malformed chunks
          }
        }
      }
    }

    // Save assistant message
    const latency = (Date.now() - startTime) / 1000;
    await Message.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: fullContent,
      tokens: null,
      latency,
      model: openRouterService.model
    });

    const messageCount = await Message.count({ where: { conversationId: conversation.id } });
    await conversation.update({ messageCount, lastMessageAt: new Date() });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Stream message error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream message', details: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
