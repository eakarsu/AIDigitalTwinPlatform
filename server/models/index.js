const sequelize = require('../config/database');
const User = require('./User');
const DigitalTwin = require('./DigitalTwin');
const Personality = require('./Personality');
const Conversation = require('./Conversation');
const Message = require('./Message');
const KnowledgeBase = require('./KnowledgeBase');
const BehaviorPattern = require('./BehaviorPattern');
const Sentiment = require('./Sentiment');
const Memory = require('./Memory');
const TrainingData = require('./TrainingData');
const Analytics = require('./Analytics');

// User <-> DigitalTwin
User.hasMany(DigitalTwin, { foreignKey: 'userId', as: 'twins' });
DigitalTwin.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// DigitalTwin <-> Personality
DigitalTwin.hasOne(Personality, { foreignKey: 'twinId', as: 'personalityProfile' });
Personality.belongsTo(DigitalTwin, { foreignKey: 'twinId', as: 'twin' });

// DigitalTwin <-> Conversation
DigitalTwin.hasMany(Conversation, { foreignKey: 'twinId', as: 'conversations' });
Conversation.belongsTo(DigitalTwin, { foreignKey: 'twinId', as: 'twin' });

// Conversation <-> User
User.hasMany(Conversation, { foreignKey: 'userId', as: 'conversations' });
Conversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Conversation <-> Message
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// DigitalTwin <-> KnowledgeBase
DigitalTwin.hasMany(KnowledgeBase, { foreignKey: 'twinId', as: 'knowledgeEntries' });
KnowledgeBase.belongsTo(DigitalTwin, { foreignKey: 'twinId', as: 'twin' });

// DigitalTwin <-> BehaviorPattern
DigitalTwin.hasMany(BehaviorPattern, { foreignKey: 'twinId', as: 'behaviorPatterns' });
BehaviorPattern.belongsTo(DigitalTwin, { foreignKey: 'twinId', as: 'twin' });

// DigitalTwin <-> Sentiment
DigitalTwin.hasMany(Sentiment, { foreignKey: 'twinId', as: 'sentiments' });
Sentiment.belongsTo(DigitalTwin, { foreignKey: 'twinId', as: 'twin' });

// DigitalTwin <-> Memory
DigitalTwin.hasMany(Memory, { foreignKey: 'twinId', as: 'memories' });
Memory.belongsTo(DigitalTwin, { foreignKey: 'twinId', as: 'twin' });

// DigitalTwin <-> TrainingData
DigitalTwin.hasMany(TrainingData, { foreignKey: 'twinId', as: 'trainingData' });
TrainingData.belongsTo(DigitalTwin, { foreignKey: 'twinId', as: 'twin' });

// DigitalTwin <-> Analytics
DigitalTwin.hasMany(Analytics, { foreignKey: 'twinId', as: 'analytics' });
Analytics.belongsTo(DigitalTwin, { foreignKey: 'twinId', as: 'twin' });

module.exports = {
  sequelize,
  User,
  DigitalTwin,
  Personality,
  Conversation,
  Message,
  KnowledgeBase,
  BehaviorPattern,
  Sentiment,
  Memory,
  TrainingData,
  Analytics
};
