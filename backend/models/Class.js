const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  name: { type: String, required: true },
  subject: { type: String },
  description: { type: String },
  teacher: { type: String },
  googleClassroomId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Class', classSchema);
