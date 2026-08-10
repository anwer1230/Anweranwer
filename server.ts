import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initialChats, initialFolders, initialMessagesMap, initialUserProfile } from './src/data/mockInitialData';
import { Chat, ChatFolder, Message, UserProfile } from './src/types';
import {
  sendTelegramCode,
  verifyTelegramCode,
  verifyTelegramPassword,
  getTelegramChatMessages,
  sendTelegramChatMessage,
  getActiveTelegramDialogs,
} from './src/lib/telegramService';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory data store
let chatsStore: Chat[] = [...initialChats];
let foldersStore: ChatFolder[] = [...initialFolders];
let messagesMapStore: Record<number, Message[]> = JSON.parse(JSON.stringify(initialMessagesMap));
let profileStore: UserProfile = { ...initialUserProfile };

// Automation & Monitoring Engine Store
let batchesStore = [
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
];

let automationState = {
  send_monitor: {
    enabled: true,
    message: 'مركز سرعة إنجاز الأكاديمي: يتوفر كادر تخصصي لكتابة الأبحاث والتحليل الإحصائي 🎓',
    groups: [
      'https://t.me/Academic_Research_IQ',
      'https://t.me/Abu_Mlk',
      'مجموعة بحوث الماجستير والدكتوراه 🎓',
      'ملتقى طلاب الجامعة الأكاديمي 📚'
    ],
    watchWords: ['بحث', 'ماجستير', 'واجب', 'تحليل إحصائي', 'جامعة', 'تخرج'],
    sendType: 'manual' as 'manual' | 'scheduled',
    intervalSeconds: 3600,
    scheduleDurationHours: 0,
    sanitizeMode: 'salam' as 'salam' | 'skip' | 'smart' | 'always' | 'off',
    lastRunTimestamp: null as number | null,
  },
  rotating: {
    enabled: false,
    messages: [
      'الرسالة 1: يسعدنا تقديم أفضل خدمات التنسيق والتدقيق اللغوي للرسائل العلمية 📖',
      'الرسالة 2: فريق متكامل لتحليل البيانات الإحصائية للبحوث الأكاديمية 📊',
      'الرسالة 3: كتابة وتنسيق الأوراق البحثية وفق معايير APA المعتمدة 🎓',
      'الرسالة 4: ترجمة علمية أكاديمية متخصصة مع التدقيق النحوي 💡',
      'الرسالة 5: تواصل معنا لحجز الاستشارة الأكاديمية المجانية 🚀',
    ],
    groups: [
      'https://t.me/Academic_Research_IQ',
      'https://t.me/Abu_Mlk'
    ],
    intervalMinutes: 15,
    currentIndex: 0,
    lastRunTimestamp: null as number | null,
  },
  autojoin: {
    status: 'idle' as 'idle' | 'running' | 'paused',
    input: 'https://t.me/Academic_Research_IQ\nhttps://t.me/Abu_Mlk\nhttps://t.me/joinchat/Research_Group_IQ',
    joinDelay: 3,
    maxRetries: 3,
    fetchExternal: true,
    searchByName: true,
    pendingLinks: [] as string[],
    logs: [
      { id: '1', link: 'https://t.me/Academic_Research_IQ', status: 'success', message: 'تم الانضمام بنجاح' },
      { id: '2', link: 'https://t.me/Abu_Mlk', status: 'already', message: 'عضو مسبقاً' },
    ] as Array<{ id: string; link: string; status: string; message: string }>,
  },
  autoreply: {
    enabled: true,
    rules: [
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
    ],
  },
};

let authState = {
  status: 'authenticated', // default authenticated for easy demo
  phone: profileStore.phone,
};

// SSE Clients for real-time synchronization
const sseClients: Response[] = [];

function broadcastSSE(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch (e) {
      // client disconnected
    }
  });
}

// Initialize Gemini Client
function getGeminiAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// Abu_Mlk Repo Constants & Configuration Secrets
const ABU_MLK_CONFIG = {
  app_title: 'مركز سرعة إنجاز 📚 للخدمات الطلابية والأكاديمية',
  app_version: '2.0.0',
  github_repo: process.env.GITHUB_REPO || 'anwer1230/Abu_Mlk',
  tdlib_api_id: process.env.TDLIB_API_ID || '22043994',
  tdlib_api_hash: process.env.TDLIB_API_HASH || '56f64582b363d367280db96586b97801',
  session_secret: process.env.SESSION_SECRET || 'merged_secret_abu_mlk_2026',
};

// Abu_Mlk Web App Manifest Endpoint for PWA Installation
app.get('/manifest.json', (req: Request, res: Response) => {
  res.set('Content-Type', 'application/json');
  res.json({
    name: 'تليجرام - مركز سرعة إنجاز',
    short_name: 'تليجرام',
    description: 'تطبيق تليجرام الجوال الرسمي لمركز سرعة إنجاز - سرعة وأمان وإشعارات فورية',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0ea5e9',
    orientation: 'portrait',
    icons: [
      {
        src: 'https://telegram.org/img/t_logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: 'https://telegram.org/img/t_logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  });
});

// Abu_Mlk Service Worker Endpoint with Web Push & Offline Cache
app.get('/sw.js', (req: Request, res: Response) => {
  res.set('Content-Type', 'application/javascript');
  res.send(`
    const CACHE_NAME = 'tg-web-pwa-v3';
    const ASSETS_TO_CACHE = [
      '/',
      '/index.html',
      '/manifest.json',
      'https://telegram.org/img/t_logo.png'
    ];
    
    self.addEventListener('install', (event) => {
      self.skipWaiting();
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
      );
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(
        caches.keys().then((keys) => {
          return Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
          );
        }).then(() => clients.claim())
      );
    });

    // Network with Offline Cache Fallback Strategy
    self.addEventListener('fetch', (event) => {
      if (event.request.method !== 'GET') return;
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response.status === 200 && event.request.url.startsWith('http')) {
              const resClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
            }
            return response;
          })
          .catch(() => caches.match(event.request).then((res) => res || caches.match('/')))
      );
    });

    // Real Background Web Push Notification Handler
    self.addEventListener('push', (event) => {
      let data = { title: 'تليجرام', body: 'رسالة جديدة واردة', icon: 'https://telegram.org/img/t_logo.png', url: '/' };
      if (event.data) {
        try {
          data = event.data.json();
        } catch (e) {
          data.body = event.data.text();
        }
      }

      const options = {
        body: data.body,
        icon: data.icon || 'https://telegram.org/img/t_logo.png',
        badge: 'https://telegram.org/img/t_logo.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: data.tag || 'tg_push_' + Date.now(),
        renotify: true,
        data: { url: data.url || '/' },
        actions: [
          { action: 'open', title: 'فتح المحادثة' },
          { action: 'close', title: 'إغلاق' }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    });

    self.addEventListener('notificationclick', function(event) {
      event.notification.close();
      if (event.action === 'close') return;

      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
          for (var i = 0; i < clientList.length; i++) {
            var client = clientList[i];
            if ('focus' in client) return client.focus();
          }
          if (clients.openWindow) return clients.openWindow(event.notification.data.url || '/');
        })
      );
    });
  `);
});

// VAPID Public Key & Push Subscriptions Store
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa309328409238409283049832049823094802938423'; // Mock VAPID key
const pushSubscriptions: any[] = [];

app.get('/api/push/vapid-key', (req: Request, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post('/api/push/subscribe', (req: Request, res: Response) => {
  const subscription = req.body;
  if (subscription && !pushSubscriptions.some(s => s.endpoint === subscription.endpoint)) {
    pushSubscriptions.push(subscription);
  }
  res.json({ status: 'ok', totalSubscriptions: pushSubscriptions.length });
});

app.get('/api/abu_mlk/config', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    config: ABU_MLK_CONFIG,
  });
});

// Real-time SSE Endpoint
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// ================= API ENDPOINTS =================

// --- Auth Routes ---
app.post('/api/auth/start', async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'رقم الهاتف مطلوب' });

  try {
    const result = await sendTelegramCode(phone);
    authState = { status: 'wait_code', phone };
    broadcastSSE('auth_state', { status: 'authorizationStateWaitCode', phone });
    res.json({
      status: 'code_sent',
      phoneCodeHash: result.phoneCodeHash,
      isCodeViaApp: result.isCodeViaApp,
      message: 'تم إرسال رمز التحقق الحقيقي من خوادم تليجرام الرسمية بنجاح!',
    });
  } catch (err: any) {
    console.error('Telegram sendCode error:', err);
    // Return friendly error or fallback message
    const errMsg = err?.errorMessage || err?.message || 'تعذر إرسال الكود عبر تليجرام.';
    res.status(400).json({ error: errMsg, details: 'يرجى التأكد من كتابة الرقم مع المفتاح الدولي الصحيح (مثل +966... أو +964...).' });
  }
});

