const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KnowledgeBase = sequelize.define('KnowledgeBase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  twinId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'digital_twins',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  embedding: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  relevanceScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.0
  }
}, {
  tableName: 'knowledge_base',
  timestamps: true,
  updatedAt: false
});

module.exports = KnowledgeBase;
