const Task = require('../../models/Task');

describe('Task Model', () => {
  describe('Task Schema Validation', () => {
    it('should create a valid task', async () => {
      const taskData = {
        userId: '507f1f77bcf86cd799439011',
        name: 'Complete homework',
        category: 'school',
        priority: 'high',
        due: new Date('2024-12-31'),
        description: 'Finish math homework'
      };

      const task = new Task(taskData);
      await task.save();

      expect(task.userId.toString()).toBe(taskData.userId);
      expect(task.name).toBe(taskData.name);
      expect(task.category).toBe(taskData.category);
      expect(task.priority).toBe(taskData.priority);
      expect(task.completed).toBe(false);
      expect(task.createdAt).toBeDefined();
    });

    it('should require userId and name', async () => {
      const task = new Task({
        category: 'school'
      });

      await expect(task.save()).rejects.toThrow();
    });

    it('should set default values', async () => {
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Test task'
      });

      await task.save();

      expect(task.category).toBe('personal');
      expect(task.priority).toBe('medium');
      expect(task.completed).toBe(false);
    });
  });

  describe('Task Completion', () => {
    it('should mark task as completed', async () => {
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Test task'
      });

      await task.save();
      expect(task.completed).toBe(false);

      task.completed = true;
      await task.save();

      expect(task.completed).toBe(true);
      expect(task.updatedAt).toBeDefined();
    });

    it('should update timestamp on completion', async () => {
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Test task'
      });

      await task.save();
      const initialUpdatedAt = task.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      task.completed = true;
      await task.save();

      expect(task.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('Task Priority', () => {
    it('should accept valid priority values', async () => {
      const priorities = ['low', 'medium', 'high'];

      for (const priority of priorities) {
        const task = new Task({
          userId: '507f1f77bcf86cd799439011',
          name: `Task ${priority}`,
          priority: priority
        });

        await task.save();
        expect(task.priority).toBe(priority);
      }
    });

    it('should default to medium priority', async () => {
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Default priority task'
      });

      await task.save();
      expect(task.priority).toBe('medium');
    });
  });

  describe('Task Category', () => {
    it('should accept valid category values', async () => {
      const categories = ['personal', 'school', 'work'];

      for (const category of categories) {
        const task = new Task({
          userId: '507f1f77bcf86cd799439011',
          name: `Task ${category}`,
          category: category
        });

        await task.save();
        expect(task.category).toBe(category);
      }
    });

    it('should default to personal category', async () => {
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Default category task'
      });

      await task.save();
      expect(task.category).toBe('personal');
    });
  });

  describe('Task Due Date', () => {
    it('should store due date correctly', async () => {
      const dueDate = new Date('2024-12-31T23:59:59Z');
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Task with due date',
        due: dueDate
      });

      await task.save();

      expect(task.due.toISOString()).toBe(dueDate.toISOString());
    });

    it('should allow null due date', async () => {
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Task without due date',
        due: null
      });

      await task.save();

      expect(task.due).toBeNull();
    });
  });

  describe('Task Description', () => {
    it('should store description', async () => {
      const description = 'This is a detailed task description';
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Task with description',
        description: description
      });

      await task.save();

      expect(task.description).toBe(description);
    });

    it('should allow empty description', async () => {
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Task without description'
      });

      await task.save();

      expect(task.description).toBe('');
    });
  });

  describe('Task Class Association', () => {
    it('should store classId', async () => {
      const classId = '507f1f77bcf86cd799439012';
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Task with class',
        classId: classId
      });

      await task.save();

      expect(task.classId.toString()).toBe(classId);
    });

    it('should allow null classId', async () => {
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Task without class'
      });

      await task.save();

      expect(task.classId).toBeNull();
    });
  });

  describe('Task Timestamps', () => {
    it('should set createdAt timestamp', async () => {
      const beforeCreate = new Date();
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Timestamp test task'
      });

      await task.save();
      const afterCreate = new Date();

      expect(task.createdAt).toBeDefined();
      expect(task.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(task.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should set updatedAt timestamp', async () => {
      const task = new Task({
        userId: '507f1f77bcf86cd799439011',
        name: 'Updated timestamp task'
      });

      await task.save();
      const initialUpdatedAt = task.updatedAt;

      // Wait to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      task.name = 'Updated task name';
      await task.save();

      expect(task.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });
});
