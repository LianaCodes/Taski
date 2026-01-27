const express = require('express');
const Exam = require('../models/Exam');
const User = require('../models/User');
const { requireEmailVerification } = require('./auth');

const router = express.Router();

/**
 * 🧠 Helper: normalize date-only input
 * Prevents day-shifting across timezones
 */
function normalizeDate(dateString) {
  const d = new Date(dateString);
  d.setUTCHours(12, 0, 0, 0); // midday UTC = safe
  return d;
}

/**
 * ➕ Add exam
 */
router.post('/add', requireEmailVerification, async (req, res) => {
  try {
    const { userId, name, subject, date, time, classId, description } = req.body;

    if (!userId || !name || !date) {
      return res.status(400).json({ error: 'userId, name, and date are required' });
    }

    // 🔒 ensure user exists (fixes new-account refusal)
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exam = new Exam({
      userId,
      name,
      subject,
      date: normalizeDate(date),
      time: time || null,
      classId: classId || null,
      description: description || ''
    });

    await exam.save();
    res.status(201).json(exam);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📚 Get exams for user
 */
router.get('/user/:userId', requireEmailVerification, async (req, res) => {
  try {
    const exams = await Exam
      .find({ userId: req.params.userId })
      .sort({ date: 1 });

    res.json(exams);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * 🔔 Exams due in X days (used by n8n)
 */
router.get('/due-in/:days', async (req, res) => {
  try {
    const daysAhead = parseInt(req.params.days, 10);

    if (isNaN(daysAhead)) {
      return res.status(400).json({ error: 'Invalid days parameter' });
    }

    const start = new Date();
    start.setDate(start.getDate() + daysAhead);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const exams = await Exam.find({
      date: { $gte: start, $lte: end }
    }).populate('userId', 'email name settings');

    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
