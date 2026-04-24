const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'conversations',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant', 'system'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tokens: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  latency: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'messages',
  timestamps: true,
  updatedAt: false
});

module.exports = Message;
