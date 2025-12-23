import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../../src/api/server.js';
import { initDatabase, closeDatabase } from '../../src/persistence/database.js';

const app = createServer();

beforeAll(() => {
  initDatabase();
});

afterAll(() => {
  closeDatabase();
});

describe('API Integration Tests', () => {
  describe('Project Endpoints', () => {
    it('GET /api/project returns project', async () => {
      const res = await request(app).get('/api/project');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 'singleton');
      expect(res.body).toHaveProperty('name');
    });

    it('PATCH /api/project updates project name', async () => {
      const res = await request(app).patch('/api/project').send({ name: 'Test Project' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Test Project');
    });
  });

  describe('Ideas Endpoints', () => {
    it('POST /api/ideas creates an idea', async () => {
      const res = await request(app)
        .post('/api/ideas')
        .send({ title: 'Test Idea', description: 'Test Description' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Idea');
      expect(res.body.status).toBe('PARKED');
    });

    it('GET /api/ideas returns ideas', async () => {
      const res = await request(app).get('/api/ideas');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/ideas/:id/promote promotes idea to phase', async () => {
      const createRes = await request(app)
        .post('/api/ideas')
        .send({ title: 'Promote Test', description: 'Test' });
      const ideaId = createRes.body.id;

      const res = await request(app).post(`/api/ideas/${ideaId}/promote`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('idea');
      expect(res.body).toHaveProperty('phase');
      expect(res.body.idea.status).toBe('PROMOTED');
      expect(res.body.phase.status).toBe('ACTIVE');
    });
  });

  describe('Phases Endpoints', () => {
    it('GET /api/phases/active returns active phase', async () => {
      const res = await request(app).get('/api/phases/active');
      expect([200, 404]).toContain(res.status);
    });

    it('GET /api/phases/completed returns completed phases', async () => {
      const res = await request(app).get('/api/phases/completed');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Documents Endpoints', () => {
    it('POST /api/documents creates a document', async () => {
      const ideaRes = await request(app)
        .post('/api/ideas')
        .send({ title: 'Doc Test', description: '' });
      const promoteRes = await request(app).post(`/api/ideas/${ideaRes.body.id}/promote`);
      const phase_id = promoteRes.body.phase.id;

      const res = await request(app)
        .post('/api/documents')
        .send({ phase_id, title: 'Test Doc', content: 'Content' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Doc');
    });
  });

  describe('Decisions Endpoints', () => {
    it('POST /api/decisions creates a decision', async () => {
      const ideaRes = await request(app)
        .post('/api/ideas')
        .send({ title: 'Decision Test', description: '' });
      const promoteRes = await request(app).post(`/api/ideas/${ideaRes.body.id}/promote`);
      const phase_id = promoteRes.body.phase.id;

      const res = await request(app)
        .post('/api/decisions')
        .send({ phase_id, content: 'Test decision content with statement and rationale' });
      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Test decision content with statement and rationale');
      expect(res.body.status).toBe('DRAFT');
    });

    it('POST /api/decisions/:id/lock locks a decision', async () => {
      const ideaRes = await request(app)
        .post('/api/ideas')
        .send({ title: 'Lock Test', description: '' });
      const promoteRes = await request(app).post(`/api/ideas/${ideaRes.body.id}/promote`);
      const phase_id = promoteRes.body.phase.id;

      const decRes = await request(app)
        .post('/api/decisions')
        .send({ phase_id, content: 'Lock decision content' });
      const decisionId = decRes.body.id;

      const res = await request(app)
        .post(`/api/decisions/${decisionId}/lock`)
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('LOCKED');
      expect(res.body.content_hash).toBeTruthy();
    });
  });

  describe('Tasks Endpoints', () => {
    it('POST /api/tasks creates a task from locked decision', async () => {
      const ideaRes = await request(app)
        .post('/api/ideas')
        .send({ title: 'Task Test', description: '' });
      const promoteRes = await request(app).post(`/api/ideas/${ideaRes.body.id}/promote`);
      const phase_id = promoteRes.body.phase.id;

      const decRes = await request(app)
        .post('/api/decisions')
        .send({ phase_id, content: 'Task decision content' });
      const decision_id = decRes.body.id;

      await request(app).post(`/api/decisions/${decision_id}/lock`).send({});

      const res = await request(app)
        .post('/api/tasks')
        .send({ decision_id, title: 'Test Task', description: 'Description' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Task');
      expect(res.body.status).toBe('PENDING');
    });

    it('POST /api/tasks/:id/complete completes a task', async () => {
      const ideaRes = await request(app)
        .post('/api/ideas')
        .send({ title: 'Complete Test', description: '' });
      const promoteRes = await request(app).post(`/api/ideas/${ideaRes.body.id}/promote`);
      const phase_id = promoteRes.body.phase.id;

      const decRes = await request(app)
        .post('/api/decisions')
        .send({ phase_id, content: 'Complete decision content' });
      await request(app)
        .post(`/api/decisions/${decRes.body.id}/lock`)
        .send({});

      const taskRes = await request(app)
        .post('/api/tasks')
        .send({ decision_id: decRes.body.id, title: 'Complete Task', description: '' });
      const taskId = taskRes.body.id;

      // Start task first (PENDING → IN_PROGRESS)
      await request(app).post(`/api/tasks/${taskId}/start`);

      // Then complete (IN_PROGRESS → COMPLETED)
      const res = await request(app).post(`/api/tasks/${taskId}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('COMPLETED');
    });
  });
});
