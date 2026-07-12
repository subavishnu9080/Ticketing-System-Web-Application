const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const User = require('./User');

const getDB = () => getFirestore();
const getCommentsCollection = () => getDB().collection('comments');

module.exports = {
  getCollection: getCommentsCollection,

  create: async (data) => {
    const commentData = {
      ...data,
      created_at: new Date().toISOString()
    };
    const docRef = await getCommentsCollection().add(commentData);
    const doc = await docRef.get();
    return { id: doc.id, _id: doc.id, ...doc.data() };
  },

  findAll: async (filters = {}) => {
    let query = getCommentsCollection();

    if (filters.ticketId) {
      query = query.where('ticketId', '==', filters.ticketId);
    }

    const snapshot = await query.get();
    const comments = snapshot.docs.map(doc => ({ id: doc.id, _id: doc.id, ...doc.data() }));

    // Sort by created_at ascending
    comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Populate author
    const populatedComments = [];
    for (const c of comments) {
      let author = null;
      if (c.authorId) {
        author = await User.findById(c.authorId);
        if (author) {
          author = { id: author.id, _id: author.id, username: author.username, role: author.role };
        }
      }
      populatedComments.push({
        ...c,
        author
      });
    }

    return populatedComments;
  },

  destroy: async (filters = {}) => {
    if (filters.ticketId) {
      const snapshot = await getCommentsCollection().where('ticketId', '==', filters.ticketId).get();
      if (snapshot.empty) return;

      const batch = getDB().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
  }
};
