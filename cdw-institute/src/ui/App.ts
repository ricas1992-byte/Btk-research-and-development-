// Root UI component

import { render, h } from 'preact';
import { CDWInstitute } from '../index.js';

export class App {
  private institute: CDWInstitute;
  private rootElement: HTMLElement;

  constructor(rootElement: HTMLElement, storagePath: string) {
    this.rootElement = rootElement;
    this.institute = new CDWInstitute(storagePath);
  }

  async mount(): Promise<void> {
    // Initialize the institute
    await this.institute.initialize();

    // Render the workspace
    this.render();

    // Start the institute
    this.institute.start();
  }

  unmount(): void {
    // Unmount the UI
    render(null, this.rootElement);

    // Shutdown the institute
    this.institute.shutdown();
  }

  // Render the full workspace UI
  private render(): void {
    const workspace = this.institute.getWorkspace();

    // Create main app structure
    const app = h('div', { class: 'cdw-app' },
      h('header', { class: 'app-header' },
        h('h1', null, 'Cognitive Discipline Workspace'),
        h('div', { class: 'app-subtitle' },
          'A system for rigorous intellectual work'
        )
      ),
      h('main', { class: 'app-main' },
        // Render workspace
        workspace.render()
      ),
      h('footer', { class: 'app-footer' },
        h('div', { class: 'constraint-reminder' },
          'Remember: Only judgments rendered at the Table are binding.'
        )
      )
    );

    // Mount to DOM
    render(app, this.rootElement);
  }
}
