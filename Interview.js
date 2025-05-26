const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    validate: {
      validator: (value) => mongoose.Types.ObjectId.isValid(value),
      message: 'Invalid user ID format'
    }
  },
  jobRole: {
    type: String,
    required: [true, 'Job role is required'],
    trim: true,
    minlength: [2, 'Job role must be at least 2 characters']
  },
  questions: [{
    questionText: String,
    userAnswer: String,
    feedback: {
      clarity: Number,
      relevance: Number,
      suggestions: [String]
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Interview', interviewSchema);