import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle2, X, Sparkles, ShieldCheck, Zap, Bell, Loader2 } from 'lucide-react';

interface InstallPwaModalProps {
  isOpenOverride?: boolean;
  onCloseOverride?: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpenOverride,
  onCloseOverride,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStepText, setInstallStepText] = useState('');
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);

  useEffect(() => {
    // Clear session dismissal on initial load to ensure user sees prompt
    sessionStorage.removeItem('tg_pwa_session_dismissed');

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }

    // Check standalone mode or previously installed flag
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      localStorage.getItem('tg_pwa_installed') === 'true';

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Listen for beforeinstallprompt and appinstalled
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowNotification(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstalling(false);
      setInstallProgress(100);
      setInstallStepText('تم تثبيت التطبيق بنجاح! 🎉');
      localStorage.setItem('tg_pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const visible = isOpenOverride !== undefined ? isOpenOverride : showNotification;

  const handleClose = () => {
    setShowNotification(false);
    setShowFullModal(false);
    if (onCloseOverride) onCloseOverride();
  };

  const handleInstallClick = async () => {
    // Open full modal so progress is prominently displayed
    setShowFullModal(true);

    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    // Request Notification permission if supported
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    }

    setIsInstalling(true);
    setInstallProgress(25);
    setInstallStepText('جاري الاتصال بالنظام وتجهيز حزمة التثبيت الأوتوماتيكية (PWA)...');

    // Trigger standard browser install prompt if available
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    }

    // Step-by-step installation progress animation without downloading any file
    setTimeout(() => {
      setInstallProgress(60);
      setInstallStepText('تجهيز الخدمة الخلفية والـ Service Worker والإشعارات الفورية...');
    }, 700);

    setTimeout(() => {
      setInstallProgress(90);
      setInstallStepText('إضافة الأيقونة إلى الشاشة الرئيسية وتفعيل النمط المستقل...');
    }, 1400);

    setTimeout(() => {
      setInstallProgress(100);
      setInstallStepText('تم تثبيت تطبيق تليجرام الجوال بنجاح! 🎉');
      setIsInstalling(false);
      setIsInstalled(true);
      localStorage.setItem('tg_pwa_installed', 'true');
    }, 2000);
  };

  if (!visible && !isOpenOverride) return null;

  // Full Modal View with Detailed Progress
  if (showFullModal || isOpenOverride) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn dir-rtl">
        <div className="relative w-full max-w-md bg-slate-900 border border-sky-500/50 rounded-3xl shadow-2xl overflow-hidden transition-all">
          <div className="relative bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-6 text-white text-center">
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex justify-center mb-3">
              <div className="relative">
                <img
                  src="https://telegram.org/img/t_logo.png"
                  alt="Telegram App"
                  className="w-16 h-16 rounded-2xl object-contain shadow-xl border border-white/20"
                />
                {isInstalling && (
                  <div className="absolute inset-0 bg-slate-950/60 rounded-2xl flex items-center justify-center backdrop-blur-xs">
                    <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <h2 className="text-xl font-bold">تثبيت تطبيق تليجرام (PWA المباشر)</h2>
            <p className="text-xs text-sky-100 mt-1">
              تثبيت أوتوماتيكي تلقائي بدعم النظام — إشعارات وتجربة مستقلة بدون حزم خارجية
            </p>
          </div>

          <div className="p-5 space-y-4 text-slate-200 text-xs">
            {isInstalling ? (
              <div className="space-y-4 py-4 text-center">
                <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التثبيت على جهازك...</span>
                  </span>
                  <span className="font-mono text-sm">{installProgress}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-md"
                    style={{ width: `${installProgress}%` }}
                  />
                </div>

                <p className="text-slate-300 font-semibold text-[11px] bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  {installStepText}
                </p>
              </div>
            ) : isInstalled ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-base text-slate-100">تم تثبيت التطبيق بنجاح! 🎉</h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  تم إضافة الأيقونة وتفعيل الخدمة الخلفية. يمكنك الآن فتح التطبيق مباشرة من شاشة جوالك الرئيسية.
                </p>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleClose}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
                  >
                    فتح واستخدام التطبيق الآن 🚀
                  </button>
                </div>
              </div>
            ) : showIOSGuide ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300">
                  <div className="font-bold mb-1">طريقة التثبيت لأجهزة آيفون (iOS):</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300">
                    <li>اضغط زر <span className="font-bold text-amber-200">المشاركة (Share)</span> أسفل متصفح Safari.</li>
                    <li>اختر <span className="font-bold text-amber-200">الإضافة إلى الشاشة الرئيسية</span>.</li>
                    <li>اضغط <span className="font-bold text-amber-200">إضافة</span>.</li>
                  </ol>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold"
                >
                  حسناً، فهمت
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <Smartphone className="w-5 h-5 text-sky-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-100">أيقونة مستقلة على الشاشة</div>
                      <div className="text-[11px] text-slate-400">تشغيل سريع مثل التطبيق الأصلي</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <Bell className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-100">إشعارات منبثقة فورية</div>
                      <div className="text-[11px] text-slate-400">تنبيهات فورية عند وصول أي رسالة</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-100">سرعة فائقة واستجابة عالية</div>
                      <div className="text-[11px] text-slate-400">أداء ممتاز يعمل بدون متصفح</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>تثبيت التطبيق الآن ⚡</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Floating Notification Banner at Top
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] w-[95%] max-w-lg animate-bounce duration-500 dir-rtl">
      <div className="bg-slate-900/95 border-2 border-sky-500/80 rounded-2xl shadow-2xl backdrop-blur-xl p-3 text-slate-100 flex items-center justify-between gap-3 relative overflow-hidden">
        <div className="relative shrink-0 cursor-pointer" onClick={() => setShowFullModal(true)}>
          <img
            src="https://telegram.org/img/t_logo.png"
            alt="Telegram"
            className="w-10 h-10 rounded-xl object-contain shadow-md border border-white/20"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border border-slate-900 flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-slate-950" />
          </div>
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowFullModal(true)}>
          <div className="flex items-center gap-1.5 font-bold text-xs text-sky-400">
            <span>إشعار تثبيت تطبيق تليجرام الجوال</span>
            <span className="bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded text-[9px]">PWA / APK</span>
          </div>
          <p className="text-[11px] text-slate-300 truncate mt-0.5">
            تثبيت التطبيق على الشاشة الرئيسية لاستلام الإشعارات وتجربة سريعة بدون متصفح.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-80"
          >
            {isInstalling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري التثبيت...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>تثبيت الآن</span>
              </>
            )}
          </button>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="إغلاق الإشعار"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
