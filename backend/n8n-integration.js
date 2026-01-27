// Simple n8n integration for task and exam reminders

const triggerN8nWebhook = async (eventType, data) => {
  try {
    await fetch('https://your-n8n-instance.com/webhook/taski-reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventType,
        data: data,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.log('n8n webhook failed:', error);
  }
};

// API endpoint for n8n to fetch due tasks
router.get('/due-tomorrow', async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    
    const tasks = await Task.find({
      due: {
        $gte: tomorrow,
        $lte: endOfTomorrow
      },
      completed: false
    }).populate('userId', 'email name');
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for n8n to fetch upcoming exams
router.get('/exams-upcoming/:days', async (req, res) => {
  try {
    const daysAhead = parseInt(req.params.days);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    targetDate.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const exams = await Exam.find({
      date: {
        $gte: targetDate,
        $lte: endOfDay
      }
    }).populate('userId', 'email name');
    
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { triggerN8nWebhook };