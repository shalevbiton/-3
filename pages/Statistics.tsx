
import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, Area, ComposedChart, Line 
} from 'recharts';
import { evidenceService } from '../services/evidenceService';
import { Evidence, EvidenceStatus, ExhibitType, ExtractionStatus, SystemUser } from '../types';
import { RefreshCcw, Calendar, Filter, User, BarChart2, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { format, isWithinInterval, startOfYear, endOfYear, getQuarter, startOfMonth, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

// --- Types & Constants ---

type TimeResolution = 'monthly' | 'quarterly' | 'yearly';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];
const SUCCESS_COLOR = '#10b981'; // Green
const FAIL_COLOR = '#ef4444';    // Red

export const Statistics: React.FC = () => {
  // --- State ---
  const [data, setData] = useState<Evidence[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Filters State ---
  const [dateRange, setDateRange] = useState({
    start: format(startOfYear(new Date()), 'yyyy-MM-dd'),
    end: format(endOfYear(new Date()), 'yyyy-MM-dd')
  });
  const [resolution, setResolution] = useState<TimeResolution>('monthly');
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>('all');

  // --- Load Data ---
  const loadData = async () => {
    setLoading(true);
    const [allEvidence, allUsers] = await Promise.all([
      evidenceService.getAll(),
      evidenceService.getUsers()
    ]);
    setData(allEvidence);
    setUsers(allUsers);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Aggregation Logic ---

  // 1. Filter Data based on Range & Investigator
  const filteredData = useMemo(() => {
    const start = new Date(dateRange.start).getTime();
    const end = new Date(dateRange.end).getTime() + 86400000; // Add 1 day to include end date

    return data.filter(item => {
      // Date Filter
      const inDateRange = item.created_at >= start && item.created_at <= end;
      
      // Investigator Filter
      // Note: lab_investigator might store "Rank Name", so we check inclusion or exact match
      let matchesInvestigator = true;
      if (selectedInvestigator !== 'all') {
        matchesInvestigator = item.lab_investigator === selectedInvestigator;
      }

      return inDateRange && matchesInvestigator;
    });
  }, [data, dateRange, selectedInvestigator]);

  // 2. Calculate KPIs
  const kpiData = useMemo(() => {
    const totalReceived = filteredData.length;
    
    // Items that reached status 8 or 9
    const totalCompleted = filteredData.filter(i => 
      i.status === EvidenceStatus.FINISHED || i.status === EvidenceStatus.ARCHIVED
    ).length;

    // Success Rate Calculation
    // Only consider items that have an extraction_status set
    const itemsWithExtraction = filteredData.filter(i => i.extraction_status);
    const successItems = itemsWithExtraction.filter(i => i.extraction_status === 'הופק בהצלחה').length;
    const successRate = itemsWithExtraction.length > 0 
      ? Math.round((successItems / itemsWithExtraction.length) * 100) 
      : 0;

    return { totalReceived, totalCompleted, successRate };
  }, [filteredData]);

  // 3. Prepare Chart Data (Time Based)
  const timeChartData = useMemo(() => {
    // Helper to generate key based on resolution
    const getTimeKey = (timestamp: number) => {
      const date = new Date(timestamp);
      if (resolution === 'monthly') return format(date, 'MM/yyyy');
      if (resolution === 'quarterly') return `Q${getQuarter(date)}/${format(date, 'yyyy')}`;
      if (resolution === 'yearly') return format(date, 'yyyy');
      return '';
    };

    // Grouping
    const groups: Record<string, { name: string, received: number, completed: number, success: number, fail: number }> = {};

    filteredData.forEach(item => {
      const key = getTimeKey(item.created_at);
      if (!groups[key]) {
        groups[key] = { name: key, received: 0, completed: 0, success: 0, fail: 0 };
      }

      // Count Received (Intake)
      groups[key].received += 1;

      // Count Completed
      if (item.status === EvidenceStatus.FINISHED || item.status === EvidenceStatus.ARCHIVED) {
        groups[key].completed += 1;
        
        // Count Success/Fail (only if completed)
        if (item.extraction_status === 'הופק בהצלחה') groups[key].success += 1;
        if (item.extraction_status === 'לא התממשק / נכשל') groups[key].fail += 1;
      }
    });

    // Sort by date (naive string sort works for yyyy, but for MM/yyyy we need logic)
    // Simple sort for now based on string keys which roughly aligns chronologically for ISO, 
    // but for 'MM/yyyy' we rely on the insertion order or mapped sorting.
    return Object.values(groups).sort((a, b) => {
      // Custom sort logic could go here
      return a.name.localeCompare(b.name); 
    });
  }, [filteredData, resolution]);

  // 4. Prepare Pie Chart Data (Types)
  const typeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // --- Render ---

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">לוח בקרה וסטטיסטיקה (Analytics)</h2>
          <p className="text-slate-400">ניתוח ביצועי מעבדה, מגמות ותפוקות.</p>
        </div>
        <button onClick={loadData} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-full transition-colors">
          <RefreshCcw size={20} />
        </button>
      </div>

      {/* 1. FILTER BAR */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-6 items-end md:items-center justify-between shadow-sm">
        
        {/* Date Range */}
        <div className="flex gap-4 items-center w-full md:w-auto">
          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
               <Calendar size={12} /> מתאריך
             </label>
             <input 
               type="date" 
               value={dateRange.start}
               onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
               className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
             />
          </div>
          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-400">עד תאריך</label>
             <input 
               type="date" 
               value={dateRange.end}
               onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
               className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
             />
          </div>
        </div>

        {/* Resolution Toggle */}
        <div className="space-y-1 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
             <BarChart2 size={12} /> רזולוציית זמן
          </label>
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
             {['monthly', 'quarterly', 'yearly'].map((res) => (
               <button
                 key={res}
                 onClick={() => setResolution(res as TimeResolution)}
                 className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                   resolution === res 
                   ? 'bg-blue-600 text-white shadow' 
                   : 'text-slate-400 hover:text-slate-200'
                 }`}
               >
                 {res === 'monthly' ? 'חודשי' : res === 'quarterly' ? 'רבעוני' : 'שנתי'}
               </button>
             ))}
          </div>
        </div>

        {/* Investigator Filter */}
        <div className="space-y-1 w-full md:w-64">
           <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
             <User size={12} /> סינון לפי חוקר
           </label>
           <select
             value={selectedInvestigator}
             onChange={(e) => setSelectedInvestigator(e.target.value)}
             className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
           >
             <option value="all">כלל החוקרים (All)</option>
             {users.map(u => (
               <option key={u.id} value={`${u.rank} ${u.fullName}`}>
                 {u.rank} {u.fullName}
               </option>
             ))}
           </select>
        </div>

      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Intake */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Filter size={64} className="text-blue-500" />
           </div>
           <h3 className="text-slate-400 text-sm font-medium mb-1">סה"כ מוצגים שנקלטו</h3>
           <div className="text-4xl font-bold text-white">{kpiData.totalReceived}</div>
           <div className="text-xs text-blue-400 mt-2 flex items-center gap-1">
             <span className="w-2 h-2 rounded-full bg-blue-500"></span>
             בטווח התאריכים הנבחר
           </div>
        </div>

        {/* Total Completed */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <CheckSquareIcon size={64} className="text-purple-500" />
           </div>
           <h3 className="text-slate-400 text-sm font-medium mb-1">סה"כ מוצגים שטופלו</h3>
           <div className="text-4xl font-bold text-white">{kpiData.totalCompleted}</div>
           <div className="text-xs text-purple-400 mt-2 flex items-center gap-1">
             <span className="w-2 h-2 rounded-full bg-purple-500"></span>
             סטטוס סיום או ארכיון
           </div>
        </div>

        {/* Success Rate */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <TrendingUp size={64} className={kpiData.successRate >= 80 ? "text-green-500" : "text-amber-500"} />
           </div>
           <h3 className="text-slate-400 text-sm font-medium mb-1">אחוז הצלחה בהפקה</h3>
           <div className={`text-4xl font-bold ${kpiData.successRate >= 80 ? "text-green-400" : "text-amber-400"}`}>
             {kpiData.successRate}%
           </div>
           <div className="text-xs text-slate-500 mt-2">
             מתוך מוצגים עם דיווח תוצאה
           </div>
        </div>

      </div>

      {/* 3. CHART A: PRODUCTION TRENDS */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm min-h-[400px] flex flex-col">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             <BarChart2 size={20} className="text-blue-400" />
             מגמת הפקות (Production Trends)
           </h3>
        </div>
        
        <div className="flex-1 w-full h-[300px]">
           <ResponsiveContainer width="100%" height="100%">
             <ComposedChart data={timeChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickMargin={10} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Area type="monotone" dataKey="received" name="נקלטו" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReceived)" />
                <Line type="monotone" dataKey="completed" name="טופלו" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
             </ComposedChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* CHARTS GRID (B & C) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART B: DISTRIBUTION BY TYPE */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm min-h-[400px] flex flex-col">
           <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
             <PieIcon size={20} className="text-purple-400" />
             פילוח לפי סוג מוצג (Device Types)
           </h3>
           <div className="flex-1 w-full h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* CHART C: SUCCESS VS FAILURE */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm min-h-[400px] flex flex-col">
           <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
             <TrendingUp size={20} className="text-green-400" />
             סטטוס הפקה (Success vs Failure)
           </h3>
           <div className="flex-1 w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                  <Legend />
                  <Bar dataKey="success" name="הופק בהצלחה" stackId="a" fill={SUCCESS_COLOR} radius={[0, 0, 4, 4]} />
                  <Bar dataKey="fail" name="נכשל / לא התממשק" stackId="a" fill={FAIL_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

      </div>

    </div>
  );
};

// Helper Icon for KPI
const CheckSquareIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 11 3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
