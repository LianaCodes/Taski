require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB().then(() => {
  console.log('✅ Database connected successfully');
}).catch((err) => {
  console.error('❌ Database connection failed:', err);
  process.exit(1);
});

app.use(cors());
app.use(express.json());

// ---- ROUTES (require once, mount once) ----
const authRoutes = require('./routes/auth');
const { requireEmailVerification } = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const classRoutes = require('./routes/classes');
const examRoutes = require('./routes/exams');
const noteRoutes = require('./routes/notes');
const sessionRoutes = require('./routes/sessions');
const classroomRoutes = require('./routes/classroom');
const userSettingsRoutes = require('./routes/userSettings');
const aiTutorRoutes = require('./routes/aiTutor');

// ---- API MOUNTS ----
app.use('/api/auth', authRoutes);

// Apply email verification middleware to protected routes
app.use('/api/tasks', requireEmailVerification);
app.use('/api/classes', requireEmailVerification);
app.use('/api/exams', requireEmailVerification);
app.use('/api/notes', requireEmailVerification);
app.use('/api/sessions', requireEmailVerification);
app.use('/api/classroom', requireEmailVerification);
app.use('/api/settings', requireEmailVerification);
// app.use('/api/ai-tutor', requireEmailVerification); // Removed AI tutor

// Mount protected routes
app.use('/api/tasks', taskRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/classroom', classroomRoutes);
app.use('/api/settings', userSettingsRoutes);
// app.use('/api/ai-tutor', aiTutorRoutes); // Removed AI tutor

// ---- FRONTEND ----
app.use(express.static('../frontend'));

// ---- START SERVER ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
