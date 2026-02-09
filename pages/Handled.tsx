
import React, { useEffect, useState } from 'react';
import { Evidence, EvidenceStatus, SystemUser } from '../types';
import { evidenceService } from '../services/evidenceService';
import { CheckSquare, RefreshCcw, Search, Clock, Eye, PackageCheck, UserCheck, X, ChevronDown, User, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ExhibitDetailsModal } from '../components/ExhibitDetailsModal';

export const Handled: React.FC = () => {
  const [items, setItems] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data for Dropdown
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  // Modal State
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Evidence | null>(null);
  
  // Details Modal State
  const [detailsItem, setDetailsItem] = useState<Evidence | null>(null);

  // Deletion State
  const [itemToDelete, setItemToDelete] = useState<Evidence | null>(null);

  // Release Form State
  const [receiverName, setReceiverName] = useState('');
  const [releasingOfficer, setReleasingOfficer] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    const all = await evidenceService.getAll();
    // Filter: Show ONLY Status 8 (Finished)
    setItems(all.filter(i => i.status === EvidenceStatus.FINISHED));
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

  const openReleaseModal = (item: Evidence) => {
    setSelectedItem(item);
    setReceiverName('');
    setReleasingOfficer('');
    setIsReleaseModalOpen(true);
  };

  const closeReleaseModal = () => {
    setIsReleaseModalOpen(false);
    setSelectedItem(null);
  };

  const handleReleaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !receiverName || !releasingOfficer) return;

    // Backward compatibility string
    const releaseInfoString = `נמסר ל: ${receiverName} | שוחרר ע"י: ${releasingOfficer} | בתאריך ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;

    // Update Status to 9 (ARCHIVED) with structured data
    await evidenceService.updateStatus(
      selectedItem.id, 
      EvidenceStatus.ARCHIVED, 
      releaseInfoString,
      {
        releaseDetails: {
          releasedBy: releasingOfficer,
          receivedBy: receiverName
        }
      }
    );
    
    closeReleaseModal();
    await fetchItems(); // Refresh list to remove the item
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
    setDetailsItem(null); // Close detail modal if open
    fetchItems();
  };

  const filteredItems = items.filter(item => 
    item.internal_barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.caseDetails.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.caseDetails.suspectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white">טופלו / למסירה (Handled)</h2>
          <p className="text-slate-400">מוצגים שסיימו טיפול (שלב 8) ונמצאים פיזית במעבדה בהמתנה למסירה.</p>
        </div>
        <button onClick={fetchItems} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-full transition-colors">
          <RefreshCcw size={20} />
        </button>
      </div>

       <div className="relative shrink-0">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="חפש לפי ברקוד, תיק, או שם חשוד..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-3 bg-slate-900 border border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none text-white placeholder-slate-600"
        />
      </div>

      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 flex-1 overflow-hidden flex flex-col min-h-0">
        {loading ? (
          <div className="p-12 text-center text-slate-500">טוען מוצגים למסירה...</div>
        ) : filteredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
             <div className="bg-slate-800 p-4 rounded-full mb-4">
               <PackageCheck size={32} className="text-green-500" />
             </div>
             <h3 className="text-lg font-medium text-slate-300">הכל נקי!</h3>
             <p className="text-slate-500">אין מוצגים הממתינים למסירה כרגע.</p>
          </div>
        ) : (
          <div className="overflow-auto custom-scrollbar">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10 shadow-sm">
                <tr>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">ברקוד</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">תיק</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">מוצג</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">הסתיים ב</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">פעולות</th>
                   <th className="px-6 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredItems.map(item => (
                   <tr 
                     key={item.id} 
                     onClick={() => setDetailsItem(item)}
                     className="hover:bg-slate-800/50 transition-colors cursor-pointer group animate-in fade-in duration-200"
                   >
                     <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-900/50 dir-ltr inline-block">
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
                     <td className="px-6 py-4">
                        <div className="text-sm text-slate-300">{item.type}</div>
                        <div className="text-xs text-slate-500">{item.model}</div>
                     </td>
                     <td className="px-6 py-4 text-sm text-slate-400 dir-ltr">
                        <div className="flex items-center gap-2">
                           <Clock size={12} />
                           {format(item.updated_at, 'dd/MM/yyyy HH:mm')}
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openReleaseModal(item);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-green-600/20 hover:text-green-400 text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-700 hover:border-green-500/50"
                        >
                          <UserCheck size={14} />
                          שחרר
                        </button>
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

      {/* Details Modal (Read Only Report) */}
      {detailsItem && (
        <ExhibitDetailsModal 
          exhibit={detailsItem}
          onClose={() => setDetailsItem(null)}
          onRelease={(item) => {
            setDetailsItem(null);
            openReleaseModal(item);
          }}
          onDelete={(item) => setItemToDelete(item)}
        />
      )}

      {/* Release Modal */}
      {isReleaseModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <div>
                 <h3 className="text-lg font-bold text-white">שחרור מוצג (Release Item)</h3>
                 <p className="text-xs text-slate-400">{selectedItem.internal_barcode}</p>
              </div>
              <button onClick={closeReleaseModal} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReleaseSubmit} className="p-6 space-y-5">
               <div className="bg-green-900/10 p-3 rounded-lg border border-green-900/30 text-green-300 text-sm flex gap-3 items-start">
                  <PackageCheck className="shrink-0 mt-0.5" size={16} />
                  <p>פעולה זו תעביר את המוצג לסטטוס <b>"נמסר / ארכיון" (9)</b> והוא יוסר מרשימת המוצגים הפעילים במעבדה.</p>
               </div>

               {/* Field 1: Recipient Name */}
               <div className="space-y-1">
                 <label className="text-sm font-medium text-slate-300">למי נמסר? (שם מלא) <span className="text-red-500">*</span></label>
                 <input 
                   type="text" 
                   required
                   autoFocus
                   value={receiverName}
                   onChange={e => setReceiverName(e.target.value)}
                   className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-green-500 outline-none placeholder-slate-600"
                   placeholder="לדוגמא: דני דין (אזרח/עו״ד)"
                 />
               </div>

               {/* Field 2: Releasing Officer (Dynamic Dropdown) */}
               <div className="space-y-1 relative">
                 <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                   <User size={14} />
                   מי החזיר (חוקר משחרר) <span className="text-red-500">*</span>
                 </label>
                 <div className="relative">
                    <select 
                      required
                      value={releasingOfficer}
                      onChange={e => setReleasingOfficer(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-green-500 outline-none appearance-none"
                    >
                      <option value="">בחר חוקר מהרשימה...</option>
                      {systemUsers.map(user => (
                        <option key={user.id} value={`${user.rank} ${user.fullName}`}>
                          {user.rank} {user.fullName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                 </div>
                 {systemUsers.length === 0 && (
                   <p className="text-[10px] text-amber-400 mt-1">
                     * רשימת המשתמשים ריקה. נא להוסיף משתמשים בהגדרות.
                   </p>
                 )}
               </div>

               <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={closeReleaseModal}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors"
                  >
                    ביטול
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-green-900/20"
                  >
                    אשר ומסור
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
