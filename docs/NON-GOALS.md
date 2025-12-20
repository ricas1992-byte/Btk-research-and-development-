# NON-GOALS

This document lists features that are **explicitly excluded** from CDW. These are intentional design decisions to maintain focus and simplicity.

## Excluded Features

### Content Management

- **Tags and Labels**: No tagging system
- **Categories**: No hierarchical categorization
- **Search**: No full-text search functionality
- **Rich Text**: Plain text only (no Markdown, HTML, or formatting)
- **Attachments**: No file attachments or media
- **Templates**: No document or decision templates
- **Comments**: No commenting system

### User Interface

- **Themes**: Single color scheme only (navy/gold)
- **Customization**: No UI customization options
- **Keyboard Shortcuts**: Mouse/touch interaction only
- **Drag and Drop**: No drag-and-drop functionality
- **Notifications**: No in-app or system notifications
- **Widgets**: No dashboard widgets or custom views

### Workflow Features

- **Reminders**: No deadline or reminder system
- **Analytics**: No metrics, charts, or dashboards
- **Automation**: No automated workflows or triggers
- **Undo/Redo**: No undo functionality (use backup/restore)
- **Version History**: Only snapshots on phase close
- **Concurrent Editing**: Single-user only

### Multi-Entity Features

- **Multi-Project**: Single project only
- **Multi-User**: Single user only
- **Collaboration**: No sharing or collaboration features
- **Permissions**: No access control or roles
- **Teams**: No team or organization features

### Integration Features

- **Import**: No data import from other tools
- **Export Formats**: JSON only (no CSV, PDF, etc.)
- **API for External Tools**: Internal API only
- **Webhooks**: No webhook support
- **Third-Party Integrations**: No integrations with other services

### Advanced Features

- **AI Features**: No AI assistance or suggestions
- **Cloud Sync**: Local-only (no cloud synchronization)
- **Mobile App**: Desktop/web only
- **Offline Mode**: Always offline (local-first)
- **Real-time Collaboration**: Not applicable (single-user)
- **Plugins**: No plugin system or extensions

### Data Management

- **Batch Operations**: Single-item operations only
- **Bulk Import**: Not supported
- **Data Migration**: Manual export/import only
- **Archival Formats**: JSON export only
- **Compression**: No automatic compression

## Why These Are Non-Goals

CDW is designed with specific constraints to enforce disciplined cognitive work:

1. **Focus**: Single project, single phase forces attention
2. **Simplicity**: Plain text removes formatting distractions
3. **Immutability**: Locked decisions and closed phases prevent revision
4. **Local-First**: No network dependencies or sync conflicts
5. **Minimal Scope**: Core workflow only, no feature creep

If you need these features, CDW may not be the right tool for you.
