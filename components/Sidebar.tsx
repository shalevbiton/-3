
import React from 'react';
import { 
  FilePlus, 
  ClipboardList, 
  Archive, 
  BarChart3, 
  LogOut,
  Settings,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { PageView } from '../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: PageView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  
  const navItems = [
    { id: 'intake', label: 'קליטה', icon: FilePlus, description: 'רישום מוצג חדש' },
    { id: 'work_arrangement', label: 'סידור עבודה', icon: ClipboardList, description: 'ניהול משימות (1-7)' },
    { id: 'handled', label: 'טופלו / למסירה', icon: CheckCircle2, description: 'הסתיים, ממתין למסירה (8)' },
    { id: 'archive', label: 'ארכיון / נמסר', icon: Archive, description: 'היסטוריית מסירות (9)' },
    { id: 'statistics', label: 'סטטיסטיקה', icon: BarChart3, description: 'מבט על' },
    { id: 'settings', label: 'הגדרות', icon: Settings, description: 'ניהול מערכת' },
  ];

  return (
    <div className="w-72 bg-black/40 border-l border-slate-800 text-slate-300 flex flex-col h-full shadow-xl">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8 opacity-50">
           <Shield size={16} />
           <h2 className="text-xs font-bold uppercase tracking-wider">תפריט ראשי</h2>
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as PageView)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-200 group text-right relative overflow-hidden
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none`} />
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                <div>
                  <div className="font-bold text-sm tracking-wide">{item.label}</div>
                  <div className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors text-sm font-medium">
          <LogOut size={18} />
          <span>התנתק</span>
        </button>
      </div>
    </div>
  );
};
