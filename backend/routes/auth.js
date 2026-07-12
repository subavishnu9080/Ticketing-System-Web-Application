const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const userExists = await User.findOne({ where: { username } });
    if (userExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      password: hashedPassword,
      role: role || 'user'
    });

    res.status(201).json({
      _id: user.id,
      username: user.username,
      role: user.role,
      token: generateToken(user.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & return token
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username } });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        username: user.username,
        role: user.role,
        token: generateToken(user.id)
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET api/auth/users
// @desc    Get all users (for assignment dropdown)
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
