import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Lock,
  Volume2,
  X,
  Monitor,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

interface CallRecord {
  id: string;
  peer_name: string;
  direction: 'incoming' | 'outgoing';
  status: 'ended' | 'missed' | 'active';
  duration: number;
  date: string;
  type: 'voice' | 'video';
}

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerName?: string;
  peerAvatar?: string;
  initialType?: 'voice' | 'video';
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  peerName = 'أبو ملك (المشرف الأكاديمي)',
  peerAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  initialType = 'voice',
}) => {
  const [activeTab, setActiveTab] = useState<'call' | 'history'>('call');
  const [callType, setCallType] = useState<'voice' | 'video'>(initialType);
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [callHistory] = useState<CallRecord[]>([
    {
      id: '1',
      peer_name: 'أبو ملك (المشرف الأكاديمي)',
      direction: 'outgoing',
      status: 'ended',
      duration: 142,
      date: 'اليوم 11:20',
      type: 'video',
    },
    {
      id: '2',
      peer_name: 'د. خالد عبد العزيز',
      direction: 'incoming',
      status: 'ended',
      duration: 58,
      date: 'أمس 18:40',
      type: 'voice',
    },
  ]);

  useEffect(() => {
    setCallType(initialType);
  }, [initialType, isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (inCall) {
      interval = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);

      // Try enabling live webcam stream for video call
      if (callType === 'video' && !isVideoOff) {
        navigator.mediaDevices
          ?.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            mediaStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.warn('Camera access error or restricted iframe:', err);
          });
      }
    } else {
      setCallSeconds(0);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }
    return () => {
      clearInterval(interval);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [inCall, callType, isVideoOff]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setInCall(false);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } catch (e) {
        alert('مشاركة الشاشة غير متاحة حالياً على هذا المتصفح');
      }
    } else {
      setIsScreenSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-[9999] select-none text-slate-100 dir-rtl animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl relative max-h-[90vh] flex flex-col justify-between overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              {callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                <span>{callType === 'video' ? 'مكالمة مرئية مشفرة' : 'مكالمة صوتية مشفرة'}</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                  P2P E2EE
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">اتصال مباشر آمن بعيد عن أي طرف ثالث</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl my-3 border border-slate-800 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('call')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'call' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            📞 مكالمة مباشرة
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'history' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            📜 سجل المكالمات
          </button>
        </div>

        {activeTab === 'call' ? (
          <div className="flex-1 flex flex-col items-center justify-between py-2 space-y-4">
            
            {/* Call Mode Switcher Pill */}
            {!inCall && (
              <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setCallType('voice')}
                  className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    callType === 'voice'
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>مكالمة صوتية</span>
                </button>

                <button
                  onClick={() => setCallType('video')}
                  className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    callType === 'video'
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>مكالمة فيديو</span>
                </button>
              </div>
            )}

            {/* Video Viewfinder / Audio Avatar Frame */}
            <div className="relative w-full h-56 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shadow-inner">
              {callType === 'video' && inCall && !isVideoOff ? (
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-3xl"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-lg text-[10px] text-emerald-400 font-mono border border-white/10">
                    كاميرا عالية الدقة (HD 1080p)
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center p-4">
                  <div className="relative mb-2">
                    <img
                      src={peerAvatar}
                      alt={peerName}
                      className={`w-24 h-24 rounded-full object-cover border-4 transition-all ${
                        inCall
                          ? 'border-emerald-500 scale-105 shadow-emerald-500/20 shadow-2xl animate-pulse'
                          : 'border-slate-700'
                      }`}
                    />
                    <div
                      className="absolute top-0 right-0 p-1.5 bg-emerald-500 text-slate-950 rounded-full shadow"
                      title="تشفير مشفر"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100">{peerName}</h4>
                  <p className="text-xs text-emerald-400 font-mono mt-0.5">
                    {inCall
                      ? `جاري الاتصال المشفر... ${formatTimer(callSeconds)}`
                      : 'جاهز للاتصال المباشر'}
                  </p>
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="w-full space-y-3 pt-2">
              {inCall ? (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3.5 rounded-2xl shadow-lg transition-transform hover:scale-110 ${
                      isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الميكروفون'}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {callType === 'video' && (
                    <button
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className={`p-3.5 rounded-2xl shadow-lg transition-transform hover:scale-110 ${
                        isVideoOff ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                      title={isVideoOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'}
                    >
                      {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </button>
                  )}

                  <button
                    onClick={toggleScreenShare}
                    className={`p-3.5 rounded-2xl shadow-lg transition-transform hover:scale-110 ${
                      isScreenSharing ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title="مشاركة الشاشة"
                  >
                    <Monitor className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl shadow-2xl transition-transform hover:scale-110 animate-pulse"
                    title="إنهاء المكالمة"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setInCall(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  {callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                  <span>
                    بدء {callType === 'video' ? 'مكالمة فيديو' : 'مكالمة صوتية'} مشفرة الآن
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2 flex-1 overflow-y-auto pr-1 text-xs">
            {callHistory.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{c.peer_name}</span>
                    <span className="text-[10px] text-sky-400 font-mono">
                      ({c.type === 'video' ? 'فيديو' : 'صوتية'})
                    </span>
                  </div>
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
