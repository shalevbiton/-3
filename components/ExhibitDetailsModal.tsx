
import React from 'react';
import { 
  X, 
  Printer, 
  Edit, 
  Smartphone, 
  Laptop, 
  HardDrive, 
  Disc, 
  Camera, 
  Cpu, 
  Tablet, 
  FileText,
  Lock,
  BatteryCharging,
  Zap,
  User,
  Microscope,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Calendar,
  Clock,
  ArrowDownCircle,
  Archive,
  Trash2
} from 'lucide-react';
import { Evidence, ExhibitType, Priority, EvidenceStatus, ExtractionStatus } from '../types';
import { PatternLock } from './PatternLock';
import { format, differenceInDays } from 'date-fns';

interface ExhibitDetailsModalProps {
  exhibit: Evidence;
  onClose: () => void;
  onEdit?: (exhibit: Evidence) => void; 
  onRelease?: (exhibit: Evidence) => void;
  onDelete?: (exhibit: Evidence) => void; // New prop for deletion
}

export const ExhibitDetailsModal: React.FC<ExhibitDetailsModalProps> = ({ exhibit, onClose, onEdit, onRelease, onDelete }) => {
  
  const getIcon = (type: ExhibitType) => {
    switch (type) {
      case ExhibitType.PHONE: return Smartphone;
      case ExhibitType.TABLET: return Tablet;
      case ExhibitType.COMPUTER: return Laptop;
      case ExhibitType.MEMORY_CARD:
      case ExhibitType.SIM_CARD: return Cpu;
      case ExhibitType.DISK: return Disc;
      case ExhibitType.HARD_DRIVE:
      case ExhibitType.USB_DRIVE: return HardDrive;
      case ExhibitType.CAMERA: return Camera;
      case ExhibitType.DRONE: return Cpu;
      default: return FileText;
    }
  };

  const Icon = getIcon(exhibit.type);
  const isUrgent = exhibit.priority === Priority.URGENT;
  const hasRestrictions = exhibit.caseDetails.restrictions && exhibit.caseDetails.restrictions !== 'ללא';
  const isArchived = exhibit.status === EvidenceStatus.ARCHIVED;

  // --- FEATURE 1: PRINT LABEL ---
  const handlePrintLabel = () => {
    const printWindow = window.open('', '', 'width=600,height=400');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
        <head>
          <title>הדפסת מדבקה - ${exhibit.internal_barcode}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 20px; margin: 0; }
            .label-container {
              width: 10cm;
              height: 6cm;
              border: 2px solid black;
              padding: 15px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid black;
              padding-bottom: 5px;
              margin-bottom: 5px;
            }
            .title { font-weight: bold; font-size: 16px; }
            .priority { font-weight: bold; border: 1px solid black; padding: 2px 5px; font-size: 12px; }
            .row { font-size: 14px; margin-bottom: 4px; }
            .label-key { font-weight: bold; }
            .barcode-area {
              margin-top: 10px;
              text-align: center;
              border-top: 1px dashed #ccc;
              padding-top: 5px;
            }
            .barcode-mock {
              font-family: 'Courier New', monospace;
              font-size: 24px;
              letter-spacing: 2px;
              font-weight: 900;
              display: inline-block;
              transform: scaleY(1.5);
            }
            @media print {
              body { padding: 0; }
              .label-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="header">
              <span class="title">משטרת ישראל - מוצג</span>
              ${exhibit.priority === Priority.URGENT ? '<span class="priority">דחוף!</span>' : ''}
            </div>
            
            <div class="row"><span class="label-key">מספר תיק:</span> ${exhibit.caseDetails.caseNumber}</div>
            <div class="row"><span class="label-key">מזהה מוצג:</span> ${exhibit.internal_barcode}</div>
            <div class="row"><span class="label-key">תיאור:</span> ${exhibit.type} - ${exhibit.model}</div>
            <div class="row"><span class="label-key">חוקר מטפל:</span> ${exhibit.caseDetails.investigatorName}</div>
            <div class="row"><span class="label-key">תאריך:</span> ${format(exhibit.created_at, 'dd/MM/yyyy')}</div>

            <div class="barcode-area">
               <!-- Simulating a visual barcode with text for offline/no-lib scenario -->
               <div class="barcode-mock">||| |||| || |||</div>
               <div style="font-size: 12px; font-family: monospace;">${exhibit.internal_barcode}</div>
            </div>
          </div>
          <script>
            window.print();
            // Optional: window.close();
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Helper to render specific technical fields based on type
  const renderTechSpecs = () => {
    const commonFields = (
      <>
        <DetailItem label="צבע מכשיר" value={(exhibit as any).device_color} />
        <DetailItem label="סימון" value={exhibit.marking} />
      </>
    );

    switch (exhibit.type) {
      case ExhibitType.PHONE:
      case ExhibitType.TABLET:
        const mobile = exhibit as any;
        return (
          <>
            {commonFields}
            <DetailItem label="צבע מגן" value={mobile.case_color} />
            <DetailItem label="נדלק?" value={mobile.turns_on ? 'כן' : 'לא'} icon={Zap} />
            {exhibit.type === ExhibitType.PHONE && (
              <DetailItem label="סוללה נשלפת?" value={mobile.removable_battery ? 'כן' : 'לא'} icon={BatteryCharging} />
            )}
            <div className="col-span-full h-px bg-slate-700/50 my-2" />
            <DetailItem label="סוג סים" value={mobile.sim_type} />
            {mobile.sim_type === 'SIM' && (
               <DetailItem label="סים מודבק?" value={mobile.is_sim_glued ? 'כן' : 'לא'} highlight={mobile.is_sim_glued} />
            )}
            <DetailItem label="כרטיס זיכרון" value={mobile.memory_card_type} />
            {mobile.memory_card_type === 'Micro SD' && (
              <DetailItem label="נפח זיכרון" value={mobile.memory_size} />
            )}
          </>
        );
      
      case ExhibitType.COMPUTER:
        return (
          <>
            {commonFields}
          </>
        );

      case ExhibitType.HARD_DRIVE:
      case ExhibitType.USB_DRIVE:
      case ExhibitType.MEMORY_CARD:
         return (
          <>
            {commonFields}
            <DetailItem label="נפח" value={(exhibit as any).capacity} />
          </>
         );
      
      default:
        return (
           <>
             {commonFields}
             {(exhibit as any).capacity && <DetailItem label="נפח" value={(exhibit as any).capacity} />}
           </>
        );
    }
  };

  const renderSecurity = () => {
    // Only relevant for devices with passwords
    if (!['טלפון', 'טאבלט', 'מחשב'].includes(exhibit.type)) return null;

    const device = exhibit as any;
    
    return (
      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-red-400" />
          <h4 className="font-bold text-slate-300">אבטחה וסיסמה</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <DetailItem label="סוג נעילה" value={device.password_type} />
           
           {device.password_type === 'טקסט' && (
             <DetailItem label="סיסמה" value={device.password_value} mono />
           )}
           
           {device.password_type === 'תבנית' && (
             <div className="md:col-span-2 flex flex-col items-center sm:items-start bg-slate-800 p-4 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-400 mb-2">רצף תבנית:</span>
                <span className="font-mono text-lg tracking-widest text-white mb-4 dir-ltr">
                  {device.password_value?.split('').join(' -> ')}
                </span>
                <div className="pointer-events-none opacity-90 scale-75 origin-top-left">
                  <PatternLock value={device.password_value || ''} onChange={() => {}} />
                </div>
             </div>
           )}
        </div>
      </div>
    );
  };

  const renderLabResults = () => {
    if (!exhibit.lab_investigator && !exhibit.extraction_status) return null;

    const isSuccess = exhibit.extraction_status === 'הופק בהצלחה';

    return (
      <div className="bg-cyan-900/10 p-4 rounded-lg border border-cyan-900/30 mt-4">
         <div className="flex items-center gap-2 mb-4 text-cyan-400">
            <Microscope size={18} />
            <h3 className="font-bold text-sm uppercase tracking-wider">תוצאות מעבדה (Lab Results)</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DetailItem 
              label="חוקר מבצע" 
              value={exhibit.lab_investigator} 
              highlight 
              highlightColor="text-white font-semibold"
            />
            <div className="flex flex-col gap-1">
               <span className="text-xs font-medium text-slate-500">סטטוס הפקה</span>
               <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit ${isSuccess ? 'bg-green-900/20 border-green-900/50 text-green-400' : 'bg-red-900/20 border-red-900/50 text-red-400'}`}>
                 {isSuccess ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                 <span className="font-bold text-sm">{exhibit.extraction_status}</span>
               </div>
            </div>
            {/* Using updated_at as completion date for Status 8 */}
            <DetailItem 
              label="תאריך סיום" 
              value={format(exhibit.updated_at, 'dd/MM/yyyy HH:mm')} 
              dir="ltr" 
            />
         </div>
      </div>
    );
  };

  const renderTimeline = () => {
    // Only show for Archived items with release time
    if (!isArchived || !exhibit.released_at) return null;

    const daysInLab = differenceInDays(exhibit.released_at, exhibit.created_at);

    return (
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
         <div className="flex items-center gap-2 mb-4 text-slate-300">
            <Clock size={18} />
            <h3 className="font-bold text-sm uppercase tracking-wider">ציר זמן (Timeline)</h3>
         </div>
         <div className="flex items-center justify-between relative">
             {/* Line */}
             <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-700 -z-10" />

             {/* Intake Point */}
             <div className="flex flex-col items-center bg-slate-800 px-4">
                <span className="text-xs text-slate-500 mb-1">התקבל בתאריך</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-900/20 text-blue-300 rounded-full border border-blue-900/50 text-sm font-mono font-bold dir-ltr">
                  <ArrowDownCircle size={14} />
                  {format(exhibit.created_at, 'dd/MM/yyyy HH:mm')}
                </div>
             </div>
             
             {/* Duration Badge */}
             <div className="bg-slate-700 px-2 py-1 rounded text-[10px] text-slate-300">
               {daysInLab === 0 ? 'באותו היום' : `${daysInLab} ימים`}
             </div>

             {/* Release Point */}
             <div className="flex flex-col items-center bg-slate-800 px-4">
                <span className="text-xs text-slate-500 mb-1">שוחרר בתאריך</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-900/20 text-purple-300 rounded-full border border-purple-900/50 text-sm font-mono font-bold dir-ltr">
                  <Archive size={14} />
                  {format(exhibit.released_at, 'dd/MM/yyyy HH:mm')}
                </div>
             </div>
         </div>
      </div>
    );
  };

  const renderReleaseInfo = () => {
    if (!isArchived) return null;

    const releasedBy = exhibit.releaseDetails?.releasedBy || '-';
    const receivedBy = exhibit.releaseDetails?.receivedBy || exhibit.location || '-';

    return (
      <section className="mt-6 border-t border-slate-700/50 pt-6">
        <div className="flex items-center gap-2 mb-3 text-purple-400">
          <LogOut size={18} />
          <h3 className="font-bold text-sm uppercase tracking-wider">פרטי שחרור (Release Info)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-900/10 p-4 rounded-lg border border-purple-900/30">
          <DetailItem 
            label="מי שחרר (חוקר משחרר)" 
            value={releasedBy} 
            icon={User}
          />
          <DetailItem 
            label="למי נמסר (מקבל)" 
            value={receivedBy} 
            highlight
            highlightColor="text-white font-bold"
          />
        </div>
      </section>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="bg-slate-800 p-6 flex items-start justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
              <Icon size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">{exhibit.model}</h2>
                {exhibit.status === EvidenceStatus.FINISHED && (
                   <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                     סיום טיפול
                   </span>
                )}
                {isArchived && (
                   <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-600 text-slate-200 border border-slate-500">
                     נמסר / ארכיון
                   </span>
                )}
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${isUrgent ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                  {exhibit.priority}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                 <span className="bg-slate-700/50 px-1.5 rounded text-xs font-mono">{exhibit.internal_barcode}</span>
                 <span>|</span>
                 <span>{exhibit.type}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* BODY - SCROLLABLE */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
          
          {/* SECTION B: TIMELINE (NEW) */}
          {renderTimeline()}
          
          <div className="space-y-8">
            {/* SECTION 1: CHAIN OF CUSTODY */}
            <section>
              <div className="flex items-center gap-2 mb-3 text-blue-400">
                <User size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">שרשרת ראיות</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <DetailItem label="שם המוסר" value={exhibit.caseDetails.deliveredBy} />
                <DetailItem label="שם הקולט" value={exhibit.caseDetails.receivedBy} />
                <DetailItem label="תאריך קליטה" value={format(exhibit.created_at, 'dd/MM/yyyy HH:mm')} dir="ltr" />
              </div>
            </section>

            {/* SECTION 2: CASE INFO */}
            <section>
              <div className="flex items-center gap-2 mb-3 text-purple-400">
                <FileText size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">פרטי תיק</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <DetailItem label="שם מעורב" value={exhibit.caseDetails.suspectName} />
                <DetailItem label="ת.ז / מ.א" value={exhibit.caseDetails.suspectID} />
                <DetailItem label="מספר תיק" value={exhibit.caseDetails.caseNumber} />
                <DetailItem label="בסיס מטפל" value={exhibit.caseDetails.handlingBase} />
                
                <div className="col-span-full h-px bg-slate-700/50" />
                
                <DetailItem label="חוקר מטפל" value={exhibit.caseDetails.investigatorName} />
                <DetailItem label="מספר צו" value={exhibit.caseDetails.orderNumber} />
                <div className="lg:col-span-2">
                  <DetailItem 
                    label="הגבלות" 
                    value={exhibit.caseDetails.restrictions} 
                    highlight={hasRestrictions} 
                    highlightColor="text-red-400 font-bold"
                  />
                </div>
                <div className="col-span-full">
                    <DetailItem label="עבירות" value={exhibit.caseDetails.offenses} />
                </div>
              </div>
            </section>

            {/* SECTION 3: TECH SPECS */}
            <section>
              <div className="flex items-center gap-2 mb-3 text-emerald-400">
                <Cpu size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">מפרט טכני</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <DetailItem label="סוג מוצג" value={exhibit.type} />
                {renderTechSpecs()}
              </div>
            </section>

            {/* SECTION 3.5: LAB RESULTS (NEW) */}
            {renderLabResults()}

            {/* SECTION 4: SECURITY */}
            {renderSecurity()}

            {/* SECTION 5: RELEASE INFO (NEW) */}
            {renderReleaseInfo()}
          </div>

        </div>

        {/* FOOTER - ACTIONS */}
        <div className="bg-slate-800 p-4 border-t border-slate-700 flex justify-between items-center shrink-0 gap-4">
          
          {/* Left Side - Destructive Actions */}
          <div>
            {onDelete && (
              <button 
                onClick={() => onDelete(exhibit)}
                className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-900/20 rounded-lg font-medium transition-colors"
              >
                <Trash2 size={18} />
                מחק מוצג
              </button>
            )}
          </div>

          {/* Right Side - Primary Actions */}
          <div className="flex gap-3">
             <button 
               onClick={handlePrintLabel}
               className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
             >
               <Printer size={18} />
               הדפס
             </button>
             
             {onEdit && (
               <button 
                 onClick={() => onEdit(exhibit)}
                 className="flex items-center gap-2 px-4 py-2 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg font-medium transition-colors"
               >
                 <Edit size={18} />
                 ערוך
               </button>
             )}
             
             <button 
              onClick={onClose} 
              className="px-6 py-2 bg-slate-200 hover:bg-white text-slate-900 rounded-lg font-bold transition-colors"
            >
              סגור
            </button>
            {onRelease && (
              <button 
                onClick={() => onRelease(exhibit)}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-green-900/20"
              >
                <LogOut size={18} />
                שחרר מוצג
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Component for Field Display ---
const DetailItem = ({ label, value, icon: Icon, highlight = false, highlightColor = 'text-amber-400', mono = false, dir }: any) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
      {Icon && <Icon size={12} />}
      {label}
    </span>
    <span className={`text-sm text-slate-200 break-words ${highlight ? highlightColor : ''} ${mono ? 'font-mono bg-slate-900/50 px-2 py-1 rounded inline-block w-fit' : ''}`} dir={dir}>
      {value || '-'}
    </span>
  </div>
);
