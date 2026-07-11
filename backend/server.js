require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/db');
const User = require('./models/User');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));

// Simple root healthcheck
app.get('/', (req, res) => {
  res.json({ message: 'Ticketing System API is running...' });
});

// Seed demo users if empty
const seedDemoUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding database with demo users...');
      
      const salt = await bcrypt.genSalt(10);
      
      const adminPassword = await bcrypt.hash('admin123', salt);
      const agentPassword = await bcrypt.hash('agent123', salt);
      const userPassword = await bcrypt.hash('user123', salt);

      await User.create([
        { username: 'admin', password: adminPassword, role: 'admin' },
        { username: 'agent', password: agentPassword, role: 'agent' },
        { username: 'user', password: userPassword, role: 'user' }
      ]);

      console.log('Demo users seeded successfully:');
      console.log(' - Admin: admin / admin123');
      console.log(' - Agent: agent / agent123');
      console.log(' - User:  user  / user123');
    }
  } catch (error) {
    console.error('Error seeding demo users:', error.message);
  }
};

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to DB
  await connectDB();
  
  // Seed database
  await seedDemoUsers();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
