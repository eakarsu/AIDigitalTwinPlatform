const express = require('express');
const router = express.Router();
const { DigitalTwin, Personality, Conversation, Message, Memory, TrainingData } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const openRouterService = require('../services/openrouter');

router.use(authMiddleware);

// 503 guard: bail out if OPENROUTER_API_KEY is not configured
function requireOpenRouterKey(req, res, next) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || /your[-_]?openrouter[-_]?api[-_]?key/i.test(key)) {
    return res.status(503).json({ error: 'AI service not configured. OPENROUTER_API_KEY missing.' });
  }
  next();
}

// POST /api/twins/:id/memory-extract
// Fetches last 10 messages from a conversation, extracts key facts, creates Memory entries
router.post('/twins/:id/memory-extract', aiRateLimiter, async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!twin) return res.status(404).json({ error: 'Digital twin not found' });

    const { conversation_id } = req.body;
    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id is required' });
    }

    const conversation = await Conversation.findOne({
      where: { id: conversation_id, twinId: twin.id, userId: req.user.id }
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const messages = await Message.findAll({
      where: { conversationId: conversation.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    if (messages.length === 0) {
      return res.status(400).json({ error: 'No messages found in conversation' });
    }

    const transcript = messages.reverse().map(m => `${m.role}: ${m.content}`).join('\n');

    const aiMessages = [
      {
        role: 'system',
        content: `You are a memory extraction expert. Extract key facts, preferences, and important information from a conversation. Return ONLY valid JSON with this structure:
{
  "memories": [
    { "content": "fact or key information", "memoryType": "episodic|semantic|procedural", "importance": 0.0-1.0 }
  ]
}`
      },
      {
        role: 'user',
        content: `Extract key facts from this conversation with the digital twin "${twin.name}":\n\n${transcript}`
      }
    ];

    const response = await openRouterService.chat(aiMessages, { temperature: 0.3, maxTokens: 2048 });
    const content = openRouterService.extractContent(response);
    const parsed = openRouterService.parseJSON(content);

    if (!parsed || !Array.isArray(parsed.memories)) {
      return res.status(500).json({ error: 'Failed to parse memory extraction result' });
    }

    const createdMemories = [];
    for (const mem of parsed.memories) {
      const memoryRecord = await Memory.create({
        twinId: twin.id,
        memoryType: mem.memoryType || 'semantic',
        content: mem.content,
        importance: mem.importance || 0.5,
        associations: [],
        lastAccessed: new Date(),
        accessCount: 0,
        decay: 0.0
      });

      // Analyze importance with AI
      try {
        const importanceAnalysis = await openRouterService.analyzeMemoryImportance(memoryRecord, `${twin.name} - ${twin.industry || 'general'}`);
        await memoryRecord.update({
          importance: importanceAnalysis.importance || memoryRecord.importance,
          associations: importanceAnalysis.associations || [],
          decay: importanceAnalysis.suggestedDecay || 0.0
        });
      } catch (e) {
        // keep default importance if analysis fails
      }

      createdMemories.push(memoryRecord);
    }

    res.status(201).json({
      message: `Extracted ${createdMemories.length} memories from conversation`,
      memories: createdMemories
    });
  } catch (err) {
    console.error('Memory extract error:', err);
    res.status(500).json({ error: 'Failed to extract memories', details: err.message });
  }
});

// POST /api/twins/:id/training-export
// Fetches all training data pairs for a twin, returns JSONL for fine-tuning
router.post('/twins/:id/training-export', async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!twin) return res.status(404).json({ error: 'Digital twin not found' });

    const trainingData = await TrainingData.findAll({
      where: { twinId: twin.id },
      order: [['createdAt', 'DESC']]
    });

    if (trainingData.length === 0) {
      return res.status(200).json({ message: 'No training data found for this twin', jsonl: '', count: 0 });
    }

    const jsonlLines = trainingData.map(pair =>
      JSON.stringify({ prompt: pair.inputText, completion: pair.expectedOutput })
    );
    const jsonl = jsonlLines.join('\n');

    res.setHeader('Content-Type', 'application/jsonl');
    res.setHeader('Content-Disposition', `attachment; filename="training-${twin.name.replace(/\s+/g, '_')}-${Date.now()}.jsonl"`);
    res.status(200).send(jsonl);
  } catch (err) {
    console.error('Training export error:', err);
    res.status(500).json({ error: 'Failed to export training data', details: err.message });
  }
});

