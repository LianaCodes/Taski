const express = require('express');
const { oauth2Client, classroom } = require('../config/google');
const Task = require('../models/Task');
const Class = require('../models/Class');
const router = express.Router();

// Google OAuth URL
router.get('/auth-url', (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/classroom.courses.readonly', 
                  'https://www.googleapis.com/auth/classroom.coursework.me'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.json({ url });
});

// Handle OAuth callback
router.post('/callback', async (req, res) => {
  try {
    const { code, userId } = req.body;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Return tokens to frontend
    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync courses
router.post('/sync-courses', async (req, res) => {
  try {
    const { userId, tokens } = req.body;
    oauth2Client.setCredentials(tokens);
    
    const courses = await classroom.courses.list();
    
    for (const course of courses.data.courses || []) {
      await Class.findOneAndUpdate(
        { userId, googleClassroomId: course.id },
        {
          userId,
          name: course.name,
          description: course.description || '',
          googleClassroomId: course.id
        },
        { upsert: true }
      );
    }
    
    res.json({ success: true, count: courses.data.courses?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync assignments
router.post('/sync-assignments', async (req, res) => {
  try {
    const { userId, tokens } = req.body;
    oauth2Client.setCredentials(tokens);
    
    const courses = await classroom.courses.list();
    let taskCount = 0;
    
    for (const course of courses.data.courses || []) {
      const coursework = await classroom.courses.courseWork.list({
        courseId: course.id
      });
      
      for (const work of coursework.data.courseWork || []) {
        await Task.findOneAndUpdate(
          { userId, googleClassroomId: work.id },
          {
            userId,
            title: work.title,
            description: work.description || '',
            category: 'Assignment',
            priority: 'medium',
            dueDate: work.dueDate ? new Date(work.dueDate.year, work.dueDate.month - 1, work.dueDate.day) : null,
            googleClassroomId: work.id,
            courseId: course.id
          },
          { upsert: true }
        );
        taskCount++;
      }
    }
    
    res.json({ success: true, count: taskCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;