const express = require('express');
const router = express.Router();
require('dotenv').config();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const JobRole = require('../models/JobRole');

console.log('📦 jobRoles.js router is loaded and ready ✅');

// Rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many AI requests from this IP, please try again later'
});

// ===================
// 🤖 DEEPSEEK API INTEGRATION
// ===================
const generateWithDeepSeek = async (prompt) => {
  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions', // DeepSeek API endpoint
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 seconds timeout
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);
    throw new Error('Failed to generate with DeepSeek');
  }
};

// ===================
// 🎤 INTERVIEW SIMULATION ENDPOINTS
// ===================

// Start interview session
router.post('/start-interview', [
  body('role').trim().notEmpty().withMessage('Job role is required'),
  body('experienceLevel').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { role, experienceLevel } = req.body;

  try {
    // Generate first question
    const prompt = `Act as an expert interviewer for a ${experienceLevel || 'mid-level'} ${role} position. 
    Generate the first technical interview question that tests core competencies for this role.
    Make it challenging but appropriate for the level.
    Format: "Question: [your question]".`;

    const firstQuestion = await generateWithDeepSeek(prompt);

    // Create interview session (in a real app, you'd save this to DB)
    const session = {
      role,
      experienceLevel,
      questions: [firstQuestion],
      answers: [],
      currentQuestion: 0,
      startedAt: new Date()
    };

    res.json({
      success: true,
      data: {
        sessionId: 'temp-' + Math.random().toString(36).substring(7),
        currentQuestion: firstQuestion,
        feedback: null
      }
    });
  } catch (error) {
    console.error('Interview start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start interview session'
    });
  }
});

// Submit answer and get feedback
router.post('/submit-answer', [
  body('sessionId').trim().notEmpty(),
  body('question').trim().notEmpty(),
  body('answer').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { sessionId, question, answer } = req.body;

  try {
    // Generate feedback using DeepSeek
    const feedbackPrompt = `You're interviewing a candidate for ${req.body.role || 'a technical position'}.
    The question was: "${question}"
    The candidate answered: "${answer}"
    
    Provide detailed feedback on:
    1. Technical accuracy (0-10)
    2. Communication clarity (0-10)
    3. Relevance to question (0-10)
    4. Areas for improvement
    5. Overall assessment
    
    Format as JSON: {
      "technicalScore": number,
      "communicationScore": number,
      "relevanceScore": number,
      "improvements": string[],
      "overallAssessment": string
    }`;

    const feedback = await generateWithDeepSeek(feedbackPrompt);

    // Generate next question
    const nextQuestionPrompt = `Based on this interview answer: "${answer}" 
    for question: "${question}", generate the next appropriate technical question 
    for a ${req.body.role || 'technical'} position. 
    Make it slightly more challenging than the previous one.`;

    const nextQuestion = await generateWithDeepSeek(nextQuestionPrompt);

    res.json({
      success: true,
      data: {
        feedback: JSON.parse(feedback),
        nextQuestion,
        isComplete: false // In real app, set based on question count
      }
    });
  } catch (error) {
    console.error('Answer submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process answer and generate feedback'
    });
  }
});

// ===================
// 🔍 ENHANCED JOB ROLE SEARCH WITH AI SUGGESTIONS
// ===================
router.get('/search', async (req, res) => {
  const { query = '' } = req.query;

  try {
    // 1. First try database search
    const roles = await JobRole.find({
      name: { $regex: query, $options: 'i' }
    }).limit(5);

    if (roles.length > 0) {
      return res.json({
        success: true,
        source: 'database',
        data: roles.map(r => r.name)
      });
    }

    // 2. Fallback to AI suggestions if no DB results
    const prompt = `Suggest 5 most relevant job titles similar to "${query}". 
    Return as a JSON array: ["job1", "job2"]`;

    const suggestions = await generateWithDeepSeek(prompt);
    const aiSuggestions = JSON.parse(suggestions);

    res.json({
      success: true,
      source: 'ai',
      data: aiSuggestions
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ 
      success: false,
      error: "Search failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ===================
// ❓ GET QUESTIONS WITH AI ENHANCEMENT
// ===================
router.get('/questions', async (req, res) => {
  const { role } = req.query;
  
  if (!role) {
    return res.status(400).json({
      success: false,
      error: 'Role name is required'
    });
  }

  try {
    // 1. Try to get from database first
    const dbRole = await JobRole.findOne({ name: role });
    
    if (dbRole?.questions?.length > 0) {
      return res.json({
        success: true,
        source: 'database',
        data: dbRole.questions
      });
    }

    // 2. Generate with AI if no DB results
    const prompt = `Generate 5 realistic technical interview questions for a ${role} position.
    For each question, include what a good answer should cover.
    Format as JSON: [{
      "question": string,
      "evaluationCriteria": string[]
    }]`;

    const questions = await generateWithDeepSeek(prompt);
    const parsedQuestions = JSON.parse(questions);

    // Save to database for future use
    if (dbRole) {
      dbRole.questions = parsedQuestions.map(q => q.question);
      await dbRole.save();
    } else {
      await JobRole.create({
        name: role,
        questions: parsedQuestions.map(q => q.question)
      });
    }

    res.json({
      success: true,
      source: 'ai',
      data: parsedQuestions
    });
  } catch (err) {
    console.error('Questions error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get questions'
    });
  }
});

module.exports = router;