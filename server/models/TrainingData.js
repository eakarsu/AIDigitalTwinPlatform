const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrainingData = sequelize.define('TrainingData', {
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
  inputText: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expectedOutput: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  quality: {
    type: DataTypes.FLOAT,
    defaultValue: 0.5
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'training_data',
  timestamps: true,
  updatedAt: false
});

module.exports = TrainingData;
