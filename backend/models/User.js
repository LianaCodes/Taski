const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firebaseUid: { type: String, required: false }, // Optional for backend auth

  password: { type: String }, // optional for Firebase
  name: { type: String, default: 'User' },
  profilePicture: { type: String }, // base64 image data

  userGrade: { type: String },
  goal: { type: String },

  settings: {
    theme: {
      type: String,
      enum: ['beige', 'pink', 'babyblue'],
      default: 'beige'
    },
    taskReminders: { type: Boolean, default: true },
    examAlerts: { type: Boolean, default: true }
  },

  timezone: {
    type: String,
    default: 'America/New_York'
  },

  googleTokens: { type: Object },

  verified: {
    type: Boolean,
    default: false
  },
  verifyToken: String,
  resetToken: String,
  resetTokenExpiry: Date,

  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.password) return next();
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
