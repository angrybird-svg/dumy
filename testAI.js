const express = require('express');
const router = express.Router();
const { analyzeResponse } = require('../services/aiService');

// Request Logger Middleware
router.use((req, res, next) => {
  console.log('📨 AI Test Request:', {
    method: req.method,
    body: req.body
  });
  next();
});

// POST /api/test-ai
router.post('/', async (req, res) => {
  try {
    const { question, answer } = req.body;
    
    // Input Validation
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid question field (expected non-empty string)' 
      });
    }

    if (!answer || typeof answer !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid answer field (expected non-empty string)' 
      });
    }

    // AI Analysis
    const analysis = await analyzeResponse(question, answer);
    
    console.log('✅ AI Analysis Completed:', analysis);
    res.json(analysis);

  } catch (err) {
    console.error(' AI Test Error:', err);
    res.status(500).json({ 
      error: 'AI analysis failed',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});

module.exports = router;