import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { computeCheck } from 'telegram/Password';

const API_ID = 22043994;
const API_HASH = '56f64582b363d367280db96586b97801';

interface PendingAuth {
  client: TelegramClient;
  phoneCodeHash: string;
}

const activeClients: Record<string, TelegramClient> = {};
const pendingAuths: Record<string, PendingAuth> = {};

export function normalizeDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
}

export function normalizePhone(phone: string): string {
  let cleaned = normalizeDigits(phone.trim()).replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+') && cleaned.length > 5) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

export function getPhoneKey(phone: string): string {
  if (!phone) return '';
  return normalizeDigits(phone).replace(/[^\d]/g, '');
}

function formatUser(me: any, phone: string) {
  return {
    uid: me?.id?.toString() || 'tg_me',
    first_name: me?.firstName || 'مستخدم',
    last_name: me?.lastName || '',
    username: me?.username ? `@${me.username}` : '@user',
    phone: phone,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  };
}

export async function fetchDialogsSafe(client: TelegramClient): Promise<any[]> {
  try {
    const dialogs = await client.getDialogs({ limit: 40 });
    return dialogs.map((d: any, index: number) => {
      const chatId = Number(d.id) || Number(d.entity?.id) || index + 100;
      const title = d.title || d.name || d.entity?.firstName || 'محادثة تليجرام';
      const type = d.isGroup ? 'group' : d.isChannel ? 'channel' : d.isUser ? 'user' : 'group';
      const username = d.entity?.username ? `@${d.entity.username}` : undefined;

      let lastMsgText = d.message?.message || '';
      if (!lastMsgText && d.message?.media) {
        lastMsgText = '[صورة / وسائط]';
      }

      const lastMsgDate = d.message?.date
        ? new Date(d.message.date * 1000).toISOString()
        : new Date().toISOString();

      return {
        id: chatId,
        title: title,
        username: username,
        type: type,
        avatar:
          type === 'channel'
            ? 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=150&q=80'
            : type === 'group'
            ? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        unread_count: d.unreadCount || 0,
        last_message: d.message
          ? {
              id: `m_tg_${d.message.id}`,
              chat_id: chatId,
              sender_id: d.message.out ? 'me' : 'other',
              sender_name: d.message.out ? 'أنت' : title,
              is_outgoing: d.message.out || false,
              date: lastMsgDate,
              content: { type: 'text', text: lastMsgText || 'رسالة' },
            }
          : undefined,
      };
    });
  } catch (e) {
    console.log('Error fetching dialogs from Telegram:', e);
    return [];
  }
}

export async function sendTelegramCode(phone: string): Promise<{ phoneCodeHash: string; isCodeViaApp?: boolean }> {
  const cleanPhone = normalizePhone(phone);
  const key = getPhoneKey(phone);

  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
    useWSS: false,
  });

  await client.connect();

  const res = await client.sendCode(
    {
      apiId: API_ID,
      apiHash: API_HASH,
    },
    cleanPhone
  );

  pendingAuths[key] = {
    client,
    phoneCodeHash: res.phoneCodeHash,
  };

  return {
    phoneCodeHash: res.phoneCodeHash,
    isCodeViaApp: res.isCodeViaApp,
  };
}

export async function verifyTelegramCode(
  phone: string,
  code: string,
  phoneCodeHash?: string
): Promise<{ status: string; session?: string; user?: any; dialogs?: any[] }> {
  const cleanPhone = normalizePhone(phone);
  const cleanCode = normalizeDigits(code.trim());
  const key = getPhoneKey(phone);

  const authData = pendingAuths[key];
  const client = authData ? authData.client : activeClients[key];
  const hash = phoneCodeHash || (authData ? authData.phoneCodeHash : '');

  if (!client) {
    throw new Error('لم يتم العثور على جلسة مصادقة نشطة لهذا الرقم. يرجى إدخال الرقم مجدداً وإعادة المحاولة.');
  }

  // Check if client is already authorized
  try {
    if (await client.isUserAuthorized()) {
      activeClients[key] = client;
      if (pendingAuths[key]) delete pendingAuths[key];

      const me = (await client.getMe()) as any;
      const sessionString = (client.session as StringSession).save();
      const userDialogs = await fetchDialogsSafe(client);

      return {
        status: 'authenticated',
        session: sessionString,
        user: formatUser(me, cleanPhone),
        dialogs: userDialogs,
      };
    }
  } catch (e) {
    console.log('User authorization check info:', e);
  }

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: cleanPhone,
        phoneCodeHash: hash,
        phoneCode: cleanCode,
      })
    );

    // Save active client & session
    activeClients[key] = client;
    if (pendingAuths[key]) delete pendingAuths[key];

    const me = (await client.getMe()) as any;
    const sessionString = (client.session as StringSession).save();
    const userDialogs = await fetchDialogsSafe(client);

    return {
      status: 'authenticated',
      session: sessionString,
      user: formatUser(me, cleanPhone),
      dialogs: userDialogs,
    };
  } catch (error: any) {
    console.error('Telegram verify error details:', error);
    const errStr = String(error?.errorMessage || error?.message || error || '');

    if (errStr === 'SESSION_PASSWORD_NEEDED' || errStr.includes('SESSION_PASSWORD_NEEDED')) {
      return { status: 'wait_password' };
    }

    if (errStr.includes('PHONE_CODE_INVALID')) {
      throw new Error('رمز التحقق الذي أدخلته غير صحيح. يرجى التثبت من الرمز وإعادة المحاولة.');
    }
    if (errStr.includes('PHONE_CODE_EXPIRED')) {
      throw new Error('انتهت صلاحية رمز التحقق. يرجى طلب إرسال كود جديد.');
    }

    throw new Error(error?.errorMessage || error?.message || 'حدث خطأ أثناء التحقق من الكود مع تليجرام');
  }
}

