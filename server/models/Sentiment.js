const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sentiment = sequelize.define('Sentiment', {
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
  sourceText: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sentiment: {
    type: DataTypes.ENUM('positive', 'negative', 'neutral', 'mixed'),
    allowNull: false
  },
  confidence: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  emotions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  keywords: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  analyzedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'sentiments',
  timestamps: false
});

module.exports = Sentiment;
