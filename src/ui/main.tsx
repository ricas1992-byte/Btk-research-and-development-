/**
 * Client entry point for CDW application
 *
 * IMPORTANT: Client/Server Separation
 * This file and all imports must ONLY include client-safe code.
 * NEVER import server-only modules:
 * - express
 * - better-sqlite3
 * - Node.js built-ins (fs, path, process, etc.)
 *
 * For server communication, use /src/ui/api-client.ts
 */
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
