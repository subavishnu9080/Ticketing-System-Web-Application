const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'agent', 'user'),
    defaultValue: 'user'
  }
}, {
  timestamps: true
});

// Map SQL id to _id for frontend compatibility
User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = User;
