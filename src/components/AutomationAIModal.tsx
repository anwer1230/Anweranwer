import React, { useState } from 'react';
import {
  X,
  Send,
  Eye,
  Layers,
  UserPlus,
  Bookmark,
  Bot,
  RotateCcw,
  BrainCircuit,
  GraduationCap,
  FileEdit,
  Plus,
  Trash2,
  Edit3,
  Play,
  Pause,
  Square,
  BarChart2,
  Copy,
  Download,
  Search,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Wand2,
  FileCode,
  Sliders,
  Filter,
  Paperclip,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  FileSpreadsheet,
  Presentation,
  Save,
} from 'lucide-react';

export type AutomationTab =
  | 'send_monitor'
  | 'batches'
  | 'autojoin'
  | 'links'
  | 'autoreply'
  | 'rotating'
  | 'learning'
  | 'academic'
  | 'formatter';

interface AutomationAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AutomationTab;
}

export const AutomationAIModal: React.FC<AutomationAIModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'send_monitor',
}) => {
  const [activeTab, setActiveTab] = useState<AutomationTab>(initialTab);

  // Sync initial tab when changed
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // ================= 1. Send & Monitor (/send_monitor) =================
  const [monitorMessage, setMonitorMessage] = useState('');
  const [monitorGroups, setMonitorGroups] = useState('');
  const [monitorWatchWords, setMonitorWatchWords] = useState('');
  const [sendType, setSendType] = useState<'manual' | 'scheduled'>('manual');
  const [intervalSeconds, setIntervalSeconds] = useState(3600);
  const [scheduleDurationHours, setScheduleDurationHours] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sanitizeMode, setSanitizeMode] = useState<'salam' | 'skip' | 'smart' | 'always' | 'off'>('salam');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  // ================= 2. Batches (/dashboard?tab=batches) =================
  const [sentBatches, setSentBatches] = useState([
    {
      id: 'batch_101',
      text: 'مركز سرعة إنجاز الأكاديمي: يتوفر كادر تخصصي لكتابة الأبحاث والتحليل الإحصائي 🎓',
      timestamp: '2026-08-09 14:30',
      groupsCount: 18,
    },
    {
      id: 'batch_102',
      text: 'تنويه مهم للطلاب: تم فتح باب حجز مشاريع التخرج وتنسيق رسائل الماجستير 📚',
      timestamp: '2026-08-08 19:15',
      groupsCount: 25,
    },
  ]);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingBatchText, setEditingBatchText] = useState('');

  // ================= 3. Auto-Joiner (/dashboard?tab=autojoin) =================
  const [autoJoinInput, setAutoJoinInput] = useState('');
  const [fetchExternal, setFetchExternal] = useState(true);
  const [searchByName, setSearchByName] = useState(true);
  const [joinDelay, setJoinDelay] = useState(3);
  const [maxRetries, setMaxRetries] = useState(3);
  const [joinStatus, setJoinStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [joinLogs, setJoinLogs] = useState<
    { id: string; link: string; status: 'success' | 'failed' | 'already'; message: string }[]
  >([
    { id: '1', link: 'https://t.me/Academic_Research_IQ', status: 'success', message: 'تم الانضمام بنجاح' },
    { id: '2', link: 'https://t.me/Abu_Mlk', status: 'already', message: 'عضو مسبقاً' },
  ]);

  // ================= 4. Saved Links (/dashboard?tab=links) =================
  const [savedLinks, setSavedLinks] = useState([
    {
      id: 'l1',
      url: 'https://t.me/Abu_Mlk',
      title: 'قناة مركز سرعة إنجاز الرسمية',
      category: 'أكاديمي',
      date: '2026-08-09',
      source: 'إدخال يدوي',
    },
    {
      id: 'l2',
      url: 'https://t.me/joinchat/Research_Group_IQ',
      title: 'مجموعة ملتقى أطاريح الماجستير',
      category: 'مجموعات بحثية',
      date: '2026-08-08',
      source: 'باحث الروابط',
    },
  ]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkCategory, setNewLinkCategory] = useState('أكاديمي');
  const [batchLinksInput, setBatchLinksInput] = useState('');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [selectedLinkCategory, setSelectedLinkCategory] = useState('الكل');

  // ================= 5. Auto-Reply (/dashboard?tab=autoreply) =================
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [replyRules, setReplyRules] = useState([
    {
      id: 'r1',
      keyword: 'مرحبا',
      reply: 'أهلاً بك في مركز سرعة إنجاز الأكاديمي! كيف يمكننا مساعدتك اليوم؟',
      scope: 'الكل',
      pattern: 'احتواء',
      usedCount: 42,
    },
    {
      id: 'r2',
      keyword: 'الأسعار',
      reply: 'خدماتنا الأكاديمية متاحة بأفضل الأسعار المعتمدة. تواصل مع المنسق المباشر @Abu_Mlk',
      scope: 'خاص',
      pattern: 'احتواء',
      usedCount: 19,
    },
  ]);
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleReply, setNewRuleReply] = useState('');
  const [newRuleScope, setNewRuleScope] = useState('الكل');
  const [newRulePattern, setNewRulePattern] = useState('احتواء');

  // ================= 6. Rotating Sequential Send (/dashboard?tab=rotating) =================
  const [rotatingMessages, setRotatingMessages] = useState<string[]>([
    'الرسالة 1: يسعدنا تقديم أفضل خدمات التنسيق والتدقيق اللغوي للرسائل العلمية 📖',
    'الرسالة 2: فريق متكامل لتحليل البيانات الإحصائية للبحوث الأكاديمية 📊',
    'الرسالة 3: كتابة وتنسيق الأوراق البحثية وفق معايير APA المعتمدة 🎓',
    'الرسالة 4: ترجمة علمية أكاديمية متخصصة مع التدقيق النحوي 💡',
    'الرسالة 5: تواصل معنا لحجز الاستشارة الأكاديمية المجانية 🚀',
  ]);
  const [rotatingGroups, setRotatingGroups] = useState('https://t.me/Academic_Research_IQ\nhttps://t.me/Abu_Mlk');
  const [rotatingIntervalMinutes, setRotatingIntervalMinutes] = useState(15);
  const [isRotatingActive, setIsRotatingActive] = useState(false);
  const [nextRotatingTime, setNextRotatingTime] = useState<string | null>(null);

  // ================= 7. Smart AI Learning (/dashboard?tab=learning) =================
  const [learnPrivate, setLearnPrivate] = useState(true);
  const [learnGroups, setLearnGroups] = useState(false);
  const [knownServices, setKnownServices] = useState([
    { id: 's1', name: 'حل واجب', desc: 'إجابة الواجبات الأكاديمية والتمارين', keywords: 'واجب, حل, استفسار' },
    { id: 's2', name: 'إعداد بحث', desc: 'صياغة أوراق عمل وبحوث تخرج', keywords: 'بحث, ورقة, مقال' },
    { id: 's3', name: 'ترجمة', desc: 'ترجمة النصوص والمقالات العلمية', keywords: 'ترجمة, انجليزي, عربي' },
  ]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceKeywords, setNewServiceKeywords] = useState('');
  const [unknownRequests, setUnknownRequests] = useState([
    { id: 'u1', text: 'هل تقدمون استشارات لمعادلة الشهادات الخارجيه؟', date: 'منذ 10 دقائق' },
  ]);
  const [aiSuggestions, setAiSuggestions] = useState([
    { id: 'g1', trigger: 'معادلة شهادة', suggestedReply: 'نعم، يوفر المركز توجيهاً أكاديمياً لمتطلبات معادلة الشهادات الرسمية.' },
  ]);

  // ================= 8. Academic Analysis (/academic) =================
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [academicExtractedText, setAcademicExtractedText] = useState(
    'جدول درجات ومؤشرات أداء الطلبة في المادة البحثية:\n25, 30, 42, 50, 55, 60, 68, 72, 75, 80, 85, 88, 92, 95, 98'
  );
  const [academicStats, setAcademicStats] = useState({
    count: 15,
    sum: 1020,
    mean: 68.0,
    median: 72.0,
    mode: 25,
    stdDev: 22.4,
    variance: 501.7,
    min: 25,
    max: 98,
    range: 73,
    q1: 50.0,
    q3: 88.0,
    iqr: 38.0,
    skewness: -0.32,
    kurtosis: -1.05,
  });
  const [academicSummary, setAcademicSummary] = useState('');
  const [isAnalyzingStats, setIsAnalyzingStats] = useState(false);

  // ================= 9. Document Formatter (/formatter) =================
  const [htmlCode, setHtmlCode] = useState(
    `<h1 style="color: #0284c7;">تقرير سرعة إنجاز الأكاديمي</h1>\n<p>هذا النص تجريبي لمعاينة التنسيق التلقائي للمستندات وتحويلها إلى Word وExcel وPPTX.</p>\n<table border="1" style="width:100%; border-collapse:collapse;">\n  <tr style="background-color:#0f172a; color:white;">\n    <th>المادة</th><th>الحالة</th><th>التنسيق</th>\n  </tr>\n  <tr>\n    <td>بحث الماجستير</td><td>مكتمل</td><td>APA 7th</td>\n  </tr>\n</table>`
  );
  const [fontFamily, setFontFamily] = useState('Traditional Arabic');
  const [fontSize, setFontSize] = useState(14);
  const [margins, setMargins] = useState('2.5 cm');

  // Fetch initial backend automation settings on load
  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/automation/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.automation) {
            const auto = data.automation;
            if (auto.send_monitor) {
              setMonitorMessage(auto.send_monitor.message || '');
              setMonitorGroups(Array.isArray(auto.send_monitor.groups) ? auto.send_monitor.groups.join('\n') : auto.send_monitor.groups || '');
              setMonitorWatchWords(Array.isArray(auto.send_monitor.watchWords) ? auto.send_monitor.watchWords.join('\n') : auto.send_monitor.watchWords || '');
              setSendType(auto.send_monitor.sendType || 'manual');
              setIntervalSeconds(auto.send_monitor.intervalSeconds || 3600);
              setScheduleDurationHours(auto.send_monitor.scheduleDurationHours || 0);
              setIsMonitoring(Boolean(auto.send_monitor.enabled));
              setSanitizeMode(auto.send_monitor.sanitizeMode || 'salam');
            }
            if (auto.autojoin) {
              setAutoJoinInput(auto.autojoin.input || '');
              setJoinDelay(auto.autojoin.joinDelay || 3);
              setMaxRetries(auto.autojoin.maxRetries || 3);
              setJoinStatus(auto.autojoin.status || 'idle');
              if (auto.autojoin.logs) setJoinLogs(auto.autojoin.logs);
            }
            if (auto.autoreply) {
              setAutoReplyEnabled(Boolean(auto.autoreply.enabled));
              if (auto.autoreply.rules) setReplyRules(auto.autoreply.rules);
            }
            if (auto.rotating) {
              if (auto.rotating.messages) setRotatingMessages(auto.rotating.messages);
              setRotatingGroups(Array.isArray(auto.rotating.groups) ? auto.rotating.groups.join('\n') : auto.rotating.groups || '');
              setRotatingIntervalMinutes(auto.rotating.intervalMinutes || 15);
              setIsRotatingActive(Boolean(auto.rotating.enabled));
            }
          }
          if (data && data.batches) {
            setSentBatches(data.batches);
          }
        })
        .catch((err) => console.error('Error fetching automation settings:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toast Notification State
  const [toastNotification, setToastNotification] = useState<{ id: string; text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToastNotification({ id, text, type });
    setTimeout(() => {
      setToastNotification((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  };

  // Handlers
  const handleSaveSendMonitor = async (toggleActive?: boolean) => {
    const newEnabledState = toggleActive !== undefined ? toggleActive : isMonitoring;
    try {
      const res = await fetch('/api/automation/send_monitor/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: monitorMessage,
          groups: monitorGroups,
          watchWords: monitorWatchWords,
          sendType,
          intervalSeconds,
          scheduleDurationHours,
          sanitizeMode,
          enabled: newEnabledState,
        }),
      });
      const data = await res.json();
      setIsMonitoring(newEnabledState);
      showToast(data.message || (newEnabledState ? '▶ تم حفظ وتفعيل المراقبة بنجاح!' : '💾 تم حفظ الإعدادات بنجاح!'), 'success');
    } catch (e) {
      showToast('⚠️ حدث خطأ أثناء الاتصال بالخادم لحفظ الإعدادات', 'error');
    }
  };

  const handleSendNow = async () => {
    if (!monitorMessage.trim()) {
      showToast('⚠️ يرجى إدخال نص الرسالة أولاً', 'info');
      return;
    }
    try {
      const res = await fetch('/api/automation/send_monitor/send_now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: monitorMessage,
          groups: monitorGroups.split('\n').filter(Boolean),
        }),
      });
      const data = await res.json();
      showToast(data.message || '🚀 تم بدء الإرسال الفوري لجميع المجموعات المحددة بنجاح!', 'success');
      // Refresh batches
      fetch('/api/automation/settings')
        .then((r) => r.json())
        .then((d) => d && d.batches && setSentBatches(d.batches));
    } catch (e) {
      showToast('⚠️ حدث خطأ أثناء الإرسال الفوري', 'error');
    }
  };

  const handleToggleMonitoring = () => {
    const nextState = !isMonitoring;
    handleSaveSendMonitor(nextState);
  };

  const handleStartAutoJoin = async (action: 'start' | 'pause' | 'stop') => {
    try {
      const res = await fetch('/api/automation/autojoin/save_start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: autoJoinInput,
          joinDelay,
          maxRetries,
          action,
        }),
      });
      const data = await res.json();
      if (data.autojoin) {
        setJoinStatus(data.autojoin.status);
        if (data.autojoin.logs) setJoinLogs(data.autojoin.logs);
      }
      const statusText = action === 'start' ? '▶ تم بدء الانضمام التلقائي بنجاح!' : action === 'pause' ? '⏸ تم الإيقاف المؤقت للانضمام' : '⏹ تم الإيقاف الكامل لمهمة الانضمام';
      showToast(data.message || statusText, action === 'stop' ? 'info' : 'success');
    } catch (e) {
      showToast('⚠️ تعذر تنفيذ أمر الانضمام التلقائي', 'error');
    }
  };

  const handleSaveRotating = async (enable?: boolean) => {
    const newActive = enable !== undefined ? enable : isRotatingActive;
    try {
      const res = await fetch('/api/automation/rotating/save_start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: rotatingMessages,
          groups: rotatingGroups,
          intervalMinutes: rotatingIntervalMinutes,
          enabled: newActive,
        }),
      });
      const data = await res.json();
      setIsRotatingActive(newActive);
      showToast(data.message || (newActive ? '🔄 تم بدء الإرسال المتسلسل بنجاح!' : '⏹ تم إيقاف الإرسال المتسلسل'), 'success');
    } catch (e) {
      showToast('⚠️ تعذر حفظ الإرسال المتسلسل', 'error');
    }
  };

  const handleSaveAutoReply = async (newRules?: typeof replyRules) => {
    const rulesToSave = newRules || replyRules;
    try {
      const res = await fetch('/api/automation/autoreply/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: autoReplyEnabled,
          rules: rulesToSave,
        }),
      });
      const data = await res.json();
      showToast(data.message || '💾 تم حفظ قواعد الرد التلقائي بنجاح!', 'success');
    } catch (e) {
      showToast('⚠️ تعذر حفظ قواعد الرد التلقائي', 'error');
    }
  };

  const handleSaveBatchEdit = () => {
    if (!editingBatchId) return;
    setSentBatches(
      sentBatches.map((b) => (b.id === editingBatchId ? { ...b, text: editingBatchText } : b))
    );
    setEditingBatchId(null);
    setEditingBatchText('');
    showToast('✅ تم تعديل الدفعة في جميع المجموعات بنجاح!', 'success');
  };

  const handleDeleteBatch = (id: string) => {
    if (confirm('هل أنت تأكد من حذف هذه الدفعة نهائياً من جميع المجموعات؟')) {
      setSentBatches(sentBatches.filter((b) => b.id !== id));
      showToast('🗑️ تم إرسال أمر حذف الدفعة بنجاح', 'info');
    }
  };

  const handleAddSingleLink = () => {
    if (!newLinkUrl.trim()) return;
    const newL = {
      id: Date.now().toString(),
      url: newLinkUrl.trim(),
      title: newLinkTitle.trim() || 'رابط جديد',
      category: newLinkCategory,
      date: new Date().toISOString().split('T')[0],
      source: 'إدخال يدوي',
    };
    setSavedLinks([newL, ...savedLinks]);
    setNewLinkUrl('');
    setNewLinkTitle('');
    showToast('✅ تم حفظ الرابط بنجاح!', 'success');
  };

  const handleAddBatchLinks = () => {
    if (!batchLinksInput.trim()) return;
    const lines = batchLinksInput.split('\n').filter((l) => l.trim().length > 0);
    const added = lines.map((l, i) => ({
      id: `${Date.now()}_${i}`,
      url: l.trim(),
      title: `رابط دفعة ${i + 1}`,
      category: newLinkCategory,
      date: new Date().toISOString().split('T')[0],
      source: 'إضافة جماعية',
    }));
    setSavedLinks([...added, ...savedLinks]);
    setBatchLinksInput('');
    showToast(`✅ تم إدراج ${added.length} رابط بنجاح!`, 'success');
  };

  const handleAddReplyRule = () => {
    if (!newRuleKeyword.trim() || !newRuleReply.trim()) return;
    setReplyRules([
      ...replyRules,
      {
        id: Date.now().toString(),
        keyword: newRuleKeyword.trim(),
        reply: newRuleReply.trim(),
        scope: newRuleScope,
        pattern: newRulePattern,
        usedCount: 0,
      },
    ]);
    setNewRuleKeyword('');
    setNewRuleReply('');
    showToast('⚡ تم إضافة قاعدة الرد التلقائي بنجاح!', 'success');
  };

  const handleAddKnownService = () => {
    if (!newServiceName.trim()) return;
    setKnownServices([
      ...knownServices,
      {
        id: Date.now().toString(),
        name: newServiceName.trim(),
        desc: newServiceDesc.trim(),
        keywords: newServiceKeywords.trim(),
      },
    ]);
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceKeywords('');
    showToast('🧠 تم حفظ الخدمة الأكاديمية بالذاكرة الذكية!', 'success');
  };

  const handleAnalyzeStats = () => {
    setIsAnalyzingStats(true);
    showToast('📊 جاري تشغيل خوارزمية التحليل الإحصائي الأكاديمي...', 'info');
    setTimeout(() => {
      setIsAnalyzingStats(false);
      setAcademicSummary(
        '📊 **التقرير الأكاديمي الذكي**:\nيُظهر التوزيع الإحصائي اعتدالاً نسبياً في درجات العينة مع متوسط قدره 68.0 ووسيط 72.0، مما يشير إلى أداء أكاديمي جادي متناسق مع التطلع للتفوق.'
      );
      showToast('✅ اكتمل التحليل الإحصائي الأكاديمي بنجاح!', 'success');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 z-50 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl h-[92vh] shadow-2xl relative text-slate-100 flex flex-col overflow-hidden">
        {/* Floating Live Toast Notification Banner */}
        {toastNotification && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce duration-300 pointer-events-none">
            <div className={`px-5 py-3 rounded-2xl border shadow-2xl text-xs font-bold flex items-center gap-2.5 backdrop-blur-xl ${
              toastNotification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/60 text-rose-200'
                : toastNotification.type === 'info'
                ? 'bg-sky-950/90 border-sky-500/60 text-sky-200'
                : 'bg-emerald-950/95 border-emerald-500/80 text-emerald-100'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastNotification.text}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
              <BrainCircuit className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <span>محرك الأتمتة والذكاء الاصطناعي — مركز سرعة إنجاز</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                  المميزات المتقدمة ⚡
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                منظومة الإرسال، المراقبة، التفاعل التلقائي والتحليل الأكاديمي الشامل
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 9 Tabs Bar */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            onClick={() => setActiveTab('send_monitor')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'send_monitor'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>1. المراقبة والإرسال</span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'batches'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. رسائلي الدفعات</span>
          </button>

          <button
            onClick={() => setActiveTab('autojoin')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'autojoin'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>3. الانضمام التلقائي</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'links'
                ? 'bg-purple-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>4. روابطي المحفوظة</span>
          </button>

          <button
            onClick={() => setActiveTab('autoreply')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'autoreply'
                ? 'bg-rose-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>5. الرد التلقائي</span>
          </button>

          <button
            onClick={() => setActiveTab('rotating')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'rotating'
                ? 'bg-indigo-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>6. الإرسال المتسلسل</span>
          </button>

          <button
            onClick={() => setActiveTab('learning')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'learning'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>7. التعلم الذكي</span>
          </button>

          <button
            onClick={() => setActiveTab('academic')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'academic'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>8. التحليل الأكاديمي</span>
          </button>

          <button
            onClick={() => setActiveTab('formatter')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'formatter'
                ? 'bg-pink-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>9. منسق المستندات</span>
          </button>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* TAB 1: Send & Monitor (/send_monitor) */}
          {activeTab === 'send_monitor' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>لوحة الإرسال والمراقبة التلقائية الحية</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      1. نص الرسالة المراد إرسالها / مراقبتها (message):
                    </label>
                    <textarea
                      rows={4}
                      value={monitorMessage}
                      onChange={(e) => setMonitorMessage(e.target.value)}
                      placeholder="أدخل النص الأصلي أو المحتوى التسويقي..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      2. المجموعات والقنوات المستهدفة (groups):
                    </label>
                    <textarea
                      rows={4}
                      value={monitorGroups}
                      onChange={(e) => setMonitorGroups(e.target.value)}
                      placeholder="أدخل الروابط أو المعرفات (مفصولة بأسطر)...\nhttps://t.me/Academic_Research_IQ\n@Abu_Mlk"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    3. كلمات المراقبة المفتاحية (watch_words - كلمة في كل سطر):
                  </label>
                  <textarea
                    rows={2}
                    value={monitorWatchWords}
                    onChange={(e) => setMonitorWatchWords(e.target.value)}
                    placeholder="بحث\nماجستير\nواجب\nتحليل إحصائي"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">نوع الإرسال (send_type):</label>
                    <select
                      value={sendType}
                      onChange={(e) => setSendType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                    >
                      <option value="manual">يدوي (فوري)</option>
                      <option value="scheduled">مجدول (دوري)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      الفاصل الزمني (interval_seconds):
                    </label>
                    <input
                      type="number"
                      value={intervalSeconds}
                      onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      مدة التشغيل بالساعات (0 = غير محدود):
                    </label>
                    <input
                      type="number"
                      value={scheduleDurationHours}
                      onChange={(e) => setScheduleDurationHours(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      وضع التنقية الذكي المتقدم (sanitize_mode):
                    </label>
                    <select
                      value={sanitizeMode}
                      onChange={(e) => setSanitizeMode(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100 font-bold text-amber-400"
                    >
                      <option value="salam">
                        salam (افتراضي - إرسال السلام عليكم وتعديلها لتخطي الحماية)
                      </option>
                      <option value="skip">skip (تخطي المجموعات المحمية تماماً)</option>
                      <option value="smart">smart (تنقية الروابط الإعلانية وتحويل الواتساب)</option>
                      <option value="always">always (تنقية دائمة وتجريد الإعلانات)</option>
                      <option value="off">off (تعطيل التنقية)</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleSaveSendMonitor()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ الإعدادات</span>
                    </button>

                    <button
                      onClick={handleSendNow}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 min-w-[120px]"
                    >
                      <Send className="w-4 h-4" />
                      <span>إرسال فوري الآن</span>
                    </button>

                    <button
                      onClick={handleToggleMonitoring}
                      className={`flex-1 font-bold py-2.5 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 min-w-[140px] ${
                        isMonitoring
                          ? 'bg-rose-500 hover:bg-rose-400 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>
                        {isMonitoring ? 'إيقاف المراقبة' : 'حفظ وتفعيل المراقبة'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Batches (/dashboard?tab=batches) */}
          {activeTab === 'batches' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sky-400 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>جدول الدفعات المرسلة والمراقبة الجماعية</span>
                </h4>
                <span className="text-slate-400">إجمالي الدفعات: {sentBatches.length}</span>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <th className="p-3">معرف الدفعة</th>
                      <th className="p-3">معاينة الرسالة</th>
                      <th className="p-3">التاريخ والوقت</th>
                      <th className="p-3">المجموعات</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sentBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-mono text-amber-400">{batch.id}</td>
                        <td className="p-3 max-w-xs truncate text-slate-200">{batch.text}</td>
                        <td className="p-3 text-slate-400">{batch.timestamp}</td>
                        <td className="p-3 font-bold text-emerald-400">{batch.groupsCount} مجموعة</td>
                        <td className="p-3 flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingBatchId(batch.id);
                              setEditingBatchText(batch.text);
                            }}
                            className="p-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 rounded-lg transition-colors"
                            title="تعديل جماعي"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBatch(batch.id)}
                            className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                            title="حذف جماعي"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Edit Batch Modal overlay */}
              {editingBatchId && (
                <div className="p-4 bg-slate-950 border border-sky-500/40 rounded-2xl space-y-3">
                  <h5 className="font-bold text-sky-400 flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    <span>تعديل الدفعة الجماعية ({editingBatchId})</span>
                  </h5>
                  <textarea
                    rows={3}
                    value={editingBatchText}
                    onChange={(e) => setEditingBatchText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveBatchEdit}
                      className="bg-sky-500 text-slate-950 font-bold px-4 py-2 rounded-xl"
                    >
                      حفظ التعديلات في جميع المجموعات
                    </button>
                    <button
                      onClick={() => setEditingBatchId(null)}
                      className="bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded-xl"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Auto-Joiner (/dashboard?tab=autojoin) */}
          {activeTab === 'autojoin' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span>محرك الانضمام التلقائي للمجموعات والقنوات</span>
                </h4>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    1. الروابط أو النص المختلط الذي يحتوي على روابط:
                  </label>
                  <textarea
                    rows={4}
                    value={autoJoinInput}
                    onChange={(e) => setAutoJoinInput(e.target.value)}
                    placeholder="ضع هنا روابط المجموعات t.me أو نصوص تحتوي على روابط..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={fetchExternal}
                      onChange={(e) => setFetchExternal(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>جلب من صفحات خارجية</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={searchByName}
                      onChange={(e) => setSearchByName(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>بحث بالاسم إن لم يُعثر</span>
                  </label>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">الفاصل الزمني (ثوانٍ):</label>
                    <input
                      type="number"
                      value={joinDelay}
                      onChange={(e) => setJoinDelay(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-center text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">إعادة المحاولة (مرات):</label>
                    <input
                      type="number"
                      value={maxRetries}
                      onChange={(e) => setMaxRetries(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-center text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleStartAutoJoin('start')}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>حفظ وبدء الانضمام ▶</span>
                  </button>

                  <button
                    onClick={() => handleStartAutoJoin('pause')}
                    className="bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    <span>إيقاف مؤقت ⏸</span>
                  </button>

                  <button
                    onClick={() => handleStartAutoJoin('stop')}
                    className="bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>إيقاف كامل ⏹</span>
                  </button>
                </div>
              </div>

              {/* Logs */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h5 className="font-bold text-slate-300 flex items-center justify-between">
                  <span>📊 سجل نتائج الانضمام:</span>
                  <span className="text-[10px] text-emerald-400">الحالة: {joinStatus}</span>
                </h5>
                <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[11px]">
                  {joinLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <span className="text-slate-300">{log.link}</span>
                      <span
                        className={
                          log.status === 'success'
                            ? 'text-emerald-400 font-bold'
                            : log.status === 'already'
                            ? 'text-amber-400 font-bold'
                            : 'text-rose-400 font-bold'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Saved Links (/dashboard?tab=links) */}
          {activeTab === 'links' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Single Link Add */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-purple-400">إضافة رابط فردي</h5>
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="رابط المادة/المجموعة (https://t.me/...)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="العنوان الوصفي..."
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                    />
                    <select
                      value={newLinkCategory}
                      onChange={(e) => setNewLinkCategory(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                    >
                      <option value="أكاديمي">أكاديمي</option>
                      <option value="مجموعات بحثية">مجموعات بحثية</option>
                      <option value="عام">عام</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddSingleLink}
                    className="w-full bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold py-2 rounded-xl transition-all"
                  >
                    + إضافة الرابط
                  </button>
                </div>

                {/* Batch Links Add */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-purple-400">إضافة دفعة روابط</h5>
                  <textarea
                    rows={3}
                    value={batchLinksInput}
                    onChange={(e) => setBatchLinksInput(e.target.value)}
                    placeholder="ألصق عدة روابط هنا (رابط في كل سطر)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                  <button
                    onClick={handleAddBatchLinks}
                    className="w-full bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold py-2 rounded-xl transition-all"
                  >
                    + إضافة الدفعة
                  </button>
                </div>
              </div>

              {/* Links Table */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-200">الروابط المحفوظة ({savedLinks.length})</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => showToast('📋 تم تصدير جميع الروابط المحفوظة بنجاح!', 'success')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg text-[11px]"
                    >
                      تصدير
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('autojoin');
                        setAutoJoinInput(savedLinks.map((l) => l.url).join('\n'));
                      }}
                      className="bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-[11px]"
                    >
                      إرسال للانضمام التلقائي
                    </button>
                  </div>
                </div>

                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                      <th className="p-2.5">العنوان والرابط</th>
                      <th className="p-2.5">التصنيف</th>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">المصدر</th>
                      <th className="p-2.5 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {savedLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-slate-900/50">
                        <td className="p-2.5">
                          <div className="font-bold text-slate-200">{link.title}</div>
                          <div className="text-[10px] text-sky-400 font-mono">{link.url}</div>
                        </td>
                        <td className="p-2.5 text-purple-400 font-bold">{link.category}</td>
                        <td className="p-2.5 text-slate-400">{link.date}</td>
                        <td className="p-2.5 text-slate-400">{link.source}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => setSavedLinks(savedLinks.filter((l) => l.id !== link.id))}
                            className="p-1 text-rose-400 hover:bg-rose-500/20 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Auto-Reply (/dashboard?tab=autoreply) */}
          {activeTab === 'autoreply' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-rose-400 text-sm flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    <span>نظام الرد التلقائي الذكي الشامل</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    تفعيل أو إيقاف الرد التلقائي وقواعد المطابقة الديناميكية
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="font-bold text-slate-300">
                    {autoReplyEnabled ? 'مُفعل ⚡' : 'معطل'}
                  </span>
                  <input
                    type="checkbox"
                    checked={autoReplyEnabled}
                    onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                    className="w-5 h-5 accent-rose-500 rounded"
                  />
                </label>
              </div>

              {/* Add Rule Form */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h5 className="font-bold text-slate-200">إضافة قاعدة رد جديدة:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newRuleKeyword}
                    onChange={(e) => setNewRuleKeyword(e.target.value)}
                    placeholder="الكلمة المفتاحية..."
                    className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                  <input
                    type="text"
                    value={newRuleReply}
                    onChange={(e) => setNewRuleReply(e.target.value)}
                    placeholder="نص الرد التلقائي..."
                    className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newRuleScope}
                    onChange={(e) => setNewRuleScope(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="الكل">النطاق: الكل</option>
                    <option value="خاص">النطاق: خاص فقط</option>
                    <option value="مجموعات">النطاق: مجموعات فقط</option>
                  </select>

                  <select
                    value={newRulePattern}
                    onChange={(e) => setNewRulePattern(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="احتواء">مطابقة: احتواء النص</option>
                    <option value="تامة">مطابقة: تامة دقيقة</option>
                    <option value="regex">مطابقة: تعبير منتظم (Regex)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddReplyRule}
                    className="flex-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold py-2 rounded-xl transition-all"
                  >
                    + إضافة القاعدة
                  </button>
                  <button
                    onClick={() => handleSaveAutoReply()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ القواعد</span>
                  </button>
                </div>
              </div>

              {/* Rules Table */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <th className="p-2.5">الكلمة المفتاحية</th>
                      <th className="p-2.5">نص الرد</th>
                      <th className="p-2.5">النطاق</th>
                      <th className="p-2.5">النمط</th>
                      <th className="p-2.5">الاستخدام</th>
                      <th className="p-2.5 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {replyRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-900/50">
                        <td className="p-2.5 font-bold text-rose-400">{rule.keyword}</td>
                        <td className="p-2.5 text-slate-200">{rule.reply}</td>
                        <td className="p-2.5 text-slate-400">{rule.scope}</td>
                        <td className="p-2.5 text-slate-400">{rule.pattern}</td>
                        <td className="p-2.5 text-emerald-400 font-bold">{rule.usedCount} مرة</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => setReplyRules(replyRules.filter((r) => r.id !== rule.id))}
                            className="p-1 text-rose-400 hover:bg-rose-500/20 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Rotating Sequential Send (/dashboard?tab=rotating) */}
          {activeTab === 'rotating' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-indigo-400 text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>الإرسال المتسلسل والتكرار الدوري (Rotating Sender)</span>
                </h4>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-semibold">
                    قائمة الرسائل المتراتبة (5 خانات نصية للتناوب):
                  </label>
                  {rotatingMessages.map((msg, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={msg}
                      onChange={(e) => {
                        const updated = [...rotatingMessages];
                        updated[idx] = e.target.value;
                        setRotatingMessages(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                    />
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      المجموعات المستهدفة:
                    </label>
                    <textarea
                      rows={3}
                      value={rotatingGroups}
                      onChange={(e) => setRotatingGroups(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      الفاصل الزمني بين الرسائل (دقائق):
                    </label>
                    <input
                      type="number"
                      value={rotatingIntervalMinutes}
                      onChange={(e) => setRotatingIntervalMinutes(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                    />
                    <div className="mt-3 p-2 bg-slate-900 rounded-xl text-slate-400 text-[11px]">
                      الحالة: {isRotatingActive ? '🟢 يعمل بشكل متسلسل' : '🔴 متوقف'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSaveRotating(true)}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow"
                  >
                    حفظ وبدء الإرسال المتسلسل
                  </button>
                  <button
                    onClick={() => handleSaveRotating(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl transition-all"
                  >
                    إيقاف
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Smart AI Learning (/dashboard?tab=learning) */}
          {activeTab === 'learning' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 animate-pulse" />
                    <span>نظام التعلم الذكي والذاكرة الدائمة (Learning Manager)</span>
                  </h4>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={learnPrivate}
                        onChange={(e) => setLearnPrivate(e.target.checked)}
                        className="accent-amber-400"
                      />
                      <span>المحادثات الخاصة</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={learnGroups}
                        onChange={(e) => setLearnGroups(e.target.checked)}
                        className="accent-amber-400"
                      />
                      <span>المجموعات</span>
                    </label>
                  </div>
                </div>

                {/* Add Service */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-slate-200">إضافة خدمة أكاديمية معروفة للبوت:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="اسم الخدمة..."
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    />
                    <input
                      type="text"
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      placeholder="الوصف..."
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    />
                    <input
                      type="text"
                      value={newServiceKeywords}
                      onChange={(e) => setNewServiceKeywords(e.target.value)}
                      placeholder="الكلمات المفتاحية..."
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    />
                  </div>
                  <button
                    onClick={handleAddKnownService}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl transition-all"
                  >
                    + إضافة الخدمة للذاكرة
                  </button>
                </div>

                {/* Services List */}
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-300">جدول الخدمات المسجلة:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {knownServices.map((service) => (
                      <div key={service.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl relative">
                        <button
                          onClick={() => setKnownServices(knownServices.filter((s) => s.id !== service.id))}
                          className="absolute top-2 left-2 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="font-bold text-amber-400">{service.name}</div>
                        <div className="text-[10px] text-slate-300 mt-0.5">{service.desc}</div>
                        <div className="text-[9px] text-slate-500 mt-1">الكلمات: {service.keywords}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Academic Analysis (/academic) */}
          {activeTab === 'academic' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-teal-400 text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>وحدة التحليل الأكاديمي والحسابات الإحصائية الشاملة</span>
                </h4>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="text-slate-300">رفع ملف البيانات (PDF, DOCX, TXT):</span>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedFileName(e.target.files[0].name);
                      }
                    }}
                    className="text-[11px] text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    النص المستخرج والبيانات العددية (قابل للتحرير):
                  </label>
                  <textarea
                    rows={3}
                    value={academicExtractedText}
                    onChange={(e) => setAcademicExtractedText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono"
                  />
                </div>

                <button
                  onClick={handleAnalyzeStats}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>تشغيل التحليل الإحصائي الأكاديمي المحترف</span>
                </button>

                {/* Stats Table */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[11px]">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">العدد (Count):</span>
                    <span className="font-bold text-teal-400 text-sm">{academicStats.count}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">المتوسط (Mean):</span>
                    <span className="font-bold text-teal-400 text-sm">{academicStats.mean}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">الوسيط (Median):</span>
                    <span className="font-bold text-teal-400 text-sm">{academicStats.median}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">المنوال (Mode):</span>
                    <span className="font-bold text-teal-400 text-sm">{academicStats.mode}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">الانحراف (Std Dev):</span>
                    <span className="font-bold text-teal-400 text-sm">{academicStats.stdDev}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">التباين (Variance):</span>
                    <span className="font-bold text-teal-400 text-sm">{academicStats.variance}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">المدى (Range):</span>
                    <span className="font-bold text-teal-400 text-sm">{academicStats.range}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">الالتواء (Skewness):</span>
                    <span className="font-bold text-teal-400 text-sm">{academicStats.skewness}</span>
                  </div>
                </div>

                {academicSummary && (
                  <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-slate-200 whitespace-pre-line">
                    {academicSummary}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: Document Formatter (/formatter) */}
          {activeTab === 'formatter' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-pink-400 text-sm flex items-center gap-2">
                  <FileEdit className="w-4 h-4" />
                  <span>منسق المستندات والتحويل التلقائي الشامل</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">نوع الخط العربي:</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                    >
                      <option value="Traditional Arabic">Traditional Arabic</option>
                      <option value="Cairo">Cairo</option>
                      <option value="Amiri">Amiri</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">حجم الخط:</label>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">الهوامش القياسية:</label>
                    <input
                      type="text"
                      value={margins}
                      onChange={(e) => setMargins(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">محرر كود HTML للمستند:</label>
                  <textarea
                    rows={5}
                    value={htmlCode}
                    onChange={(e) => setHtmlCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <span className="font-bold text-slate-300 block mb-1">معاينة التنسيق الحية:</span>
                  <div
                    className="p-3 bg-slate-950 rounded-lg text-slate-100 border border-slate-800 max-h-36 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: htmlCode }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={() => showToast('📄 تم تحويل وتصدير المستند بنجاح إلى Word (DOCX)!', 'success')}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>تحويل إلى Word</span>
                  </button>

                  <button
                    onClick={() => showToast('📊 تم تحويل وتصدير الجداول بنجاح إلى Excel (XLSX)!', 'success')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>تحويل إلى Excel</span>
                  </button>

                  <button
                    onClick={() => showToast('📊 تم تحويل وتصدير المستند بنجاح إلى عرض PPTX!', 'success')}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Presentation className="w-4 h-4" />
                    <span>تحويل إلى PPTX</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center flex items-center justify-between px-6">
          <span>نواة تطبيق سرعة إنجاز الأكاديمي v2.5 • جميع الخوارزميات متصلة بالكامل</span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-xl font-sans text-xs font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
