const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async chat(messages, options = {}) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Digital Twin Platform'
      },
      body: JSON.stringify({
        model: options.model || this.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1024,
      })
    });
    const data = await response.json();
    return data;
  }

  async chatStream(messages, options = {}) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Digital Twin Platform'
      },
      body: JSON.stringify({
        model: options.model || this.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1024,
        stream: true,
      })
    });
    return response;
  }

  extractContent(response) {
    if (response && response.choices && response.choices.length > 0) {
      return response.choices[0].message.content;
    }
    return null;
  }

  parseJSON(text) {
    if (!text) return null;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        // fall through
      }
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try {
          return JSON.parse(braceMatch[0]);
        } catch (e2) {
          return null;
        }
      }
      return null;
    }
  }

  async generatePersonality(twinName, description, industry) {
    const messages = [
      {
        role: 'system',
        content: `You are an AI personality designer. Generate a detailed personality profile for a digital twin. Return ONLY valid JSON with no additional text. The JSON must have this structure:
{
  "traits": { "openness": 0.0-1.0, "conscientiousness": 0.0-1.0, "extraversion": 0.0-1.0, "agreeableness": 0.0-1.0, "neuroticism": 0.0-1.0 },
  "communicationStyle": "string describing communication style",
  "emotionalProfile": { "primaryEmotion": "string", "emotionalRange": 0.0-1.0, "stability": 0.0-1.0, "expressiveness": 0.0-1.0 },
  "values": ["value1", "value2", "value3", "value4", "value5"],
  "temperament": "string describing temperament type",
  "creativity": 0.0-1.0,
  "analyticalSkill": 0.0-1.0,
  "empathy": 0.0-1.0
}`
      },
      {
        role: 'user',
        content: `Create a personality profile for a digital twin named "${twinName}" in the ${industry || 'general'} industry. Description: ${description || 'A versatile digital assistant'}.`
      }
    ];

    const response = await this.chat(messages, { temperature: 0.8 });
    const content = this.extractContent(response);
    const parsed = this.parseJSON(content);

    if (parsed) {
      return parsed;
    }

    return {
      traits: { openness: 0.7, conscientiousness: 0.8, extraversion: 0.6, agreeableness: 0.7, neuroticism: 0.3 },
      communicationStyle: 'Professional and approachable',
      emotionalProfile: { primaryEmotion: 'calm', emotionalRange: 0.6, stability: 0.8, expressiveness: 0.5 },
      values: ['accuracy', 'helpfulness', 'efficiency', 'clarity', 'empathy'],
      temperament: 'Balanced and adaptable',
      creativity: 0.7,
      analyticalSkill: 0.8,
      empathy: 0.6
    };
  }

  async generateResponse(twin, personality, conversationHistory, userMessage, knowledgeEntries = []) {
    const personalityContext = personality ? `
Your personality traits: ${JSON.stringify(personality.traits || {})}
Communication style: ${personality.communicationStyle || 'Professional'}
Temperament: ${personality.temperament || 'Balanced'}
Values: ${JSON.stringify(personality.values || [])}
Creativity level: ${personality.creativity || 0.5}
Analytical skill: ${personality.analyticalSkill || 0.5}
Empathy level: ${personality.empathy || 0.5}` : '';

    const knowledgeContext = knowledgeEntries.length > 0 ? `

Knowledge Base:
${knowledgeEntries.map(e => `- ${e.title}: ${e.content}`).join('\n')}` : '';

    const systemPrompt = `You are "${twin.name}", a digital twin AI assistant.
Description: ${twin.description || 'A helpful digital twin'}
Industry: ${twin.industry || 'General'}
Purpose: ${twin.purpose || 'To assist and provide expert guidance'}
${personalityContext}${knowledgeContext}

Respond in character, maintaining your personality consistently. Be helpful, accurate, and engaging.
Keep your responses concise but thorough.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const startTime = Date.now();
    const response = await this.chat(messages, {
      temperature: personality ? personality.creativity || 0.7 : 0.7
    });
    const latency = (Date.now() - startTime) / 1000;

    const content = this.extractContent(response);
    const tokens = response.usage ? response.usage.total_tokens : null;

    return {
      content: content || 'I apologize, but I was unable to generate a response. Please try again.',
      tokens,
      latency,
      model: response.model || this.model
    };
  }

  async analyzeSentiment(text) {
    const messages = [
      {
        role: 'system',
        content: `You are a sentiment analysis expert. Analyze the given text and return ONLY valid JSON with no additional text. The JSON must have this structure:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "confidence": 0.0-1.0,
  "emotions": { "joy": 0.0-1.0, "sadness": 0.0-1.0, "anger": 0.0-1.0, "fear": 0.0-1.0, "surprise": 0.0-1.0, "disgust": 0.0-1.0 },
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`
      },
      {
        role: 'user',
        content: `Analyze the sentiment of this text: "${text}"`
      }
    ];

    const response = await this.chat(messages, { temperature: 0.3 });
    const content = this.extractContent(response);
    const parsed = this.parseJSON(content);

    if (parsed) {
      return parsed;
    }

    return {
      sentiment: 'neutral',
      confidence: 0.5,
      emotions: { joy: 0.0, sadness: 0.0, anger: 0.0, fear: 0.0, surprise: 0.0, disgust: 0.0 },
      keywords: []
    };
  }

  async generateBehaviorPattern(twin, interactions) {
    const messages = [
      {
        role: 'system',
        content: `You are a behavioral analysis expert. Analyze the given interactions from a digital twin and identify behavior patterns. Return ONLY valid JSON with no additional text. The JSON must have this structure:
{
  "patternName": "string",
  "description": "string",
  "triggerConditions": { "keywords": ["word1", "word2"], "context": "string", "emotionalState": "string" },
  "responseTemplate": "string template for how the twin responds in this pattern",
  "confidence": 0.0-1.0,
  "category": "string (e.g., greeting, problem-solving, empathy, technical, creative)"
}`
      },
      {
        role: 'user',
        content: `Analyze these interactions for the digital twin "${twin.name}" (${twin.industry || 'general'} industry) and identify a behavior pattern:\n\n${JSON.stringify(interactions)}`
      }
    ];

    const response = await this.chat(messages, { temperature: 0.5 });
    const content = this.extractContent(response);
    const parsed = this.parseJSON(content);

    if (parsed) {
      return parsed;
    }

    return {
      patternName: 'General Response Pattern',
      description: 'A default response behavior pattern',
      triggerConditions: { keywords: [], context: 'general', emotionalState: 'neutral' },
      responseTemplate: 'Acknowledge the user input and provide a helpful response.',
      confidence: 0.5,
      category: 'general'
    };
  }

  async summarizeText(text, options = {}) {
    const style = options.style || 'concise';
    const maxLength = options.maxLength || 200;

    const messages = [
      {
        role: 'system',
        content: `You are a text summarization expert. Summarize the given text in a ${style} manner. The summary should be no longer than ${maxLength} words. Return ONLY valid JSON with no additional text. The JSON must have this structure:
{
  "summary": "the summarized text",
  "keyPoints": ["point1", "point2", "point3"],
  "wordCount": number,
  "compressionRatio": 0.0-1.0
}`
      },
      {
        role: 'user',
        content: `Summarize this text: "${text}"`
      }
    ];

    const response = await this.chat(messages, { temperature: 0.3 });
    const content = this.extractContent(response);
    const parsed = this.parseJSON(content);

    if (parsed) {
      return parsed;
    }

    return {
      summary: text.substring(0, maxLength) + '...',
      keyPoints: [],
      wordCount: text.split(/\s+/).length,
      compressionRatio: 0.5
    };
  }

  async compareTwins(twin1, twin2) {
    const messages = [
      {
        role: 'system',
        content: `You are an AI analysis expert. Compare two digital twins and provide a detailed comparison. Return ONLY valid JSON with no additional text. The JSON must have this structure:
{
  "similarities": ["similarity1", "similarity2", "similarity3"],
  "differences": ["difference1", "difference2", "difference3"],
  "strengths": {
    "twin1": ["strength1", "strength2"],
    "twin2": ["strength1", "strength2"]
  },
  "complementaryAreas": ["area1", "area2"],
  "overallCompatibility": 0.0-1.0,
  "recommendation": "string with recommendation for how these twins could work together"
}`
      },
      {
        role: 'user',
        content: `Compare these two digital twins:

Twin 1: "${twin1.name}"
- Description: ${twin1.description || 'N/A'}
- Industry: ${twin1.industry || 'N/A'}
- Purpose: ${twin1.purpose || 'N/A'}
- Personality: ${twin1.personality || 'N/A'}

Twin 2: "${twin2.name}"
- Description: ${twin2.description || 'N/A'}
- Industry: ${twin2.industry || 'N/A'}
- Purpose: ${twin2.purpose || 'N/A'}
- Personality: ${twin2.personality || 'N/A'}`
      }
    ];

    const response = await this.chat(messages, { temperature: 0.5 });
    const content = this.extractContent(response);
    const parsed = this.parseJSON(content);

    if (parsed) {
      return parsed;
    }

    return {
      similarities: ['Both are AI digital twins'],
      differences: ['Different industries or purposes'],
      strengths: { twin1: ['Specialized focus'], twin2: ['Specialized focus'] },
      complementaryAreas: ['Cross-industry collaboration'],
      overallCompatibility: 0.5,
      recommendation: 'These twins could complement each other in cross-functional scenarios.'
    };
  }

  async generateKnowledge(topic, context) {
    const messages = [
      {
        role: 'system',
        content: `You are a knowledge base curator. Generate a comprehensive knowledge base entry on the given topic. Return ONLY valid JSON with no additional text. The JSON must have this structure:
{
  "title": "string",
  "content": "detailed knowledge content (at least 3 paragraphs)",
  "category": "string",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "source": "AI Generated",
  "relevanceScore": 0.0-1.0
}`
      },
      {
        role: 'user',
        content: `Generate a knowledge base entry about "${topic}". Context: ${context || 'General knowledge for a digital twin platform'}.`
      }
    ];

    const response = await this.chat(messages, { temperature: 0.6, maxTokens: 2048 });
    const content = this.extractContent(response);
    const parsed = this.parseJSON(content);

    if (parsed) {
      return parsed;
    }

    return {
      title: topic,
      content: `Knowledge entry about ${topic}. This entry was auto-generated and should be reviewed for accuracy.`,
      category: 'general',
      tags: [topic.toLowerCase()],
      source: 'AI Generated',
      relevanceScore: 0.5
    };
  }

  async generateTrainingPair(twin, category) {
    const messages = [
      {
        role: 'system',
        content: `You are a training data specialist. Generate a high-quality training input/output pair for a digital twin. Return ONLY valid JSON with no additional text. The JSON must have this structure:
{
  "inputText": "a realistic user query or prompt",
  "expectedOutput": "the ideal response the digital twin should give",
  "category": "string",
  "quality": 0.0-1.0
}`
      },
      {
        role: 'user',
        content: `Generate a training pair for the digital twin "${twin.name}" in the ${twin.industry || 'general'} industry. Category: ${category || 'general'}. The twin's purpose is: ${twin.purpose || 'general assistance'}.`
      }
    ];

    const response = await this.chat(messages, { temperature: 0.7, maxTokens: 2048 });
    const content = this.extractContent(response);
    const parsed = this.parseJSON(content);

    if (parsed) {
      return parsed;
    }

    return {
      inputText: `What can you help me with in ${twin.industry || 'general'}?`,
      expectedOutput: `As ${twin.name}, I can assist you with various aspects of ${twin.industry || 'general'} work.`,
      category: category || 'general',
      quality: 0.5
    };
  }

  async analyzeMemoryImportance(memory, twinContext) {
    const messages = [
      {
        role: 'system',
        content: `You are a cognitive science expert specializing in memory systems. Assess the importance of a given memory for a digital twin. Return ONLY valid JSON with no additional text. The JSON must have this structure:
{
  "importance": 0.0-1.0,
  "reasoning": "string explaining why this importance score was given",
  "associations": ["related concept 1", "related concept 2", "related concept 3"],
  "suggestedDecay": 0.0-1.0,
  "memoryType": "episodic" | "semantic" | "procedural"
}`
      },
      {
        role: 'user',
        content: `Assess the importance of this memory for a digital twin:

Memory content: "${memory.content}"
Memory type: ${memory.memoryType || 'unknown'}
Twin context: ${twinContext || 'General purpose digital twin'}
Current access count: ${memory.accessCount || 0}`
      }
    ];

    const response = await this.chat(messages, { temperature: 0.4 });
    const content = this.extractContent(response);
    const parsed = this.parseJSON(content);

    if (parsed) {
      return parsed;
    }

    return {
      importance: 0.5,
      reasoning: 'Default importance assigned due to analysis limitations.',
      associations: [],
      suggestedDecay: 0.1,
      memoryType: memory.memoryType || 'semantic'
    };
  }
}

module.exports = new OpenRouterService();
