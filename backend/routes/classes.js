const express = require('express');
const Class = require('../models/Class');

const router = express.Router();

router.post('/add', async (req, res) => {
  try {
    const { userId, name, subject, teacher } = req.body;
    const cls = new Class({ userId, name, subject, teacher });
    await cls.save();
    res.status(201).json(cls);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const classes = await Class.find({ userId: req.params.userId });
    res.json(classes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(cls);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
