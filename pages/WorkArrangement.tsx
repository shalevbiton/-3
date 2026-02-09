
import React, { useEffect, useState } from 'react';
import { Evidence, EvidenceStatus, ExtractionStatus, SystemUser } from '../types';
import { evidenceService } from '../services/evidenceService';
import { RefreshCcw, Search, Filter, Clock, FileText, CheckCircle2, X, Microscope, AlertTriangle, ChevronDown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ExhibitDetailsModal } from '../components/ExhibitDetailsModal';

interface WorkArrangementProps {
  onEdit: (evidence: Evidence) => void;
}

export const WorkArrangement: React.FC<WorkArrangementProps> = ({ onEdit }) => {
  const [items, setItems] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExhibit, setSelectedExhibit] = useState<Evidence | null>(null);

  // --- Deletion State ---
  const [itemToDelete, setItemToDelete] = useState<Evidence | null>(null);

  // --- Completion Protocol State ---
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [pendingExhibit, setPendingExhibit] = useState<Evidence | null>(null);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]); // Store users for dropdown
  const [completionForm, setCompletionForm] = useState<{
    labInvestigator: string;
    extractionStatus: ExtractionStatus | '';
  }>({
    labInvestigator: '',
    extractionStatus: ''
  });

  const fetchItems = async () => {
    setLoading(true);
    const all = await evidenceService.getAll();
    setItems(all);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    
    // Fetch users for the dropdown
    const loadUsers = async () => {
      const users = await evidenceService.getUsers();
      setSystemUsers(users);
    };
    loadUsers();
  }, []);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, id: string) => {
    e.stopPropagation();
    const newStatus = e.target.value as EvidenceStatus;
    const currentItem = items.find(i => i.id === id);

    if (!currentItem) return;

    // INTERCEPTION: If user selects 'FINISHED' (Status 8), stop and open modal
    if (newStatus === EvidenceStatus.FINISHED) {
      setPendingExhibit(currentItem);
      // Try to pre-fill investigator if we had user context
      setCompletionForm({
        labInvestigator: '', 
        extractionStatus: ''
      });
      setIsCompletionModalOpen(true);
      return; 
    }
    
    // Normal Flow (Statuses 1-7)
    // Optimistic UI Update
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));

    // Persist to DB
    await evidenceService.updateStatus(id, newStatus);
  };

  const handleSaveCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingExhibit) return;
    if (!completionForm.labInvestigator || !completionForm.extractionStatus) {
      alert('נא למלא את כל שדות החובה');
      return;
    }

    // Update with extra details
    await evidenceService.updateStatus(
      pendingExhibit.id, 
      EvidenceStatus.FINISHED, 
      undefined, 
      {
        lab_investigator: completionForm.labInvestigator,
        extraction_status: completionForm.extractionStatus as ExtractionStatus
      }
    );

    // Optimistic Update: Remove from this view (since it moved to Handled)
    setItems(prev => prev.filter(item => item.id !== pendingExhibit.id));

    // Cleanup
    setIsCompletionModalOpen(false);
    setPendingExhibit(null);
  };

  // --- Deletion Logic ---
  const initiateDelete = (e: React.MouseEvent, item: Evidence) => {
    e.stopPropagation();
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    await evidenceService.deleteEvidence(itemToDelete.id);
    
    // Refresh UI
    setItemToDelete(null);
    setSelectedExhibit(null); // Close detail modal if open
    fetchItems();
  };

  // --- FILTER LOGIC: PAGE 1 (Active Cases) ---
  const filteredItems = items.filter(item => {
    // 1. Status Filter: Show everything NOT Finished (8) and NOT Archived (9)
    const isActive = item.status !== EvidenceStatus.FINISHED && item.status !== EvidenceStatus.ARCHIVED;
    if (!isActive) return false;

    // 2. Search Filter
    const matchesSearch = 
      item.internal_barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.caseDetails.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: EvidenceStatus) => {
    switch (status) {
      case EvidenceStatus.WAITING: return 'bg-slate-700 text-slate-300 border border-slate-600';
      case EvidenceStatus.EXTRACTION: return 'bg-blue-600 text-white border border-blue-500 shadow-blue-900/50';
      case EvidenceStatus.DUMP_READY: return 'bg-indigo-600 text-white border border-indigo-500 shadow-indigo-900/50';
      case EvidenceStatus.PARSING: return 'bg-cyan-600 text-white border border-cyan-500 shadow-cyan-900/50';
      case EvidenceStatus.REPORT_GEN: return 'bg-sky-600 text-white border border-sky-500 shadow-sky-900/50';
      case EvidenceStatus.REPORT_READY: return 'bg-teal-600 text-white border border-teal-500 shadow-teal-900/50';
      case EvidenceStatus.REVIEW: return 'bg-amber-600 text-white border border-amber-500 shadow-amber-900/50';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white">סידור עבודה (Active Cases)</h2>
          <p className="text-slate-400">ניהול תהליך עבודה שוטף (שלבים 1-7).</p>
        </div>
        <button onClick={fetchItems} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-full transition-colors">
          <RefreshCcw size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative shrink-0">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="סרוק ברקוד, חפש מספר תיק או דגם..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-3 bg-slate-900 border border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-600 outline-none text-white placeholder-slate-600 transition-all"
        />
      </div>

      {/* Table Area */}
      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 flex-1 overflow-hidden flex flex-col min-h-0">
        {loading ? (
          <div className="p-8 text-center text-slate-500">טוען נתונים...</div>
        ) : filteredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-0 animate-in fade-in zoom-in-95 duration-300">
            <div className="inline-flex bg-slate-800 p-6 rounded-full text-slate-600 mb-4 border border-slate-700">
              <Filter size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-300">אין משימות פעילות</h3>
            <p className="text-slate-500 max-w-sm mt-2">
              מוצגים חדשים יופיעו כאן. מוצגים שסיימו טיפול עברו לדף "טופלו / למסירה".
            </p>
          </div>
        ) : (
          <div className="overflow-auto custom-scrollbar">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">ברקוד</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">תיק</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">מוצג</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">תאריך</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-64">
                    סטטוס נוכחי
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-12">
                    {/* Actions Column */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredItems.map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedExhibit(item)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group animate-in fade-in duration-200"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700 dir-ltr inline-block group-hover:border-blue-500/30 transition-colors">
                        {item.internal_barcode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200 text-sm">{item.caseDetails.caseNumber}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                         <FileText size={10} />
                         {item.caseDetails.suspectName}
                      </div>
                    </td>
                     <td className="px-6 py-4 text-sm text-slate-400">
                        <div className="flex flex-col">
                           <span className="text-slate-200 font-medium">{item.type}</span>
                           <span className="text-xs text-slate-500">{item.model}</span>
                           {item.marking && (
                             <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded w-fit mt-1 border border-slate-700/50">
                               {item.marking}
                             </span>
                           )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dir-ltr">
                       <div className="flex items-center gap-2">
                         <Clock size={12} />
                         {format(item.created_at, 'dd/MM/yyyy')}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                         <select
                           value={item.status}
                           onChange={(e) => handleStatusChange(e, item.id)}
                           className={`appearance-none w-full px-3 py-2 rounded-lg text-xs font-bold border-none outline-none cursor-pointer transition-all shadow-sm ${getStatusColor(item.status)}`}
                         >
                           {/* Steps 1-7 (Active) */}
                           <option value={EvidenceStatus.WAITING} className="bg-slate-800 text-slate-300">1. ממתין לטיפול</option>
                           <option value={EvidenceStatus.EXTRACTION} className="bg-slate-800 text-blue-400">2. בהפקה</option>
                           <option value={EvidenceStatus.DUMP_READY} className="bg-slate-800 text-indigo-400">3. Dump בתיקייה</option>
                           <option value={EvidenceStatus.PARSING} className="bg-slate-800 text-cyan-400">4. בפרסור</option>
                           <option value={EvidenceStatus.REPORT_GEN} className="bg-slate-800 text-sky-400">5. בהפקת דו"ח</option>
                           <option value={EvidenceStatus.REPORT_READY} className="bg-slate-800 text-teal-400">6. דו"ח בתיקייה</option>
                           <option value={EvidenceStatus.REVIEW} className="bg-slate-800 text-amber-400">7. בעיון</option>
                           
                           {/* Step 8 (Exit Action triggers Modal) */}
                           <option value={EvidenceStatus.FINISHED} className="bg-slate-900 text-green-400 font-bold border-t border-slate-700">
                             8. סיום טיפול (-> טופלו)
                           </option>
                         </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button 
                         onClick={(e) => initiateDelete(e, item)}
                         className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                         title="מחק מוצג"
                       >
                         <Trash2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exhibit Details Modal */}
      {selectedExhibit && (
        <ExhibitDetailsModal 
          exhibit={selectedExhibit} 
          onClose={() => setSelectedExhibit(null)} 
          onEdit={(exhibit) => {
            setSelectedExhibit(null);
            onEdit(exhibit);
          }}
          onDelete={(item) => setItemToDelete(item)}
        />
      )}

      {/* Completion Protocol Modal */}
      {isCompletionModalOpen && pendingExhibit && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
             
             {/* Modal Header */}
             <div className="bg-slate-800 px-6 py-5 border-b border-slate-700 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="bg-green-900/30 p-2 rounded-lg text-green-400">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">פרוטוקול סיום טיפול</h3>
                    <p className="text-xs text-slate-400">{pendingExhibit.internal_barcode} | {pendingExhibit.type}</p>
                  </div>
               </div>
               <button onClick={() => setIsCompletionModalOpen(false)} className="text-slate-400 hover:text-white">
                 <X size={24} />
               </button>
             </div>

             {/* Modal Form */}
             <form onSubmit={handleSaveCompletion} className="p-8 space-y-8">
               
               <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 flex items-start gap-3">
                  <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-slate-300 leading-relaxed">
                    אנא מלא את פרטי סיום הטיפול. לאחר האישור, המוצג יעבור לסטטוס <b>"סיום טיפול" (8)</b> ויועבר לרשימת "טופלו / למסירה".
                  </p>
               </div>

               <div className="space-y-6">
                 {/* Field 1: Lab Investigator (Dynamic Dropdown) */}
                 <div className="space-y-2 relative">
                    <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Microscope size={16} />
                      חוקר מבצע במעבדה <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        autoFocus
                        value={completionForm.labInvestigator}
                        onChange={(e) => setCompletionForm({...completionForm, labInvestigator: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all appearance-none"
                      >
                        <option value="">בחר חוקר מהרשימה...</option>
                        {systemUsers.map(user => (
                          <option key={user.id} value={`${user.rank} ${user.fullName}`}>
                            {user.rank} {user.fullName} - {user.role}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    {systemUsers.length === 0 && (
                      <p className="text-xs text-amber-400 mt-1">
                        * לא נמצאו משתמשים במערכת. אנא הוסף משתמשים בדף ההגדרות.
                      </p>
                    )}
                 </div>

                 {/* Field 2: Extraction Status */}
                 <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-200">
                      תוצאות הפקה <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                       <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${completionForm.extractionStatus === 'הופק בהצלחה' ? 'border-green-500 bg-green-900/20' : 'border-slate-700 bg-slate-800 hover:bg-slate-750'}`}>
                          <input 
                            type="radio" 
                            name="extractionStatus" 
                            value="הופק בהצלחה"
                            checked={completionForm.extractionStatus === 'הופק בהצלחה'}
                            onChange={(e) => setCompletionForm({...completionForm, extractionStatus: e.target.value as any})}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${completionForm.extractionStatus === 'הופק בהצלחה' ? 'border-green-500' : 'border-slate-500'}`}>
                             {completionForm.extractionStatus === 'הופק בהצלחה' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                          </div>
                          <span className="font-bold text-sm text-slate-200">הופק בהצלחה</span>
                       </label>

                       <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${completionForm.extractionStatus === 'לא התממשק / נכשל' ? 'border-red-500 bg-red-900/20' : 'border-slate-700 bg-slate-800 hover:bg-slate-750'}`}>
                          <input 
                            type="radio" 
                            name="extractionStatus" 
                            value="לא התממשק / נכשל"
                            checked={completionForm.extractionStatus === 'לא התממשק / נכשל'}
                            onChange={(e) => setCompletionForm({...completionForm, extractionStatus: e.target.value as any})}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${completionForm.extractionStatus === 'לא התממשק / נכשל' ? 'border-red-500' : 'border-slate-500'}`}>
                             {completionForm.extractionStatus === 'לא התממשק / נכשל' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                          </div>
                          <span className="font-bold text-sm text-slate-200">נכשל / לא התממשק</span>
                       </label>
                    </div>
                 </div>
               </div>

               <div className="pt-4 flex gap-4">
                 <button 
                   type="button" 
                   onClick={() => setIsCompletionModalOpen(false)}
                   className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3.5 rounded-xl font-medium transition-colors"
                 >
                   ביטול וחזרה
                 </button>
                 <button 
                   type="submit" 
                   className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                 >
                   <CheckCircle2 size={18} />
                   שמור וסיים
                 </button>
               </div>

             </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-red-900/50 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-900/30">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">מחיקת מוצג לצמיתות</h3>
                <p className="text-slate-400 mb-6">
                  האם אתה בטוח שברצונך למחוק את מוצג <span className="text-white font-mono font-bold bg-slate-800 px-1 rounded">{itemToDelete.internal_barcode}</span>?
                  <br/>
                  <span className="text-xs text-red-400 mt-2 block font-bold">פעולה זו היא בלתי הפיכה!</span>
                </p>
                <div className="flex gap-3">
                   <button 
                    onClick={() => setItemToDelete(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg font-medium transition-colors"
                  >
                    ביטול
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold transition-colors shadow-lg shadow-red-900/20"
                  >
                    כן, מחק
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}

    </div>
  );
};
