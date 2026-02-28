import React, { useState } from 'react';
import { X, Scan, CheckCircle2, FileImage, Loader2 } from 'lucide-react';

interface ScannerModalProps {
    documentFolderPath: string;
    onClose: () => void;
    onComplete: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ documentFolderPath, onClose, onComplete }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scannedFiles, setScannedFiles] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleScan = async () => {
        setIsScanning(true);
        setError(null);
        try {
            if (window.electronAPI && window.electronAPI.scanDocument) {
                const result = await window.electronAPI.scanDocument(documentFolderPath);
                if (result.success && result.filePath) {
                    setScannedFiles(prev => [...prev, result.filePath!]);
                } else {
                    setError(result.error || 'שגיאה בסריקה');
                }
            } else {
                // Fallback for non-electron testing
                setTimeout(() => {
                    setScannedFiles(prev => [...prev, `${documentFolderPath}\\Mock_Scan_${Date.now()}.jpg`]);
                    setIsScanning(false);
                }, 1500);
                return;
            }
        } catch (err: any) {
            setError(err.message || 'שגיאה כללית בסריקה');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                            <Scan size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">סריקת מסמכים (Document Scanning)</h3>
                            <p className="text-xs text-slate-400 dir-ltr text-right mt-0.5">{documentFolderPath}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full hover:bg-slate-700" disabled={isScanning}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 flex flex-col lg:flex-row gap-6 bg-slate-900">
                    {/* Left / Preview Area */}
                    <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 flex flex-col overflow-hidden min-h-[350px] shadow-inner">
                        <div className="bg-slate-800/80 py-3 px-5 border-b border-slate-800/50 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-300">מסמכים שנסרקו</span>
                            <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">{scannedFiles.length}</span>
                        </div>
                        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                            {scannedFiles.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700/50">
                                        <FileImage size={24} className="text-slate-600" />
                                    </div>
                                    <p className="font-medium text-slate-400">טרם נסרקו מסמכים לכונן.</p>
                                    <p className="text-sm mt-1">לחץ על ׳סרוק דף׳ כדי להתחיל בתהליך הסריקה.</p>
                                </div>
                            ) : (
                                scannedFiles.map((file, idx) => (
                                    <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="bg-slate-900 p-2 rounded-lg">
                                            <FileImage className="text-blue-400" size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-200 truncate dir-ltr text-right">
                                                {file.split('\\').pop()}
                                            </p>
                                            <p className="text-[10px] text-green-400 mt-0.5">✔ נשמר בהצלחה בתיקייה</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right / Actions Area */}
                    <div className="w-full lg:w-56 flex flex-col gap-4 shrink-0 justify-center pb-2">
                        {error && (
                            <div className="bg-red-900/20 border border-red-900/50 text-red-400 text-xs p-4 rounded-xl text-center shadow-inner">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleScan}
                            disabled={isScanning}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 disabled:border text-white py-5 rounded-xl font-bold flex flex-col items-center justify-center gap-3 transition-colors shadow-lg shadow-blue-900/20"
                        >
                            {isScanning ? <Loader2 size={28} className="animate-spin text-blue-300" /> : <Scan size={28} />}
                            <span className="text-lg">{isScanning ? 'סורק...' : 'סרוק דף'}</span>
                        </button>

                        <div className="flex-1 hidden lg:block"></div>

                        <button
                            onClick={onComplete}
                            disabled={isScanning}
                            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 disabled:border text-white py-5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                        >
                            <CheckCircle2 size={20} />
                            <span className="text-lg">סיום קליטה</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
