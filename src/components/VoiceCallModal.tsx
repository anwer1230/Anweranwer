import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Lock, Volume2, History, X } from 'lucide-react';

interface CallRecord {
  id: string;
  peer_name: string;
  direction: 'incoming' | 'outgoing';
  status: 'ended' | 'missed' | 'active';
  duration: number;
  date: string;
}

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'call' | 'history'>('call');
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  const [callHistory] = useState<CallRecord[]>([
    { id: '1', peer_name: 'أبو ملك (المشرف الأكاديمي)', direction: 'outgoing', status: 'ended', duration: 142, date: 'اليوم 11:20' },
    { id: '2', peer_name: 'د. خالد عبد العزيز', direction: 'incoming', status: 'ended', duration: 58, date: 'أمس 18:40' },
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (inCall) {
      interval = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setCallSeconds(0);
    }
    return () => clearInterval(interval);
  }, [inCall]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-slate-100 max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 text-emerald-400">
          <Phone className="w-6 h-6" />
          <h3 className="font-bold text-sm">المكالمات الصوتية المشفرة (P2P Encrypted)</h3>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl mb-4 border border-slate-800">
          <button
            onClick={() => setActiveTab('call')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'call' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            📞 مكالمة مباشرة
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'history' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            📜 سجل المكالمات
          </button>
        </div>

        {activeTab === 'call' ? (
          <div className="flex-1 flex flex-col items-center justify-between py-4">
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Peer"
                  className={`w-24 h-24 rounded-full object-cover border-4 transition-all ${
                    inCall ? 'border-emerald-500 scale-105 shadow-emerald-500/20 shadow-2xl animate-pulse' : 'border-slate-700'
                  }`}
                />
                <div className="absolute top-0 right-0 p-1.5 bg-emerald-500 text-slate-950 rounded-full shadow" title="تشفير تام">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>

              <h4 className="font-bold text-base text-slate-100">أبو ملك (المشرف الأكاديمي)</h4>
              <p className="text-xs text-emerald-400 font-mono mt-0.5">
                {inCall ? `جارٍ الاتصال المشفر... ${formatTimer(callSeconds)}` : 'جاهز للاتصال المباشر'}
              </p>
            </div>

            <div className="w-full space-y-3 mt-6">
              {inCall ? (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-4 rounded-full shadow-lg transition-transform hover:scale-110 ${
                      isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>

                  <button
                    onClick={() => setInCall(false)}
                    className="p-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-2xl transition-transform hover:scale-110 animate-pulse"
                  >
                    <PhoneOff className="w-7 h-7" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setInCall(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <Phone className="w-5 h-5" />
                  <span>بدء مكالمة صوتية مشفرة الآن</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {callHistory.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-100">{c.peer_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {c.direction === 'outgoing' ? '↗️ صادرة' : '↙️ واردة'} • {c.date}
                  </div>
                </div>
                <span className="font-mono text-emerald-400 text-[11px] font-bold">
                  {Math.floor(c.duration / 60)} د {c.duration % 60} ث
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