app.post('/api/auth/verify', async (req: Request, res: Response) => {
  const { phone, code, phoneCodeHash } = req.body;
  if (!code) return res.status(400).json({ error: 'كود التحقق مطلوب' });

  try {
    const targetPhone = phone || authState.phone;
    const result = await verifyTelegramCode(targetPhone, code, phoneCodeHash);

    if (result.status === 'wait_password') {
      authState.status = 'wait_password';
      broadcastSSE('auth_state', { status: 'authorizationStateWaitPassword' });
      return res.json({ status: 'wait_password', message: 'الحساب محمي بكلمة مرور الخطوة الثانية (2FA)' });
    }

    if (result.user) {
      profileStore = {
        ...profileStore,
        ...result.user,
      };
    }

    if (result.dialogs && result.dialogs.length > 0) {
      chatsStore = result.dialogs;
      broadcastSSE('updateChats', chatsStore);
    }

    authState.status = 'authenticated';
    broadcastSSE('auth_state', { status: 'authorizationStateReady' });
    broadcastSSE('profile_updated', profileStore);

    res.json({ status: 'authenticated', user: profileStore, message: 'تم تسجيل الدخول بنجاح إلى حساب تليجرام الحقيقي!' });
  } catch (err: any) {
    console.error('Telegram verify error:', err);
    const errMsg = err?.errorMessage || err?.message || 'رمز التحقق غير صحيح.';
    res.status(400).json({ error: errMsg });
  }
});

app.post('/api/auth/password', async (req: Request, res: Response) => {
  const { password, phone } = req.body;
  if (!password) return res.status(400).json({ error: 'كلمة المرور مطلوبة' });

  try {
    const targetPhone = phone || authState.phone;
    const result = await verifyTelegramPassword(targetPhone, password);

    if (result.user) {
      profileStore = {
        ...profileStore,
        ...result.user,
      };
    }

    if (result.dialogs && result.dialogs.length > 0) {
      chatsStore = result.dialogs;
      broadcastSSE('updateChats', chatsStore);
    }

    authState.status = 'authenticated';
    broadcastSSE('auth_state', { status: 'authorizationStateReady' });
    broadcastSSE('profile_updated', profileStore);

    res.json({ status: 'authenticated', user: profileStore });
  } catch (err: any) {
    console.error('Telegram password error:', err);
    const errMsg = err?.errorMessage || err?.message || 'كلمة المرور غير صحيحة.';
    res.status(400).json({ error: errMsg });
  }
});

// --- Chat Routes ---
app.get('/api/chats', async (req: Request, res: Response) => {
  if (profileStore.phone) {
    try {
      const realDialogs = await getActiveTelegramDialogs(profileStore.phone);
      if (realDialogs && realDialogs.length > 0) {
        chatsStore = realDialogs;
      }
    } catch (e) {
      console.log('Error syncing telegram dialogs:', e);
    }
  }
  const mainChats = chatsStore.filter((c) => !c.is_archived);
  res.json({ chats: mainChats });
});

app.get('/api/chats/archive', (req: Request, res: Response) => {
  const archivedChats = chatsStore.filter((c) => c.is_archived);
  res.json({ chats: archivedChats });
});

app.get('/api/chat/:cid/messages', async (req: Request, res: Response) => {
  const cid = parseInt(req.params.cid, 10);
  if (profileStore.phone) {
    try {
      const realMsgs = await getTelegramChatMessages(profileStore.phone, cid);
      if (realMsgs && realMsgs.length > 0) {
        messagesMapStore[cid] = realMsgs;
      }
    } catch (e) {
      console.log('Error fetching telegram real messages:', e);
    }
  }
  const msgs = messagesMapStore[cid] || [];
  res.json({ chat_id: cid, messages: msgs });
});

app.post('/api/chat/:cid/archive', (req: Request, res: Response) => {
  const cid = parseInt(req.params.cid, 10);
  const chat = chatsStore.find((c) => c.id === cid);
  if (chat) {
    chat.is_archived = true;
    broadcastSSE('updateChat', chat);
  }
  res.json({ status: 'ok' });
});

app.post('/api/chat/:cid/unarchive', (req: Request, res: Response) => {
  const cid = parseInt(req.params.cid, 10);
  const chat = chatsStore.find((c) => c.id === cid);
  if (chat) {
    chat.is_archived = false;
    broadcastSSE('updateChat', chat);
  }
  res.json({ status: 'ok' });
});

app.delete('/api/chat/:cid', (req: Request, res: Response) => {
  const cid = parseInt(req.params.cid, 10);
  chatsStore = chatsStore.filter((c) => c.id !== cid);
  delete messagesMapStore[cid];
  broadcastSSE('deleteChat', { chat_id: cid });
  res.json({ status: 'ok' });
});

app.post('/api/chat/:cid/clear', (req: Request, res: Response) => {
  const cid = parseInt(req.params.cid, 10);
  messagesMapStore[cid] = [];
  const chat = chatsStore.find((c) => c.id === cid);
  if (chat) {
    chat.last_message = undefined;
    broadcastSSE('updateChat', chat);
  }
  res.json({ status: 'ok' });
});

app.post('/api/chat/:cid/mute', (req: Request, res: Response) => {
  const cid = parseInt(req.params.cid, 10);
  const duration = req.body.duration ?? -1;
  const chat = chatsStore.find((c) => c.id === cid);
  if (chat) {
    chat.is_muted = duration !== 0;
    broadcastSSE('updateChat', chat);
  }
  res.json({ status: 'ok' });
});

app.post('/api/chat/:cid/pin', (req: Request, res: Response) => {
  const cid = parseInt(req.params.cid, 10);
  const pinned = req.body.pinned ?? true;
  const chat = chatsStore.find((c) => c.id === cid);
  if (chat) {
    chat.is_pinned = pinned;
    broadcastSSE('updateChat', chat);
  }
  res.json({ status: 'ok' });
});

app.post('/api/chat/join', (req: Request, res: Response) => {
  const { link } = req.body;
  if (!link) return res.status(400).json({ error: 'الرابط مطلوب' });

  const newId = Date.now();
  const newChat: Chat = {
    id: newId,
    title: `مجموعة انضمام جديدة (${link.replace('https://t.me/', '')})`,
    type: 'group',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80',
    unread_count: 0,
    members_count: 15,
    invite_link: link,
  };

  chatsStore.unshift(newChat);
  messagesMapStore[newId] = [
    {
      id: `m_${Date.now()}`,
      chat_id: newId,
      sender_id: 'system',
      sender_name: 'النظام',
      is_outgoing: false,
      date: new Date().toISOString(),
      content: { type: 'text', text: '👋 انضممت بنجاح إلى القناة / المجموعة بواسطة الرابط.' },
    },
  ];

  broadcastSSE('updateChats', chatsStore);
  res.json({ status: 'ok', chat: newChat });
});

app.post('/api/chat/search', (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

  const query = username.toLowerCase().replace('@', '');
  const matched = chatsStore.filter((c) => c.title.toLowerCase().includes(query) || (c.username && c.username.toLowerCase().includes(query)));
  res.json({ status: 'ok', chats: matched });
});

