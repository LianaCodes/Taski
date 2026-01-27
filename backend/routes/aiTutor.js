const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Chat = require('../models/Chat');
const Task = require('../models/Task');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Note = require('../models/Note');
const StudySession = require('../models/StudySession');

// Middleware to verify user
const requireAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'] || req.body.userId;
  if (!userId) {
    return res.status(401).json({ error: 'User authentication required' });
  }
  req.userId = userId;
  next();
};

// AI Tutor Chat Endpoint
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user's context data
    const [user, tasks, classes, exams, notes, sessions] = await Promise.all([
      User.findById(userId),
      Task.find({ userId }).sort({ createdAt: -1 }).limit(10),
      Class.find({ userId }),
      Exam.find({ userId }).sort({ date: 1 }).limit(5),
      Note.find({ userId }).sort({ createdAt: -1 }).limit(5),
      StudySession.find({ userId }).sort({ createdAt: -1 }).limit(10)
    ]);

    // Build context for AI
    const context = {
      user: {
        name: user?.name || 'Student',
        email: user?.email
      },
      currentStats: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        totalClasses: classes.length,
        upcomingExams: exams.filter(e => new Date(e.date) > new Date()).length,
        totalStudyTime: sessions.reduce((sum, s) => sum + (s.duration / 60), 0) // in hours
      },
      recentTasks: tasks.slice(0, 5).map(t => ({
        name: t.name,
        completed: t.completed,
        due: t.due,
        priority: t.priority,
        category: t.category
      })),
      upcomingExams: exams.filter(e => new Date(e.date) > new Date()).map(e => ({
        name: e.name,
        date: e.date,
        subject: e.subject
      })),
      classes: classes.map(c => ({
        name: c.name,
        subject: c.subject,
        teacher: c.teacher
      }))
    };

    // Create system prompt and user context
    const systemPrompt = `You are Taski AI, an AI-powered study companion built directly into the Taski app.

	Taski is a study planner that includes:
	- tasks and assignments
	- exams and deadlines
	- study sessions
	- classes and schedules
	- calendars and analytics
	
	Your role is to help students study more effectively, stay organized, and feel less overwhelmed.
	
	You are NOT a general-purpose chatbot.
	You are a focused study assistant that uses the user’s academic context when appropriate.
	
	--------------------
	CORE BEHAVIOR
	--------------------
	- Be calm, supportive, and encouraging
	- Sound human, not robotic
	- Be clear and concise, but not cold
	- Never shame, guilt, or pressure the user
	- Reduce overwhelm by breaking things into small steps
	- Prefer progress over perfection
	
	If the user sounds stressed, acknowledge it briefly before helping.
	
	--------------------
	TEACHING STYLE
	--------------------
	When explaining concepts:
	- Explain step by step
	- Use simple language
	- Avoid unnecessary jargon
	- Use analogies when helpful
	- Do NOT jump straight to final answers
	- Check understanding with short follow-up questions
	
	If the user is confused:
	- Rephrase the explanation in a different way
	- Slow down
	- Focus on one idea at a time
	
	--------------------
	STUDY SUPPORT RULES
	--------------------
	You may help users:
	- plan study sessions
	- prioritize tasks and exams
	- break down large assignments
	- review topics for exams
	- understand difficult concepts
	- build consistent study habits
	
	When suggesting plans:
	- Consider deadlines and urgency
	- Suggest realistic time blocks
	- Avoid overloading the user
	- Offer options instead of commands
	
	Always ask before creating or changing plans.
	
	--------------------
	USE OF APP CONTEXT
	--------------------
	You may be given information about:
	- upcoming exams
	- pending tasks
	- class schedules
	- past study activity
	
	Use this information ONLY when it is relevant.
	Do not mention analytics or patterns unless it is genuinely helpful.
	
	Examples:
	- “You have an exam in two days — let’s focus on the highest-impact topic.”
	- “You haven’t studied this subject recently. We can start small.”
	
	Do NOT overwhelm the user with too much data at once.
	
	--------------------
	CONVERSATION STYLE
	--------------------
	- Keep responses structured and easy to read
	- Prefer short paragraphs or bullet points
	- Ask one clear follow-up question at a time
	- Do not ask unnecessary questions
	
	Tone should feel like:
	A supportive, organized study partner who wants the user to succeed without stress.
	
	--------------------
	BOUNDARIES
	--------------------
	- Do not invent app features
	- Do not promise outcomes (e.g. “you will ace this exam”)
	- Do not give medical, legal, or mental health advice
	- Do not encourage unhealthy study habits (all-nighters, extreme schedules)
	- Do not reintroduce yourself after the initial greeting
	- Do not list broad topics unless the user asks for a full review
	- Never invent or assume user tasks, deadlines, or analytics
	- Only reference app data if it is explicitly provided in the context
	
	If a question is outside your scope, gently redirect.
	
	--------------------
	GOAL
	--------------------
	Your goal is to help users:
	- understand what they are studying
	- feel more in control of their workload
	- make steady, realistic progress
	
	You should always aim to leave the user feeling clearer and more confident than before.
	`;

    // Create user context as separate system message
    const userContext = `Student Context:
- Name: ${context.user.name}
- Total Tasks: ${context.currentStats.totalTasks} (${context.currentStats.completedTasks} completed)
- Classes: ${context.currentStats.totalClasses}
- Upcoming Exams: ${context.currentStats.upcomingExams}
- Study Time: ${context.currentStats.totalStudyTime.toFixed(1)} hours

Recent Tasks:
${context.recentTasks.map(t => `- ${t.name} (${t.completed ? '✅' : '⏳'} ${t.priority} priority${t.due ? ', due ' + new Date(t.due).toLocaleDateString() : ''})`).join('\n')}

Upcoming Exams:
${context.upcomingExams.map(e => `- ${e.name} (${new Date(e.date).toLocaleDateString()})`).join('\n')}

Classes:
${context.classes.map(c => `- ${c.name} (${c.subject})`).join('\n')}`;

    // Call Ollama API (using /api/generate for single responses)
    const prompt = `${systemPrompt}\n\n${userContext}\n\nUser: ${message}\n\nAssistant:`;

    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama2',
        prompt: prompt,
        stream: false
      })
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status} - ${ollamaResponse.statusText}`);
    }

    const ollamaData = await ollamaResponse.json();
    const aiResponse = ollamaData.response || 'Sorry, I couldn\'t generate a response.';

    res.json({
      response: aiResponse,
      context: context,
      source: 'ollama'
    });

  } catch (error) {
    console.error('AI Tutor error:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      response: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 🤖"
    });
  }
});

// Get all conversations for user
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const conversations = await Chat.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt messages')
      .limit(50);

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Create new conversation
router.post('/conversations', requireAuth, async (req, res) => {
  try {
    const { title = 'New Chat' } = req.body;

    const conversation = new Chat({
      userId: req.userId,
      title,
      messages: []
    });

    await conversation.save();
    res.json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get specific conversation
router.get('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const conversation = await Chat.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Add message to conversation and get AI response
router.post('/conversations/:id/chat', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const conversationId = req.params.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get conversation
    const conversation = await Chat.findOne({
      _id: conversationId,
      userId: req.userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get user's context data
    const [user, tasks, classes, exams, notes, sessions] = await Promise.all([
      User.findById(req.userId),
      Task.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(10),
      Class.find({ userId: req.userId }),
      Exam.find({ userId: req.userId }).sort({ date: 1 }).limit(5),
      Note.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(5),
      StudySession.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(10)
    ]);

    // Build context for AI
    const context = {
      user: {
        name: user?.name || 'Student',
        email: user?.email
      },
      currentStats: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        totalClasses: classes.length,
        upcomingExams: exams.filter(e => new Date(e.date) > new Date()).length,
        totalStudyTime: sessions.reduce((sum, s) => sum + (s.duration / 60), 0)
      },
      recentTasks: tasks.slice(0, 5).map(t => ({
        name: t.name,
        completed: t.completed,
        due: t.due,
        priority: t.priority,
        category: t.category
      })),
      upcomingExams: exams.filter(e => new Date(e.date) > new Date()).map(e => ({
        name: e.name,
        date: e.date,
        subject: e.subject
      })),
      classes: classes.map(c => ({
        name: c.name,
        subject: c.subject,
        teacher: c.teacher
      }))
    };

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Create system prompt and user context
    const systemPrompt = `You are Taski, an AI tutor inside a study planner app.

