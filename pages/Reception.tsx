import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, FileText, Smartphone, Database, AlertCircle, Users, Lock } from 'lucide-react';
import { evidenceService } from '../services/evidenceService';
import { Evidence, ExhibitType, HandlingBase, Priority, CaseDetails } from '../types';
import { PatternLock } from '../components/PatternLock';

interface ReceptionProps {
  initialEvidence?: Evidence;
}

export const Reception: React.FC<ReceptionProps> = ({ initialEvidence }) => {
  const isEditing = !!initialEvidence;

  // --- Global State ---
  const [caseDetails, setCaseDetails] = useState<CaseDetails>({
    deliveredBy: '',
    receivedBy: '', // This will now be populated via dropdown
    suspectName: '',
    suspectID: '',
    handlingBase: HandlingBase.POLICE,
    caseNumber: '',
    investigatorName: '',
    orderNumber: '',
    restrictions: '',
    offenses: ''
  });

  const [exhibitType, setExhibitType] = useState<ExhibitType>(ExhibitType.PHONE);
  const [commonDetails, setCommonDetails] = useState({
    model: '',
    marking: '',
    date: new Date().toISOString().split('T')[0],
    priority: Priority.NORMAL
  });

  // Dynamic state for all possible fields
  const [dynamicFields, setDynamicFields] = useState<any>({
    case_color: '',
    device_color: '',
    memory_card_type: 'ללא', // Default
    memory_size: '',
    password_type: 'ללא', // Default
    password_value: '',
    sim_type: 'SIM',
    is_sim_glued: false,
    removable_battery: false,
    turns_on: false,
    capacity: '',
    memory_card: '',
    has_sim: false
  });

  const [lastCreated, setLastCreated] = useState<Evidence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // New State for System Users
  const [systemUsers, setSystemUsers] = useState<string[]>([]);

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      const users = await evidenceService.getAuthorizedUsers();
      setSystemUsers(users);
    };
    loadUsers();
  }, []);

  // Initialize form when editing
  useEffect(() => {
    if (initialEvidence) {
      setCaseDetails(initialEvidence.caseDetails);
      setExhibitType(initialEvidence.type);
      setCommonDetails({
        model: initialEvidence.model,
        marking: initialEvidence.marking,
        date: new Date(initialEvidence.date).toISOString().split('T')[0],
        priority: initialEvidence.priority
      });
      // Merge dynamic fields from the evidence object
      const { caseDetails: _c, type: _t, model: _m, marking: _mk, date: _d, priority: _p, id: _i, internal_barcode: _ib, status: _st, created_at: _ca, updated_at: _ua, ...rest } = initialEvidence as any;
      setDynamicFields(prev => ({ ...prev, ...rest }));
    }
  }, [initialEvidence]);

  // --- Handlers ---
  const handleCaseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setCaseDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error on change
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleCommonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCommonDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleDynamicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setDynamicFields((prev: any) => ({ ...prev, [e.target.name]: value }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };
  
  const handlePatternChange = (sequence: string) => {
    setDynamicFields((prev: any) => ({ ...prev, password_value: sequence }));
    if (errors.password_value) {
      setErrors(prev => ({ ...prev, password_value: '' }));
    }
  }

  // --- Strict Validation Logic ---
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const reqMsg = 'שדה זה הינו חובה';

    // Step 1: Chain of Custody
    if (!caseDetails.deliveredBy.trim()) newErrors.deliveredBy = reqMsg;
    if (!caseDetails.receivedBy.trim()) newErrors.receivedBy = reqMsg;

    // Step 2: Case Details
    if (!caseDetails.suspectName.trim()) newErrors.suspectName = reqMsg;
    if (!caseDetails.suspectID.trim()) newErrors.suspectID = reqMsg;
    if (!caseDetails.caseNumber.trim()) newErrors.caseNumber = reqMsg;
    if (!caseDetails.investigatorName.trim()) newErrors.investigatorName = reqMsg;
    if (!caseDetails.orderNumber.trim()) newErrors.orderNumber = reqMsg;
    if (!caseDetails.restrictions.trim()) newErrors.restrictions = 'שדה חובה (רשום "ללא" אם אין)';
    if (!caseDetails.offenses.trim()) newErrors.offenses = reqMsg;
    // HandlingBase is an Enum, always has a value, but good to check emptiness
    if (!caseDetails.handlingBase) newErrors.handlingBase = reqMsg;

    // Step 3: Exhibit General
    if (!commonDetails.model.trim()) newErrors.model = reqMsg;
    if (!commonDetails.marking.trim()) newErrors.marking = reqMsg;
    if (!commonDetails.date.trim()) newErrors.date = reqMsg;
    if (!commonDetails.priority) newErrors.priority = reqMsg;

    // Step 4: Dynamic Fields (Strict Conditional)
    switch (exhibitType) {
      case ExhibitType.PHONE:
      case ExhibitType.TABLET:
        if (!dynamicFields.case_color.trim()) newErrors.case_color = reqMsg;
        if (!dynamicFields.device_color.trim()) newErrors.device_color = reqMsg;
        
        // Memory Card Logic
        if (dynamicFields.memory_card_type === 'Micro SD') {
          if (!dynamicFields.memory_size.trim()) newErrors.memory_size = reqMsg;
        }

        // Password Logic
        if (dynamicFields.password_type !== 'ללא') {
          if (!dynamicFields.password_value.trim()) newErrors.password_value = reqMsg;
        }
        break;

      case ExhibitType.COMPUTER:
        if (!dynamicFields.device_color.trim()) newErrors.device_color = reqMsg;
        if (dynamicFields.password_type !== 'ללא') {
           if (!dynamicFields.password_value.trim()) {
             newErrors.password_value = reqMsg;
           }
        }
        break;

      case ExhibitType.MEMORY_CARD:
      case ExhibitType.DISK:
      case ExhibitType.HARD_DRIVE:
      case ExhibitType.USB_DRIVE:
        if (!dynamicFields.device_color.trim()) newErrors.device_color = reqMsg;
        if (!dynamicFields.capacity.trim()) newErrors.capacity = reqMsg;
        break;

      case ExhibitType.CAMERA:
      case ExhibitType.DRONE:
        if (!dynamicFields.device_color.trim()) newErrors.device_color = reqMsg;
        if (!dynamicFields.memory_card.trim()) newErrors.memory_card = reqMsg; 
        if (!dynamicFields.capacity.trim()) newErrors.capacity = reqMsg;
        break;

      case ExhibitType.SIM_CARD:
         if (!dynamicFields.device_color.trim()) newErrors.device_color = reqMsg;
         break;
    }

    setErrors(newErrors);
    
    // Smooth scroll to first error
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.getElementsByName(firstErrorKey)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Construct the final object based on type
      const basePayload: any = {
        caseDetails,
        type: exhibitType,
        ...commonDetails,
        date: new Date(commonDetails.date).getTime()
      };

      // Merge dynamic fields relevant to the selected type
      const payload = { ...basePayload, ...dynamicFields };

      if (isEditing && initialEvidence && initialEvidence.id) {
        // --- EDIT MODE (UPDATE) ---
        await evidenceService.updateEvidence(initialEvidence.id, payload);
        alert('השינויים נשמרו בהצלחה');
        // We do not reset form in edit mode, user might want to continue editing or navigate away
      } else {
        // --- CREATE MODE (NEW) ---
        const newEvidence = await evidenceService.addEvidence(payload);
        setLastCreated(newEvidence);
        
        // Reset only exhibit specific fields if not editing
        setCommonDetails({
          model: '',
          marking: '',
          date: new Date().toISOString().split('T')[0],
          priority: Priority.NORMAL
        });
        // Reset critical dynamic fields
        setDynamicFields((prev: any) => ({
          ...prev,
          password_value: '',
          password_type: 'ללא',
          case_color: '',
          device_color: '',
          capacity: '',
          memory_size: '',
          memory_card: ''
        }));
      }

      setErrors({});

    } catch (error) {
      console.error(error);
      alert('שגיאה בשמירת המוצג');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Password Logic Helper ---
  const renderPasswordField = () => {
    const { password_type, password_value } = dynamicFields;

    if (password_type === 'טקסט') {
      return (
         <InputField 
           label="סיסמא" 
           name="password_value" 
           value={password_value} 
           onChange={handleDynamicChange} 
           placeholder="הזן את סיסמת המכשיר..."
           error={errors.password_value}
           required
         />
      );
    }

    if (password_type === 'תבנית') {
      return (
        <div className={`col-span-1 md:col-span-2 bg-slate-800/50 p-4 rounded-xl border ${errors.password_value ? 'border-red-500' : 'border-blue-900/30'} grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-in fade-in`}>
           <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">סיסמא (רצף תבנית) <span className="text-red-500">*</span></label>
              <input 
                 type="text" 
                 name="password_value" 
                 value={password_value} 
                 readOnly 
                 className={`w-full px-3 py-2 border rounded-lg bg-slate-900 text-slate-400 font-mono tracking-widest cursor-not-allowed text-center ${errors.password_value ? 'border-red-500 bg-red-900/10' : 'border-slate-600'}`} 
              />
              {errors.password_value && <p className="text-xs text-red-400 mt-1">{errors.password_value}</p>}
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                שרטט את התבנית ע"ג הלוח. המערכת תתרגם את השרטוט לרצף מספרים (1-9).
              </p>
           </div>
           <div className="flex justify-center">
             <PatternLock onChange={handlePatternChange} value={password_value} />
           </div>
        </div>
      );
    }

    return null; // 'ללא'
  };

  // --- STEP 4: Dynamic Attributes ---
  const renderConditionalFields = () => {
    switch (exhibitType) {
      case ExhibitType.PHONE:
      case ExhibitType.TABLET:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            <InputField label="צבע מגן" name="case_color" value={dynamicFields.case_color} onChange={handleDynamicChange} error={errors.case_color} required />
            <InputField label="צבע מכשיר" name="device_color" value={dynamicFields.device_color} onChange={handleDynamicChange} error={errors.device_color} required />
            
            {/* Memory Card Logic */}
            <SelectField 
              label="סוג כרטיס זיכרון" 
              name="memory_card_type" 
              value={dynamicFields.memory_card_type} 
              onChange={handleDynamicChange} 
              options={['Micro SD', 'ללא']} 
            />
            {dynamicFields.memory_card_type === 'Micro SD' && (
              <InputField label="גודל זיכרון" name="memory_size" value={dynamicFields.memory_size} onChange={handleDynamicChange} error={errors.memory_size} required />
            )}

            {/* Sim Logic */}
            <SelectField 
              label="סוג סים" 
              name="sim_type" 
              value={dynamicFields.sim_type} 
              onChange={handleDynamicChange} 
              options={['SIM', 'eSIM', 'ללא']} 
            />
            
            {dynamicFields.sim_type === 'SIM' && (
               <div className="md:col-span-2">
                 <CheckboxField label="האם הסים הודבק לגב המכשיר?" name="is_sim_glued" checked={dynamicFields.is_sim_glued} onChange={handleDynamicChange} />
               </div>
            )}

            {exhibitType === ExhibitType.PHONE && (
              <CheckboxField label="סוללה נשלפת?" name="removable_battery" checked={dynamicFields.removable_battery} onChange={handleDynamicChange} />
            )}
            
            <CheckboxField label="מכשיר נדלק?" name="turns_on" checked={dynamicFields.turns_on} onChange={handleDynamicChange} />

            {/* Password Block */}
            <div className="md:col-span-2 border-t border-slate-700 pt-4 mt-2">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <SelectField label="סוג סיסמא" name="password_type" value={dynamicFields.password_type} onChange={handleDynamicChange} options={['טקסט', 'תבנית', 'ללא']} />
                 {dynamicFields.password_type !== 'ללא' && dynamicFields.password_type !== 'תבנית' && renderPasswordField()}
               </div>
               {dynamicFields.password_type === 'תבנית' && (
                 <div className="mt-4">{renderPasswordField()}</div>
               )}
            </div>
          </div>
        );

      case ExhibitType.COMPUTER:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            <InputField label="צבע מכשיר" name="device_color" value={dynamicFields.device_color} onChange={handleDynamicChange} error={errors.device_color} required />
            <div className="hidden md:block"></div> {/* Spacer */}

             <div className="md:col-span-2 border-t border-slate-700 pt-4 mt-2">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <SelectField label="סוג סיסמא" name="password_type" value={dynamicFields.password_type} onChange={handleDynamicChange} options={['טקסט', 'תבנית']} />
                 {dynamicFields.password_type !== 'ללא' && dynamicFields.password_type !== 'תבנית' && renderPasswordField()}
               </div>
               {dynamicFields.password_type === 'תבנית' && (
                 <div className="mt-4">{renderPasswordField()}</div>
               )}
            </div>
          </div>
        );

      case ExhibitType.MEMORY_CARD:
      case ExhibitType.DISK:
      case ExhibitType.HARD_DRIVE:
      case ExhibitType.USB_DRIVE:
        return (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
             <InputField label="צבע מכשיר" name="device_color" value={dynamicFields.device_color} onChange={handleDynamicChange} error={errors.device_color} required />
             <InputField label="נפח" name="capacity" value={dynamicFields.capacity} onChange={handleDynamicChange} error={errors.capacity} required />
           </div>
        );

      case ExhibitType.SIM_CARD:
         return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
             <InputField label="צבע מכשיר" name="device_color" value={dynamicFields.device_color} onChange={handleDynamicChange} error={errors.device_color} required />
            </div>
         );

      case ExhibitType.CAMERA:
      case ExhibitType.DRONE:
         return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <InputField label="צבע המכשיר" name="device_color" value={dynamicFields.device_color} onChange={handleDynamicChange} error={errors.device_color} required />
              <InputField label="כרטיס זיכרון" name="memory_card" value={dynamicFields.memory_card} onChange={handleDynamicChange} error={errors.memory_card} required />
              <InputField label="נפח" name="capacity" value={dynamicFields.capacity} onChange={handleDynamicChange} error={errors.capacity} required />
            </div>
         );
      
      default:
        return <div className="text-slate-500 italic p-4">נא לבחור סוג מוצג כדי לראות מאפיינים נוספים</div>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? 'עריכת מוצג (Edit Evidence)' : 'טופס קליטת מוצג (Forensic Intake)'}
          </h2>
          <p className="text-slate-400">
            {isEditing ? `עריכת פרטים עבור ${initialEvidence.internal_barcode}` : 'הזנת פרטי תיק ומוצגים למערכת.'} 
            {!isEditing && <span className="text-red-400 font-bold"> * כל השדות חובה</span>}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: CHAIN OF CUSTODY */}
        <div className={`bg-slate-900 rounded-xl shadow-sm border ${isEditing ? 'border-amber-900/50' : 'border-slate-800'} overflow-hidden relative`}>
           {isEditing && (
             <div className="absolute top-0 left-0 p-2 bg-amber-500/10 rounded-br-xl border-b border-r border-amber-500/30 text-amber-500 flex items-center gap-2 text-xs font-bold">
               <Lock size={12} />
               נעול לעריכה
             </div>
           )}
           <div className="bg-blue-900/20 px-6 py-3 border-b border-blue-900/30 flex items-center gap-2">
             <Users size={18} className="text-blue-400" />
             <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider">שרשרת ראיות (Chain of Custody)</h3>
           </div>
           <div className={`p-6 grid grid-cols-1 md:grid-cols-2 gap-8 ${isEditing ? 'opacity-75 grayscale-[0.5] pointer-events-none select-none' : ''}`}>
              <InputField label="שם המוסר" name="deliveredBy" value={caseDetails.deliveredBy} onChange={handleCaseChange} error={errors.deliveredBy} required={!isEditing} />
              
              {/* Special Select Input for Received By */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">שם הקולט <span className="text-red-500">*</span></label>
                <select 
                  name="receivedBy" 
                  value={caseDetails.receivedBy} 
                  onChange={handleCaseChange} 
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-800 text-white outline-none focus:ring-2 focus:ring-blue-600 ${errors.receivedBy ? 'border-red-500' : 'border-slate-700'}`}
                >
                  <option value="">בחר משתמש...</option>
                  {systemUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
                {errors.receivedBy && <p className="text-xs text-red-400 animate-in slide-in-from-top-1">{errors.receivedBy}</p>}
              </div>
           </div>
        </div>

        {/* STEP 2: CASE DETAILS */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
          <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-800 flex items-center gap-2">
            <FileText size={18} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">פרטי תיק (Case Details)</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField label="שם מעורב" name="suspectName" value={caseDetails.suspectName} onChange={handleCaseChange} error={errors.suspectName} required />
            <InputField label="מ.א / ת.ז" name="suspectID" value={caseDetails.suspectID} onChange={handleCaseChange} error={errors.suspectID} required />
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">בסיס מטפל <span className="text-red-500">*</span></label>
              <select 
                name="handlingBase" 
                value={caseDetails.handlingBase} 
                onChange={handleCaseChange} 
                className={`w-full px-3 py-2 border rounded-lg bg-slate-800 text-white text-right outline-none focus:ring-2 focus:ring-blue-600 ${errors.handlingBase ? 'border-red-500' : 'border-slate-700'}`}
              >
                {Object.values(HandlingBase).map(base => (
                  <option key={base} value={base}>{base}</option>
                ))}
              </select>
              {errors.handlingBase && <p className="text-xs text-red-400">{errors.handlingBase}</p>}
            </div>

            <InputField label="מספר תיק" name="caseNumber" value={caseDetails.caseNumber} onChange={handleCaseChange} error={errors.caseNumber} required placeholder="פ״א / פל״א" />
            <InputField label="חוקר מטפל" name="investigatorName" value={caseDetails.investigatorName} onChange={handleCaseChange} error={errors.investigatorName} required />
            <InputField label="מספר צו" name="orderNumber" value={caseDetails.orderNumber} onChange={handleCaseChange} error={errors.orderNumber} required />
            
            <div className="col-span-1 md:col-span-3">
              <InputField label="הגבלות" name="restrictions" value={caseDetails.restrictions} onChange={handleCaseChange} error={errors.restrictions} required placeholder="אם אין, רשום: ללא" />
            </div>

            <div className="col-span-1 md:col-span-3">
               <InputField label="עבירות" name="offenses" value={caseDetails.offenses} onChange={handleCaseChange} error={errors.offenses} required />
            </div>
          </div>
        </div>

        {/* STEP 3: EXHIBIT GENERAL DETAILS */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
           <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-800 flex items-center gap-2">
            <Smartphone size={18} className="text-purple-400" />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">פרטי מוצג (General Details)</h3>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
               <div className="space-y-1 lg:col-span-1">
                <label className="text-sm font-bold text-slate-300">סוג מוצג <span className="text-red-500">*</span></label>
                <select 
                  value={exhibitType} 
                  onChange={(e) => setExhibitType(e.target.value as ExhibitType)}
                  className="w-full px-3 py-2 border border-blue-900/50 bg-blue-900/20 rounded-lg text-blue-200 font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(ExhibitType).map(t => <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>)}
                </select>
              </div>

              <InputField label="דגם" name="model" value={commonDetails.model} onChange={handleCommonChange} error={errors.model} required />
              <InputField label="סימון" name="marking" value={commonDetails.marking} onChange={handleCommonChange} error={errors.marking} required placeholder="לדוגמא: א-1" />
              
              <div className="space-y-1">
                 <label className="text-sm font-medium text-slate-400">תאריך סימון <span className="text-red-500">*</span></label>
                 <input 
                   type="date" 
                   name="date" 
                   value={commonDetails.date} 
                   onChange={handleCommonChange} 
                   className={`w-full px-3 py-2 border bg-slate-800 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-600 ${errors.date ? 'border-red-500' : 'border-slate-700'}`} 
                 />
                 {errors.date && <p className="text-xs text-red-400">{errors.date}</p>}
              </div>
              
               <div className="space-y-1">
                 <label className="text-sm font-medium text-slate-400">עדיפות <span className="text-red-500">*</span></label>
                 <select name="priority" value={commonDetails.priority} onChange={handleCommonChange} className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white outline-none focus:ring-2 focus:ring-blue-600">
                   <option value={Priority.NORMAL}>{Priority.NORMAL}</option>
                   <option value={Priority.URGENT}>{Priority.URGENT}</option>
                 </select>
              </div>
          </div>
        </div>

        {/* STEP 4: DYNAMIC ATTRIBUTES */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
           <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-800 flex items-center gap-2">
            <Database size={18} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">מאפיינים משתנים (Dynamic Attributes)</h3>
          </div>
          <div className="p-6">
            {renderConditionalFields()}
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <button
            type="submit"
            disabled={isLoading}
            className={`flex items-center gap-3 ${isEditing ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'} text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all border border-blue-400/20 text-lg`}
          >
            <Save size={20} />
            {isLoading ? 'שומר...' : (isEditing ? 'שמור שינויים' : 'שמור וקלוט מוצג')}
          </button>
        </div>

      </form>

      {lastCreated && (
        <div className="fixed bottom-8 left-8 bg-green-900 text-green-100 p-6 rounded-xl shadow-2xl animate-in slide-in-from-bottom-10 flex items-center gap-4 z-50 border border-green-700">
          <div className="bg-green-800/50 p-2 rounded-full">
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 className="font-bold text-lg">המוצג נקלט בהצלחה!</h4>
            <p className="opacity-80">ברקוד מערכת: <span className="font-mono font-bold bg-black/30 px-2 rounded text-white">{lastCreated.internal_barcode}</span></p>
          </div>
          <button onClick={() => setLastCreated(null)} className="mr-4 hover:bg-white/10 p-2 rounded-full">
            <RotateCcw size={18} />
          </button>
        </div>
      )}

    </div>
  );
};

// --- Reusable UI Components ---

const InputField = ({ label, name, value, onChange, required = false, placeholder = '', error = '' }: any) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-400">{label} {required && <span className="text-red-500">*</span>}</label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border bg-slate-800 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder-slate-600 focus:bg-slate-800 ${error ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-700'}`}
    />
    {error && <p className="text-xs text-red-400 animate-in slide-in-from-top-1">{error}</p>}
  </div>
);

const SelectField = ({ label, name, value, onChange, options }: any) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-400">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white outline-none focus:ring-2 focus:ring-blue-600"
    >
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const CheckboxField = ({ label, name, checked, onChange }: any) => (
  <label className="flex items-center gap-3 p-3 border border-slate-700 rounded-lg bg-slate-800 hover:bg-slate-750 cursor-pointer transition-colors w-full h-full">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-slate-900 border-slate-600"
    />
    <span className="text-sm font-medium text-slate-300">{label}</span>
  </label>
);
