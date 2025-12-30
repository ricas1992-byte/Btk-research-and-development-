// ============================================
// Database Seeding Script
// Seeds the canonical single user for BTK Institute
// ============================================

import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

// Canonical user credentials (per FULL EXECUTION BRIEF)
const CANONICAL_USERNAME = 'yotam_ricas';
const CANONICAL_PASSWORD = 'Btk!Yotam_Institute#2025';
const USER_ID = 'user-001';
const DOCUMENT_ID = 'doc-001';

async function seedDatabase() {
  // Connect to database
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('Seeding database...');

  try {
    // Check if user already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM user WHERE id = ?',
      args: [USER_ID],
    });

    if (existing.rows.length > 0) {
      console.log('User already exists. Updating password...');

      // Hash the canonical password
      const passwordHash = await bcrypt.hash(CANONICAL_PASSWORD, 10);

      // Update existing user
      await db.execute({
        sql: 'UPDATE user SET username = ?, password_hash = ? WHERE id = ?',
        args: [CANONICAL_USERNAME, passwordHash, USER_ID],
      });

      console.log('✓ User updated successfully');
    } else {
      console.log('Creating canonical user...');

      // Hash the canonical password
      const passwordHash = await bcrypt.hash(CANONICAL_PASSWORD, 10);

      // Insert canonical user
      await db.execute({
        sql: `INSERT INTO user (id, username, password_hash, created_at)
              VALUES (?, ?, ?, datetime('now'))`,
        args: [USER_ID, CANONICAL_USERNAME, passwordHash],
      });

      console.log('✓ User created successfully');

      // Check if document exists
      const docExists = await db.execute({
        sql: 'SELECT id FROM document WHERE id = ?',
        args: [DOCUMENT_ID],
      });

      if (docExists.rows.length === 0) {
        console.log('Creating initial document...');

        // Create initial document
        await db.execute({
          sql: `INSERT INTO document (id, user_id, title, content, created_at, updated_at, writing_phase)
                VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), ?)`,
          args: [DOCUMENT_ID, USER_ID, 'Untitled', '', 'NOTES'],
        });

        console.log('✓ Document created successfully');
      }

      // Create sample sources for development
      console.log('Creating sample sources...');

      const sources = [
        {
          id: 'src-001',
          title: 'Sample Research Paper',
          content: `This is sample source content for development purposes. In production, sources are pre-seeded and managed outside the application.

The practice of deliberate technical work in music requires sustained attention to detail. This extended text provides material for annotation and highlighting functionality testing.

Key concepts in musical practice include:
- Systematic approach to technical challenges
- Integration of theoretical understanding with physical execution
- Development of consistent practice habits
- Critical self-assessment and adjustment

The relationship between conceptual understanding and physical skill development represents a fundamental aspect of musical education. Effective pedagogy must address both domains simultaneously while recognizing their distinct requirements.`,
          type: 'TEXT',
        },
        {
          id: 'src-002',
          title: 'Secondary Source',
          content: `Additional sample content to demonstrate multiple sources in the Sources panel.

This text explores complementary themes:
- Historical development of practice methodologies
- Comparative analysis across different pedagogical traditions
- Modern adaptations of classical techniques

The evolution of piano pedagogy reflects broader shifts in educational philosophy and our understanding of skill acquisition. Contemporary approaches synthesize traditional wisdom with insights from cognitive science and motor learning research.`,
          type: 'TEXT',
        },
      ];

      for (const source of sources) {
        const srcExists = await db.execute({
          sql: 'SELECT id FROM source WHERE id = ?',
          args: [source.id],
        });

        if (srcExists.rows.length === 0) {
          await db.execute({
            sql: `INSERT INTO source (id, user_id, document_id, title, content, source_type, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
            args: [source.id, USER_ID, DOCUMENT_ID, source.title, source.content, source.type],
          });
        }
      }

      console.log('✓ Sample sources created');
    }

    console.log('\n✅ Database seeding completed successfully');
    console.log(`\nCanonical user: ${CANONICAL_USERNAME}`);
    console.log('Password: [REDACTED - see FULL EXECUTION BRIEF]');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed script
seedDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