Your job is to help students:
- understand concepts step by step
- plan study sessions based on deadlines
- prepare for exams without overwhelming them

Rules:
- Be patient and encouraging
- Never give answers without explanation
- Ask short follow-up questions
- Use the user's tasks and exams when relevant
- If the user is stressed, be supportive and calm`;

    const userContext = `Student Context:
- Name: ${context.user.name}
- Total Tasks: ${context.currentStats.totalTasks} (${context.currentStats.completedTasks} completed)
- Classes: ${context.currentStats.totalClasses}
- Upcoming Exams: ${context.currentStats.upcomingExams}
- Study Time: ${context.currentStats.totalStudyTime.toFixed(1)} hours

Recent Tasks:
${context.recentTasks.map(t => `- ${t.name} (${t.completed ? '✅' : '⏳'} ${t.priority} priority${t.due ? ', due ' + new Date(t.due).toLocaleDateString() : ''})`).join('\n')}

Upcoming Exams:
${context.upcomingExams.map(e => `- ${e.name} (${new Date(e.date).toLocaleDateString()})`).join('\n')}

Classes:
${context.classes.map(c => `- ${c.name} (${c.subject})`).join('\n')}`;

    // Build conversation history for context
    const conversationHistory = conversation.messages.slice(-10) // Last 10 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    // Create full prompt with conversation history
    const prompt = `${systemPrompt}\n\n${userContext}\n\nConversation History:\n${conversationHistory}\n\nAssistant:`;

    // Call Ollama API
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'mistral',
        prompt: prompt,
        stream: false
      })
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status} - ${ollamaResponse.statusText}`);
    }

    const ollamaData = await ollamaResponse.json();
    const aiResponse = ollamaData.response || 'Sorry, I couldn\'t generate a response.';

    // Add AI response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    // Update conversation title if it's the first message
    if (conversation.messages.length === 2 && conversation.title === 'New Chat') {
      conversation.title = message.length > 50 ? message.substring(0, 50) + '...' : message;
    }

    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      response: aiResponse,
      conversationId: conversation._id,
      context: context,
      source: 'ollama'
    });

  } catch (error) {
    console.error('Conversation chat error:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      response: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 🤖"
    });
  }
});

// Rename conversation
router.put('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const conversation = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title: title.trim(), updatedAt: new Date() },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Rename conversation error:', error);
    res.status(500).json({ error: 'Failed to rename conversation' });
  }
});

// Delete conversation
router.delete('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const result = await Chat.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!result) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;
