-- ============================================
-- Initial Data Seed
-- Run after schema creation
-- ============================================

-- Create single user (password hash generated at deployment time)
-- NOTE: Replace {{PASSWORD_HASH_PLACEHOLDER}} with actual bcrypt hash before running
-- Canonical user: yotam_ricas
INSERT INTO user (id, username, password_hash, created_at)
VALUES (
  'user-001',
  'yotam_ricas',
  '{{PASSWORD_HASH_PLACEHOLDER}}',
  datetime('now')
);

-- Create single document
INSERT INTO document (id, user_id, title, content, created_at, updated_at, writing_phase)
VALUES (
  'doc-001',
  'user-001',
  'Untitled',
  '',
  datetime('now'),
  datetime('now'),
  'NOTES'
);

-- Sample sources (for development/testing only)
-- Sources are created via seed script only. There is NO user-facing source creation.
INSERT INTO source (id, user_id, document_id, title, content, source_type, created_at)
VALUES
  (
    'src-001',
    'user-001',
    'doc-001',
    'Sample Research Paper',
    'This is sample source content for development purposes. In production, sources are pre-seeded and managed outside the application.

The practice of deliberate technical work in music requires sustained attention to detail. This extended text provides material for annotation and highlighting functionality testing.

Key concepts in musical practice include:
- Systematic approach to technical challenges
- Integration of theoretical understanding with physical execution
- Development of consistent practice habits
- Critical self-assessment and adjustment

The relationship between conceptual understanding and physical skill development represents a fundamental aspect of musical education. Effective pedagogy must address both domains simultaneously while recognizing their distinct requirements.',
    'TEXT',
    datetime('now')
  ),
  (
    'src-002',
    'user-001',
    'doc-001',
    'Secondary Source',
    'Additional sample content to demonstrate multiple sources in the Sources panel.

This text explores complementary themes:
- Historical development of practice methodologies
- Comparative analysis across different pedagogical traditions
- Modern adaptations of classical techniques

The evolution of piano pedagogy reflects broader shifts in educational philosophy and our understanding of skill acquisition. Contemporary approaches synthesize traditional wisdom with insights from cognitive science and motor learning research.',
    'TEXT',
    datetime('now')
  );
