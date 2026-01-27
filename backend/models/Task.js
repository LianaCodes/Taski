const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, default: 'personal' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  due: { type: Date },
  completed: { type: Boolean, default: false },
  classId: { type: String },
  googleClassroomId: { type: String },
  courseId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
