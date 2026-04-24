const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Memory = sequelize.define('Memory', {
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
  memoryType: {
    type: DataTypes.ENUM('episodic', 'semantic', 'procedural'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  importance: {
    type: DataTypes.FLOAT,
    defaultValue: 0.5
  },
  associations: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  lastAccessed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  accessCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  decay: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  }
}, {
  tableName: 'memories',
  timestamps: true,
  updatedAt: false
});

module.exports = Memory;
