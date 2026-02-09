
import React, { useEffect, useState } from 'react';
import { Evidence, EvidenceStatus } from '../types';
import { evidenceService } from '../services/evidenceService';
import { Archive as ArchiveIcon, RefreshCcw, Search, History, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ExhibitDetailsModal } from '../components/ExhibitDetailsModal';

export const Archive: React.FC = () => {
  const [items, setItems] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExhibit, setSelectedExhibit] = useState<Evidence | null>(null);

  // --- Deletion State ---
  const [itemToDelete, setItemToDelete] = useState<Evidence | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const all = await evidenceService.getAll();
    
    // FILTER LOGIC: PAGE 4
    // Show ONLY items where status IS EQUAL TO 'נמסר / ארכיון' (Status 9)
    setItems(all.filter(i => i.status === EvidenceStatus.ARCHIVED));
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

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

  const filteredItems = items.filter(item => 
    item.internal_barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.caseDetails.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.caseDetails.suspectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">ארכיון / היסטוריה (Released History)</h2>
          <p className="text-slate-400">היסטוריית מוצגים שנמסרו או אוחסנו בארכיון הפיזי (שלב 9).</p>
        </div>
        <button onClick={fetchItems} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-full transition-colors">
          <RefreshCcw size={20} />
        </button>
      </div>

      <div className="relative">
         <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="חפש בהיסטוריה..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-3 bg-slate-900 border border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 outline-none text-white placeholder-slate-600"
        />
      </div>

      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-8 text-center text-slate-500">טוען היסטוריה...</div>
        ) : filteredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
            <div className="inline-flex bg-slate-800 p-6 rounded-full text-slate-600 mb-4 border border-slate-700">
              <History size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-300">הארכיון ריק</h3>
            <p className="text-slate-500">
              עדיין לא בוצעו מסירות או העברות לארכיון.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-800 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">ברקוד</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">תיק</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">פרטי מוצג</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">פרטי מסירה (למי נמסר)</th>
                  <th className="px-6 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedExhibit(item)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 w-40">
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700 dir-ltr inline-block">
                        {item.internal_barcode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200 text-sm">{item.caseDetails.caseNumber}</div>
                      <div className="text-xs text-slate-500">{item.caseDetails.suspectName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-300">{item.type}</div>
                      <div className="text-xs text-slate-500">{item.model}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-purple-200">
                      <div className="flex items-start gap-2">
                        <ArchiveIcon size={14} className="mt-0.5 opacity-70" />
                        <span>
                          {item.releaseDetails?.receivedBy || item.location || 'לא צוינו פרטי מסירה'}
                        </span>
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

      {/* Details Modal */}
      {selectedExhibit && (
        <ExhibitDetailsModal 
          exhibit={selectedExhibit} 
          onClose={() => setSelectedExhibit(null)} 
          onDelete={(item) => setItemToDelete(item)}
        />
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
