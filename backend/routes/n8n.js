const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Exam = require('../models/Exam');

// Simple API key middleware for n8n
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.N8N_API_KEY;

  if (!validKey) {
    console.warn('⚠️ N8N_API_KEY not set in environment');
    return res.status(500).json({ error: 'API key not configured' });
  }

  if (apiKey !== validKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};

// Apply API key check to all n8n routes
router.use(requireApiKey);

// Helper to get date range for a specific day offset
function getDateRange(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return {
    start: new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`),
    end: new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`)
  };
}

// ============================================
// TASKS ENDPOINTS
// ============================================

// Tasks due tomorrow
router.get('/tasks/due-tomorrow', async (req, res) => {
  try {
    const { start, end } = getDateRange(1);

    const tasks = await Task.find({
      due: { $gte: start, $lte: end },
      completed: false
    }).populate('userId', 'email name');

    // Format response for n8n email sending
    const formatted = tasks.map(task => ({
      taskId: task._id,
      taskName: task.name,
      taskDescription: task.description || '',
      taskPriority: task.priority || 'medium',
      taskCategory: task.category || '',
      dueDate: task.due,
      userEmail: task.userId?.email,
      userName: task.userId?.name || 'Student'
    })).filter(t => t.userEmail); // Only include tasks with valid user emails

    res.json({
      count: formatted.length,
      tasks: formatted
    });
  } catch (err) {
    console.error('n8n tasks due-tomorrow error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// EXAMS ENDPOINTS
// ============================================

// Exams tomorrow
router.get('/exams/tomorrow', async (req, res) => {
  try {
    const { start, end } = getDateRange(1);

    const exams = await Exam.find({
      date: { $gte: start, $lte: end }
    }).populate('userId', 'email name');

    const formatted = exams.map(exam => ({
      examId: exam._id,
      examSubject: exam.subject,
      examDescription: exam.description || '',
      examDate: exam.date,
      examTime: exam.time || '',
      daysUntil: 1,
      urgency: 'urgent',
      userEmail: exam.userId?.email,
      userName: exam.userId?.name || 'Student'
    })).filter(e => e.userEmail);

    res.json({
      count: formatted.length,
      exams: formatted
    });
  } catch (err) {
    console.error('n8n exams tomorrow error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Exams in 3 days
router.get('/exams/in-3-days', async (req, res) => {
  try {
    const { start, end } = getDateRange(3);

    const exams = await Exam.find({
      date: { $gte: start, $lte: end }
    }).populate('userId', 'email name');

    const formatted = exams.map(exam => ({
      examId: exam._id,
      examSubject: exam.subject,
      examDescription: exam.description || '',
      examDate: exam.date,
      examTime: exam.time || '',
      daysUntil: 3,
      urgency: 'soon',
      userEmail: exam.userId?.email,
      userName: exam.userId?.name || 'Student'
    })).filter(e => e.userEmail);

    res.json({
      count: formatted.length,
      exams: formatted
    });
  } catch (err) {
    console.error('n8n exams in-3-days error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Exams in 1 week
router.get('/exams/in-1-week', async (req, res) => {
  try {
    const { start, end } = getDateRange(7);

    const exams = await Exam.find({
      date: { $gte: start, $lte: end }
    }).populate('userId', 'email name');

    const formatted = exams.map(exam => ({
      examId: exam._id,
      examSubject: exam.subject,
      examDescription: exam.description || '',
      examDate: exam.date,
      examTime: exam.time || '',
      daysUntil: 7,
      urgency: 'upcoming',
      userEmail: exam.userId?.email,
      userName: exam.userId?.name || 'Student'
    })).filter(e => e.userEmail);

    res.json({
      count: formatted.length,
      exams: formatted
    });
  } catch (err) {
    console.error('n8n exams in-1-week error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Combined: All upcoming exams (tomorrow, 3 days, 1 week)
router.get('/exams/upcoming', async (req, res) => {
  try {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);

    const exams = await Exam.find({
      date: { $gte: now, $lte: oneWeekLater }
    }).populate('userId', 'email name').sort({ date: 1 });

    const formatted = exams.map(exam => {
      const daysUntil = Math.ceil((new Date(exam.date) - now) / (1000 * 60 * 60 * 24));
      let urgency = 'upcoming';
      if (daysUntil <= 1) urgency = 'urgent';
      else if (daysUntil <= 3) urgency = 'soon';

      return {
        examId: exam._id,
        examSubject: exam.subject,
        examDescription: exam.description || '',
        examDate: exam.date,
        examTime: exam.time || '',
        daysUntil,
        urgency,
        userEmail: exam.userId?.email,
        userName: exam.userId?.name || 'Student'
      };
    }).filter(e => e.userEmail);

    res.json({
      count: formatted.length,
      exams: formatted
    });
  } catch (err) {
    console.error('n8n exams upcoming error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
