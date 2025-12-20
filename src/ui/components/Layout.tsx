interface LayoutProps {
  projectName: string;
  activeView: string;
  onViewChange: (view: string) => void;
  activePhase?: any;
  children: React.ReactNode;
}

export function Layout({
  projectName,
  activeView,
  onViewChange,
  activePhase,
  children,
}: LayoutProps) {
  return (
    <>
      <header className="app-header">
        <h1>{projectName}</h1>
      </header>
      <nav className="app-nav">
        <button
          className={`nav-button ${activeView === 'parking-lot' ? 'active' : ''}`}
          onClick={() => onViewChange('parking-lot')}
        >
          Parking Lot
        </button>
        <button
          className={`nav-button ${activeView === 'active-phase' ? 'active' : ''}`}
          onClick={() => onViewChange('active-phase')}
          disabled={!activePhase}
        >
          Active Phase
        </button>
        <button
          className={`nav-button ${activeView === 'archive' ? 'active' : ''}`}
          onClick={() => onViewChange('archive')}
        >
          Archive
        </button>
        <button
          className={`nav-button ${activeView === 'operations' ? 'active' : ''}`}
          onClick={() => onViewChange('operations')}
        >
          Operations
        </button>
      </nav>
      <main className="app-main">{children}</main>
    </>
  );
}
