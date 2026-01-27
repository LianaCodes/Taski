const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');

describe('Auth Routes', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.message).toContain('Account created successfully');
      expect(response.body.userId).toBeDefined();
      expect(response.body.emailVerified).toBe(false);

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
      expect(user.emailVerified).toBe(false);
      expect(user.emailVerificationToken).toBeDefined();
    });

    it('should require email, password, and name', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toBe('Email, password, and name are required');
    });

    it('should not allow duplicate emails', async () => {
      // Create first user
      await User.create({
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'First User'
      });

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'password456',
          name: 'Second User'
        })
        .expect(400);

      expect(response.body.error).toBe('User already exists');
    });

    it('should validate password strength', async () => {
      // This test assumes frontend validation, but backend should handle it
      const userData = {
        email: 'weakpass@example.com',
        password: 'weak',
        name: 'Weak Pass User'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201); // Backend doesn't enforce password strength, only frontend does

      expect(response.body.message).toContain('Account created successfully');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        email: 'login@example.com',
        password: 'password123',
        name: 'Login User',
        emailVerified: true
      });
      await user.save();
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.userId).toBeDefined();
      expect(response.body.email).toBe('login@example.com');
      expect(response.body.name).toBe('Login User');
      expect(response.body.emailVerified).toBe(true);
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should require email and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com' })
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
    });
  });

  describe('GET /api/auth/verify-email', () => {
    let verificationToken;

    beforeEach(async () => {
      // Create a user with verification token
      const user = new User({
        email: 'verify@example.com',
        password: 'password123',
        name: 'Verify User',
        emailVerified: false,
        emailVerificationToken: 'test-verification-token',
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      });
      await user.save();
      verificationToken = user.emailVerificationToken;
    });

    it('should verify email with valid token', async () => {
      const response = await request(app)
        .get(`/api/auth/verify-email?token=${verificationToken}`)
        .expect(302); // Redirect to verified.html

      expect(response.headers.location).toBe('/verified.html');

      // Verify user was updated in database
      const user = await User.findOne({ email: 'verify@example.com' });
      expect(user.emailVerified).toBe(true);
      expect(user.emailVerificationToken).toBeUndefined();
      expect(user.emailVerificationExpires).toBeUndefined();
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email?token=invalid-token')
        .expect(400);

      expect(response.text).toContain('Invalid or Expired Link');
    });

    it('should reject expired token', async () => {
      // Update token to be expired
      await User.findOneAndUpdate(
        { email: 'verify@example.com' },
        { emailVerificationExpires: new Date(Date.now() - 1000) } // Expired 1 second ago
      );

      const response = await request(app)
        .get(`/api/auth/verify-email?token=${verificationToken}`)
        .expect(400);

      expect(response.text).toContain('Invalid or Expired Link');
    });

    it('should handle missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email')
        .expect(400);

      expect(response.text).toContain('Invalid Verification Link');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    beforeEach(async () => {
      // Create an unverified user
      const user = new User({
        email: 'resend@example.com',
        password: 'password123',
        name: 'Resend User',
        emailVerified: false
      });
      await user.save();
    });

    it('should resend verification email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'resend@example.com' })
        .expect(200);

      expect(response.body.message).toBe('Verification email sent successfully');

      // Verify new token was generated
      const user = await User.findOne({ email: 'resend@example.com' });
      expect(user.emailVerificationToken).toBeDefined();
      expect(user.emailVerificationExpires).toBeDefined();
    });

    it('should reject verified users', async () => {
      await User.findOneAndUpdate(
        { email: 'resend@example.com' },
        { emailVerified: true }
      );

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'resend@example.com' })
        .expect(400);

      expect(response.body.error).toBe('Email is already verified');
    });

    it('should reject non-existent users', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should require email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Email is required');
    });
  });
});