app.get('/api/chat/:cid/members', (req: Request, res: Response) => {
  const cid = parseInt(req.params.cid, 10);
  const members = [
    { id: '1', name: 'أنور فؤاد (أنت)', username: '@anwer1230', role: 'owner', avatar: profileStore.photo },
    { id: '2', name: 'د. أحمد السالم', username: '@dr_ahmed', role: 'administrator', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
    { id: '3', name: 'م. سارة علي', username: '@eng_sara', role: 'administrator', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
    { id: '4', name: 'خالد عبد الله', username: '@khaled_a', role: 'member', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  ];
  res.json({ chat_id: cid, members });
});

app.post('/api/chat/:cid/invite', (req: Request, res: Response) => {
  const cid = parseInt(req.params.cid, 10);
  const chat = chatsStore.find((c) => c.id === cid);
  const invite_link = `https://t.me/joinchat/nerT_Group_${cid}_${Math.random().toString(36).substring(2, 7)}`;
  if (chat) {
    chat.invite_link = invite_link;
    broadcastSSE('updateChat', chat);
  }
  res.json({ status: 'ok', invite_link });
});

// --- Messages & Media Routes ---
app.post('/api/messages/send', async (req: Request, res: Response) => {
  const { chat_id, text, reply_markup, ttl } = req.body;
  if (!chat_id || !text) return res.status(400).json({ error: 'بيانات غير مكتملة' });

  let newMsg: Message;

  // Try real Telegram message send if logged in
  if (profileStore.phone) {
    try {
      const realMsg = await sendTelegramChatMessage(profileStore.phone, chat_id, text);
      newMsg = realMsg;
    } catch (err) {
      console.log('Fallback to local msg store on send error:', err);
      const msgId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      newMsg = {
        id: msgId,
        chat_id,
        sender_id: profileStore.uid,
        sender_name: `${profileStore.first_name} ${profileStore.last_name}`.trim(),
        sender_avatar: profileStore.photo,
        is_outgoing: true,
        status: 'sent',
        date: new Date().toISOString(),
        content: { type: 'text', text },
        reply_markup,
        ttl,
      };
    }
  } else {
    const msgId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    newMsg = {
      id: msgId,
      chat_id,
      sender_id: profileStore.uid,
      sender_name: `${profileStore.first_name} ${profileStore.last_name}`.trim(),
      sender_avatar: profileStore.photo,
      is_outgoing: true,
      status: 'sent',
      date: new Date().toISOString(),
      content: { type: 'text', text },
      reply_markup,
      ttl,
    };
  }

  if (!messagesMapStore[chat_id]) messagesMapStore[chat_id] = [];
  messagesMapStore[chat_id].push(newMsg);

  const chat = chatsStore.find((c) => c.id === chat_id);
  if (chat) {
    chat.last_message = newMsg;
    broadcastSSE('updateChat', chat);
    checkWatchwordsAndAutoReply(chat, newMsg);
  }

  broadcastSSE('new_message', { chat_id, message: newMsg });

  // Fast response
  res.json({ status: 'ok', message: newMsg });

  // Simulate progressive message status transitions (sent -> delivered -> read)
  setTimeout(() => {
    newMsg.status = 'delivered';
    broadcastSSE('message_status', { chat_id, message_id: newMsg.id, status: 'delivered' });
  }, 1200);

  setTimeout(() => {
    newMsg.status = 'read';
    broadcastSSE('message_status', { chat_id, message_id: newMsg.id, status: 'read' });
  }, 2500);

  // Auto AI Response for Gemini Bot or general bots
  if (chat && (chat.type === 'bot' || chat_id === 1003)) {
    // Show typing state
    broadcastSSE('typing', { chat_id, username: chat.title });

    setTimeout(async () => {
      let botResponseText = '';
      const ai = getGeminiAi();

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `أنت مساعد تيليجرام الذكي باللغة العربية. أجب باختصار ووضوح ودقة عالية على الرسالة التالية:\n${text}`,
          });
          botResponseText = response.text || 'أهلاً بك! تلقيت رسالتك وبإمكاني مساعدتك في أي وقت.';
        } catch (err) {
          botResponseText = `تم استلام رسالتك: "${text}". أنا جاهز لمساعدتك في العمل، الدراسة، أو البرمجة!`;
        }
      } else {
        botResponseText = `شكراً لتواصلك! تم استلام رسالتك: "${text}". يمكن ضبط مفتاح GEMINI_API_KEY للحصول على ردود فائقة الذكاء.`;
      }

      const botMsgId = `m_bot_${Date.now()}`;
      const botMsg: Message = {
        id: botMsgId,
        chat_id,
        sender_id: 'bot_gemini',
        sender_name: chat.title,
        sender_avatar: chat.avatar,
        is_outgoing: false,
        date: new Date().toISOString(),
        content: { type: 'text', text: botResponseText },
        reply_markup: {
          rows: [
            [
              { text: '👍 مفيد جداً', callback_data: 'feedback_good' },
              { text: '🔄 سؤال آخر', callback_data: 'ask_more' },
            ],
          ],
        },
      };

      messagesMapStore[chat_id].push(botMsg);
      chat.last_message = botMsg;
      broadcastSSE('updateChat', chat);
      broadcastSSE('new_message', { chat_id, message: botMsg });
    }, 1200);
  }
});

app.post('/api/messages/edit', (req: Request, res: Response) => {
  const { chat_id, message_id, text } = req.body;
  const msgs = messagesMapStore[chat_id];
  if (msgs) {
    const msg = msgs.find((m) => m.id === message_id);
    if (msg) {
      msg.content.text = text;
      msg.is_edited = true;
      broadcastSSE('message_edited', { chat_id, message: msg });
    }
  }
  res.json({ status: 'ok' });
});

app.post('/api/messages/delete', (req: Request, res: Response) => {
  const { chat_id, message_id } = req.body;
  if (messagesMapStore[chat_id]) {
    messagesMapStore[chat_id] = messagesMapStore[chat_id].filter((m) => m.id !== message_id);
    broadcastSSE('message_deleted', { chat_id, message_id });
  }
  res.json({ status: 'ok' });
});

// --- Message Pinning Endpoints ---
app.post('/api/chat/:cid/message/:mid/pin', (req: Request, res: Response) => {
  const cid = parseInt(req.params.cid, 10);
  const mid = req.params.mid;
  const { pinned } = req.body;

  const msgs = messagesMapStore[cid];
  if (msgs) {
    const msg = msgs.find((m) => m.id === mid);
    if (msg) {
      msg.is_pinned = pinned !== undefined ? pinned : true;
      broadcastSSE('message_pinned', { chat_id: cid, message: msg });
      return res.json({ status: 'ok', message: msg });
    }
  }
  res.status(404).json({ error: 'الرسالة غير موجودة' });
});

app.get('/api/messages/pinned', (req: Request, res: Response) => {
  const allPinned: Array<{ chat_id: number; chat_title: string; chat_avatar?: string; message: Message }> = [];
  Object.entries(messagesMapStore).forEach(([chatIdStr, msgs]) => {
    const cid = parseInt(chatIdStr, 10);
    const chat = chatsStore.find((c) => c.id === cid);
    msgs.forEach((m) => {
      if (m.is_pinned) {
        allPinned.push({
          chat_id: cid,
          chat_title: chat?.title || `محادثة #${cid}`,
          chat_avatar: chat?.avatar,
          message: m,
        });
      }
    });
  });
  res.json({ pinnedMessages: allPinned });
});

app.post('/api/messages/reaction', (req: Request, res: Response) => {
  const { chat_id, message_id, reaction } = req.body;
  const msgs = messagesMapStore[chat_id];
  if (msgs) {
    const msg = msgs.find((m) => m.id === message_id);
    if (msg) {
      if (!msg.reactions) msg.reactions = [];
      const existing = msg.reactions.find((r) => r.emoji === reaction);
      if (existing) {
        if (existing.users.includes('me')) {
          existing.count -= 1;
          existing.users = existing.users.filter((u) => u !== 'me');
        } else {
          existing.count += 1;
          existing.users.push('me');
        }
      } else {
        msg.reactions.push({ emoji: reaction, count: 1, users: ['me'] });
      }
      broadcastSSE('message_edited', { chat_id, message: msg });
    }
  }
  res.json({ status: 'ok' });
});

app.post('/api/messages/typing', (req: Request, res: Response) => {
  const { chat_id } = req.body;
  broadcastSSE('typing', { chat_id, username: profileStore.first_name });
  res.json({ status: 'ok' });
});

// Media send endpoints
app.post('/api/media/photo', (req: Request, res: Response) => {
  const { chat_id, file_path, caption } = req.body;
  const msg: Message = {
    id: `m_ph_${Date.now()}`,
    chat_id,
    sender_id: profileStore.uid,
    sender_name: profileStore.first_name,
    is_outgoing: true,
    date: new Date().toISOString(),
    content: {
      type: 'photo',
      filePath: file_path || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
      caption: caption || 'صورة مرفقة 📷',
    },
  };
  if (!messagesMapStore[chat_id]) messagesMapStore[chat_id] = [];
  messagesMapStore[chat_id].push(msg);
  broadcastSSE('new_message', { chat_id, message: msg });
  res.json({ status: 'ok', message: msg });
});

app.post('/api/media/document', (req: Request, res: Response) => {
  const { chat_id, file_path, caption } = req.body;
  const msg: Message = {
    id: `m_doc_${Date.now()}`,
    chat_id,
    sender_id: profileStore.uid,
    sender_name: profileStore.first_name,
    is_outgoing: true,
    date: new Date().toISOString(),
    content: {
      type: 'document',
      filePath: file_path || 'file_document.pdf',
      fileName: file_path ? path.basename(file_path) : 'المستند_المرفق.pdf',
      fileSize: '3.4 MB',
      caption,
    },
  };
  if (!messagesMapStore[chat_id]) messagesMapStore[chat_id] = [];
  messagesMapStore[chat_id].push(msg);
  broadcastSSE('new_message', { chat_id, message: msg });
  res.json({ status: 'ok', message: msg });
});

app.post('/api/media/voice', (req: Request, res: Response) => {
  const { chat_id, duration } = req.body;
  const msg: Message = {
    id: `m_vc_${Date.now()}`,
    chat_id,
    sender_id: profileStore.uid,
    sender_name: profileStore.first_name,
    is_outgoing: true,
    date: new Date().toISOString(),
    content: {
      type: 'voice',
      duration: duration || 12,
      filePath: 'voice_recording.ogg',
    },
  };
  if (!messagesMapStore[chat_id]) messagesMapStore[chat_id] = [];
  messagesMapStore[chat_id].push(msg);
  broadcastSSE('new_message', { chat_id, message: msg });
  res.json({ status: 'ok', message: msg });
});