// POST /api/comparison/multi-twin
// Accepts {twin_ids: [id1, id2, id3]}, generates group collaboration analysis
router.post('/comparison/multi-twin', aiRateLimiter, async (req, res) => {
  try {
    const { twin_ids } = req.body;
    if (!Array.isArray(twin_ids) || twin_ids.length < 2) {
      return res.status(400).json({ error: 'twin_ids must be an array with at least 2 IDs' });
    }

    const twins = await DigitalTwin.findAll({
      where: { id: twin_ids, userId: req.user.id },
      include: [{ model: Personality, as: 'personalityProfile' }]
    });

    if (twins.length < 2) {
      return res.status(404).json({ error: 'Could not find enough twins belonging to this user' });
    }

    const twinsContext = twins.map(t => ({
      name: t.name,
      description: t.description,
      industry: t.industry,
      purpose: t.purpose,
      personality: t.personalityProfile ? {
        traits: t.personalityProfile.traits,
        communicationStyle: t.personalityProfile.communicationStyle,
        temperament: t.personalityProfile.temperament,
        values: t.personalityProfile.values
      } : null
    }));

    const aiMessages = [
      {
        role: 'system',
        content: `You are an expert in AI team dynamics and collaboration. Analyze a group of digital twins and generate collaboration recommendations. Return ONLY valid JSON with this structure:
{
  "groupDynamics": "string describing how the group would work together",
  "collaborationRecommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "roleAssignments": [{ "twinName": "name", "suggestedRole": "role", "rationale": "why" }],
  "potentialConflicts": ["conflict1", "conflict2"],
  "synergyScore": 0.0-1.0,
  "bestUseCases": ["use case 1", "use case 2", "use case 3"],
  "communicationStrategy": "string describing optimal communication patterns"
}`
      },
      {
        role: 'user',
        content: `Analyze how these ${twins.length} digital twins would collaborate together:\n\n${JSON.stringify(twinsContext, null, 2)}`
      }
    ];

    const response = await openRouterService.chat(aiMessages, { temperature: 0.6, maxTokens: 2048 });
    const content = openRouterService.extractContent(response);
    const parsed = openRouterService.parseJSON(content);

    res.json({
      twins: twins.map(t => ({ id: t.id, name: t.name })),
      analysis: parsed || { error: 'Could not parse analysis', raw: content }
    });
  } catch (err) {
    console.error('Multi-twin comparison error:', err);
    res.status(500).json({ error: 'Failed to perform multi-twin comparison', details: err.message });
  }
});

// POST /api/twins/:id/predict-sentiment
// Given a hypothetical message, predict the twin's sentiment response.
router.post('/twins/:id/predict-sentiment', requireOpenRouterKey, aiRateLimiter, async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Personality, as: 'personalityProfile' }]
    });
    if (!twin) return res.status(404).json({ error: 'Digital twin not found' });

    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message (string) is required' });
    }

    const personality = twin.personalityProfile ? {
      traits: twin.personalityProfile.traits,
      communicationStyle: twin.personalityProfile.communicationStyle,
      temperament: twin.personalityProfile.temperament,
      values: twin.personalityProfile.values,
      emotionalProfile: twin.personalityProfile.emotionalProfile
    } : null;

    const aiMessages = [
      {
        role: 'system',
        content: `You predict how a digital twin would feel about a hypothetical user message. Return ONLY valid JSON with this structure:
{
  "predictedSentiment": "positive" | "negative" | "neutral" | "mixed",
  "confidence": 0.0-1.0,
  "emotions": { "joy": 0.0-1.0, "sadness": 0.0-1.0, "anger": 0.0-1.0, "fear": 0.0-1.0, "surprise": 0.0-1.0, "disgust": 0.0-1.0 },
  "rationale": "string explaining why the twin would respond this way",
  "expectedToneOfReply": "string (e.g., warm, defensive, excited)"
}`
      },
      {
        role: 'user',
        content: `Twin: ${twin.name} (${twin.industry || 'general'} industry)\nDescription: ${twin.description || 'N/A'}\nPersonality: ${JSON.stringify(personality)}\n\nHypothetical incoming message:\n"${message}"\n\nPredict the twin's sentiment toward this message.`
      }
    ];

    const response = await openRouterService.chat(aiMessages, { temperature: 0.4, maxTokens: 1024 });
    const content = openRouterService.extractContent(response);
    const parsed = openRouterService.parseJSON(content);

    res.json({
      twin: { id: twin.id, name: twin.name },
      message,
      prediction: parsed || { error: 'Could not parse prediction', raw: content }
    });
  } catch (err) {
    console.error('Predict sentiment error:', err);
    res.status(500).json({ error: 'Failed to predict sentiment', details: err.message });
  }
});