export async function verifyTelegramPassword(phone: string, password: string) {
  const cleanPhone = normalizePhone(phone);
  const cleanPassword = normalizeDigits(password.trim());
  const key = getPhoneKey(phone);

  const client = pendingAuths[key]?.client || activeClients[key];

  if (!client) {
    throw new Error('جلسة منتهية، يرجى إدخال الرقم من جديد وإعادة المحاولة.');
  }

  try {
    const passwordSrpResult = await client.invoke(new Api.account.GetPassword());
    const passwordSrpCheck = await computeCheck(passwordSrpResult, cleanPassword);
    await client.invoke(
      new Api.auth.CheckPassword({
        password: passwordSrpCheck,
      })
    );

    activeClients[key] = client;
    if (pendingAuths[key]) delete pendingAuths[key];

    const me = (await client.getMe()) as any;
    const sessionString = (client.session as StringSession).save();
    const userDialogs = await fetchDialogsSafe(client);

    return {
      status: 'authenticated',
      session: sessionString,
      user: formatUser(me, cleanPhone),
      dialogs: userDialogs,
    };
  } catch (error: any) {
    console.error('Telegram 2FA error details:', error);
    const errStr = String(error?.errorMessage || error?.message || error || '');

    if (errStr.includes('PASSWORD_HASH_INVALID')) {
      throw new Error('كلمة المرور السحابية غير صحيحة.');
    }

    throw new Error(error?.errorMessage || error?.message || 'كلمة المرور السحابية غير صحيحة');
  }
}

export async function getTelegramChatMessages(phone: string, chatId: number | string): Promise<any[]> {
  const key = getPhoneKey(phone);
  const client = activeClients[key] || Object.values(activeClients)[0];
  if (!client) return [];

  try {
    const msgs = await client.getMessages(chatId, { limit: 40 });
    return msgs.map((m: any) => {
      const isOut = m.out || false;
      const date = m.date ? new Date(m.date * 1000).toISOString() : new Date().toISOString();
      const text = m.message || (m.media ? '[وسائط / ملف]' : '');
      const senderName = m.sender
        ? (m.sender.firstName ? `${m.sender.firstName} ${m.sender.lastName || ''}`.trim() : m.sender.title || 'مستخدم')
        : isOut
        ? 'أنت'
        : 'تليجرام';

      return {
        id: `m_tg_${m.id}`,
        chat_id: Number(chatId) || chatId,
        sender_id: m.senderId ? String(m.senderId) : isOut ? 'me' : 'other',
        sender_name: senderName,
        is_outgoing: isOut,
        date: date,
        content: { type: 'text', text: text || 'رسالة' },
      };
    }).reverse();
  } catch (e) {
    console.error('Error fetching chat messages from Telegram:', e);
    return [];
  }
}

export async function sendTelegramChatMessage(phone: string, chatId: number | string, text: string): Promise<any> {
  const key = getPhoneKey(phone);
  const client = activeClients[key] || Object.values(activeClients)[0];
  if (!client) {
    throw new Error('لم يتم العثور على جلسة تليجرام نشطة');
  }

  try {
    const res = await client.sendMessage(chatId, { message: text });
    return {
      id: `m_tg_${res.id}`,
      chat_id: Number(chatId) || chatId,
      sender_id: 'me',
      sender_name: 'أنت',
      is_outgoing: true,
      date: new Date().toISOString(),
      content: { type: 'text', text },
    };
  } catch (e: any) {
    console.error('Error sending message to Telegram:', e);
    throw new Error(e?.message || 'تعذر إرسال الرسالة عبر تليجرام');
  }
}

export async function getActiveTelegramDialogs(phone: string): Promise<any[]> {
  const key = getPhoneKey(phone);
  const client = activeClients[key] || Object.values(activeClients)[0];
  if (!client) return [];
  return await fetchDialogsSafe(client);
}


