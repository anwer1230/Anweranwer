import React from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { SystemUpdateStatus } from '../types';

interface UpdateToastProps {
  status: SystemUpdateStatus | null;
  onPerformUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateToast: React.FC<UpdateToastProps> = ({
  status,
  onPerformUpdate,
  onDismiss,
}) => {
  if (!status || !status.has_update) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-sky-600 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-bounce text-xs select-none border border-sky-300/40">
      <div className="flex items-center gap-2 text-slate-950">
        <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
        <div>
          <div>يتوفر تحديث جديد للواجهة والخدمات!</div>
          <div className="text-[10px] font-mono opacity-80">
            Current: {status.current} ➔ Latest: {status.latest}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPerformUpdate}
          className="bg-slate-950 hover:bg-slate-900 text-sky-400 font-bold px-3.5 py-1.5 rounded-xl shadow transition-transform hover:scale-105"
        >
          تحديث الآن
        </button>
        <button
          onClick={onDismiss}
          className="p-1 text-slate-950 hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
