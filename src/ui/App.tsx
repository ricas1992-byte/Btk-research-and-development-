import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ParkingLot } from './components/ParkingLot';
import { ActivePhase } from './components/ActivePhase';
import { Archive } from './components/Archive';
import { Operations } from './components/Operations';
import { api } from './api-client';
import './styles/main.css';

export function App() {
  const [view, setView] = useState('parking-lot');
  const [project, setProject] = useState<any>(null);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [activePhase, setActivePhase] = useState<any>(null);

  // Loading and error states for each data entity
  const [ideasLoading, setIdeasLoading] = useState(true);
  const [ideasError, setIdeasError] = useState<Error | null>(null);
  const [phaseLoading, setPhaseLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load project data
    loadProject();

    // Load ideas data
    loadIdeas();

    // Load active phase data
    loadActivePhase();
  };

  const loadProject = async () => {
    try {
      const proj = await api.getProject();
      setProject(proj);
    } catch (err: any) {
      console.error('Failed to load project:', err);
      // Set a fallback project to allow UI to render
      setProject({ name: 'Untitled Project', id: 1 });
    }
  };

  const loadIdeas = async () => {
    setIdeasLoading(true);
    setIdeasError(null);
    try {
      const ideasData = await api.getIdeas();
      setIdeas(ideasData as any[]);
    } catch (err: any) {
      console.error('Failed to load ideas:', err);
      setIdeasError(err);
      setIdeas([]);
    } finally {
      setIdeasLoading(false);
    }
  };

  const loadActivePhase = async () => {
    setPhaseLoading(true);
    try {
      const phaseData = await api.getActivePhase();
      setActivePhase(phaseData);

      // Auto-navigate to active phase if one exists and we're on parking lot
      if (phaseData && view === 'parking-lot') {
        setView('active-phase');
      }
    } catch (err: any) {
      // No active phase is not an error condition
      console.log('No active phase found');
      setActivePhase(null);
    } finally {
      setPhaseLoading(false);
    }
  };

  const handleViewChange = (newView: string) => {
    setView(newView);
  };

  // Render UI immediately - no blocking on data load
  return (
    <Layout
      projectName={project?.name || 'Loading...'}
      activeView={view}
      onViewChange={handleViewChange}
      activePhase={activePhase}
    >
      {view === 'parking-lot' && (
        <ParkingLot
          ideas={ideas}
          activePhaseExists={!!activePhase}
          onRefresh={loadData}
          loading={ideasLoading}
          error={ideasError}
        />
      )}
      {view === 'active-phase' && (
        <ActivePhase
          phase={activePhase}
          onRefresh={loadData}
          loading={phaseLoading}
        />
      )}
      {view === 'archive' && <Archive />}
      {view === 'operations' && <Operations />}
    </Layout>
  );
}
