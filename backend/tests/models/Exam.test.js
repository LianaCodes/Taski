const Exam = require('../../models/Exam');

describe('Exam Model', () => {
  describe('Exam Schema Validation', () => {
    it('should create a valid exam', async () => {
      const examData = {
        userId: '507f1f77bcf86cd799439011',
        name: 'Midterm Exam',
        subject: 'Mathematics',
        date: new Date('2024-12-15'),
        time: '14:00',
        classId: '507f1f77bcf86cd799439012',
        description: 'Covers chapters 1-5'
      };

      const exam = new Exam(examData);
      await exam.save();

      expect(exam.userId.toString()).toBe(examData.userId);
      expect(exam.name).toBe(examData.name);
      expect(exam.subject).toBe(examData.subject);
      expect(exam.date.toISOString().split('T')[0]).toBe('2024-12-15');
      expect(exam.time).toBe(examData.time);
      expect(exam.classId.toString()).toBe(examData.classId);
      expect(exam.description).toBe(examData.description);
      expect(exam.createdAt).toBeDefined();
    });

    it('should require userId, name, and date', async () => {
      const exam = new Exam({
        subject: 'Mathematics'
      });

      await expect(exam.save()).rejects.toThrow();
    });

    it('should allow optional fields', async () => {
      const exam = new Exam({
        userId: '507f1f77bcf86cd799439011',
        name: 'Final Exam',
        date: new Date('2024-12-20')
      });

      await exam.save();

      expect(exam.subject).toBe('');
      expect(exam.time).toBeNull();
      expect(exam.classId).toBeNull();
      expect(exam.description).toBe('');
    });
  });

  describe('Exam Date Handling', () => {
    it('should normalize date correctly', async () => {
      const inputDate = new Date('2024-12-15T10:30:00Z');
      const exam = new Exam({
        userId: '507f1f77bcf86cd799439011',
        name: 'Date Test Exam',
        date: inputDate
      });

      await exam.save();

      // Date should be normalized (set to midday UTC)
      expect(exam.date.getUTCHours()).toBe(12);
      expect(exam.date.getUTCMinutes()).toBe(0);
      expect(exam.date.getUTCSeconds()).toBe(0);
    });

    it('should store future dates', async () => {
      const futureDate = new Date('2024-12-31');
      const exam = new Exam({
        userId: '507f1f77bcf86cd799439011',
        name: 'Future Exam',
        date: futureDate
      });

      await exam.save();

      expect(exam.date.toISOString().split('T')[0]).toBe('2024-12-31');
    });
  });

  describe('Exam Time', () => {
    it('should store time string', async () => {
      const time = '09:30';
      const exam = new Exam({
        userId: '507f1f77bcf86cd799439011',
        name: 'Morning Exam',
        date: new Date('2024-12-15'),
        time: time
      });

      await exam.save();

      expect(exam.time).toBe(time);
    });

    it('should allow null time', async () => {
      const exam = new Exam({
        userId: '507f1f77bcf86cd799439011',
        name: 'No Time Exam',
        date: new Date('2024-12-15')
      });

      await exam.save();

      expect(exam.time).toBeNull();
    });
  });

  describe('Exam Subject and Description', () => {
    it('should store subject', async () => {
      const subject = 'Advanced Calculus';
      const exam = new Exam({
        userId: '507f1f77bcf86cd799439011',
        name: 'Calculus Exam',
        date: new Date('2024-12-15'),
        subject: subject
      });

      await exam.save();

      expect(exam.subject).toBe(subject);
    });

    it('should store description', async () => {
      const description = 'Comprehensive final examination covering all course material';
      const exam = new Exam({
        userId: '507f1f77bcf86cd799439011',
        name: 'Final Exam',
        date: new Date('2024-12-20'),
        description: description
      });

      await exam.save();

      expect(exam.description).toBe(description);
    });
  });

  describe('Exam Class Association', () => {
    it('should store classId', async () => {
      const classId = '507f1f77bcf86cd799439013';
      const exam = new Exam({
        userId: '507f1f77bcf86cd799439011',
        name: 'Class Exam',
        date: new Date('2024-12-15'),
        classId: classId
      });

      await exam.save();

      expect(exam.classId.toString()).toBe(classId);
    });

    it('should allow null classId', async () => {
      const exam = new Exam({
        userId: '507f1f77bcf86cd799439011',
        name: 'Independent Exam',
        date: new Date('2024-12-15')
      });

      await exam.save();

      expect(exam.classId).toBeNull();
    });
  });
});
