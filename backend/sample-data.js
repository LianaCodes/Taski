require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const Class = require('./models/Class');
const Exam = require('./models/Exam');
const Note = require('./models/Note');
const StudySession = require('./models/StudySession');

const MONGO = process.env.MONGO_URI;

async function seed() {
  if (!MONGO) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(MONGO);
  console.log('Connected to Mongo');

  const email = 'demo@taski.local';
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({ email, password: 'password', name: 'Demo User', theme: 'beige' });
    await user.save();
    console.log('Created demo user:', email);
  } else {
    console.log('Demo user already exists');
  }

  // Create some sample tasks
  const existing = await Task.find({ userId: user._id });
  if (existing.length === 0) {
    await Task.create([
      { userId: user._id, name: 'Finish algebra homework', category: 'school', priority: 'high', due: new Date(Date.now() + 2*24*3600*1000) },
      { userId: user._id, name: 'Read chapter 4', category: 'school', priority: 'medium' },
      { userId: user._id, name: 'Buy study snacks', category: 'personal', priority: 'low' }
    ]);
    console.log('Added sample tasks');
  }

  // Classes
  const classes = await Class.find({ userId: user._id });
  if (classes.length === 0) {
    await Class.create({ userId: user._id, name: 'Calculus I', subject: 'Math', teacher: 'Prof. Smith' });
    await Class.create({ userId: user._id, name: 'Intro to Literature', subject: 'English' });
    console.log('Added sample classes');
  }

  // Exams
  const exams = await Exam.find({ userId: user._id });
  if (exams.length === 0) {
    await Exam.create({ userId: user._id, name: 'Midterm - Calculus', subject: 'Math', date: new Date(Date.now() + 10*24*3600*1000) });
    console.log('Added sample exam');
  }

  // Notes
  const notes = await Note.find({ userId: user._id });
  if (notes.length === 0) {
    await Note.create({ userId: user._id, title: 'Study tips', content: 'Pomodoro: 25 min study / 5 min break' });
    console.log('Added sample note');
  }

  // Sessions
  const sessions = await StudySession.find({ userId: user._id });
  if (sessions.length === 0) {
    await StudySession.create({ userId: user._id, duration: 1500, notes: 'Focused on calculus problems' });
    console.log('Added sample session');
  }

  console.log('Seeding complete');
  mongoose.connection.close();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});