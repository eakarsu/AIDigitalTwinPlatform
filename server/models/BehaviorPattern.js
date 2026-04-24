const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BehaviorPattern = sequelize.define('BehaviorPattern', {
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
  patternName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  triggerConditions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  responseTemplate: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  frequency: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  confidence: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'behavior_patterns',
  timestamps: true,
  updatedAt: false
});

module.exports = BehaviorPattern;
