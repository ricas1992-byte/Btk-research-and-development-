-- ============================================
-- Development Seed Data
-- ============================================

-- Initialize system status records
INSERT OR REPLACE INTO system_status (id, function_code, status, last_check_at, message) VALUES
  ('ss-env', 'ENV', 'OK', datetime('now'), NULL),
  ('ss-access', 'ACCESS', 'OK', datetime('now'), NULL),
  ('ss-tool', 'TOOL', 'OK', datetime('now'), NULL),
  ('ss-data', 'DATA', 'OK', datetime('now'), NULL),
  ('ss-bound', 'BOUND', 'OK', datetime('now'), NULL);

-- Sample sources for development
INSERT OR IGNORE INTO source (id, user_id, document_id, title, content, source_type, source_url, created_at)
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
    NULL,
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
    NULL,
    datetime('now')
  ),
  (
    'src-003',
    'user-001',
    'doc-001',
    'Web Article Example',
    'Sample web content to test source type variation.

This demonstrates how web-scraped content might appear in the system. The content remains immutable after creation, ensuring annotation offsets remain stable.

Research methodology considerations:
- Source credibility assessment
- Context preservation when quoting
- Attribution and citation practices
- Integration of multiple perspectives

Digital research tools transform how we engage with source material, but fundamental scholarly practices remain essential.',
    'WEB',
    'https://example.com/article',
    datetime('now')
  );

-- Sample notes for development
INSERT OR IGNORE INTO note (id, user_id, document_id, content, source_id, annotation_id, created_at, updated_at, is_locked)
VALUES
  (
    'note-001',
    'user-001',
    'doc-001',
    'Key insight: systematic practice requires both theoretical understanding and physical execution.',
    'src-001',
    NULL,
    datetime('now'),
    datetime('now'),
    0
  ),
  (
    'note-002',
    'user-001',
    'doc-001',
    '"Critical self-assessment and adjustment" - important for continuous improvement',
    'src-001',
    NULL,
    datetime('now'),
    datetime('now'),
    0
  ),
  (
    'note-003',
    'user-001',
    'doc-001',
    'Modern pedagogy combines classical methods with cognitive science research',
    'src-002',
    NULL,
    datetime('now'),
    datetime('now'),
    0
  ),
  (
    'note-004',
    'user-001',
    'doc-001',
    'Remember: context preservation is crucial when quoting sources',
    'src-003',
    NULL,
    datetime('now'),
    datetime('now'),
    0
  ),
  (
    'note-005',
    'user-001',
    'doc-001',
    'General thought - need to integrate these themes into main argument',
    NULL,
    NULL,
    datetime('now'),
    datetime('now'),
    0
  );

-- Sample admin exceptions for development
INSERT OR IGNORE INTO admin_exception (id, user_id, exception_type, severity, description, impact, detected_at, status)
VALUES
  (
    'exc-001',
    'user-001',
    'DATA',
    'WARNING',
    'Sample warning exception for development testing',
    'No functional impact - development data only',
    datetime('now', '-2 hours'),
    'PENDING'
  ),
  (
    'exc-002',
    'user-001',
    'ENV',
    'ERROR',
    'Sample error exception to test admin screen display',
    'Demonstration of error-level exception rendering',
    datetime('now', '-1 hour'),
    'PENDING'
  );