// POST /api/twins/:id/counterfactual
// Given a what-if scenario, simulate the twin's response.
router.post('/twins/:id/counterfactual', requireOpenRouterKey, aiRateLimiter, async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Personality, as: 'personalityProfile' }]
    });
    if (!twin) return res.status(404).json({ error: 'Digital twin not found' });

    const { scenario, baselineContext } = req.body;
    if (!scenario || typeof scenario !== 'string') {
      return res.status(400).json({ error: 'scenario (string) is required' });
    }

    const personality = twin.personalityProfile ? {
      traits: twin.personalityProfile.traits,
      communicationStyle: twin.personalityProfile.communicationStyle,
      temperament: twin.personalityProfile.temperament,
      values: twin.personalityProfile.values,
      emotionalProfile: twin.personalityProfile.emotionalProfile
    } : null;

    const aiMessages = [
      {
        role: 'system',
        content: `You simulate how a digital twin would respond to a counterfactual ("what if") scenario. Return ONLY valid JSON with this structure:
{
  "simulatedResponse": "string — the twin's verbatim response",
  "decisionPath": ["step 1", "step 2", "step 3"],
  "alternateOutcomes": [{ "outcome": "string", "likelihood": 0.0-1.0 }],
  "valuesActivated": ["value1", "value2"],
  "confidence": 0.0-1.0,
  "summary": "string"
}`
      },
      {
        role: 'user',
        content: `Twin: ${twin.name} (${twin.industry || 'general'} industry)\nDescription: ${twin.description || 'N/A'}\nPersonality: ${JSON.stringify(personality)}\nBaseline context: ${baselineContext || 'none provided'}\n\nCounterfactual scenario:\n"${scenario}"\n\nSimulate how this twin would respond.`
      }
    ];

    const response = await openRouterService.chat(aiMessages, { temperature: 0.7, maxTokens: 1500 });
    const content = openRouterService.extractContent(response);
    const parsed = openRouterService.parseJSON(content);

    res.json({
      twin: { id: twin.id, name: twin.name },
      scenario,
      simulation: parsed || { error: 'Could not parse simulation', raw: content }
    });
  } catch (err) {
    console.error('Counterfactual error:', err);
    res.status(500).json({ error: 'Failed to simulate counterfactual', details: err.message });
  }
});

// POST /api/twins/:id/personality-snapshot
// Produces an analytical snapshot of the twin's current personality vector.
router.post('/twins/:id/personality-snapshot', requireOpenRouterKey, aiRateLimiter, async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Personality, as: 'personalityProfile' }]
    });
    if (!twin) return res.status(404).json({ error: 'Digital twin not found' });

    if (!twin.personalityProfile) {
      return res.status(400).json({ error: 'Twin has no personality profile yet' });
    }

    const recentMemories = await Memory.findAll({
      where: { twinId: twin.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    }).catch(() => []);

    const personality = {
      traits: twin.personalityProfile.traits,
      communicationStyle: twin.personalityProfile.communicationStyle,
      temperament: twin.personalityProfile.temperament,
      values: twin.personalityProfile.values,
      emotionalProfile: twin.personalityProfile.emotionalProfile,
      creativity: twin.personalityProfile.creativity,
      analyticalSkill: twin.personalityProfile.analyticalSkill,
      empathy: twin.personalityProfile.empathy
    };

    const aiMessages = [
      {
        role: 'system',
        content: `You are an analytical personality coach. Produce an analytical snapshot of a digital twin's current personality vector. Return ONLY valid JSON with this structure:
{
  "headline": "one-sentence summary of who this twin is",
  "dominantTraits": ["trait1", "trait2", "trait3"],
  "strengths": ["strength1", "strength2"],
  "blindSpots": ["blind spot1", "blind spot2"],
  "communicationFingerprint": "string describing how this twin communicates",
  "valueTensions": [{ "tension": "string", "manifestsAs": "string" }],
  "growthAreas": ["area1", "area2"],
  "interactionTips": ["tip1", "tip2", "tip3"],
  "personalityScore": { "coherence": 0.0-1.0, "distinctiveness": 0.0-1.0, "stability": 0.0-1.0 }
}`
      },
      {
        role: 'user',
        content: `Generate a personality snapshot for this twin.\n\nTwin: ${twin.name}\nIndustry: ${twin.industry || 'general'}\nPurpose: ${twin.purpose || 'N/A'}\nDescription: ${twin.description || 'N/A'}\n\nPersonality profile:\n${JSON.stringify(personality, null, 2)}\n\nRecent memories (sample): ${JSON.stringify(recentMemories.slice(0, 5).map(m => ({ type: m.memoryType, content: m.content })))}`
      }
    ];

    const response = await openRouterService.chat(aiMessages, { temperature: 0.5, maxTokens: 1500 });
    const content = openRouterService.extractContent(response);
    const parsed = openRouterService.parseJSON(content);

    res.json({
      twin: { id: twin.id, name: twin.name },
      personalityProfile: personality,
      snapshot: parsed || { error: 'Could not parse snapshot', raw: content }
    });
  } catch (err) {
    console.error('Personality snapshot error:', err);
    res.status(500).json({ error: 'Failed to generate snapshot', details: err.message });
  }
});

