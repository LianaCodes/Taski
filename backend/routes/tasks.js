const express = require('express');
const Task = require('../models/Task');

const router = express.Router();

router.post('/add', async (req, res) => {
  try {
    const { userId, name, category, priority, due, classId, description } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    // Check if user exists
    const User = require('../models/User');
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const task = new Task({ userId, name, category, priority, due, classId, description });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.userId.toString() !== userId) return res.status(403).json({ error: 'Unauthorized' });

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// n8n endpoint - tasks due tomorrow

// n8n endpoint - tasks due tomorrow
router.get('/due-tomorrow', async (req, res) => {
	try {
	  const tomorrow = new Date();
	  tomorrow.setDate(tomorrow.getDate() + 1);
  
	  const yyyy = tomorrow.getFullYear();
	  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
	  const dd = String(tomorrow.getDate()).padStart(2, '0');
  
	  const start = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
	  const end = new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`);
  
	  const tasks = await Task.find({
		due: { $gte: start, $lte: end },
		completed: false
	  }).populate('userId', 'email name');
	  res.json(tasks);
	} catch (err) {
	  res.status(500).json({ error: err.message });
	}
  });

  

// 👇 THIS MUST COME AFTER
router.get('/user/:userId', async (req, res) => {
  const tasks = await Task.find({ userId: req.params.userId });
  res.json(tasks);
});

module.exports = router;
