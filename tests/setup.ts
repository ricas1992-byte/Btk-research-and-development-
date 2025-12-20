import { beforeEach, afterEach } from 'vitest';
import { closeDatabase, resetDatabase } from '../src/persistence/database.js';

beforeEach(() => {
  // Reset database before each test
  resetDatabase();
});

afterEach(() => {
  // Clean up after each test
  closeDatabase();
});
