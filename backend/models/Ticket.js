const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const User = require('./User');

const getDB = () => getFirestore();
const getTicketsCollection = () => getDB().collection('tickets');

module.exports = {
  getCollection: getTicketsCollection,

  findByPk: async (id) => {
    if (!id) return null;
    const doc = await getTicketsCollection().doc(id).get();
    if (!doc.exists) return null;
    const ticketData = doc.data();

    // Populate assignee & createdBy
    let assignee = null;
    if (ticketData.assigneeId) {
      assignee = await User.findById(ticketData.assigneeId);
      if (assignee) {
        assignee = { id: assignee.id, _id: assignee.id, username: assignee.username, role: assignee.role };
      }
    }
    let createdBy = await User.findById(ticketData.createdById);
    if (createdBy) {
      createdBy = { id: createdBy.id, _id: createdBy.id, username: createdBy.username, role: createdBy.role };
    }

    const ticketInstance = {
      id: doc.id,
      _id: doc.id,
      ...ticketData,
      assignee,
      createdBy,
      save: async function() {
        const { id: _, _id: __, save: ___, assignee: ____, createdBy: _____, ...dataToSave } = this;
        await getTicketsCollection().doc(this.id).update({
          ...dataToSave,
          updatedAt: new Date().toISOString()
        });
      },
      destroy: async function() {
        await getTicketsCollection().doc(this.id).delete();
      }
    };
    return ticketInstance;
  },

  create: async (data) => {
    const ticketData = {
      ...data,
      status: data.status || 'open',
      priority: data.priority || 'medium',
      category: data.category || 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await getTicketsCollection().add(ticketData);
    const doc = await docRef.get();
    return { id: doc.id, _id: doc.id, ...doc.data() };
  },

  findAll: async (filters = {}) => {
    let query = getTicketsCollection();

    // Apply Firestore queries where possible
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.priority) {
      query = query.where('priority', '==', filters.priority);
    }
    if (filters.createdById) {
      query = query.where('createdById', '==', filters.createdById);
    }
    if (filters.assigneeId !== undefined) {
      query = query.where('assigneeId', '==', filters.assigneeId);
    }

    const snapshot = await query.get();
    let tickets = snapshot.docs.map(doc => ({ id: doc.id, _id: doc.id, ...doc.data() }));

    // In-memory sort (avoids composite index requirements in Firestore)
    tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // In-memory search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      tickets = tickets.filter(t => 
        (t.title && t.title.toLowerCase().includes(searchLower)) ||
        (t.description && t.description.toLowerCase().includes(searchLower))
      );
    }

    // Populate associations
    const populatedTickets = [];
    for (const t of tickets) {
      let assignee = null;
      if (t.assigneeId) {
        assignee = await User.findById(t.assigneeId);
        if (assignee) {
          assignee = { id: assignee.id, _id: assignee.id, username: assignee.username, role: assignee.role };
        }
      }
      let createdBy = await User.findById(t.createdById);
      if (createdBy) {
        createdBy = { id: createdBy.id, _id: createdBy.id, username: createdBy.username, role: createdBy.role };
      }
      populatedTickets.push({
        ...t,
        assignee,
        createdBy
      });
    }

    return populatedTickets;
  },

  destroy: async (id) => {
    if (!id) return;
    await getTicketsCollection().doc(id).delete();
  }
};