// PRODUCT-DECISION: For "real-time interaction interface" we ship a long-poll
// endpoint instead of websockets — additive, no infra change, and no new deps.
// PRODUCT-DECISION: For "multi-twin group-conversation data model" we keep the
// session in-memory (resets on restart) — fine for demo / single-instance dev.
const groupSessions = new Map(); // sessionId -> { twins: [...], turns: [{author, content, ts}], updatedAt }

function newSessionId() {
  return 'gs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

// POST /api/twins/group-session — create a new in-memory group conversation session.
router.post('/twins/group-session', async (req, res) => {
  try {
    const { twin_ids, topic } = req.body || {};
    if (!Array.isArray(twin_ids) || twin_ids.length < 2) {
      return res.status(400).json({ error: 'twin_ids must be an array with at least 2 IDs' });
    }
    const twins = await DigitalTwin.findAll({ where: { id: twin_ids, userId: req.user.id } });
    if (twins.length < 2) {
      return res.status(404).json({ error: 'Could not find enough twins belonging to this user' });
    }
    const sessionId = newSessionId();
    const session = {
      sessionId,
      ownerId: req.user.id,
      twins: twins.map(t => ({ id: t.id, name: t.name, industry: t.industry, description: t.description })),
      topic: topic || null,
      turns: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    groupSessions.set(sessionId, session);
    res.status(201).json(session);
  } catch (err) {
    console.error('group-session create error:', err);
    res.status(500).json({ error: 'Failed to create session', details: err.message });
  }
});

// POST /api/twins/group-session/:sessionId/turn — add a user message and get
// each twin's reply via the LLM. Reuses openRouterService and 503-gates on key.
router.post('/twins/group-session/:sessionId/turn', requireOpenRouterKey, aiRateLimiter, async (req, res) => {
  try {
    const session = groupSessions.get(req.params.sessionId);
    if (!session || session.ownerId !== req.user.id) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message (string) is required' });
    }

    session.turns.push({ author: 'user', content: message, ts: new Date() });

    // Each twin replies in turn, conditioned on the running transcript.
    const replies = [];
    for (const twin of session.twins) {
      const transcript = session.turns.map(t => `${t.author}: ${t.content}`).join('\n');
      const aiMessages = [
        {
          role: 'system',
          content: `You are the digital twin "${twin.name}" (${twin.industry || 'general'} industry). Description: ${twin.description || 'N/A'}. You are participating in a group conversation. Reply ONLY in your own voice as ${twin.name} in 1-3 sentences. Do not narrate other twins' responses.`,
        },
        { role: 'user', content: `Topic: ${session.topic || 'free'}\n\nGroup transcript so far:\n${transcript}\n\nReply now as ${twin.name}.` },
      ];
      try {
        const response = await openRouterService.chat(aiMessages, { temperature: 0.7, maxTokens: 400 });
        const content = openRouterService.extractContent(response);
        const reply = (content || '').trim();
        const turn = { author: twin.name, twinId: twin.id, content: reply, ts: new Date() };
        session.turns.push(turn);
        replies.push(turn);
      } catch (e) {
        replies.push({ author: twin.name, twinId: twin.id, error: e.message });
      }
    }
    session.updatedAt = new Date();
    res.json({ sessionId: session.sessionId, replies, turns: session.turns });
  } catch (err) {
    console.error('group-session turn error:', err);
    res.status(500).json({ error: 'Failed to process turn', details: err.message });
  }
});

// GET /api/twins/group-session/:sessionId — long-poll fetch (since=ISO).
// Returns turns since `since`; clients re-poll for "real-time" updates.
router.get('/twins/group-session/:sessionId', async (req, res) => {
  const session = groupSessions.get(req.params.sessionId);
  if (!session || session.ownerId !== req.user.id) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const sinceParam = req.query.since;
  let turns = session.turns;
  if (sinceParam) {
    const sinceDate = new Date(sinceParam);
    if (!isNaN(sinceDate.getTime())) {
      turns = session.turns.filter(t => t.ts > sinceDate);
    }
  }
  res.json({
    sessionId: session.sessionId,
    twins: session.twins,
    topic: session.topic,
    turns,
    updatedAt: session.updatedAt,
  });
});

module.exports = router;
