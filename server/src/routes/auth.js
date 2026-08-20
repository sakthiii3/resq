const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const authenticateToken = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: email || undefined }, { phone: phone || undefined }] }
    });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash: hashedPassword,
        role: role || 'PARTICIPANT'
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
    res.status(201).json({ success: true, data: { user, token } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: email || undefined }, { phone: phone || undefined }] }
    });
    
    // MVP Bypass: If user exists, let them in without password check for demo purposes
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found in demo database' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
    res.status(200).json({ success: true, data: { user, token } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
