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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [proj, ideasData, phaseData] = (await Promise.all([
        api.getProject(),
        api.getIdeas(),
        api.getActivePhase().catch(() => null),
      ])) as [any, any[], any];
      setProject(proj);
      setIdeas(ideasData);
      setActivePhase(phaseData);

      if (phaseData && view === 'parking-lot') {
        setView('active-phase');
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
    }
  };

  const handleViewChange = (newView: string) => {
    setView(newView);
  };

  if (!project) {
    return <div style={{ padding: '24px' }}>Loading...</div>;
  }

  return (
    <Layout
      projectName={project.name}
      activeView={view}
      onViewChange={handleViewChange}
      activePhase={activePhase}
    >
      {view === 'parking-lot' && (
        <ParkingLot ideas={ideas} activePhaseExists={!!activePhase} onRefresh={loadData} />
      )}
      {view === 'active-phase' && <ActivePhase phase={activePhase} onRefresh={loadData} />}
      {view === 'archive' && <Archive />}
      {view === 'operations' && <Operations />}
    </Layout>
  );
}
