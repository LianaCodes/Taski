const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  describe('User Schema Validation', () => {
    it('should create a valid user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const user = new User(userData);
      await user.save();

      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.emailVerified).toBe(false);
      expect(user.createdAt).toBeDefined();
    });

    it('should require email', async () => {
      const user = new User({
        password: 'password123',
        name: 'Test User'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require unique email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await new User(userData).save();
      await expect(new User(userData).save()).rejects.toThrow();
    });

    it('should set default values', async () => {
      const user = new User({
        email: 'defaults@example.com',
        password: 'password123'
      });

      await user.save();

      expect(user.name).toBe('User');
      expect(user.emailVerified).toBe(false);
      expect(user.isVerified).toBe(false);
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const password = 'password123';
      const user = new User({
        email: 'hash@example.com',
        password: password
      });

      await user.save();

      expect(user.password).not.toBe(password);
      expect(user.password).toHaveLength(60); // bcrypt hash length
    });

    it('should not re-hash already hashed password', async () => {
      const user = new User({
        email: 'rehash@example.com',
        password: 'password123'
      });

      await user.save();
      const firstHash = user.password;

      user.name = 'Updated Name';
      await user.save();
      const secondHash = user.password;

      expect(firstHash).toBe(secondHash);
    });
  });

  describe('Password Comparison', () => {
    it('should compare password correctly', async () => {
      const password = 'password123';
      const user = new User({
        email: 'compare@example.com',
        password: password
      });

      await user.save();

      const isValid = await user.comparePassword(password);
      expect(isValid).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const user = new User({
        email: 'wrong@example.com',
        password: 'password123'
      });

      await user.save();

      const isValid = await user.comparePassword('wrongpassword');
      expect(isValid).toBe(false);
    });

    it('should return false for user without password', async () => {
      const user = new User({
        email: 'nopassword@example.com'
      });

      const isValid = await user.comparePassword('password123');
      expect(isValid).toBe(false);
    });
  });

  describe('Email Verification Fields', () => {
    it('should create email verification token', async () => {
      const user = new User({
        email: 'verify@example.com',
        password: 'password123'
      });

      user.emailVerificationToken = 'test-token';
      user.emailVerificationExpires = new Date();

      await user.save();

      expect(user.emailVerificationToken).toBe('test-token');
      expect(user.emailVerificationExpires).toBeDefined();
    });
  });

  describe('Profile Picture', () => {
    it('should store profile picture', async () => {
      const user = new User({
        email: 'picture@example.com',
        password: 'password123'
      });

      user.profilePicture = 'base64-image-data';
      await user.save();

      expect(user.profilePicture).toBe('base64-image-data');
    });
  });

  describe('Settings', () => {
    it('should set default theme', async () => {
      const user = new User({
        email: 'theme@example.com',
        password: 'password123'
      });

      await user.save();

      expect(user.settings.theme).toBe('beige');
      expect(user.settings.taskReminders).toBe(true);
      expect(user.settings.examAlerts).toBe(true);
    });

    it('should accept custom settings', async () => {
      const user = new User({
        email: 'custom@example.com',
        password: 'password123',
        settings: {
          theme: 'pink',
          taskReminders: false,
          examAlerts: false
        }
      });

      await user.save();

      expect(user.settings.theme).toBe('pink');
      expect(user.settings.taskReminders).toBe(false);
      expect(user.settings.examAlerts).toBe(false);
    });
  });
});
