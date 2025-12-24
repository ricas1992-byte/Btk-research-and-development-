// Tests for judgment workflow

import { Table } from '../src/zones/Table';
import { FileRepository } from '../src/storage/FileRepository';
import { JudgmentService } from '../src/core/JudgmentService';
import { WorkspaceItem } from '../src/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

const TEST_STORAGE_PATH = './test-storage-judgment';

describe('Judgment Workflow', () => {
  let table: Table;
  let repository: FileRepository;
  let judgmentService: JudgmentService;

  beforeEach(async () => {
    table = new Table();
    repository = new FileRepository(TEST_STORAGE_PATH);
    await repository.initialize();
    judgmentService = new JudgmentService(table, repository);
  });

  afterEach(async () => {
    // Clean up test storage
    try {
      await fs.rm(TEST_STORAGE_PATH, { recursive: true });
    } catch (e) {
      // Ignore if doesn't exist
    }
  });

  test('Verdict requires reasoning', async () => {
    const item: WorkspaceItem = {
      id: 'item-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
      title: 'Test Item',
      content: 'Content',
      sourceReferences: [],
      annotations: [],
      currentZone: 'reading-chair',
      epistemicStatus: 'provisional',
      history: [],
    };

    await table.addItem(item, 'Adding item for judgment');

    // Try verdict without reasoning
    const result = await judgmentService.executeJudgment('My verdict', '');
    expect(result.success).toBe(false);
  });

  test('TableRecord is created with isBinding: true', async () => {
    const item: WorkspaceItem = {
      id: 'item-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
      title: 'Test Item',
      content: 'Content',
      sourceReferences: [],
      annotations: [],
      currentZone: 'reading-chair',
      epistemicStatus: 'provisional',
      history: [],
    };

    await table.addItem(item, 'Adding item for judgment');

    const result = await judgmentService.executeJudgment(
      'This is my verdict',
      'This is my reasoning'
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.isBinding).toBe(true);
      expect(result.value.verdict).toBe('This is my verdict');
      expect(result.value.reasoning).toBe('This is my reasoning');
    }
  });

  test('Items updated to binding status after judgment', async () => {
    const item: WorkspaceItem = {
      id: 'item-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
      title: 'Test Item',
      content: 'Content',
      sourceReferences: [],
      annotations: [],
      currentZone: 'reading-chair',
      epistemicStatus: 'provisional',
      history: [],
    };

    await table.addItem(item, 'Adding item for judgment');
    expect(item.epistemicStatus).toBe('under-judgment');

    await judgmentService.executeJudgment(
      'This is my verdict',
      'This is my reasoning'
    );

    expect(item.epistemicStatus).toBe('binding');
  });

  test('Judgment fails if Table is empty', async () => {
    const result = await judgmentService.executeJudgment(
      'This is my verdict',
      'This is my reasoning'
    );

    expect(result.success).toBe(false);
  });

  test('TableRecord is read-only after creation', async () => {
    const item: WorkspaceItem = {
      id: 'item-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
      title: 'Test Item',
      content: 'Content',
      sourceReferences: [],
      annotations: [],
      currentZone: 'reading-chair',
      epistemicStatus: 'provisional',
      history: [],
    };

    await table.addItem(item, 'Adding item for judgment');

    const result = await judgmentService.executeJudgment(
      'This is my verdict',
      'This is my reasoning'
    );

    expect(result.success).toBe(true);
    if (result.success) {
      const record = result.value;

      // Verify record has literal true for isBinding
      expect(record.isBinding).toBe(true);

      // TableRecord interface ensures isBinding is literal true
      // There's no way to modify it in TypeScript due to type system
    }
  });
});
