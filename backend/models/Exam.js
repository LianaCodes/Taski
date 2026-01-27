const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  name: { type: String, required: true },
  subject: { type: String, required: true },
  classId: { type: String },
  date: { type: Date, required: true },
  time: { type: String },
  description: { type: String },
  studyTopics: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', examSchema);
