const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const getDB = () => getFirestore();
const getUsersCollection = () => getDB().collection('users');

module.exports = {
  getCollection: getUsersCollection,

  findOne: async (query) => {
    const key = Object.keys(query)[0];
    const val = query[key];
    const snapshot = await getUsersCollection().where(key, '==', val).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, _id: doc.id, ...doc.data() };
  },

  findById: async (id) => {
    if (!id) return null;
    const doc = await getUsersCollection().doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, _id: doc.id, ...doc.data() };
  },

  create: async (data) => {
    const docRef = await getUsersCollection().add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    const doc = await docRef.get();
    return { id: doc.id, _id: doc.id, ...doc.data() };
  },

  findAll: async () => {
    const snapshot = await getUsersCollection().get();
    return snapshot.docs.map(doc => ({ id: doc.id, _id: doc.id, ...doc.data() }));
  },

  count: async () => {
    const snapshot = await getUsersCollection().get();
    return snapshot.size;
  },

  bulkCreate: async (usersList) => {
    const batch = getDB().batch();
    const createdUsers = [];
    for (const user of usersList) {
      const docRef = getUsersCollection().doc();
      const userData = {
        ...user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      batch.set(docRef, userData);
      createdUsers.push({ id: docRef.id, _id: docRef.id, ...userData });
    }
    await batch.commit();
    return createdUsers;
  }
};
