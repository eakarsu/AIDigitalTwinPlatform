const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Analytics = sequelize.define('Analytics', {
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
  metricName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  metricValue: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  metricType: {
    type: DataTypes.ENUM('performance', 'usage', 'quality'),
    allowNull: false
  },
  dimensions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  period: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recordedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'analytics',
  timestamps: false
});

module.exports = Analytics;
