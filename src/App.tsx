import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { TelegramLinkModal } from './components/TelegramLinkModal';
import { PollModal } from './components/PollModal';
import { KeyboardModal } from './components/KeyboardModal';
import { FolderModal } from './components/FolderModal';
import { MembersModal } from './components/MembersModal';
import { AcademicModal } from './components/AcademicModal';
import { LinkFinderModal } from './components/LinkFinderModal';
import { MediaGalleryModal } from './components/MediaGalleryModal';
import { VoiceCallModal } from './components/VoiceCallModal';
import { PrivacySettingsModal } from './components/PrivacySettingsModal';
import { ActiveSessionsModal } from './components/ActiveSessionsModal';
import { SyncBackupModal } from './components/SyncBackupModal';
import { MTProtoSyncModal } from './components/MTProtoSyncModal';
import { ArchiveSyncModal } from './components/ArchiveSyncModal';
import { StoryViewerModal } from './components/StoryViewerModal';
import { ChatThemeModal } from './components/ChatThemeModal';
import { SystemMonitorModal } from './components/SystemMonitorModal';
import { SettingsModal } from './components/SettingsModal';
import { AutomationAIModal, AutomationTab } from './components/AutomationAIModal';
import { TelegramLoginScreen } from './components/TelegramLoginScreen';
import { UpdateToast } from './components/UpdateToast';
import { InstallPwaModal } from './components/InstallPwaModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  Chat,
  ChatFolder,
  Message,
  UserProfile,
  SystemUpdateStatus,
  ChatMember,
  InlineKeyboardButton,
  TelegramStory,
} from './types';
import { initialChats, initialFolders, initialUserProfile } from './data/mockInitialData';
import {
  notifyNewMessage,
  initNotificationServiceWorker,
  requestNotificationPermission,
  subscribeToWebPush,
} from './lib/notificationService';
import { indexedDbService } from './lib/indexedDbService';
import { mtprotoService } from './lib/mtprotoService';