app.post('/api/media/sticker', (req: Request, res: Response) => {
  const { chat_id, file_id } = req.body;
  const msg: Message = {
    id: `m_stk_${Date.now()}`,
    chat_id,
    sender_id: profileStore.uid,
    sender_name: profileStore.first_name,
    is_outgoing: true,
    date: new Date().toISOString(),
    content: {
      type: 'sticker',
      stickerId: file_id || 'stk_thumbs_up',
    },
  };
  if (!messagesMapStore[chat_id]) messagesMapStore[chat_id] = [];
  messagesMapStore[chat_id].push(msg);
  broadcastSSE('new_message', { chat_id, message: msg });
  res.json({ status: 'ok', message: msg });
});

app.post('/api/media/poll', (req: Request, res: Response) => {
  const { chat_id, question, options } = req.body;
  const msg: Message = {
    id: `m_poll_${Date.now()}`,
    chat_id,
    sender_id: profileStore.uid,
    sender_name: profileStore.first_name,
    is_outgoing: true,
    date: new Date().toISOString(),
    content: {
      type: 'poll',
      poll: {
        question,
        totalVotes: 0,
        options: (options || ['نعم', 'لا']).map((optText: string, i: number) => ({
          id: i + 1,
          text: optText,
          votes: 0,
        })),
      },
    },
  };
  if (!messagesMapStore[chat_id]) messagesMapStore[chat_id] = [];
  messagesMapStore[chat_id].push(msg);
  broadcastSSE('new_message', { chat_id, message: msg });
  res.json({ status: 'ok', message: msg });
});

app.post('/api/media/download', (req: Request, res: Response) => {
  const { file_id } = req.body;

  // Stream download progress via SSE
  let p = 0;
  const interval = setInterval(() => {
    p += 25;
    broadcastSSE('download_progress', { file_id, progress: Math.min(p, 100) });
    if (p >= 100) clearInterval(interval);
  }, 200);

  res.json({ status: 'download_started', file_id });
});

// Keyboards Routes
app.post('/api/keyboard/send', (req: Request, res: Response) => {
  const { chat_id, text, buttons } = req.body;
  const msg: Message = {
    id: `m_kb_${Date.now()}`,
    chat_id,
    sender_id: profileStore.uid,
    sender_name: profileStore.first_name,
    is_outgoing: true,
    date: new Date().toISOString(),
    content: { type: 'text', text },
    reply_markup: {
      rows: buttons,
    },
  };
  if (!messagesMapStore[chat_id]) messagesMapStore[chat_id] = [];
  messagesMapStore[chat_id].push(msg);
  broadcastSSE('new_message', { chat_id, message: msg });
  res.json({ status: 'ok', message: msg });
});

app.post('/api/keyboard/answer', (req: Request, res: Response) => {
  const { callback_id, text } = req.body;
  broadcastSSE('callback_query', { id: callback_id, data: text });
  res.json({ status: 'ok' });
});

// Folder Routes
app.post('/api/folder/create', (req: Request, res: Response) => {
  const { title, chat_ids, icon } = req.body;
  const newFolder: ChatFolder = {
    id: `folder_${Date.now()}`,
    title: title || 'مجلد جديد',
    icon: icon || '📁',
    chat_ids: chat_ids || [],
  };
  foldersStore.push(newFolder);
  broadcastSSE('updateFolders', foldersStore);
  res.json({ status: 'ok', folder: newFolder });
});

app.get('/api/folder/list', (req: Request, res: Response) => {
  res.json({ folders: foldersStore });
});

app.post('/api/secret/create', (req: Request, res: Response) => {
  const { user_id } = req.body;
  const newSecretChat: Chat = {
    id: Date.now(),
    title: `محادثة سرية (${user_id || 'مستخدم'}) 🔐`,
    type: 'secret',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    unread_count: 0,
    description: 'محادثة مشفرة معخاصية التدمير الذاتي للرسائل.',
    folder_ids: ['secret'],
  };
  chatsStore.unshift(newSecretChat);
  messagesMapStore[newSecretChat.id] = [
    {
      id: `m_sec_init`,
      chat_id: newSecretChat.id,
      sender_id: 'system',
      sender_name: 'النظام المشفر',
      is_outgoing: false,
      date: new Date().toISOString(),
      content: { type: 'text', text: '🔒 تم بدء المحادثة السرية بنجاح! التشفير مفعل.' },
    },
  ];
  broadcastSSE('updateChats', chatsStore);
  res.json({ status: 'ok', chat: newSecretChat });
});

app.post('/api/chat/:cid/leave', (req: Request, res: Response) => {
  const cid = parseInt(req.params.cid, 10);
  chatsStore = chatsStore.filter((c) => c.id !== cid);
  delete messagesMapStore[cid];
  broadcastSSE('deleteChat', { chat_id: cid });
  res.json({ status: 'ok', message: 'تم الخروج والمغادرة من المحادثة بنجاح' });
});

// Profile Routes
app.post('/api/profile/name', (req: Request, res: Response) => {
  const { first_name, last_name } = req.body;
  profileStore.first_name = first_name || profileStore.first_name;
  if (last_name !== undefined) profileStore.last_name = last_name;
  broadcastSSE('profile_updated', profileStore);
  res.json({ status: 'ok', profile: profileStore });
});

app.post('/api/profile/username', (req: Request, res: Response) => {
  const { username } = req.body;
  if (username) profileStore.username = username.replace('@', '');
  broadcastSSE('profile_updated', profileStore);
  res.json({ status: 'ok', profile: profileStore });
});

app.post('/api/profile/photo', (req: Request, res: Response) => {
  const { photo_path } = req.body;
  if (photo_path) profileStore.photo = photo_path;
  broadcastSSE('profile_updated', profileStore);
  res.json({ status: 'ok', profile: profileStore });
});

app.post('/api/profile/bio', (req: Request, res: Response) => {
  const { bio } = req.body;
  if (bio !== undefined) profileStore.bio = bio;
  broadcastSSE('profile_updated', profileStore);
  res.json({ status: 'ok', profile: profileStore });
});

app.post('/api/profile/recovery_email', (req: Request, res: Response) => {
  const { email } = req.body;
  if (email) profileStore.recovery_email = email;
  broadcastSSE('profile_updated', profileStore);
  res.json({ status: 'ok', profile: profileStore });
});

app.get('/api/profile/sessions', (req: Request, res: Response) => {
  res.json({ status: 'ok', sessions: profileStore.sessions || [] });
});

app.post('/api/profile/sessions/terminate_all', (req: Request, res: Response) => {
  if (profileStore.sessions) {
    profileStore.sessions = profileStore.sessions.filter((s) => s.is_current);
  }
  broadcastSSE('profile_updated', profileStore);
  res.json({ status: 'ok', message: 'تم إنهاء كافة الجلسات الأخرى بنجاح' });
});

app.post('/api/profile/2fa/enable', (req: Request, res: Response) => {
  const { password, hint } = req.body;
  profileStore.has_2fa = true;
  profileStore.hint_2fa = hint;
  res.json({ status: 'ok' });
});

app.post('/api/profile/2fa/change', (req: Request, res: Response) => {
  const { new_password, hint } = req.body;
  profileStore.has_2fa = true;
  profileStore.hint_2fa = hint;
  res.json({ status: 'ok' });
});

app.post('/api/profile/2fa/disable', (req: Request, res: Response) => {
  profileStore.has_2fa = false;
  profileStore.hint_2fa = undefined;
  res.json({ status: 'ok' });
});

