export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface PollData {
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: number;
}

export interface MessageContent {
  type: 'text' | 'photo' | 'document' | 'voice' | 'video_note' | 'sticker' | 'animation' | 'poll' | 'location';
  text?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: string;
  duration?: number;
  stickerId?: string;
  caption?: string;
  poll?: PollData;
  location?: { latitude: number; longitude: number; title?: string };
}

export interface Message {
  id: string;
  chat_id: number;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  is_outgoing: boolean;
  content: MessageContent;
  date: string;
  reactions?: MessageReaction[];
  reply_markup?: {
    rows: InlineKeyboardButton[][];
  };
  is_edited?: boolean;
  is_pinned?: boolean;
  ttl?: number; // self destruct in seconds
  reply_to?: { id: string; sender_name: string; text: string };
  forward_from?: { sender_name: string; chat_title?: string };
  effect?: 'party' | 'heart' | 'fire' | 'zap' | 'star';
  is_silent?: boolean;
  scheduled_at?: string;
  status?: 'sent' | 'delivered' | 'read' | 'pending';
  translated_text?: string;
}

export interface ChatTopic {
  id: string;
  name: string;
  icon: string;
  unreadCount?: number;
}

export interface ChatFolder {
  id: string;
  title: string;
  icon: string;
  chat_ids: number[];
}

export interface ChatMember {
  id: string;
  name: string;
  username?: string;
  role: 'owner' | 'administrator' | 'member' | 'restricted' | 'banned';
  avatar?: string;
}

export interface Chat {
  id: number;
  title: string;
  username?: string;
  type: 'private' | 'group' | 'supergroup' | 'channel' | 'bot' | 'secret';
  avatar?: string;
  unread_count: number;
  is_pinned?: boolean;
  is_muted?: boolean;
  is_archived?: boolean;
  last_message?: Message;
  members_count?: number;
  is_verified?: boolean;
  description?: string;
  folder_ids?: string[];
  invite_link?: string;
  is_online?: boolean;
  typing_user?: string;
  wallpaper?: string;
  topics?: ChatTopic[];
  activeTopicId?: string;
}

export interface ActiveSession {
  id: string;
  device_name: string;
  app_version: string;
  ip: string;
  location: string;
  last_active: string;
  is_current: boolean;
  platform: 'desktop' | 'mobile' | 'web';
}

export interface UserProfile {
  uid: string;
  first_name: string;
  last_name: string;
  name?: string;
  username: string;
  phone: string;
  bio: string;
  photo?: string;
  avatar?: string;
  has_2fa: boolean;
  hint_2fa?: string;
  recovery_email?: string;
  sessions?: ActiveSession[];
}

export interface SystemUpdateStatus {
  has_update: boolean;
  current: string;
  latest: string;
  message?: string;
}

export interface TelegramStory {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  media_url: string;
  media_type: 'photo' | 'video';
  caption?: string;
  date: string;
  is_viewed?: boolean;
  views_count?: number;
  reactions_count?: number;
}

export interface AuthState {
  status: 'unauthenticated' | 'wait_code' | 'wait_password' | 'authenticated';
  phone?: string;
}