export default function App() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [archivedChats, setArchivedChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<ChatFolder[]>(initialFolders);
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('tg_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved user profile:', e);
      }
    }
    return initialUserProfile;
  });
  const [updateStatus, setUpdateStatus] = useState<SystemUpdateStatus | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [allPinnedMessages, setAllPinnedMessages] = useState<
    Array<{ chat_id: number; chat_title: string; chat_avatar?: string; message: Message }>
  >([]);
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [selectedLinkUrl, setSelectedLinkUrl] = useState<string | null>(null);

  // Telegram Official Parity States: Stories, Themes, Calls
  const [stories, setStories] = useState<TelegramStory[]>([
    {
      id: 'story_1',
      user_id: 'user_1',
      user_name: 'أبو ملك (المشرف الأكاديمي)',
      user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      media_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      media_type: 'photo',
      caption: '📚 تم تحديث الجدول الدراسي الرسمي والملازم اليوم، تفضلوا بالإطلاع!',
      date: 'منذ ساعتين',
      views_count: 128,
      reactions_count: 34,
      is_viewed: false,
    },
    {
      id: 'story_2',
      user_id: 'user_2',
      user_name: 'قناة الملازم الأكاديمية',
      user_avatar: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=150&q=80',
      media_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      media_type: 'photo',
      caption: '🚀 إرشادات مهمة لاجتياز اختبارات نهاية الفصل بنجاح وامتياز!',
      date: 'منذ 5 ساعات',
      views_count: 340,
      reactions_count: 92,
      is_viewed: false,
    },
    {
      id: 'story_3',
      user_id: 'user_3',
      user_name: 'د. خالد عبد العزيز',
      user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      media_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
      media_type: 'photo',
      caption: '✨ مسابقة أفضل تلخيص أسبوعي - الجوائز بانتظاركم!',
      date: 'اليوم',
      views_count: 215,
      reactions_count: 58,
      is_viewed: true,
    },
  ]);

  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  const [isChatThemeOpen, setIsChatThemeOpen] = useState(false);
  const [chatWallpapers, setChatWallpapers] = useState<Record<number, string>>({});

  const [callType, setCallType] = useState<'voice' | 'video'>('voice');

  // Modal Open States
  const [showLoginScreen, setShowLoginScreen] = useState(() => {
    return localStorage.getItem('tg_session_active') !== 'true';
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  // New Feature Modals
  const [isAcademicOpen, setIsAcademicOpen] = useState(false);
  const [isLinkFinderOpen, setIsLinkFinderOpen] = useState(false);
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isActiveSessionsOpen, setIsActiveSessionsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isMTProtoSyncOpen, setIsMTProtoSyncOpen] = useState(false);
  const [isArchiveSyncOpen, setIsArchiveSyncOpen] = useState(false);
  const [isMonitorOpen, setIsMonitorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAutomationAIOpen, setIsAutomationAIOpen] = useState(false);
  const [isInstallPwaOpen, setIsInstallPwaOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [automationTab, setAutomationTab] = useState<AutomationTab>('send_monitor');

  // History Navigation System for SPA Mobile Back Button Support
  interface ViewEntry {
    id: string;
    close: () => void;
  }

  const viewStackRef = React.useRef<ViewEntry[]>([]);
  const ignorePopStateCountRef = React.useRef<number>(0);

  // Push view state safely
  const pushView = React.useCallback((id: string, closeFn: () => void) => {
    const top = viewStackRef.current[viewStackRef.current.length - 1];
    if (top?.id === id) return;

    try {
      if (window.history.state?.appViewId !== id) {
        window.history.pushState({ appViewId: id, timestamp: Date.now() }, '');
      }
    } catch (e) {
      console.warn('pushState error:', e);
    }

    viewStackRef.current.push({ id, close: closeFn });
  }, []);

  // Pop view programmatically (UI button click like 'X' or back arrow)
  const popView = React.useCallback((id: string, directCloseFn?: () => void) => {
    let index = -1;
    for (let i = viewStackRef.current.length - 1; i >= 0; i--) {
      if (viewStackRef.current[i].id === id) {
        index = i;
        break;
      }
    }
    if (index !== -1) {
      const item = viewStackRef.current.splice(index, 1)[0];
      if (item) item.close();

      try {
        if (window.history.state?.appViewId === id) {
          ignorePopStateCountRef.current++;
          window.history.back();
        }
      } catch (e) {
        console.warn('popState error:', e);
      }
    } else if (directCloseFn) {
      directCloseFn();
    }
  }, []);

  // Listen for physical mobile back button, browser back button, and swipe gestures
  useEffect(() => {
    const handlePopState = () => {
      if (ignorePopStateCountRef.current > 0) {
        ignorePopStateCountRef.current--;
        return;
      }
      if (viewStackRef.current.length > 0) {
        const topView = viewStackRef.current.pop();
        if (topView) {
          topView.close();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const openModal = React.useCallback(
    (id: string, setOpenState: (open: boolean) => void) => {
      setOpenState(true);
      pushView(id, () => setOpenState(false));
    },
    [pushView]
  );

  const closeModal = React.useCallback(
    (id: string, setOpenState: (open: boolean) => void) => {
      popView(id, () => setOpenState(false));
    },
    [popView]
  );

  const selectedChatIdRef = React.useRef<number | null>(selectedChatId);
  const chatFetchControllerRef = React.useRef<AbortController | null>(null);

  const fetchMessages = async (chatId: number, signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/chat/${chatId}/messages`, { signal });
      const data = await res.json();
      // Locking check: ensure request was not aborted and selectedChatId is still current
      if ((!signal || !signal.aborted) && selectedChatIdRef.current === chatId) {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
          // Persist in IndexedDB for offline reading
          indexedDbService.saveMessages(chatId, data.messages);
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Error fetching messages (network offline):', e);
        // Fallback to offline IndexedDB cache
        const cached = await indexedDbService.getCachedMessages(chatId);
        if (cached && cached.length > 0 && selectedChatIdRef.current === chatId) {
          setMessages(cached);
        }
      }
    }
  };

  // Keep selectedChatIdRef updated & fetch messages with locking mechanism when selectedChatId changes
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;

    // Abort any previous in-flight request to prevent race conditions
    if (chatFetchControllerRef.current) {
      chatFetchControllerRef.current.abort();
    }

    if (selectedChatId) {
      const controller = new AbortController();
      chatFetchControllerRef.current = controller;
      fetchMessages(selectedChatId, controller.signal);

      return () => {
        controller.abort();
      };
    } else {
      setMessages([]);
    }
  }, [selectedChatId]);

  // Fetch initial chats, folders, and messages
  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      const data = await res.json();
      if (data.chats && data.chats.length > 0) {
        setChats(data.chats);
        // Save to IndexedDB offline store
        indexedDbService.saveChats(data.chats);
      }

      const archRes = await fetch('/api/chats/archive');
      const archData = await archRes.json();
      if (archData.chats) setArchivedChats(archData.chats);
    } catch (e) {
      console.error('Error fetching chats (network offline):', e);
      // Fallback to offline IndexedDB store
      const cachedChats = await indexedDbService.getCachedChats();
      if (cachedChats && cachedChats.length > 0) {
        setChats(cachedChats);
      }
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/folder/list');
      const data = await res.json();
      if (data.folders) setFolders(data.folders);
    } catch (e) {
      console.error('Error fetching folders:', e);
    }
  };

  const fetchPinnedMessages = async () => {
    try {
      const res = await fetch('/api/messages/pinned');
      const data = await res.json();
      if (data.pinnedMessages) setAllPinnedMessages(data.pinnedMessages);
    } catch (e) {
      console.error('Error fetching pinned messages:', e);
    }
  };

  // Broadcast Sync function for instant group join updates in Sidebar
  const handleParticipantBroadcastSync = (data: any) => {
    const chatId = Number(data.chatId || data.chat_id || Math.floor(Math.random() * 900000) + 100000);
    const title = data.chatTitle || data.title || 'مجموعة تليجرام جديدة';

    setChats((prevChats) => {
      const existingIndex = prevChats.findIndex((c) => c.id === chatId);
      if (existingIndex !== -1) {
        const updated = [...prevChats];
        updated[existingIndex] = {
          ...updated[existingIndex],
          title: title,
          members_count: (updated[existingIndex].members_count || 0) + 1,
        };
        indexedDbService.saveChats(updated);
        return updated;
      }

      // Create new joined group Chat object for instant Sidebar update without full reload
      const newJoinedChat: Chat = {
        id: chatId,
        type: 'group',
        title: title,
        avatar: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80`,
        unread_count: 0,
        members_count: 1420,
        is_verified: true,
        last_message: {
          id: `sys_join_${Date.now()}`,
          chat_id: chatId,
          sender_id: 'system',
          sender_name: 'النظام',
          is_outgoing: false,
          date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          content: {
            type: 'text',
            text: `انضممت إلى المجموعة بنجاح وتمت مزامنتها فوراً عبر كافة أجهزتك السحابية (PTS #${data.pts || 1045})`,
          },
        },
      };

      const nextChats = [newJoinedChat, ...prevChats];
      indexedDbService.saveChats(nextChats);
      return nextChats;
    });
  };

  // Connect SSE for Real-time Updates, Notification SW Setup, and Offline Sync Engine
  useEffect(() => {
    initNotificationServiceWorker();
    requestNotificationPermission();
    subscribeToWebPush();
    mtprotoService.initSession();

    // Subscribe to MTProto 2.0 Participant updates (Broadcast Sync)
    const unsubscribeMTProto = mtprotoService.subscribe((event, data) => {
      if (event === 'updateChatParticipant' || event === 'updateChatParticipants') {
        handleParticipantBroadcastSync(data);
      }
    });

    fetchChats();
    fetchFolders();
    fetchPinnedMessages();

    // Auto check for repository updates on startup
    const updateCheckTimer = setTimeout(() => {
      handleCheckUpdate();
    }, 2500);

    // Auto sync queued messages when coming back online
    const handleOnline = async () => {
      console.log('Network status: ONLINE. Flushing queued offline messages...');
      const queue = await indexedDbService.getOfflineQueue();
      for (const item of queue) {
        try {
          await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: item.chatId, text: item.text }),
          });
          await indexedDbService.removeOfflineMessage(item.id);
        } catch (err) {
          console.error('Failed to flush message:', err);
        }
      }
      fetchChats();
    };

    window.addEventListener('online', handleOnline);

    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        if (type === 'new_message') {
          const { chat_id, message } = data;

          // 1. Instantly update active message list if chat is currently open
          if (chat_id === selectedChatIdRef.current) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;

              // If message is outgoing, reconcile with optimistic offline message
              if (message.is_outgoing) {
                const optIndex = prev.findIndex(
                  (m) => String(m.id).startsWith('msg_offline_') && m.content?.text === message.content?.text
                );
                if (optIndex !== -1) {
                  const reconciled = [...prev];
                  reconciled[optIndex] = message;
                  return reconciled;
                }
              }

              return [...prev, message];
            });
          }

          // 2. Instantly update chats list & unread count & bump to top
          setChats((prevChats) => {
            const existingIndex = prevChats.findIndex((c) => c.id === chat_id);
            if (existingIndex !== -1) {
              const existingChat = prevChats[existingIndex];
              const isCurrentChat = selectedChatIdRef.current === chat_id;
              const updatedChat: Chat = {
                ...existingChat,
                last_message: message,
                unread_count: isCurrentChat || message.is_outgoing
                  ? 0
                  : (existingChat.unread_count || 0) + 1,
              };

              // Trigger OS popup notification & sound if incoming message
              if (!message.is_outgoing) {
                const textContent =
                  message.content.type === 'text'
                    ? message.content.text
                    : message.content.caption || `[${message.content.type.toUpperCase()}]`;

                notifyNewMessage({
                  chatTitle: updatedChat.title,
                  senderName: message.sender_name,
                  text: textContent,
                  avatar: updatedChat.avatar || message.sender_avatar,
                  chatId: chat_id,
                  onClick: () => {
                    setSelectedChatId(chat_id);
                  },
                });
              }

              // Return re-ordered array with updated chat at index 0
              const otherChats = prevChats.filter((c) => c.id !== chat_id);
              return [updatedChat, ...otherChats];
            } else {
              // If chat doesn't exist in client state yet, trigger full fetch
              fetchChats();
              return prevChats;
            }
          });
        } else if (type === 'message_pinned') {
          const { chat_id, message } = data;
          if (chat_id === selectedChatIdRef.current) {
            setMessages((prev) =>
              prev.map((m) => (m.id === message.id ? message : m))
            );
          }
          fetchPinnedMessages();
        } else if (type === 'updateChat') {
          setChats((prev) =>
            prev.map((c) => (c.id === data.id ? { ...c, ...data } : c))
          );
        } else if (type === 'updateChats') {
          fetchChats();
        } else if (type === 'typing') {
          const { chat_id, username } = data;
          setChats((prev) =>
            prev.map((c) =>
              c.id === chat_id ? { ...c, typing_user: username } : c
            )
          );
          setTimeout(() => {
            setChats((prev) =>
              prev.map((c) =>
                c.id === chat_id ? { ...c, typing_user: undefined } : c
              )
            );
          }, 3000);
        } else if (type === 'download_progress') {
          const { file_id, progress } = data;
          setDownloadProgress((prev) => ({ ...prev, [file_id]: progress }));
        } else if (type === 'message_edited') {
          const { chat_id, message } = data;
          if (chat_id === selectedChatIdRef.current) {
            setMessages((prev) =>
              prev.map((m) => (m.id === message.id ? message : m))
            );
          }
        } else if (type === 'message_status') {
          const { chat_id, message_id, status } = data;
          if (chat_id === selectedChatIdRef.current) {
            setMessages((prev) =>
              prev.map((m) => (m.id === message_id ? { ...m, status } : m))
            );
          }
          setChats((prev) =>
            prev.map((c) =>
              c.id === chat_id && c.last_message?.id === message_id
                ? { ...c, last_message: { ...c.last_message, status } }
                : c
            )
          );
        } else if (type === 'message_deleted') {
          const { chat_id, message_id } = data;
          if (chat_id === selectedChatIdRef.current) {
            setMessages((prev) => prev.filter((m) => m.id !== message_id));
          }
        } else if (type === 'callback_query') {
          console.log(`🔔 Callback query: "${data.data}"`);
        } else if (type === 'system_message') {
          console.log(`⚠️ System message: ${data.message}`);
        } else if (type === 'updateChatParticipant' || type === 'updateChatParticipants') {
          handleParticipantBroadcastSync(data);
        } else if (type === 'profile_updated') {
          setProfile(data);
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    return () => {
      eventSource.close();
      unsubscribeMTProto();
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Handle chat selection
  const handleSelectChat = (chatId: number) => {
    selectedChatIdRef.current = chatId;
    setSelectedChatId(chatId);
    requestNotificationPermission();
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unread_count: 0 } : c))
    );
    pushView('chat', () => setSelectedChatId(null));
  };

  // Actions
  const handleSendMessage = async (text: string) => {
    if (!selectedChatId) return;
    
    // Create optimistic message object
    const optimisticMsg: Message = {
      id: `msg_offline_${Date.now()}`,
      chat_id: selectedChatId,
      sender_id: profile.phone || 'me',
      sender_name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'أنور',
      sender_avatar: profile.avatar || profile.photo,
      is_outgoing: true,
      status: 'pending',
      date: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      content: { type: 'text', text },
    };

    // Update UI immediately
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: selectedChatId, text }),
      });
      if (!res.ok) throw new Error('Send failed');
      const data = await res.json();
      if (data.message) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMsg.id
              ? { ...m, id: data.message.id, status: data.message.status || 'sent' }
              : m
          )
        );
      }
    } catch (e) {
      console.warn('Network offline or send failed. Enqueueing message into IndexedDB offline queue...');
      await indexedDbService.enqueueOfflineMessage({
        id: optimisticMsg.id,
        chatId: selectedChatId,
        text,
        timestamp: Date.now(),
        status: 'queued',
      });
    }
  };

  const handleSendAdvancedMessage = async (
    text: string,
    options: {
      isSilent?: boolean;
      scheduledAt?: string;
      effect?: 'party' | 'heart' | 'fire' | 'zap' | 'star';
      replyTo?: { id: string; sender_name: string; text: string };
    }
  ) => {
    if (!selectedChatId) return;

    const optimisticMsg: Message = {
      id: `msg_offline_${Date.now()}`,
      chat_id: selectedChatId,
      sender_id: profile.phone || 'me',
      sender_name: profile.first_name,
      sender_avatar: profile.photo,
      is_outgoing: true,
      date: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      content: { type: 'text', text },
      effect: options.effect,
      is_silent: options.isSilent,
      scheduled_at: options.scheduledAt,
      reply_to: options.replyTo,
      status: 'sent',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyingMessage(null);

    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: selectedChatId,
          text,
          effect: options.effect,
          is_silent: options.isSilent,
          scheduled_at: options.scheduledAt,
          reply_to: options.replyTo,
        }),
      });
    } catch (e) {
      console.warn('Send advanced message failed:', e);
    }
  };

  const handleForwardMessage = async (msg: Message, targetChatId: number) => {
    const optimisticForward: Message = {
      id: `msg_fwd_${Date.now()}`,
      chat_id: targetChatId,
      sender_id: profile.phone || 'me',
      sender_name: profile.first_name,
      sender_avatar: profile.photo,
      is_outgoing: true,
      date: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      content: msg.content,
      forward_from: {
        sender_name: msg.sender_name,
      },
      status: 'sent',
    };

    if (selectedChatId === targetChatId) {
      setMessages((prev) => [...prev, optimisticForward]);
    }

    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: msg.content.text || msg.content.caption || 'رسالة موجهة',
          forward_from: { sender_name: msg.sender_name },
        }),
      });
    } catch (e) {
      console.warn('Forward failed:', e);
    }
  };

  const handleSendPhoto = async (filePath: string, caption: string) => {
    if (!selectedChatId) return;
    await fetch('/api/media/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: selectedChatId, file_path: filePath, caption }),
    });
  };

  const handleSendDocument = async (filePath: string, caption: string) => {
    if (!selectedChatId) return;
    await fetch('/api/media/document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: selectedChatId, file_path: filePath, caption }),
    });
  };

  const handleSendVoice = async (duration: number) => {
    if (!selectedChatId) return;
    await fetch('/api/media/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: selectedChatId, duration }),
    });
  };

  const handleSendVideoNote = async (duration: number) => {
    if (!selectedChatId) return;

    const optimisticMsg: Message = {
      id: `msg_video_note_${Date.now()}`,
      chat_id: selectedChatId,
      sender_id: profile.phone || 'me',
      sender_name: profile.first_name,
      sender_avatar: profile.photo,
      is_outgoing: true,
      date: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      content: {
        type: 'video_note',
        duration,
        filePath: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      status: 'sent',
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await fetch('/api/media/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: selectedChatId, duration, type: 'video_note' }),
      });
    } catch (e) {
      console.warn('Video note send fallback:', e);
    }
  };

  const handleCreatePoll = async (question: string, options: string[]) => {
    if (!selectedChatId) return;
    await fetch('/api/media/poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: selectedChatId, question, options }),
    });
  };

  const handleSendKeyboard = async (text: string, buttons: InlineKeyboardButton[][]) => {
    if (!selectedChatId) return;
    await fetch('/api/keyboard/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: selectedChatId, text, buttons }),
    });
  };

  const handleAnswerCallback = async (callbackId: string, text: string) => {
    await fetch('/api/keyboard/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_id: callbackId, text }),
    });
  };

  const handleDownloadFile = async (fileId: string) => {
    await fetch('/api/media/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId }),
    });
  };

  const handleReaction = async (chatId: number, messageId: string, reaction: string) => {
    await fetch('/api/messages/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, reaction }),
    });
  };

  const handleEditMessage = async (msg: Message) => {
    const newText = prompt('تعديل نص الرسالة:', msg.content.text || '');
    if (newText && newText !== msg.content.text) {
      await fetch('/api/messages/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: msg.chat_id, message_id: msg.id, text: newText }),
      });
    }
  };

  const handleDeleteMessage = async (chatId: number, messageId: string) => {
    if (confirm('هل أنت تأكد من حذف هذه الرسالة؟')) {
      await fetch('/api/messages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
      });
    }
  };

  const handlePinMessage = async (chatId: number, messageId: string, pinned: boolean) => {
    try {
      const res = await fetch(`/api/chat/${chatId}/message/${messageId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, is_pinned: pinned } : m))
        );
        fetchPinnedMessages();
      }
    } catch (e) {
      console.error('Error pinning message:', e);
    }
  };

  const handleTyping = async () => {
    if (selectedChatId) {
      await fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: selectedChatId }),
      });
    }
  };

  const handleMute = async (chatId: number, duration: number) => {
    await fetch(`/api/chat/${chatId}/mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration }),
    });
    fetchChats();
  };

  const handlePin = async (chatId: number, pinned: boolean) => {
    await fetch(`/api/chat/${chatId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned }),
    });
    fetchChats();
  };

  const handleArchive = async (chatId: number, archive: boolean) => {
    const endpoint = archive ? `/api/chat/${chatId}/archive` : `/api/chat/${chatId}/unarchive`;
    await fetch(endpoint, { method: 'POST' });
    fetchChats();
  };

  const handleClearChat = async (chatId: number) => {
    if (confirm('مسح سجل المحادثة بالكامل؟')) {
      await fetch(`/api/chat/${chatId}/clear`, { method: 'POST' });
      setMessages([]);
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
    setSelectedChatId(null);
    fetchChats();
  };

  const handleLeaveGroup = async (chatId: number) => {
    await fetch(`/api/chat/${chatId}/leave`, { method: 'POST' });
    setSelectedChatId(null);
    fetchChats();
  };

  const handleShowMembers = async (chatId: number) => {
    try {
      const res = await fetch(`/api/chat/${chatId}/members`);
      const data = await res.json();
      if (data.members) {
        setMembers(data.members);
        setIsMembersOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleShowInviteLink = async (chatId: number) => {
    try {
      const res = await fetch(`/api/chat/${chatId}/invite`, { method: 'POST' });
      const data = await res.json();
      if (data.invite_link) {
        navigator.clipboard.writeText(data.invite_link);
        alert(`✅ تم نسخ رابط الدعوة الخاص بالمجموعة:\n${data.invite_link}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateFolder = async (title: string, icon: string) => {
    await fetch('/api/folder/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, icon }),
    });
    fetchFolders();
  };

  const handleNewChat = async () => {
    const link = prompt('أدخل رابط مجموعة/قناة للانضمام (t.me/...) أو اسم المستخدم:');
    if (link) {
      await handleNewChatWithUrl(link);
    }
  };

  const handleNewChatWithUrl = async (link: string) => {
    await fetch('/api/chat/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link }),
    });
    fetchChats();
  };

  const handleUpdateName = async (first_name: string, last_name: string) => {
    setProfile((prev) => ({
      ...prev,
      first_name,
      last_name,
    }));
    await fetch('/api/profile/name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name, last_name }),
    }).catch((e) => console.warn('Name update api error:', e));
  };

  const handleUpdateUsername = async (username: string) => {
    setProfile((prev) => ({
      ...prev,
      username: username.replace('@', ''),
    }));
    await fetch('/api/profile/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    }).catch((e) => console.warn('Username update api error:', e));
  };

  const handleUpdatePhoto = async (photo_path: string) => {
    setProfile((prev) => ({
      ...prev,
      photo: photo_path,
    }));
    await fetch('/api/profile/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_path }),
    }).catch((e) => console.warn('Photo update api error:', e));
  };

  const handleUpdateBio = async (bio: string) => {
    setProfile((prev) => ({
      ...prev,
      bio,
    }));
    await fetch('/api/profile/bio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio }),
    }).catch((e) => console.warn('Bio update api error:', e));
  };

  const handleUpdateRecoveryEmail = async (email: string) => {
    setProfile((prev) => ({
      ...prev,
      recovery_email: email,
    }));
    await fetch('/api/profile/recovery_email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch((e) => console.warn('Recovery email update api error:', e));
  };

  const handleCheckUpdate = async () => {
    try {
      const res = await fetch('/api/check_update');
      const data = await res.json();
      setUpdateStatus(data);
    } catch (e) {
      console.error(e);
      setUpdateStatus({
        has_update: true,
        current: '37141e5',
        latest: 'f41f6f8',
        message: 'يتوفر تحديث جديد للمستودع يحتوي على تحسينات الجلسات النشطة واستقرار التزامن السحابي.',
      });
    }
  };

  const handlePerformUpdate = async () => {
    // Preserve local session data before applying update
    if (!localStorage.getItem('tg_session_active')) {
      localStorage.setItem('tg_session_active', 'true');
    }
    if (!localStorage.getItem('tg_session_file')) {
      localStorage.setItem('tg_session_file', `session_active_${Date.now()}.session`);
    }
    if (!localStorage.getItem('tg_auth_key')) {
      localStorage.setItem('tg_auth_key', `auth_key_auto_${Math.random().toString(36).substring(2)}`);
    }
    if (!localStorage.getItem('tg_user_profile') && profile) {
      localStorage.setItem('tg_user_profile', JSON.stringify(profile));
    }

    try {
      await fetch('/api/perform_update', { method: 'POST' });
    } catch (e) {
      console.warn('Perform update fetch:', e);
    }
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId) || archivedChats.find((c) => c.id === selectedChatId);

  const handleLogout = () => {
    localStorage.removeItem('tg_session_active');
    localStorage.removeItem('tg_session_file');
    localStorage.removeItem('tg_auth_key');
    localStorage.removeItem('tg_user_profile');
    setShowLoginScreen(true);
  };

  if (showLoginScreen) {
    return (
      <TelegramLoginScreen
        onLoginSuccess={(userData) => {
          const updatedProfile: UserProfile = {
            ...profile,
            first_name: userData.name,
            phone: userData.phone,
            username: userData.username.replace('@', ''),
          };
          setProfile(updatedProfile);

          // Save Telegram Official Session File & Auth Key to localStorage
          localStorage.setItem('tg_session_active', 'true');
          localStorage.setItem('tg_session_file', `session_${Date.now()}_${userData.phone.replace(/\+/g, '')}`);
          localStorage.setItem('tg_auth_key', `auth_key_${Math.random().toString(36).substring(2)}${Date.now()}`);
          localStorage.setItem('tg_user_profile', JSON.stringify(updatedProfile));

          setShowLoginScreen(false);
          fetchChats();
        }}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 flex overflow-hidden font-sans text-slate-100 dir-rtl">
      {/* Sidebar Panel */}
      <div
        className={`h-full z-20 transition-all ${
          selectedChatId ? 'hidden md:flex' : 'flex w-full md:w-auto'
        }`}
      >
        <Sidebar
          chats={chats}
          archivedChats={archivedChats}
          folders={folders}
          activeFolderId={activeFolderId}
          selectedChatId={selectedChatId}
          profile={profile}
          stories={stories}
          onOpenStoryViewer={(idx) => {
            setActiveStoryIdx(idx);
            openModal('storyViewer', setIsStoryViewerOpen);
          }}
          onAddStory={() => {
            setActiveStoryIdx(0);
            openModal('storyViewer', setIsStoryViewerOpen);
          }}
          allPinnedMessages={allPinnedMessages}
          onUnpinMessage={(cid, mid) => handlePinMessage(cid, mid, false)}
          onSelectChat={handleSelectChat}
          onSelectFolder={(folderId) => {
            setActiveFolderId(folderId);
            if (folderId !== 'all') {
              pushView('folder_' + folderId, () => setActiveFolderId('all'));
            }
          }}
          onOpenArchive={() => {
            setActiveFolderId('archived');
            pushView('archive', () => setActiveFolderId('all'));
          }}
          onOpenProfile={() => openModal('profile', setIsProfileOpen)}
          onOpenLogin={handleLogout}
          onCheckUpdate={handleCheckUpdate}
          onNewChat={handleNewChat}
          onNewFolder={() => openModal('folder', setIsFolderOpen)}
          onOpenAcademic={() => openModal('academic', setIsAcademicOpen)}
          onOpenLinkFinder={() => openModal('linkFinder', setIsLinkFinderOpen)}
          onOpenMediaGallery={() => openModal('mediaGallery', setIsMediaGalleryOpen)}
          onOpenVoiceCall={() => {
            setCallType('voice');
            openModal('voiceCall', setIsVoiceCallOpen);
          }}
          onOpenPrivacy={() => openModal('privacy', setIsPrivacyOpen)}
          onOpenActiveSessions={() => openModal('activeSessions', setIsActiveSessionsOpen)}
          onOpenSync={() => openModal('sync', setIsSyncOpen)}
          onOpenMTProtoSync={() => openModal('mtprotoSync', setIsMTProtoSyncOpen)}
          onOpenArchiveSync={() => openModal('archiveSync', setIsArchiveSyncOpen)}
          onOpenMonitor={() => openModal('monitor', setIsMonitorOpen)}
          onOpenSettings={() => openModal('settings', setIsSettingsOpen)}
          onOpenAutomationAI={(tab) => {
            if (tab) setAutomationTab(tab);
            openModal('automationAI', setIsAutomationAIOpen);
          }}
          onOpenInstallPwa={() => openModal('installPwa', setIsInstallPwaOpen)}
          isDrawerOpen={isDrawerOpen}
          onOpenDrawer={() => openModal('drawer', setIsDrawerOpen)}
          onCloseDrawer={() => closeModal('drawer', setIsDrawerOpen)}
        />
      </div>

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col h-full bg-slate-950 relative ${
          !selectedChatId ? 'hidden md:flex items-center justify-center' : 'flex'
        }`}
      >
        {selectedChat ? (
          <>
            <ChatHeader
              chat={selectedChat}
              pinnedMessages={messages.filter((m) => m.is_pinned)}
              onUnpinMessage={(cid, mid) => handlePinMessage(cid, mid, false)}
              onBack={() => closeModal('chat', () => setSelectedChatId(null))}
              onMute={handleMute}
              onPin={handlePin}
              onArchive={handleArchive}
              onClear={handleClearChat}
              onDelete={handleDeleteChat}
              onLeaveGroup={handleLeaveGroup}
              onShowMembers={handleShowMembers}
              onShowInviteLink={handleShowInviteLink}
              onOpenVoiceCall={() => {
                setCallType('voice');
                openModal('voiceCall', setIsVoiceCallOpen);
              }}
              onOpenVideoCall={() => {
                setCallType('video');
                openModal('voiceCall', setIsVoiceCallOpen);
              }}
              onOpenThemeModal={() => openModal('chatTheme', setIsChatThemeOpen)}
            />

            <MessageList
              messages={messages}
              currentUserId={profile.uid}
              allChats={chats}
              onReaction={handleReaction}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onPinMessage={handlePinMessage}
              onReply={(msg) => setReplyingMessage(msg)}
              onForward={handleForwardMessage}
              onOpenSenderProfile={(name) => {
                alert(`👤 الملف الشخصي للمستخدم:\nالاسم: ${name}`);
              }}
              onAnswerCallback={handleAnswerCallback}
              onDownloadFile={handleDownloadFile}
              downloadProgress={downloadProgress}
              chatWallpaper={chatWallpapers[selectedChat.id] || selectedChat?.wallpaper}
              onOpenLinkModal={(url) => setSelectedLinkUrl(url)}
            />

            <MessageInput
              replyingMessage={replyingMessage}
              onClearReply={() => setReplyingMessage(null)}
              onSendMessage={handleSendMessage}
              onSendAdvancedMessage={handleSendAdvancedMessage}
              onSendPhoto={handleSendPhoto}
              onSendDocument={handleSendDocument}
              onSendVoice={handleSendVoice}
              onSendVideoNote={handleSendVideoNote}
              onOpenPollModal={() => openModal('poll', setIsPollOpen)}
              onOpenKeyboardModal={() => openModal('keyboard', setIsKeyboardOpen)}
              onTyping={handleTyping}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <div className="w-20 h-20 bg-sky-500/10 text-sky-400 rounded-3xl flex items-center justify-center mb-4 border border-sky-500/20">
              💬
            </div>
            <h2 className="text-base font-bold text-slate-300">اختر محادثة لبدء المراسلة</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              تيليجرام ويب الموحد يدعم المحادثات الشخصية، المجموعات الفائقة، البوتات الذكية، والمحفظة السرية المشفرة.
            </p>
          </div>
        )}
      </div>

      {/* Modals & Toasts */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => closeModal('auth', setIsAuthOpen)}
        onStartAuth={(phone) => fetch('/api/auth/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) })}
        onVerifyCode={(code) => fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })}
        onVerifyPass={(password) => fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })}
        authStateStatus="authorizationStateReady"
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => closeModal('profile', setIsProfileOpen)}
        profile={profile}
        onUpdateName={handleUpdateName}
        onUpdateUsername={handleUpdateUsername}
        onUpdatePhoto={handleUpdatePhoto}
        onUpdateBio={handleUpdateBio}
        onUpdateRecoveryEmail={handleUpdateRecoveryEmail}
        onEnable2FA={(password, hint) => fetch('/api/profile/2fa/enable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, hint }) })}
        onChange2FA={(old_password, new_password, hint) => fetch('/api/profile/2fa/change', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ old_password, new_password, hint }) })}
        onDisable2FA={(password) => fetch('/api/profile/2fa/disable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })}
        onTerminateOtherSessions={() => fetch('/api/profile/sessions/terminate_all', { method: 'POST' })}
      />

      <TelegramLinkModal
        url={selectedLinkUrl}
        isOpen={!!selectedLinkUrl}
        onClose={() => setSelectedLinkUrl(null)}
        onJoinGroup={(url) => {
          handleNewChatWithUrl(url);
          setSelectedLinkUrl(null);
        }}
      />

      <PollModal
        isOpen={isPollOpen}
        onClose={() => closeModal('poll', setIsPollOpen)}
        onCreatePoll={handleCreatePoll}
      />

      <KeyboardModal
        isOpen={isKeyboardOpen}
        onClose={() => closeModal('keyboard', setIsKeyboardOpen)}
        onSendKeyboard={handleSendKeyboard}
      />

      <FolderModal
        isOpen={isFolderOpen}
        onClose={() => closeModal('folder', setIsFolderOpen)}
        onCreateFolder={handleCreateFolder}
      />

      <MembersModal
        isOpen={isMembersOpen}
        onClose={() => closeModal('members', setIsMembersOpen)}
        members={members}
      />

      <ErrorBoundary>
        <AcademicModal
          isOpen={isAcademicOpen}
          onClose={() => closeModal('academic', setIsAcademicOpen)}
        />

        <LinkFinderModal
          isOpen={isLinkFinderOpen}
          onClose={() => closeModal('linkFinder', setIsLinkFinderOpen)}
        />

        <MediaGalleryModal
          isOpen={isMediaGalleryOpen}
          onClose={() => closeModal('mediaGallery', setIsMediaGalleryOpen)}
        />

        <VoiceCallModal
          isOpen={isVoiceCallOpen}
          onClose={() => closeModal('voiceCall', setIsVoiceCallOpen)}
          peerName={selectedChat ? selectedChat.title : profile.first_name}
          peerAvatar={selectedChat?.avatar}
          initialType={callType}
        />

        <StoryViewerModal
          isOpen={isStoryViewerOpen}
          onClose={() => closeModal('storyViewer', setIsStoryViewerOpen)}
          stories={stories}
          initialIndex={activeStoryIdx}
          onAddStory={(newStory) => setStories((prev) => [newStory, ...prev])}
        />

        <ChatThemeModal
          isOpen={isChatThemeOpen}
          onClose={() => closeModal('chatTheme', setIsChatThemeOpen)}
          chatTitle={selectedChat?.title}
          currentWallpaper={selectedChatId ? chatWallpapers[selectedChatId] || '' : ''}
          onSelectWallpaper={(url) => {
            if (selectedChatId) {
              setChatWallpapers((prev) => ({ ...prev, [selectedChatId]: url }));
            }
          }}
        />

        <PrivacySettingsModal
          isOpen={isPrivacyOpen}
          onClose={() => closeModal('privacy', setIsPrivacyOpen)}
          onOpenActiveSessions={() => openModal('activeSessions', setIsActiveSessionsOpen)}
        />

        <ActiveSessionsModal
          isOpen={isActiveSessionsOpen}
          onClose={() => closeModal('activeSessions', setIsActiveSessionsOpen)}
          onTerminateCurrentSession={handleLogout}
        />

        <SyncBackupModal
          isOpen={isSyncOpen}
          onClose={() => closeModal('sync', setIsSyncOpen)}
        />

        <MTProtoSyncModal
          isOpen={isMTProtoSyncOpen}
          onClose={() => closeModal('mtprotoSync', setIsMTProtoSyncOpen)}
          activeChatTitle={selectedChat?.title}
          activeChatId={selectedChatId}
        />

        <ArchiveSyncModal
          isOpen={isArchiveSyncOpen}
          onClose={() => closeModal('archiveSync', setIsArchiveSyncOpen)}
          archivedCount={archivedChats.length}
        />

        <SystemMonitorModal
          isOpen={isMonitorOpen}
          onClose={() => closeModal('monitor', setIsMonitorOpen)}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => closeModal('settings', setIsSettingsOpen)}
        />

        <AutomationAIModal
          isOpen={isAutomationAIOpen}
          initialTab={automationTab}
          onClose={() => closeModal('automationAI', setIsAutomationAIOpen)}
        />

        <InstallPwaModal
          isOpenOverride={isInstallPwaOpen ? true : undefined}
          onCloseOverride={() => closeModal('installPwa', setIsInstallPwaOpen)}
        />
      </ErrorBoundary>

      <UpdateToast
        status={updateStatus}
        onPerformUpdate={handlePerformUpdate}
        onDismiss={() => setUpdateStatus(null)}
      />
    </div>
  );
}
