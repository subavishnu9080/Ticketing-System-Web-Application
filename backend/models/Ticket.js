const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'in-progress', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'General'
  }
}, {
  timestamps: true
});

// Setup relationships
Ticket.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
Ticket.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });

// Map SQL id to _id for frontend compatibility
Ticket.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = Ticket;