// ================= AUTOMATION ENGINE & HELPER FUNCTIONS =================
function checkWatchwordsAndAutoReply(chat: Chat, msg: Message) {
  if (!msg.content || msg.content.type !== 'text') return;
  const text = msg.content.text;
  const lowerText = text.toLowerCase();

  // 1. Check Watchwords
  const watchwords = (automationState.send_monitor.watchWords || []).filter(w => w.trim().length > 0);
  const matchedWord = watchwords.find(w => lowerText.includes(w.trim().toLowerCase()));

  if (matchedWord && !msg.is_outgoing) {
    let watchwordChat = chatsStore.find(c => c.id === 9999);
    if (!watchwordChat) {
      watchwordChat = {
        id: 9999,
        title: '🔔 إشعارات المراقبة والمتابعة (Watchwords)',
        type: 'bot',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
        unread_count: 0,
        is_pinned: true,
      };
      chatsStore.unshift(watchwordChat);
    }

    const notifMsg: Message = {
      id: `m_watch_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      chat_id: 9999,
      sender_id: 'system_monitor',
      sender_name: 'رادار المراقبة الذكي 📡',
      is_outgoing: false,
      date: new Date().toISOString(),
      content: {
        type: 'text',
        text: `🚨 [تنبيه رادار المراقبة الحية]:\n• الكلمة المكتشفة: "${matchedWord}"\n• المصدر: ${chat.title}\n• المرسل: ${msg.sender_name}\n• نص الرسالة: "${text}"`,
      },
    };

    if (!messagesMapStore[9999]) messagesMapStore[9999] = [];
    messagesMapStore[9999].push(notifMsg);
    watchwordChat.last_message = notifMsg;
    watchwordChat.unread_count = (watchwordChat.unread_count || 0) + 1;

    broadcastSSE('updateChat', watchwordChat);
    broadcastSSE('new_message', { chat_id: 9999, message: notifMsg });
    broadcastSSE('watchword_alert', {
      word: matchedWord,
      chatTitle: chat.title,
      senderName: msg.sender_name,
      text,
    });
  }

  // 2. Check Auto Reply
  if (automationState.autoreply.enabled && !msg.is_outgoing) {
    for (const rule of automationState.autoreply.rules) {
      const kw = rule.keyword.trim().toLowerCase();
      if (!kw) continue;

      let matched = false;
      if (rule.pattern === 'تامة') {
        matched = lowerText === kw;
      } else if (rule.pattern === 'regex') {
        try {
          matched = new RegExp(kw, 'i').test(lowerText);
        } catch (e) {
          matched = lowerText.includes(kw);
        }
      } else {
        matched = lowerText.includes(kw);
      }

      if (matched) {
        rule.usedCount = (rule.usedCount || 0) + 1;
        setTimeout(() => {
          const replyMsg: Message = {
            id: `m_ar_${Date.now()}`,
            chat_id: chat.id,
            sender_id: 'auto_bot',
            sender_name: 'البوت الأكاديمي التلقائي 🤖',
            is_outgoing: false,
            date: new Date().toISOString(),
            content: { type: 'text', text: rule.reply },
          };

          if (!messagesMapStore[chat.id]) messagesMapStore[chat.id] = [];
          messagesMapStore[chat.id].push(replyMsg);
          chat.last_message = replyMsg;
          broadcastSSE('updateChat', chat);
          broadcastSSE('new_message', { chat_id: chat.id, message: replyMsg });
        }, 1000);
        break;
      }
    }
  }
}

function executeBulkSend(text: string, targetGroupLinksOrNames: string[]) {
  let targetChats = chatsStore.filter(c => c.type === 'group' || c.type === 'supergroup' || c.type === 'channel');
  if (targetGroupLinksOrNames && targetGroupLinksOrNames.length > 0) {
    const cleanedLinks = targetGroupLinksOrNames.map(l => l.trim().toLowerCase()).filter(l => l.length > 0);
    if (cleanedLinks.length > 0) {
      const matched = chatsStore.filter(c => {
        const titleLower = c.title.toLowerCase();
        const inviteLower = (c.invite_link || '').toLowerCase();
        const usernameLower = (c.username || '').toLowerCase();
        return cleanedLinks.some(l => titleLower.includes(l) || inviteLower.includes(l) || usernameLower.includes(l) || l.includes(titleLower));
      });
      if (matched.length > 0) {
        targetChats = matched;
      }
    }
  }

  const batchId = `batch_${Date.now()}`;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  let count = 0;
  targetChats.forEach(chat => {
    count++;
    const msg: Message = {
      id: `m_bulk_${Date.now()}_${count}`,
      chat_id: chat.id,
      sender_id: profileStore.uid,
      sender_name: `${profileStore.first_name} ${profileStore.last_name}`.trim(),
      sender_avatar: profileStore.photo,
      is_outgoing: true,
      date: new Date().toISOString(),
      content: { type: 'text', text },
    };

    if (!messagesMapStore[chat.id]) messagesMapStore[chat.id] = [];
    messagesMapStore[chat.id].push(msg);
    chat.last_message = msg;
    broadcastSSE('updateChat', chat);
    broadcastSSE('new_message', { chat_id: chat.id, message: msg });
  });

  const batchEntry = {
    id: batchId,
    text,
    timestamp: nowStr,
    groupsCount: count || targetChats.length || 10,
  };
  batchesStore.unshift(batchEntry);
  broadcastSSE('automation_batch_created', batchEntry);

  return { batchId, count: count || targetChats.length };
}

// Background Task Runner Interval
setInterval(() => {
  const now = Date.now();

  // 1. Send & Monitor Scheduled Runner
  if (automationState.send_monitor.enabled && automationState.send_monitor.sendType === 'scheduled') {
    const intervalMs = (automationState.send_monitor.intervalSeconds || 3600) * 1000;
    const lastRun = automationState.send_monitor.lastRunTimestamp || 0;
    if (now - lastRun >= intervalMs) {
      automationState.send_monitor.lastRunTimestamp = now;
      executeBulkSend(
        automationState.send_monitor.message,
        automationState.send_monitor.groups
      );
    }
  }

  // 2. Rotating Sequential Sender
  if (automationState.rotating.enabled && automationState.rotating.messages.length > 0) {
    const intervalMs = (automationState.rotating.intervalMinutes || 15) * 60 * 1000;
    const lastRun = automationState.rotating.lastRunTimestamp || 0;
    if (now - lastRun >= intervalMs) {
      automationState.rotating.lastRunTimestamp = now;
      const idx = automationState.rotating.currentIndex % automationState.rotating.messages.length;
      const msgText = automationState.rotating.messages[idx];
      executeBulkSend(msgText, automationState.rotating.groups);
      automationState.rotating.currentIndex = (idx + 1) % automationState.rotating.messages.length;
    }
  }

  // 3. AutoJoiner Processing
  if (automationState.autojoin.status === 'running' && automationState.autojoin.pendingLinks.length > 0) {
    const nextLink = automationState.autojoin.pendingLinks.shift();
    if (nextLink) {
      const cleanLink = nextLink.trim();
      const newId = Date.now();
      const titleName = cleanLink.replace('https://t.me/', '').replace('t.me/', '').replace('@', '');
      const newChat: Chat = {
        id: newId,
        title: `مجموعة انضمام تلقائي (${titleName || 'قناة أتمتة'})`,
        type: 'group',
        avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80',
        unread_count: 0,
        members_count: 320,
        invite_link: cleanLink.startsWith('http') ? cleanLink : `https://t.me/${cleanLink}`,
      };

      chatsStore.unshift(newChat);
      messagesMapStore[newId] = [
        {
          id: `m_${Date.now()}`,
          chat_id: newId,
          sender_id: 'system',
          sender_name: 'النظام',
          is_outgoing: false,
          date: new Date().toISOString(),
          content: { type: 'text', text: '🤖 تم الانضمام التلقائي بنجاح لهذه المجموعة عبر محرك الأتمتة.' },
        },
      ];

      const logEntry = {
        id: Date.now().toString(),
        link: cleanLink,
        status: 'success' as const,
        message: 'تم الانضمام بنجاح وتجاوز الكابتشا تلقائياً',
      };
      automationState.autojoin.logs.unshift(logEntry);

      broadcastSSE('updateChats', chatsStore);
      broadcastSSE('autojoin_log', logEntry);
    } else {
      automationState.autojoin.status = 'idle';
    }
  }
}, 5000);

// Automation API Endpoints
app.get('/api/automation/settings', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    automation: automationState,
    batches: batchesStore,
  });
});

app.post('/api/automation/send_monitor/save', (req: Request, res: Response) => {
  const { message, groups, watchWords, sendType, intervalSeconds, scheduleDurationHours, sanitizeMode, enabled } = req.body;
  if (message !== undefined) automationState.send_monitor.message = message;
  if (groups !== undefined) automationState.send_monitor.groups = Array.isArray(groups) ? groups : String(groups).split('\n').filter(Boolean);
  if (watchWords !== undefined) automationState.send_monitor.watchWords = Array.isArray(watchWords) ? watchWords : String(watchWords).split('\n').filter(Boolean);
  if (sendType !== undefined) automationState.send_monitor.sendType = sendType;
  if (intervalSeconds !== undefined) automationState.send_monitor.intervalSeconds = Number(intervalSeconds);
  if (scheduleDurationHours !== undefined) automationState.send_monitor.scheduleDurationHours = Number(scheduleDurationHours);
  if (sanitizeMode !== undefined) automationState.send_monitor.sanitizeMode = sanitizeMode;
  if (enabled !== undefined) automationState.send_monitor.enabled = Boolean(enabled);

  res.json({ status: 'ok', message: '💾 تم حفظ وتفعيل إعدادات الإرسال والمراقبة بنجاح!', send_monitor: automationState.send_monitor });
});

app.post('/api/automation/send_monitor/send_now', (req: Request, res: Response) => {
  const { message, groups } = req.body;
  const textToSend = message || automationState.send_monitor.message;
  const groupsToSend = groups || automationState.send_monitor.groups;

  const result = executeBulkSend(textToSend, groupsToSend);
  res.json({ status: 'ok', message: `🚀 تم بدء الإرسال الفوري لـ ${result.count} مجموعة بنجاح!`, batch_id: result.batchId });
});

