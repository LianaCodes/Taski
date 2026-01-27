const express = require('express');
const StudySession = require('../models/StudySession');

const router = express.Router();

router.post('/add', async (req, res) => {
  try {
    const { userId, classId, duration, notes } = req.body;
    const session = new StudySession({ userId, classId, duration, notes });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const sessions = await StudySession.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const session = await StudySession.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await StudySession.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
