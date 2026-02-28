
import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
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
  const [startupError, setStartupError] = useState<string | null>(null);

  useEffect(() => {
    // Check root storage permissions silently
    const checkPermissions = async () => {
      if (window.electronAPI && window.electronAPI.checkRootAccess) {
        const rootPath = localStorage.getItem('lems_root_folder_path') || 'C:\\LEMS_Evidence';
        try {
          const res = await window.electronAPI.checkRootAccess(rootPath);
          if (!res.success) {
            setStartupError('שגיאת הרשאות: התוכנה לא הצליחה לגשת לתיקיות השמירה. אנא בדוק את נתיב השמירה בהגדרות או הפעל כמנהל.');
          }
        } catch (e) {
          setStartupError('שגיאת הרשאות: התוכנה לא הצליחה לגשת לתיקיות השמירה. אנא בדוק את נתיב השמירה בהגדרות או הפעל כמנהל.');
        }
      }
    };
    checkPermissions();

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
    <>
      {startupError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600/95 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-red-500 max-w-lg w-full backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={28} className="flex-shrink-0" />
          <p className="font-bold text-lg">{startupError}</p>
        </div>
      )}
      <Layout
        currentPage={currentPage}
        onNavigate={handleNavigate}
      >
        {renderPage()}
      </Layout>
    </>
  );
};

export default App;