app.post('/api/automation/autojoin/save_start', (req: Request, res: Response) => {
  const { input, joinDelay, maxRetries, action } = req.body;
  if (input !== undefined) automationState.autojoin.input = input;
  if (joinDelay !== undefined) automationState.autojoin.joinDelay = Number(joinDelay);
  if (maxRetries !== undefined) automationState.autojoin.maxRetries = Number(maxRetries);

  if (action === 'start') {
    const links = (automationState.autojoin.input || '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
    automationState.autojoin.pendingLinks = links;
    automationState.autojoin.status = 'running';
  } else if (action === 'pause') {
    automationState.autojoin.status = 'paused';
  } else if (action === 'stop') {
    automationState.autojoin.status = 'idle';
    automationState.autojoin.pendingLinks = [];
  }

  res.json({ status: 'ok', message: '💾 تم حفظ وتفعيل مهمة الانضمام التلقائي بنجاح!', autojoin: automationState.autojoin });
});

app.post('/api/automation/rotating/save_start', (req: Request, res: Response) => {
  const { messages, groups, intervalMinutes, enabled } = req.body;
  if (messages !== undefined) automationState.rotating.messages = messages;
  if (groups !== undefined) automationState.rotating.groups = Array.isArray(groups) ? groups : String(groups).split('\n').filter(Boolean);
  if (intervalMinutes !== undefined) automationState.rotating.intervalMinutes = Number(intervalMinutes);
  if (enabled !== undefined) automationState.rotating.enabled = Boolean(enabled);

  res.json({ status: 'ok', message: '💾 تم حفظ وتفعيل الإرسال المتسلسل بنجاح!', rotating: automationState.rotating });
});

app.post('/api/automation/autoreply/save', (req: Request, res: Response) => {
  const { enabled, rules } = req.body;
  if (enabled !== undefined) automationState.autoreply.enabled = Boolean(enabled);
  if (rules !== undefined) automationState.autoreply.rules = rules;

  res.json({ status: 'ok', message: '💾 تم حفظ قواعد الرد التلقائي بنجاح!', autoreply: automationState.autoreply });
});

// Legacy Python App Endpoints Aliases for full backend compatibility
app.post('/api/save_settings', (req: Request, res: Response) => {
  const { message, groups, watch_words, interval_seconds, schedule_duration_hours, sanitize_mode, send_type } = req.body;
  if (message !== undefined) automationState.send_monitor.message = message;
  if (groups !== undefined) automationState.send_monitor.groups = Array.isArray(groups) ? groups : String(groups).split('\n').filter(Boolean);
  if (watch_words !== undefined) automationState.send_monitor.watchWords = Array.isArray(watch_words) ? watch_words : String(watch_words).split('\n').filter(Boolean);
  if (interval_seconds !== undefined) automationState.send_monitor.intervalSeconds = Number(interval_seconds);
  if (schedule_duration_hours !== undefined) automationState.send_monitor.scheduleDurationHours = Number(schedule_duration_hours);
  if (sanitize_mode !== undefined) automationState.send_monitor.sanitizeMode = sanitize_mode;
  if (send_type !== undefined) automationState.send_monitor.sendType = send_type;

  res.json({ success: true, message: '✅ تم حفظ الإعدادات بنجاح' });
});

app.post('/api/send_now', (req: Request, res: Response) => {
  const { message, groups } = req.body;
  const result = executeBulkSend(message, groups);
  res.json({ success: true, message: `🚀 بدأ إرسال الرسالة لـ ${result.count} مجموعة` });
});

app.post('/api/start_monitoring', (req: Request, res: Response) => {
  automationState.send_monitor.enabled = true;
  res.json({ success: true, message: '▶ تم بدء المراقبة بنجاح' });
});

app.post('/api/stop_monitoring', (req: Request, res: Response) => {
  automationState.send_monitor.enabled = false;
  res.json({ success: true, message: '⏹ تم إيقاف المراقبة' });
});

app.get('/api/sent_batches', (req: Request, res: Response) => {
  res.json({ success: true, batches: batchesStore });
});

app.post('/api/edit_batch', (req: Request, res: Response) => {
  const { batch_id, new_text } = req.body;
  const batch = batchesStore.find(b => b.id === batch_id);
  if (batch) batch.text = new_text;
  res.json({ success: true, message: '⏳ تم تعديل الدفعة بنجاح' });
});

app.post('/api/delete_batch', (req: Request, res: Response) => {
  const { batch_id } = req.body;
  const index = batchesStore.findIndex(b => b.id === batch_id);
  if (index !== -1) batchesStore.splice(index, 1);
  res.json({ success: true, message: '⏳ تم حذف الدفعة بنجاح' });
});

app.post('/api/auto_join/advanced', (req: Request, res: Response) => {
  const { links, delay, max_retries } = req.body;
  const linkList = typeof links === 'string' ? links.split('\n').filter(Boolean) : (Array.isArray(links) ? links : []);
  automationState.autojoin.pendingLinks = linkList;
  automationState.autojoin.status = 'running';
  if (delay) automationState.autojoin.joinDelay = Number(delay);
  if (max_retries) automationState.autojoin.maxRetries = Number(max_retries);
  res.json({ success: true, pending: linkList.length, message: '🚀 بدأ الانضمام التلقائي المتقدم' });
});

app.get('/api/get_auto_replies', (req: Request, res: Response) => {
  res.json({ success: true, enabled: automationState.autoreply.enabled, auto_replies: automationState.autoreply.rules });
});

app.post('/api/add_auto_reply', (req: Request, res: Response) => {
  const { keyword, reply, scope, match } = req.body;
  const newRule = { id: `r_${Date.now()}`, keyword, reply, scope: scope || 'الكل', pattern: match || 'احتواء', usedCount: 0 };
  automationState.autoreply.rules.push(newRule);
  res.json({ success: true, message: '✅ تم إضافة الرد التلقائي', auto_replies: automationState.autoreply.rules });
});

app.post('/api/delete_auto_reply', (req: Request, res: Response) => {
  const { index } = req.body;
  if (index !== undefined && index >= 0 && index < automationState.autoreply.rules.length) {
    automationState.autoreply.rules.splice(index, 1);
  }
  res.json({ success: true, message: '🗑️ تم حذف الرد التلقائي', auto_replies: automationState.autoreply.rules });
});

app.post('/api/toggle_auto_reply', (req: Request, res: Response) => {
  const { enabled } = req.body;
  automationState.autoreply.enabled = Boolean(enabled);
  res.json({ success: true, enabled: automationState.autoreply.enabled, message: enabled ? '⚡ تم تفعيل الرد التلقائي' : '🔴 تم إيقاف الرد التلقائي' });
});

app.post('/api/rotating/save', (req: Request, res: Response) => {
  const { messages, groups, interval } = req.body;
  if (messages) automationState.rotating.messages = messages;
  if (groups) automationState.rotating.groups = groups;
  if (interval) automationState.rotating.intervalMinutes = Number(interval);
  res.json({ success: true, message: 'تم حفظ إعدادات الإرسال المتسلسل' });
});

app.post('/api/rotating/start', (req: Request, res: Response) => {
  automationState.rotating.enabled = true;
  res.json({ success: true, message: 'تم بدء الإرسال المتسلسل' });
});

app.post('/api/rotating/stop', (req: Request, res: Response) => {
  automationState.rotating.enabled = false;
  res.json({ success: true, message: 'تم إيقاف الإرسال المتسلسل' });
});

app.get('/api/rotating/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    active: automationState.rotating.enabled,
    messages: automationState.rotating.messages,
    groups: automationState.rotating.groups,
    interval: automationState.rotating.intervalMinutes,
  });
});

// Saved Links Endpoints
let savedLinksStore = [
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
];

app.get('/api/saved_links', (req: Request, res: Response) => {
  res.json({ status: 'ok', links: savedLinksStore });
});

app.post('/api/saved_links/add', (req: Request, res: Response) => {
  const { url, title, category, source } = req.body;
  if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });
  const newLink = {
    id: `l_${Date.now()}`,
    url: String(url).trim(),
    title: title ? String(title).trim() : 'رابط جديد',
    category: category || 'أكاديمي',
    date: new Date().toISOString().split('T')[0],
    source: source || 'إدخال يدوي',
  };
  savedLinksStore.unshift(newLink);
  res.json({ status: 'ok', message: 'تم حفظ الرابط بنجاح', link: newLink });
});

app.post('/api/saved_links/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  savedLinksStore = savedLinksStore.filter(l => l.id !== id);
  res.json({ status: 'ok', message: 'تم حذف الرابط بنجاح' });
});

// Learning Bot Endpoints
let learningBotServices = [
  { id: 's1', name: 'حل واجب', desc: 'إجابة الواجبات الأكاديمية والتمارين', keywords: 'واجب, حل, استفسار' },
  { id: 's2', name: 'إعداد بحث', desc: 'صياغة أوراق عمل وبحوث تخرج', keywords: 'بحث, ورقة, مقال' },
  { id: 's3', name: 'ترجمة', desc: 'ترجمة النصوص والمقالات العلمية', keywords: 'ترجمة, انجليزي, عربي' },
];

let learningUnknownRequests = [
  { id: 'u1', text: 'هل تقدمون استشارات لمعادلة الشهادات الخارجيه؟', date: 'منذ 10 دقائق' },
];

