import React, { useState } from 'react';
import {
  X,
  User,
  Bookmark,
  BrainCircuit,
  GraduationCap,
  Compass,
  Image as ImageIcon,
  Phone,
  Shield,
  GitBranch,
  Activity,
  Settings,
  FolderPlus,
  Archive,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronDown,
  Send,
  Layers,
  UserPlus,
  Bot,
  RotateCcw,
  FileEdit,
  Download,
  Star,
  Rocket,
  Clock,
  Users,
  Search,
  Repeat,
  Brain,
  Contact,
  PhoneCall,
  UserCheck,
  Plus,
  Moon,
  Sun,
  LogOut,
  Zap,
} from 'lucide-react';
import { UserProfile } from '../types';
import { AutomationTab } from './AutomationAIModal';
import { ChatAvatar } from './ChatAvatar';

interface TelegramDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onOpenProfile: () => void;
  onOpenInstallPwa?: () => void;
  onOpenAutomationAI?: (tab?: AutomationTab) => void;
  onOpenAcademic?: () => void;
  onOpenLinkFinder?: () => void;
  onOpenMediaGallery?: () => void;
  onOpenVoiceCall?: () => void;
  onOpenPrivacy?: () => void;
  onOpenSync?: () => void;
  onOpenMTProtoSync?: () => void;
  onOpenMonitor?: () => void;
  onOpenSettings?: () => void;
  onNewFolder: () => void;
  onOpenArchive: () => void;
  onCheckUpdate: () => void;
  onOpenLogin: () => void;
}

