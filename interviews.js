const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Interview = require('../models/Interview');
const User = require('../models/User');

// POST /api/interviews
router.post('/', async (req, res) => {
  try {
    // Validate input
    if (!req.body.user || !req.body.jobRole) {
      return res.status(400).json({ 
        error: "Both user and jobRole are required" 
      });
    }

    // Check if user exists and get ObjectId
    let userId = req.body.user;
    
    // If username is provided instead of ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findOne({ 
        $or: [
          { username: userId },
          { email: userId }
        ]
      });
      
      if (!user) {
        return res.status(404).json({ 
          error: "User not found. Please provide a valid user ID, username, or email" 
        });
      }
      userId = user._id;
    }

    // Create interview
    const interview = new Interview({
      user: userId,
      jobRole: req.body.jobRole
    });

    const savedInterview = await interview.save();
    res.status(201).json(savedInterview);

  } catch (err) {
    console.error('Interview creation error:', err);
    res.status(500).json({ 
      error: 'Failed to create interview',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});

// GET /api/interviews
router.get('/', async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate('user', 'username email') // Include user details
      .sort({ createdAt: -1 });
      
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

module.exports = router;