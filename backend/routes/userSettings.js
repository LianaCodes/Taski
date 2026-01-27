const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/setup', async (req, res) => {
  try {
    const { userId, userName, userGrade, goal, taskReminders } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const update = {};
    if (userName !== undefined) update.name = userName;
    if (userGrade !== undefined) update.userGrade = userGrade;
    if (goal !== undefined) update.goal = goal;
    if (taskReminders !== undefined) update['settings.taskReminders'] = Boolean(taskReminders);

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });

    res.json({ message: 'Setup completed', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.get('/:userId', async (req, res) => {
	try {
	  const { userId } = req.params;

	  const user = await User.findById(userId).select('email name userGrade goal settings');

	  if (!user) {
		return res.status(404).json({ error: 'User not found' });
	  }

	  res.json({
		userId: user._id,
		email: user.email,
		name: user.name,
		userGrade: user.userGrade,
		goal: user.goal,
		settings: user.settings || {}
	  });
	} catch (err) {
	  res.status(400).json({ error: err.message });
	}
  });
  

  


// Update user timezone
router.post('/update-timezone', async (req, res) => {
  try {
    const { userId, timezone } = req.body;

    if (!userId || !timezone) {
      return res.status(400).json({ error: 'userId and timezone required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { timezone },
      { new: true }
    );

    res.json({ success: true, timezone: user.timezone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
