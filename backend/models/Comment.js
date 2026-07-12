const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Ticket = require('./Ticket');
const User = require('./User');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Setup relationships
Comment.belongsTo(Ticket, { as: 'ticket', foreignKey: 'ticketId' });
Comment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

// Map SQL id to _id for frontend compatibility
Comment.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = Comment;
