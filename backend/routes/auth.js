const express = require('express');
const router = express.Router();
const User = require('../models/User');
const admin = require('../firebase');

// Middleware to check if user is email verified (via Firebase)
const requireEmailVerification = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    // If user has firebaseUid, verify with Firebase
    if (user.firebaseUid) {
      try {
        const firebaseUser = await admin.auth().getUser(user.firebaseUid);
        if (!firebaseUser.emailVerified) {
          return res.status(403).json({
            error: 'Email not verified',
            message: 'Please verify your email address to access this feature.',
            code: 'EMAIL_NOT_VERIFIED'
          });
        }
        // Update local verified status
        if (!user.verified) {
          user.verified = true;
          await user.save();
        }
      } catch (firebaseError) {
        console.error('Firebase verification check failed:', firebaseError);
      }
    } else if (!user.verified) {
      return res.status(403).json({
        error: 'Email not verified',
        message: 'Please verify your email address to access this feature.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Email verification middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// SIGNUP ROUTE - Creates user in MongoDB (Firebase handles auth)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, firebaseUid } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user with firebaseUid if not set
      if (firebaseUid && !user.firebaseUid) {
        user.firebaseUid = firebaseUid;
        if (name) user.name = name;
        await user.save();
        return res.status(200).json({ message: 'User updated', userId: user._id });
      }
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    user = await User.create({
      name: name || 'User',
      email,
      firebaseUid,
      verified: false
    });

    res.status(201).json({ 
      message: 'Account created. Check email to verify.',
      userId: user._id
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// LOGIN ROUTE - Verifies Firebase token and returns user data
router.post('/login', async (req, res) => {
  try {
    const { email, firebaseUid } = req.body;
    const authHeader = req.headers.authorization;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Verify Firebase token if provided
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        if (decodedToken.email !== email) {
          return res.status(401).json({ error: 'Token email mismatch' });
        }
      } catch (tokenError) {
        console.error('Token verification failed:', tokenError);
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      // Auto-create user if they exist in Firebase but not in MongoDB
      user = await User.create({
        email,
        firebaseUid,
        verified: true,
        name: email.split('@')[0]
      });
    } else if (firebaseUid && !user.firebaseUid) {
      // Link Firebase UID to existing user
      user.firebaseUid = firebaseUid;
      user.verified = true;
      await user.save();
    }

    res.json({
      userId: user._id,
      email: user.email,
      name: user.name,
      emailVerified: user.verified
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// RESEND VERIFICATION EMAIL
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Firebase handles this on the client side
    // This endpoint exists for API compatibility
    res.json({ message: 'Please use the resend option in the app' });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification' });
  }
});

// CHECK VERIFICATION STATUS
router.get('/check-verification/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check Firebase if user has firebaseUid
    if (user.firebaseUid) {
      try {
        const firebaseUser = await admin.auth().getUser(user.firebaseUid);
        if (firebaseUser.emailVerified && !user.verified) {
          user.verified = true;
          await user.save();
        }
        return res.json({ verified: firebaseUser.emailVerified });
      } catch (err) {
        console.error('Firebase check failed:', err);
      }
    }

    res.json({ verified: user.verified });

  } catch (error) {
    console.error('Check verification error:', error);
    res.status(500).json({ error: 'Failed to check verification' });
  }
});

// DELETE ACCOUNT ROUTE
router.delete('/delete-account', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const authHeader = req.headers.authorization;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete from Firebase if user has firebaseUid
    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
        console.log('✅ Deleted user from Firebase:', user.firebaseUid);
      } catch (firebaseError) {
        console.error('Firebase delete error:', firebaseError);
        // Continue with MongoDB deletion even if Firebase fails
      }
    }

    // Delete all user data from MongoDB
    const Task = require('../models/Task');
    const Class = require('../models/Class');
    const Exam = require('../models/Exam');
    const Note = require('../models/Note');
    const StudySession = require('../models/StudySession');
    const Chat = require('../models/Chat');

    await Promise.all([
      Task.deleteMany({ userId }),
      Class.deleteMany({ userId }),
      Exam.deleteMany({ userId }),
      Note.deleteMany({ userId }),
      StudySession.deleteMany({ userId }),
      Chat.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    console.log('✅ Deleted all data for user:', userId);
    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
module.exports.requireEmailVerification = requireEmailVerification;
