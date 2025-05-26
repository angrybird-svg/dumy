const mongoose = require('mongoose');

const JobRoleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  questions: [String]
});

module.exports = mongoose.model('JobRole', JobRoleSchema);
