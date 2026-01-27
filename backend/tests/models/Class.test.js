const Class = require('../../models/Class');

describe('Class Model', () => {
  describe('Class Schema Validation', () => {
    it('should create a valid class', async () => {
      const classData = {
        userId: '507f1f77bcf86cd799439011',
        name: 'Mathematics 101',
        subject: 'Mathematics',
        teacher: 'Dr. Smith',
        color: '#FF6B6B'
      };

      const cls = new Class(classData);
      await cls.save();

      expect(cls.userId.toString()).toBe(classData.userId);
      expect(cls.name).toBe(classData.name);
      expect(cls.subject).toBe(classData.subject);
      expect(cls.teacher).toBe(classData.teacher);
      expect(cls.color).toBe(classData.color);
      expect(cls.createdAt).toBeDefined();
    });

    it('should require userId, name, and subject', async () => {
      const cls = new Class({
        teacher: 'Dr. Smith'
      });

      await expect(cls.save()).rejects.toThrow();
    });

    it('should allow optional teacher and color', async () => {
      const cls = new Class({
        userId: '507f1f77bcf86cd799439011',
        name: 'Physics 101',
        subject: 'Physics'
      });

      await cls.save();

      expect(cls.teacher).toBe('');
      expect(cls.color).toBe('#5352ed');
    });
  });

  describe('Class Fields', () => {
    it('should store teacher name', async () => {
      const teacher = 'Professor Johnson';
      const cls = new Class({
        userId: '507f1f77bcf86cd799439011',
        name: 'Chemistry 101',
        subject: 'Chemistry',
        teacher: teacher
      });

      await cls.save();

      expect(cls.teacher).toBe(teacher);
    });

    it('should store color', async () => {
      const color = '#4ECDC4';
      const cls = new Class({
        userId: '507f1f77bcf86cd799439011',
        name: 'Biology 101',
        subject: 'Biology',
        color: color
      });

      await cls.save();

      expect(cls.color).toBe(color);
    });

    it('should default to blue color', async () => {
      const cls = new Class({
        userId: '507f1f77bcf86cd799439011',
        name: 'History 101',
        subject: 'History'
      });

      await cls.save();

      expect(cls.color).toBe('#5352ed');
    });
  });

  describe('Class Timestamps', () => {
    it('should set createdAt timestamp', async () => {
      const beforeCreate = new Date();
      const cls = new Class({
        userId: '507f1f77bcf86cd799439011',
        name: 'Test Class',
        subject: 'Test Subject'
      });

      await cls.save();
      const afterCreate = new Date();

      expect(cls.createdAt).toBeDefined();
      expect(cls.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(cls.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });
});
