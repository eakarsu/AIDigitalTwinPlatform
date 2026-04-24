const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DigitalTwin = sequelize.define('DigitalTwin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'training'),
    defaultValue: 'active'
  },
  personality: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  purpose: {
    type: DataTypes.STRING,
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'digital_twins',
  timestamps: true
});

module.exports = DigitalTwin;