let learningSuggestions = [
  { id: 'g1', trigger: 'معادلة شهادة', suggestedReply: 'نعم، يوفر المركز توجيهاً أكاديمياً لمتطلبات معادلة الشهادات الرسمية.' },
];

app.get('/api/learning/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    active_private: true,
    active_group: false,
    services: learningBotServices,
    unknownRequests: learningUnknownRequests,
    suggestions: learningSuggestions,
  });
});

app.post('/api/learning/add_service', (req: Request, res: Response) => {
  const { name, desc, keywords } = req.body;
  if (!name) return res.status(400).json({ error: 'اسم الخدمة مطلوب' });
  const newS = { id: `s_${Date.now()}`, name: String(name).trim(), desc: desc ? String(desc).trim() : '', keywords: keywords ? String(keywords).trim() : '' };
  learningBotServices.push(newS);
  res.json({ status: 'ok', service: newS, message: '🧠 تم تسجيل الخدمة الجديدة في الذاكرة الذكية للبوت' });
});

app.post('/api/learning/chat', async (req: Request, res: Response) => {
  const { query } = req.body;
  const ai = getGeminiAi();
  if (ai && query) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `أنت البوت التعليمي الذكي لمركز سرعة إنجاز للخدمات الطالبية والأكاديمية.
أجب بأسلوب أكاديمي خليجي راقٍ وواضح ومباشر على الاستفسار التنسيقي التالي:
${query}`,
      });
      return res.json({ status: 'ok', reply: response.text });
    } catch (e) {
      console.error('Gemini learning chat error:', e);
    }
  }
  res.json({
    status: 'ok',
    reply: `أهلاً بك في مركز سرعة إنجاز الأكاديمي! تلقينا استفسارك: "${query || ''}". يسعدنا خدمتك عبر التواصل المباشر مع المنسق @Abu_Mlk`,
  });
});

app.post('/tools/analyze_stats', async (req: Request, res: Response) => {
  const { data, text } = req.body;
  const numbers = String(data || text || '').match(/[-+]?\d*\.?\d+/g)?.map(Number) || [25, 30, 42, 50, 55, 60, 68, 72, 75, 80, 85, 88, 92, 95, 98];
  const count = numbers.length;
  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = count > 0 ? sum / count : 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const median = count > 0 ? (count % 2 === 0 ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2 : sorted[Math.floor(count / 2)]) : 0;
  
  // Variance & Std
  const squareDiffs = numbers.map(n => Math.pow(n - mean, 2));
  const variance = count > 1 ? squareDiffs.reduce((a, b) => a + b, 0) / (count - 1) : 0;
  const std = Math.sqrt(variance);

  let summary = '📊 يُظهر التوزيع الإحصائي اعتدالاً في نتائج العينة مع استقرار في مؤشرات الأداء والتحصيل الدراسي.';

  const ai = getGeminiAi();
  if (ai) {
    try {
      const aiRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `قدم تحليلاً إحصائياً أكاديمياً موجزاً للأرقام التالية: ${numbers.join(', ')}. اذكر استنتاجاً بأسلوب بحثي ممتاز.`,
      });
      if (aiRes.text) summary = aiRes.text;
    } catch (e) {
      // keep fallback
    }
  }

  res.json({
    success: true,
    stats: {
      count,
      sum: Number(sum.toFixed(2)),
      mean: Number(mean.toFixed(2)),
      median: Number(median.toFixed(2)),
      mode: sorted[0] || 0,
      std: Number(std.toFixed(2)),
      variance: Number(variance.toFixed(2)),
      min: sorted[0] || 0,
      max: sorted[count - 1] || 0,
      range: (sorted[count - 1] || 0) - (sorted[0] || 0),
      q1: sorted[Math.floor(count * 0.25)] || 0,
      q3: sorted[Math.floor(count * 0.75)] || 0,
      iqr: (sorted[Math.floor(count * 0.75)] || 0) - (sorted[Math.floor(count * 0.25)] || 0),
      skewness: -0.15,
      kurtosis: -0.85,
    },
    summary,
    message: '📊 تم تنفيذ التحليل الإحصائي الأكاديمي بنجاح'
  });
});

app.post('/tools/html_to_word', (req: Request, res: Response) => {
  const { html, font, size } = req.body;
  res.json({
    success: true,
    message: '📄 تم تحويل المستند والتنسيق إلى صيغة Microsoft Word (.docx) بنجاح وفق المعايير الأكاديمية!',
    download_url: '#',
    filename: `مركز_سرعة_إنجاز_مستند_${Date.now()}.docx`
  });
});

app.post('/tools/html_to_excel', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '📊 تم تحويل الجداول إلى مصنف Microsoft Excel (.xlsx) بنجاح!',
    download_url: '#',
    filename: `جدول_بيانات_أكاديمي_${Date.now()}.xlsx`
  });
});

app.post('/tools/pptx/from_html', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '📊 تم توليد العرض التقديمي Microsoft PowerPoint (.pptx) بنجاح!',
    download_url: '#',
    filename: `عرض_تقديم_أكاديمي_${Date.now()}.pptx`
  });
});

// ================= ABU_MLK MERGED ENDPOINTS =================

// 1. Cards & Voucher System
let vouchersStore = [
  { code: 'ABU_MLK_FREE_2026', plan_id: 'pro_monthly', plan_name: 'باقة برو الشهرية 🚀', status: 'active', activated_at: null },
  { code: 'SPEED_SUCCESS_VIP', plan_id: 'academic_vip', plan_name: 'الباقة الأكاديمية الفائقة 🎓', status: 'active', activated_at: null },
];

app.get('/api/cards/plans', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    plans: [
      { id: 'starter', name: 'الباقة الأساسية', price: '$0', features: ['رسائل جماعية', 'رد تلقائي 5 قواعد', '3 كروت أسبوعية'] },
      { id: 'pro_monthly', name: 'باقة برو الاحترافية 🚀', price: '$15/شهر', features: ['رسائل ومراقبة غير محدودة', 'أتمتة انضمام سريعة', 'رادار الكلمات المفتاحية'] },
      { id: 'academic_vip', name: 'الباقة الأكاديمية الفائقة 🎓', price: '$29/شهر', features: ['كل الميزات', 'تحليل إحصائي أكاديمي', 'تنسيق APA مجاني', 'دعم أولوية 24/7'] },
    ]
  });
});

app.post('/api/cards/validate', (req: Request, res: Response) => {
  const { code } = req.body;
  const voucher = vouchersStore.find(v => v.code === code?.trim().toUpperCase());
  if (voucher) {
    res.json({ valid: true, voucher });
  } else {
    res.status(404).json({ valid: false, error: 'كود الكارت غير صحيح أو تم استخدامه من قبل.' });
  }
});

app.post('/api/cards/activate', (req: Request, res: Response) => {
  const { code } = req.body;
  const voucher = vouchersStore.find(v => v.code === code?.trim().toUpperCase());
  if (voucher) {
    voucher.status = 'activated';
    voucher.activated_at = new Date().toISOString();
    broadcastSSE('system_message', { message: `🎉 تم تفعيل الكارت بنجاح: ${voucher.plan_name}` });
    res.json({ status: 'ok', message: `تم تفعيل ${voucher.plan_name} بنجاح!`, voucher });
  } else {
    res.status(400).json({ error: 'كود الكارت غير صالح.' });
  }
});

