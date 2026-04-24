const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Personality = sequelize.define('Personality', {
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
  traits: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  communicationStyle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emotionalProfile: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  values: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  temperament: {
    type: DataTypes.STRING,
    allowNull: true
  },
  creativity: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.5
  },
  analyticalSkill: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.5
  },
  empathy: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.5
  }
}, {
  tableName: 'personalities',
  timestamps: true,
  updatedAt: false
});

module.exports = Personality;