export const TelegramDrawer: React.FC<TelegramDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  onOpenProfile,
  onOpenInstallPwa,
  onOpenAutomationAI,
  onOpenAcademic,
  onOpenLinkFinder,
  onOpenMediaGallery,
  onOpenVoiceCall,
  onOpenPrivacy,
  onOpenSync,
  onOpenMTProtoSync,
  onOpenMonitor,
  onOpenSettings,
  onNewFolder,
  onOpenArchive,
  onCheckUpdate,
  onOpenLogin,
}) => {
  const [isFeaturedOpen, setIsFeaturedOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [accountsCount] = useState(2); // Accounts count badge

  if (!isOpen) return null;

  const handleAction = (action?: () => void) => {
    onClose();
    if (action) action();
  };

  const handleOpenTab = (tab: AutomationTab) => {
    onClose();
    if (onOpenAutomationAI) onOpenAutomationAI(tab);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    if (window.confirm('هل أنت تأكيد من تسجيل الخروج من حساب تليجرام؟')) {
      handleAction(onOpenLogin);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel (Telegram Official Web Style) */}
      <div className="relative w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl z-10 overflow-y-auto dir-rtl">
        
        {/* 1. Drawer Header (User Profile Card) */}
        <div className="p-5 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800/80 relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
            title="إغلاق القائمة (✕)"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            onClick={() => handleAction(onOpenProfile)}
            className="cursor-pointer group flex flex-col space-y-3"
            title="فتح الملف الشخصي"
          >
            {/* Avatar Circle */}
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-sky-400/40 shadow-lg group-hover:scale-105 transition-transform">
              {profile.photo ? (
                <img src={profile.photo} alt={profile.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{(profile.first_name || profile.name || 'T')[0]}</span>
              )}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            <div>
              <div className="font-bold text-base text-slate-100 flex items-center gap-1.5">
                <span>{profile.first_name} {profile.last_name || profile.name}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xs text-sky-400 font-mono mt-0.5">
                @{profile.username || 'user_telegram'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono dir-ltr text-right">
                {profile.phone || '+966 50 123 4567'}
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Menu List */}
        <div className="p-2 space-y-1 flex-1 text-xs font-semibold">

          {/* Saved Messages Quick Item */}
          <button
            onClick={() => handleAction(onOpenLinkFinder)}
            className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 flex items-center justify-between transition-colors group"
            title="فتح محادثة الرسائل المحفوظة والروابط"
          >
            <div className="flex items-center gap-3">
              <Bookmark className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>الرسائل والروابط المحفوظة</span>
            </div>
            <span className="text-[10px] text-slate-500">خاص</span>
          </button>

          <hr className="border-slate-800/80 my-1" />

          {/* 2. Collapsible Featured Functions Section (⭐ الوظائف المميزة) */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden transition-all my-1">
            <button
              onClick={() => setIsFeaturedOpen(!isFeaturedOpen)}
              className="w-full p-2.5 flex items-center justify-between text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                <span className="font-bold text-slate-100">الوظائف المميزة والأتمتة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                  9 أدوات
                </span>
                {isFeaturedOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {isFeaturedOpen && (
              <div className="p-1 space-y-0.5 bg-slate-950/40 border-t border-amber-500/10 text-slate-200">
                <button
                  onClick={() => handleOpenTab('send_monitor')}
                  className="w-full p-2 rounded-xl hover:bg-slate-800/80 hover:text-amber-300 flex items-center justify-between transition-colors group"
                  title="/send_monitor - إدارة عمليات الإرسال الجماعي والمراقبة"
                >
                  <div className="flex items-center gap-2.5">
                    <Rocket className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>1. المراقبة والإرسال (/send_monitor)</span>
                  </div>
                </button>

                <button
                  onClick={() => handleOpenTab('batches')}
                  className="w-full p-2 rounded-xl hover:bg-slate-800/80 hover:text-sky-300 flex items-center justify-between transition-colors group"
                  title="/dashboard?tab=batches - عرض سجل الدفعات السابقة"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                    <span>2. رسائلي الدفعات (/batches)</span>
                  </div>
                </button>

                <button
                  onClick={() => handleOpenTab('autojoin')}
                  className="w-full p-2 rounded-xl hover:bg-slate-800/80 hover:text-emerald-300 flex items-center justify-between transition-colors group"
                  title="/dashboard?tab=autojoin - أتمتة الانضمام إلى القنوات والمجموعات"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>3. الانضمام التلقائي (/autojoin)</span>
                  </div>
                </button>

                <button
                  onClick={() => handleOpenTab('links')}
                  className="w-full p-2 rounded-xl hover:bg-slate-800/80 hover:text-purple-300 flex items-center justify-between transition-colors group"
                  title="/dashboard?tab=links - إدارية الروابط المحفوظة"
                >
                  <div className="flex items-center gap-2.5">
                    <Search className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>4. روابطي المحفوظة (/links)</span>
                  </div>
                </button>

                <button
                  onClick={() => handleOpenTab('autoreply')}
                  className="w-full p-2 rounded-xl hover:bg-slate-800/80 hover:text-rose-300 flex items-center justify-between transition-colors group"
                  title="/dashboard?tab=autoreply - إعداد ردود أوتوماتيكية للرسائل"
                >
                  <div className="flex items-center gap-2.5">
                    <Repeat className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                    <span>5. الرد التلقائي (/autoreply)</span>
                  </div>
                </button>

                <button
                  onClick={() => handleOpenTab('rotating')}
                  className="w-full p-2 rounded-xl hover:bg-slate-800/80 hover:text-indigo-300 flex items-center justify-between transition-colors group"
                  title="/dashboard?tab=rotating - الإرسال المتسلسل الذكي"
                >
                  <div className="flex items-center gap-2.5">
                    <RotateCcw className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span>6. الإرسال المتسلسل (/rotating)</span>
                  </div>
                </button>

                <button
                  onClick={() => handleOpenTab('learning')}
                  className="w-full p-2 rounded-xl hover:bg-slate-800/80 hover:text-amber-200 flex items-center justify-between transition-colors group"
                  title="/dashboard?tab=learning - الذكاء الاصطناعي الذاتي"
                >
                  <div className="flex items-center gap-2.5">
                    <Brain className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                    <span>7. نظام التعلم الذكي (/learning)</span>
                  </div>
                </button>

                <button
                  onClick={() => handleOpenTab('academic')}
                  className="w-full p-2 rounded-xl hover:bg-slate-800/80 hover:text-teal-300 flex items-center justify-between transition-colors group"
                  title="/academic - أدوات التحليل الأكاديمي الشامل"
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                    <span>8. التحليل الأكاديمي (/academic)</span>
                  </div>
                </button>

                <button
                  onClick={() => handleOpenTab('formatter')}
                  className="w-full p-2 rounded-xl hover:bg-slate-800/80 hover:text-pink-300 flex items-center justify-between transition-colors group"
                  title="/formatter - منسق المستندات والنصوص"
                >
                  <div className="flex items-center gap-2.5">
                    <FileEdit className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                    <span>9. منسق المستندات (/formatter)</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <hr className="border-slate-800/80 my-1" />

          {/* 3. Core Telegram Functions Section */}
          <div className="py-1 space-y-0.5">
            <div className="px-3 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              وظائف تليجرام الأساسية
            </div>

            <button
              onClick={() => handleAction(onOpenLinkFinder)}
              className="w-full p-2 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-sky-300 flex items-center justify-between transition-colors group"
              title="فتح دفتر العناوين ونظراء جهات الاتصال (/contacts)"
            >
              <div className="flex items-center gap-2.5">
                <Contact className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>جهات الاتصال (/contacts)</span>
              </div>
            </button>

            <button
              onClick={() => handleAction(onOpenVoiceCall)}
              className="w-full p-2 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-emerald-300 flex items-center justify-between transition-colors group"
              title="سجل المكالمات الصوتية والمرئية (/calls)"
            >
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>المكالمات (/calls)</span>
              </div>
            </button>

            <button
              onClick={() => handleAction(onOpenMediaGallery)}
              className="w-full p-2 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-purple-300 flex items-center justify-between transition-colors group"
              title="معرض وسائط المحادثات (/media_gallery)"
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>معرض الوسائط (/media_gallery)</span>
              </div>
            </button>
          </div>

          <hr className="border-slate-800/80 my-1" />

          {/* 4. Accounts Management Section */}
          <div className="py-1 space-y-0.5">
            <div className="px-3 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              إدارة الحسابات
            </div>

            <button
              onClick={() => handleAction(onOpenLogin)}
              className="w-full p-2 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-sky-300 flex items-center justify-between transition-colors group"
              title="تبديل الحساب النشط"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>تبديل الحساب</span>
              </div>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold border border-sky-500/30">
                {accountsCount} حسابات
              </span>
            </button>

            <button
              onClick={() => handleAction(onOpenLogin)}
              className="w-full p-2 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-emerald-300 flex items-center justify-between transition-colors group"
              title="إضافة حساب تليجرام جديد"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>إضافة حساب جديد</span>
              </div>
            </button>
          </div>

          <hr className="border-slate-800/80 my-1" />

          {/* 5. Settings & Theme Controls */}
          <div className="py-1 space-y-0.5">
            <div className="px-3 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              الإعدادات والتفضيلات
            </div>

            <button
              onClick={toggleDarkMode}
              className="w-full p-2 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-amber-300 flex items-center justify-between transition-colors group"
              title="تغيير المظهر بين الداكن والفاتح"
            >
              <div className="flex items-center gap-2.5">
                {isDarkMode ? (
                  <Moon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                )}
                <span>{isDarkMode ? 'الوضع المظلم (نشط)' : 'الوضع الفاتح'}</span>
              </div>
            </button>

            <button
              onClick={() => handleAction(onOpenMTProtoSync)}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-blue-600/10 hover:from-sky-500/20 hover:to-blue-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-between transition-colors group my-1 font-bold"
              title="المزامنة السحابية بروتوكول MTProto 2.0 (PTS/QTS/SEQ)"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>مزامنة MTProto السحابية (PTS/SEQ)</span>
              </div>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold border border-sky-500/30">
                سحابي
              </span>
            </button>

            <button
              onClick={() => handleAction(onOpenSettings)}
              className="w-full p-2 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-slate-100 flex items-center justify-between transition-colors group"
              title="إعدادات التطبيق والتخزين (/settings_page)"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                <span>الإعدادات (/settings_page)</span>
              </div>
            </button>

            <button
              onClick={() => handleAction(onOpenPrivacy)}
              className="w-full p-2 rounded-xl hover:bg-slate-800/80 text-slate-200 hover:text-rose-300 flex items-center justify-between transition-colors group"
              title="الخصوصية والأمان والحظر (/privacy)"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>الخصوصية والأمان (/privacy)</span>
              </div>
            </button>
          </div>

          <hr className="border-slate-800/80 my-1" />

          {/* Quick Install & Logout */}
          <div className="py-1 space-y-1">
            <button
              onClick={() => handleAction(onOpenInstallPwa)}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-indigo-500/20 hover:from-sky-500/30 hover:to-indigo-500/30 text-sky-300 border border-sky-500/30 flex items-center justify-between transition-colors font-bold"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-sky-400 animate-bounce" />
                <span>تثبيت التطبيق على الجوال (APK/PWA)</span>
              </div>
              <span className="text-[10px] bg-sky-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                تثبيت
              </span>
            </button>

            {/* 6. Red Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full p-2 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-transparent hover:border-rose-500/30 flex items-center gap-2.5 transition-colors font-bold"
              title="تسجيل الخروج من الجلسة"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
          مركز سرعة إنجاز - تليجرام ويب الرسمية v2.5
        </div>
      </div>
    </div>
  );
};