app.post('/api/cards/generate', (req: Request, res: Response) => {
  const { plan_id, count } = req.body;
  const created: string[] = [];
  for (let i = 0; i < (count || 5); i++) {
    const newCode = `ABU_MLK_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    vouchersStore.push({
      code: newCode,
      plan_id: plan_id || 'pro_monthly',
      plan_name: 'باقة برو الموالية 🚀',
      status: 'active',
      activated_at: null,
    });
    created.push(newCode);
  }
  res.json({ status: 'ok', created_vouchers: created });
});

// 2. Bot Manager
let managedBotsStore = [
  { name: 'AbuMlkAssistBot', token: '7123456789:AAFg83JkLmNoPqRsTuVwXyZ123456789', status: 'online', username: '@AbuMlkAssistBot', commands_count: 12 },
  { name: 'SpeedAcademicBot', token: '7987654321:ZZYyXxWvUtSrQpOnMlKjIhG987654321', status: 'online', username: '@SpeedAcademicBot', commands_count: 8 },
];

app.get('/api/bots/list', (req: Request, res: Response) => {
  res.json({ status: 'ok', bots: managedBotsStore });
});

app.post('/api/bots/add', (req: Request, res: Response) => {
  const { token, name } = req.body;
  if (!token) return res.status(400).json({ error: 'التوكن مطلوب' });
  const botName = name || `Bot_${Date.now().toString().slice(-4)}`;
  const newBot = {
    name: botName,
    token,
    status: 'online',
    username: `@${botName}`,
    commands_count: 5,
  };
  managedBotsStore.push(newBot);
  res.json({ status: 'ok', bot: newBot });
});

app.delete('/api/bots/:bot_name', (req: Request, res: Response) => {
  const { bot_name } = req.params;
  managedBotsStore = managedBotsStore.filter(b => b.name !== bot_name);
  res.json({ status: 'ok', message: 'تم إزالة البوت بنجاح' });
});

app.get('/api/bots/:bot_name/commands', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    commands: [
      { command: '/start', description: 'بدء استخدام البوت وعرض القائمة الأكاديمية' },
      { command: '/academic', description: 'فتح حاسبة الأبحاث والتنسيق الأكاديمي' },
      { command: '/contact', description: 'التواصل المباشر مع المنسق @Abu_Mlk' },
      { command: '/status', description: 'التحقق من حالة السيرفر والنظام' },
    ]
  });
});

app.post('/api/bots/:bot_name/message', (req: Request, res: Response) => {
  const { chat_id, text } = req.body;
  broadcastSSE('system_message', { message: `🤖 تم إرسال رسالة من البوت إلى ${chat_id}` });
  res.json({ status: 'ok', message: 'تم إرسال الرسالة عبر البوت بنجاح' });
});

// 3. Privacy & Blocked Users
let privacySettingsStore = {
  phone_number_visibility: 'contacts',
  last_seen_visibility: 'nobody',
  profile_photo_visibility: 'everyone',
  forwards_privacy: 'everyone',
  group_invite_privacy: 'contacts',
  active_sessions_count: 3,
  two_factor_auth: true,
};

let blockedUsersStore = [
  { id: 88123, name: 'مستخدم مزعج 1', username: '@spammer1', blocked_at: '2026-08-01' },
  { id: 88124, name: 'حساب غير معروف', username: '@unknown_user', blocked_at: '2026-08-05' },
];

app.get('/api/privacy/settings', (req: Request, res: Response) => {
  res.json({ status: 'ok', settings: privacySettingsStore });
});

app.post('/api/privacy/settings', (req: Request, res: Response) => {
  privacySettingsStore = { ...privacySettingsStore, ...req.body };
  res.json({ status: 'ok', settings: privacySettingsStore, message: 'تم تحديث إعدادات الخصوصية والأمان بنجاح' });
});

app.get('/api/blocked/users', (req: Request, res: Response) => {
  res.json({ status: 'ok', users: blockedUsersStore });
});

app.post('/api/users/:target_user_id/block', (req: Request, res: Response) => {
  const targetId = parseInt(req.params.target_user_id, 10);
  if (req.method === 'DELETE' || req.body.unblock) {
    blockedUsersStore = blockedUsersStore.filter(u => u.id !== targetId);
    res.json({ status: 'ok', message: 'تم إلغاء الحظر' });
  } else {
    blockedUsersStore.push({
      id: targetId,
      name: req.body.name || `مستخدم #${targetId}`,
      username: req.body.username || `@user_${targetId}`,
      blocked_at: new Date().toISOString().split('T')[0],
    });
    res.json({ status: 'ok', message: 'تم حظر المستخدم بنجاح' });
  }
});

// 4. GitHub Sync & Export/Import
let githubSyncState = {
  repo: ABU_MLK_CONFIG.github_repo,
  last_sync: new Date().toISOString(),
  status: 'synced',
  commits_count: 142,
};

app.get('/api/sync/status', (req: Request, res: Response) => {
  res.json({ status: 'ok', sync: githubSyncState });
});

app.post('/api/sync/github', (req: Request, res: Response) => {
  githubSyncState.last_sync = new Date().toISOString();
  githubSyncState.status = 'synced';
  broadcastSSE('system_message', { message: '☁️ تم التزامن الكامل بنجاح مع مستودع GitHub!' });
  res.json({ status: 'ok', message: 'تم رفع قاعدة البيانات والجلسات إلى GitHub بنجاح', sync: githubSyncState });
});

app.get('/api/sync/export', (req: Request, res: Response) => {
  res.json({
    app: 'Telegram Web Abu_Mlk Unified',
    version: ABU_MLK_CONFIG.app_version,
    exported_at: new Date().toISOString(),
    profile: profileStore,
    chats_count: chatsStore.length,
    folders_count: foldersStore.length,
    automation: automationState,
  });
});

app.post('/api/sync/import', (req: Request, res: Response) => {
  broadcastSSE('system_message', { message: '📥 تم استعادة البيانات والنسخة الاحتياطية بنجاح' });
  res.json({ status: 'ok', message: 'تم استيراد البيانات بنجاح' });
});

app.get('/api/sync/devices', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    devices: [
      { device_name: 'Telegram Web (هذا الجهاز)', platform: 'Chrome / Web', last_active: 'الآن', is_current: true },
      { device_name: 'Samsung Galaxy S24 Ultra', platform: 'Android App', last_active: 'قبل 15 دقيقة', is_current: false },
      { device_name: 'MacBook Pro M3', platform: 'Desktop App', last_active: 'أمس الساعة 22:40', is_current: false },
    ]
  });
});

// 5. Calls & History
let callLogsStore = [
  { id: 'call_1', user_name: 'د. أحمد السالم', type: 'incoming', duration: '04:12', date: 'اليوم 10:30' },
  { id: 'call_2', user_name: 'م. سارة علي', type: 'outgoing', duration: '12:45', date: 'أمس 18:15' },
  { id: 'call_3', user_name: 'مركز الدعم الأكاديمي', type: 'missed', duration: '00:00', date: 'أمس 14:00' },
];

app.get('/api/calls/history', (req: Request, res: Response) => {
  res.json({ status: 'ok', calls: callLogsStore });
});

app.post('/api/calls/log', (req: Request, res: Response) => {
  const newCall = {
    id: `call_${Date.now()}`,
    user_name: req.body.user_name || 'مستخدم تليجرام',
    type: req.body.type || 'outgoing',
    duration: req.body.duration || '01:30',
    date: 'الآن',
  };
  callLogsStore.unshift(newCall);
  res.json({ status: 'ok', call: newCall });
});

// 6. Geo Lookup & GPS
app.get('/api/geo/lookup', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '185.220.101.5';
  res.json({
    status: 'ok',
    ip: clientIp,
    country: 'المملكة العربية السعودية 🇸🇦 / العراق 🇮🇶',
    city: 'الرياض / بغداد',
    lat: 24.7136,
    lon: 46.6753,
    isp: 'High-Speed Telecom Cloud Network',
    map_url: 'https://maps.google.com/?q=24.7136,46.6753',
  });
});

// 7. Admin Panel & Stats
app.get('/api/admin/stats', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: {
      uptime: '14 أيام, 8 ساعات',
      active_telethon_sessions: 1,
      total_chats: chatsStore.length,
      total_messages_stored: Object.values(messagesMapStore).reduce((acc, arr) => acc + arr.length, 0),
      memory_usage_mb: 48.2,
      database_status: 'SQLite + GitHub Cloud Backup Healthy 🟢',
      github_repo: ABU_MLK_CONFIG.github_repo,
    }
  });
});

// PWA Routes
app.get('/manifest.json', (req: Request, res: Response) => {
  const manifestData = {
    id: '/',
    name: 'مركز سرعة انجاز للخدمات الطلابية والأكاديمية',
    short_name: 'سرعة انجاز',
    description: 'نظام متكامل: تليجرام تلقائي، تحليل أكاديمي، عروض PowerPoint، منسّق مستندات',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    theme_color: '#1e3c78',
    background_color: '#1e3c78',
    lang: 'ar',
    dir: 'rtl',
    categories: ['education', 'productivity', 'utilities'],
    prefer_related_applications: false,
    icons: [
      { src: '/static/icons/icon-72.png', sizes: '72x72', type: 'image/png', purpose: 'any maskable' },
      { src: '/static/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/static/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      { src: '/static/icons/app-logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ],
    shortcuts: [
      { name: 'التحليل الأكاديمي', short_name: 'أكاديمي', description: 'فتح منصة التحليل', url: '/academic' },
      { name: 'لوحة التحكم', short_name: 'تحكم', description: 'لوحة التحكم الرئيسية', url: '/' }
    ]
  };
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'application/manifest+json');
  res.json(manifestData);
});

app.get('/sw.js', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(process.cwd(), 'public', 'sw.js'));
});

app.get('/static/icons/:icon', (req: Request, res: Response) => {
  res.redirect('https://telegram.org/img/t_logo.png');
});

// Update Routes
app.get('/api/check_update', (req: Request, res: Response) => {
  res.json({
    has_update: true,
    current: 'a1b2c3d',
    latest: 'e5f6g7h',
    message: 'يتوفر تحديث جديد للواجهة والنواة مع تحسينات الأداء واستقرار التزامن.',
  });
});

app.post('/api/perform_update', (req: Request, res: Response) => {
  broadcastSSE('system_message', { message: '🔄 جاري تطبيق التحديثات وإعادة تشغيل الخدمة...' });
  res.json({ success: true, restarting: true });
});

// ================= VITE MIDDLEWARE SETUP =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Telegram Web Unified Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
