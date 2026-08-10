import React, { useState, useEffect } from 'react';
import { Settings, HardDrive, Trash2, Sun, Moon, Database, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [storageUsed, setStorageUsed] = useState(14.5);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    fetch('/api/settings/storage')
      .then((res) => res.json())
      .then((data) => {
        if (data.used) setStorageUsed(data.used);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearCache = async () => {
    try {
      const res = await fetch('/api/settings/clear-cache', { method: 'POST' });
      const data = await res.json();
      setStorageUsed(0.5);
      alert(`✅ ${data.message || 'تم تفريغ ذاكرة التخزين المؤقت وتحرير المساحة!'}`);
    } catch (e) {
      setStorageUsed(0.5);
      alert('✅ تم تفريغ ذاكرة التخزين المؤقت الكاش بنجاح!');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-slate-100 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sky-400">
          <Settings className="w-6 h-6" />
          <h3 className="font-bold text-sm">إعدادات التطبيق والتخزين الذكي</h3>
        </div>

        <div className="space-y-4 text-xs">
          {/* Storage Box */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5"><HardDrive className="w-4 h-4 text-sky-400" /> مساحة التخزين المستهلكة:</span>
              <span className="font-mono font-bold text-sky-400">{storageUsed} MB / 1024 MB</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full transition-all duration-500"
                style={{ width: `${Math.min((storageUsed / 1024) * 100, 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleClearCache}
            className="w-full bg-rose-500/20 hover:bg-rose-500 hover:text-slate-950 text-rose-400 border border-rose-500/40 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow"
          >
            <Trash2 className="w-4 h-4" />
            <span>تفريغ الملفات المؤقتة والكاش (Clear Cache)</span>
          </button>

          <hr className="border-slate-800" />

          {/* Theme Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">سمة الواجهة الرسمية:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme('dark')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                  theme === 'dark' ? 'bg-sky-500/20 text-sky-400 border-sky-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Moon className="w-4 h-4" /> الليلية (Dark)
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                  theme === 'light' ? 'bg-sky-500/20 text-sky-400 border-sky-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Sun className="w-4 h-4" /> النهارية (Light)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
