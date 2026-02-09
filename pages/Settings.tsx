import React, { useState, useEffect } from 'react';
import { 
  Users, 
  List, 
  Activity, 
  Sliders, 
  UserPlus, 
  Trash2, 
  Plus,
  Save,
  Moon,
  Bell,
  Building,
  X,
  AlertTriangle
} from 'lucide-react';
import { HandlingBase, ExhibitType, SystemUser, RANK_OPTIONS, Rank, UserRole, USER_ROLES } from '../types';
import { evidenceService } from '../services/evidenceService';

type Tab = 'users' | 'lists' | 'audit' | 'general';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  // --- USER MANAGEMENT STATE ---
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<SystemUser | null>(null);

  // New User Form State
  const [newUser, setNewUser] = useState<{rank: Rank | '', fullName: string, role: UserRole | ''}>({
    rank: '',
    fullName: '',
    role: ''
  });

  // --- LISTS MANAGEMENT STATE (Legacy/Mock for now) ---
  const [lists, setLists] = useState({
    bases: Object.values(HandlingBase),
    exhibitTypes: Object.values(ExhibitType),
    offenses: ['מרמה', 'סייבר', 'אלימות', 'סמים', 'תעבורה']
  });
  const [selectedList, setSelectedList] = useState<'bases' | 'exhibitTypes' | 'offenses'>('bases');
  const [newItemText, setNewItemText] = useState('');

  // --- AUDIT LOG MOCK ---
  const [auditLog] = useState([
    { id: 1, timestamp: '10/05/2024 08:30', user: 'משה כהן', action: 'התחברות', desc: 'התחברות מוצלחת למערכת' },
    { id: 2, timestamp: '10/05/2024 09:15', user: 'ישראל ישראלי', action: 'יצירת תיק', desc: 'יצירת מוצג חדש בתיק 2023-500' },
  ]);

  // --- LOAD DATA ---
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const data = await evidenceService.getUsers();
    setUsers(data);
  };

  // --- USER ACTIONS ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.rank || !newUser.fullName || !newUser.role) return;
    
    await evidenceService.addUser({
      rank: newUser.rank as Rank,
      fullName: newUser.fullName,
      role: newUser.role as UserRole
    });
    
    setIsAddUserOpen(false);
    setNewUser({ rank: '', fullName: '', role: '' });
    await fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmation) return;
    await evidenceService.deleteUser(deleteConfirmation.id);
    setDeleteConfirmation(null);
    await fetchUsers();
  };

  // --- LIST ACTIONS ---
  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    setLists(prev => ({
      ...prev,
      [selectedList]: [...prev[selectedList], newItemText]
    }));
    setNewItemText('');
  };

  const handleDeleteItem = (index: number) => {
    setLists(prev => ({
      ...prev,
      [selectedList]: prev[selectedList].filter((_, i) => i !== index)
    }));
  };

  // --- RENDERERS ---

  const renderUsersTab = () => (
    <div className="space-y-6 animate-in fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">ניהול משתמשים (User Management)</h3>
          <p className="text-slate-400">הוספה, עריכה ומחיקה של משתמשי מערכת.</p>
        </div>
        <button 
          onClick={() => setIsAddUserOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <UserPlus size={18} />
          הוסף משתמש חדש
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400">דרגה</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400">שם מלא</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400">תפקיד</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 font-medium text-slate-300">{user.rank}</td>
                <td className="px-6 py-4 text-slate-200 font-bold">{user.fullName}</td>
                <td className="px-6 py-4 text-slate-400">
                  <span className={`px-2 py-1 rounded text-xs border ${
                    user.role === 'חוקר סייבר' ? 'bg-purple-900/20 text-purple-300 border-purple-900/50' : 
                    user.role === 'חוקר מיומן עבירות מחשב' ? 'bg-blue-900/20 text-blue-300 border-blue-900/50' :
                    'bg-green-900/20 text-green-300 border-green-900/50'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button 
                    onClick={() => setDeleteConfirmation(user)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors" 
                    title="מחק משתמש"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">לא נמצאו משתמשים במערכת.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">הוספת משתמש חדש</h3>
              <button onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">דרגה <span className="text-red-500">*</span></label>
                <select 
                  required
                  value={newUser.rank}
                  onChange={e => setNewUser({...newUser, rank: e.target.value as Rank})}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">בחר דרגה...</option>
                  {RANK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">שם מלא <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  value={newUser.fullName}
                  onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="לדוגמא: ישראל ישראלי"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">תפקיד <span className="text-red-500">*</span></label>
                <select 
                  required
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">בחר תפקיד...</option>
                  {USER_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                 <button 
                  type="button" 
                  onClick={() => setIsAddUserOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-medium transition-colors"
                >
                  ביטול
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
                >
                  שמור משתמש
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-900/50 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">מחיקת משתמש</h3>
                <p className="text-slate-400 mb-6">
                  האם אתה בטוח שברצונך למחוק את המשתמש <span className="text-white font-bold">{deleteConfirmation.fullName}</span>?
                  <br/>
                  <span className="text-xs text-red-400 mt-2 block">פעולה זו תסיר את המשתמש מהמערכת.</span>
                </p>
                <div className="flex gap-3">
                   <button 
                    onClick={() => setDeleteConfirmation(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    ביטול
                  </button>
                  <button 
                    onClick={handleDeleteUser}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-red-900/20"
                  >
                    אישור ומחיקה
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );

  const renderListsTab = () => (
    <div className="space-y-6 animate-in fade-in h-[600px] flex flex-col">
       <div>
          <h3 className="text-xl font-bold text-white">ניהול רשימות (System Lists)</h3>
          <p className="text-slate-400">עריכת התפריטים והאפשרויות בטופס הקליטה.</p>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Sidebar for List Selection */}
        <div className="col-span-3 bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-2">
          <button 
            onClick={() => setSelectedList('bases')}
            className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-colors ${selectedList === 'bases' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            רשימת יחידות/בסיסים
          </button>
          <button 
            onClick={() => setSelectedList('exhibitTypes')}
            className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-colors ${selectedList === 'exhibitTypes' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            סוגי מוצגים
          </button>
          <button 
            onClick={() => setSelectedList('offenses')}
            className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-colors ${selectedList === 'offenses' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            סוגי עבירות
          </button>
        </div>

        {/* List Content Editor */}
        <div className="col-span-9 bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col min-h-0">
           <div className="flex gap-4 mb-6">
             <input 
               type="text" 
               value={newItemText}
               onChange={(e) => setNewItemText(e.target.value)}
               placeholder="הזן ערך חדש..."
               className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 text-white outline-none focus:ring-2 focus:ring-blue-600"
               onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
             />
             <button 
                onClick={handleAddItem}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus size={18} /> הוסף
             </button>
           </div>

           <div className="flex-1 overflow-y-auto space-y-2 pr-2">
             {lists[selectedList].map((item, idx) => (
               <div key={idx} className="flex items-center justify-between bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-800 group hover:border-slate-600 transition-colors">
                 <span className="text-slate-200">{item}</span>
                 <button 
                   onClick={() => handleDeleteItem(idx)}
                   className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <Trash2 size={16} />
                 </button>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );

  const renderAuditTab = () => (
    <div className="space-y-6 animate-in fade-in">
       <div>
          <h3 className="text-xl font-bold text-white">יומן פעילות (Audit Log)</h3>
          <p className="text-slate-400">מעקב אחר פעולות רגישות ושינויים במערכת.</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400">תאריך ושעה</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400">משתמש</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400">פעולה</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400">תיאור</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {auditLog.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 text-slate-400 font-mono text-xs dir-ltr">{log.timestamp}</td>
                <td className="px-6 py-4 font-medium text-slate-300">{log.user}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs border border-blue-900/50">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">{log.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGeneralTab = () => (
    <div className="space-y-6 animate-in fade-in max-w-2xl">
      <div>
          <h3 className="text-xl font-bold text-white">הגדרות כלליות (General Preferences)</h3>
          <p className="text-slate-400">התאמה אישית של ממשק המשתמש והתראות.</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-8">
        
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-900/30 p-2 rounded-lg text-purple-400">
              <Moon size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">מצב כהה (Dark Mode)</h4>
              <p className="text-xs text-slate-500">החלף בין ערכת נושא בהירה לכהה.</p>
            </div>
          </div>
          <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-green-600 rounded-full cursor-pointer">
            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200"></span>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-900/30 p-2 rounded-lg text-amber-400">
              <Bell size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">התראות במייל</h4>
              <p className="text-xs text-slate-500">קבלת עדכונים על מוצגים דחופים.</p>
            </div>
          </div>
          <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-slate-700 rounded-full cursor-pointer">
            <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200"></span>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Default Unit */}
        <div className="space-y-3">
           <div className="flex items-center gap-2 mb-2">
             <Building size={18} className="text-blue-400" />
             <label className="font-bold text-slate-200">יחידת ברירת מחדל</label>
           </div>
           <select className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-600">
             {Object.values(HandlingBase).map(base => (
               <option key={base} value={base}>{base}</option>
             ))}
           </select>
           <p className="text-xs text-slate-500">יחידה זו תוזן אוטומטית בטפסי הקליטה החדשים.</p>
        </div>

        <div className="pt-4 flex justify-end">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-900/20">
            <Save size={18} />
            שמור הגדרות
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
        <h2 className="text-2xl font-bold text-white mb-4">הגדרות מערכת</h2>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'users' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Users size={18} />
          ניהול משתמשים
        </button>
        <button 
          onClick={() => setActiveTab('lists')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'lists' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <List size={18} />
          ניהול רשימות
        </button>
        <button 
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'audit' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Activity size={18} />
          יומן פעילות
        </button>
        <button 
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'general' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Sliders size={18} />
          הגדרות כלליות
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto py-4">
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'lists' && renderListsTab()}
        {activeTab === 'audit' && renderAuditTab()}
        {activeTab === 'general' && renderGeneralTab()}
      </div>
    </div>
  );
};