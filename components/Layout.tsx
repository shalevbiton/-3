import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { ShieldCheck } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* תפריט צד (יופיע מימין ב-RTL) */}
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      {/* אזור התוכן המרכזי */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* כותרת עליונה */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">L.E.M.S</h1>
              <p className="text-xs text-slate-400 font-medium">מערכת ניהול מוצגים מקומית</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-900/30 text-green-400 rounded-full text-xs font-semibold border border-green-800/50">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                מערכת מחוברת
             </div>
             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                יש
             </div>
          </div>
        </header>

        {/* תוכן עמוד גליל */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};