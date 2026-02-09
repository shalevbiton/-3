
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Reception } from './pages/Reception';
import { WorkArrangement } from './pages/WorkArrangement';
import { Handled } from './pages/Handled';
import { Archive } from './pages/Archive';
import { Statistics } from './pages/Statistics';
import { Settings } from './pages/Settings';
import { PageView, Evidence } from './types';
import { evidenceService } from './services/evidenceService';

const App: React.FC = () => {
  // Default route is 'intake'
  const [currentPage, setCurrentPage] = useState<PageView>('intake');
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);

  useEffect(() => {
    // Initialize mock DB with some data for the demo
    evidenceService.seedDatabase();
  }, []);

  const handleEditEvidence = (evidence: Evidence) => {
    setEditingEvidence(evidence);
    // When editing, go to Intake page
    setCurrentPage('intake');
  };

  const handleNavigate = (page: PageView) => {
    // Clear editing state when manually navigating away
    if (page !== 'intake') {
      setEditingEvidence(null);
    } else if (currentPage !== 'intake') {
      // If navigating TO intake manually, ensure we are not in edit mode (fresh start)
      setEditingEvidence(null);
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'intake':
        return <Reception initialEvidence={editingEvidence || undefined} />;
      case 'work_arrangement':
        return <WorkArrangement onEdit={handleEditEvidence} />;
      case 'handled':
        return <Handled />;
      case 'archive':
        return <Archive />;
      case 'statistics':
        return <Statistics />;
      case 'settings':
        return <Settings />;
      default:
        return <Reception />;
    }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      onNavigate={handleNavigate}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;
