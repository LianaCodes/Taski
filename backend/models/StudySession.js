const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  classId: { type: String },
  duration: { type: Number, required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudySession', sessionSchema);
