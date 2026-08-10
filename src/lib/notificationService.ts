// Sound synthesizer and native OS notification manager for Telegram Web
let audioCtx: AudioContext | null = null;
let swRegistration: ServiceWorkerRegistration | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Register Service Worker for background push / OS popups
 */
export async function initNotificationServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      swRegistration = reg;
      console.log('Notification Service Worker registered successfully');
    } catch (err) {
      console.log('SW registration failed or skipped:', err);
    }
  }
}

/**
 * Synthesizes the authentic Telegram Web notification chime.
 * Double soft sine wave tone: C6 (1046.5 Hz) -> E6 (1318.5 Hz) with gentle exponential decay.
 */
export function playTelegramChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First note: C6 (1046.5Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Second note: E6 (1318.5Hz), slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.08);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.3, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.38);
  } catch (err) {
    console.error('Failed to play notification chime:', err);
  }
}

/**
 * Requests HTML5 Notification Permission from browser if needed.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'default') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      return 'denied';
    }
  }
  return Notification.permission;
}

/**
 * Triggers a native OS/browser notification.
 */
export function sendNativeNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const iconUrl = options?.icon || 'https://telegram.org/img/t_logo.png';
    const bodyText = options?.body || '';
    const tag = options?.tag || `tg_msg_${Date.now()}`;

    if (swRegistration && 'showNotification' in swRegistration) {
      swRegistration.showNotification(title, {
        body: bodyText,
        icon: iconUrl,
        badge: iconUrl,
        tag: tag,
        renotify: true,
        vibrate: [200, 100, 200],
        data: { onClickUrl: window.location.href },
      } as NotificationOptions);
    } else {
      const notification = new Notification(title, {
        body: bodyText,
        icon: iconUrl,
        tag: tag,
      });

      notification.onclick = () => {
        window.focus();
        if (options?.onClick) {
          options.onClick();
        }
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 6000);
    }
  } catch (e) {
    console.error('Error showing native notification:', e);
  }
}

/**
 * Complete Real-time Telegram Message Notification Handler
 */
export function notifyNewMessage({
  chatTitle,
  senderName,
  text,
  avatar,
  chatId,
  onClick,
}: {
  chatTitle: string;
  senderName: string;
  text: string;
  avatar?: string;
  chatId: number;
  onClick?: () => void;
}) {
  // Always play chime sound
  playTelegramChime();

  // Show native popup notification
  const title = senderName && senderName !== chatTitle ? `${senderName} • ${chatTitle}` : chatTitle;
  sendNativeNotification(title, {
    body: text || 'رسالة جديدة',
    icon: avatar || 'https://telegram.org/img/t_logo.png',
    tag: `chat_${chatId}`,
    onClick,
  });
}

export async function subscribeToWebPush(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return false;

    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      // Fetch VAPID Public Key from server
      const vapidRes = await fetch('/api/push/vapid-key');
      const { publicKey } = await vapidRes.json();

      if (publicKey) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
    }

    if (subscription) {
      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
      console.log('Web Push Subscription active and synced with server.');
      return true;
    }
  } catch (err) {
    console.error('Web Push Subscription failed:', err);
  }
  return false;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
