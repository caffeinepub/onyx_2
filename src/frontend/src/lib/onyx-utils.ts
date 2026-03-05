// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnyxVideo {
  id: string;
  title: string;
  uploaderUsername: string;
  videoDataUrl: string;
  thumbnailUrl?: string;
  isPrivate: boolean;
  isShort?: boolean;
  passwordHash: string;
  likesCount: number;
  viewCount: number;
  likedBy: string[];
  timestamp: number;
}

export interface OnyxVideoComment {
  id: string;
  videoId: string;
  commenterUsername: string;
  text: string;
  timestamp: number;
}

export interface OnyxChannel {
  username: string;
  channelName: string;
  description: string;
  createdAt: number;
}

export interface OnyxCallRecord {
  id: string;
  from: string;
  to: string;
  type: "audio" | "video";
  timestamp: number;
}

export interface OnyxProfile {
  id: string;
  username: string;
  avatarUrl: string; // data URL or preset color key
  avatarType: "upload" | "preset";
  presetIndex?: number;
}

export interface OnyxRoom {
  id: string;
  name: string;
  isSecret: boolean;
  passwordHash: string;
  creatorId: string;
  createdAt: number;
}

export interface OnyxStatus {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  timestamp: number;
}

export interface ParsedMessage {
  roomId: string;
  username: string;
  content: string;
  timestamp: bigint;
  rawAlias: string;
}

export type MediaContent = {
  type: "media";
  dataUrl: string;
  mimeType: string;
  fileName?: string;
};

export type SystemPayload =
  | { type: "room_create"; room: OnyxRoom }
  | {
      type: "room_update";
      roomId: string;
      name?: string;
      passwordHash?: string;
    }
  | { type: "status_post"; status: OnyxStatus }
  | { type: "heartbeat"; roomId: string; userId: string }
  | { type: "room_delete"; roomId: string };

// ─── Alias encoding ───────────────────────────────────────────────────────────

export function encodeAlias(roomId: string, username: string): string {
  return `${roomId}|${username}`;
}

export function decodeAlias(
  alias: string,
): { roomId: string; username: string } | null {
  if (alias === "__SYSTEM__") return null;
  const idx = alias.indexOf("|");
  if (idx === -1) return null;
  return {
    roomId: alias.slice(0, idx),
    username: alias.slice(idx + 1),
  };
}

// ─── Password hashing (simple btoa) ──────────────────────────────────────────

export function hashPassword(password: string): string {
  if (!password) return "";
  return btoa(encodeURIComponent(password));
}

export function checkPassword(password: string, hash: string): boolean {
  if (!hash) return true;
  return hashPassword(password) === hash;
}

// ─── Time formatting ──────────────────────────────────────────────────────────

export function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  const date = new Date(ms);
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function formatTimeFromMs(ms: number): string {
  const date = new Date(ms);
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function formatRelativeTime(ms: number): string {
  const now = Date.now();
  const diff = now - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ─── Profile storage ──────────────────────────────────────────────────────────

const PROFILE_KEY = "onyx_profile";
const ROOMS_KEY = "onyx_rooms";
const JOINED_ROOMS_KEY = "onyx_joined_rooms";
const STATUSES_KEY = "onyx_statuses";

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadProfile(): OnyxProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnyxProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: OnyxProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadRooms(): OnyxRoom[] {
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OnyxRoom[];
  } catch {
    return [];
  }
}

export function saveRooms(rooms: OnyxRoom[]): void {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export function loadJoinedRooms(): Set<string> {
  try {
    const raw = localStorage.getItem(JOINED_ROOMS_KEY);
    if (!raw) return new Set(["general"]);
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set(["general"]);
  }
}

export function saveJoinedRooms(rooms: Set<string>): void {
  localStorage.setItem(JOINED_ROOMS_KEY, JSON.stringify(Array.from(rooms)));
}

export function loadStatuses(): OnyxStatus[] {
  try {
    const raw = localStorage.getItem(STATUSES_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as OnyxStatus[];
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return all.filter((s) => s.timestamp > oneDayAgo);
  } catch {
    return [];
  }
}

export function saveStatuses(statuses: OnyxStatus[]): void {
  localStorage.setItem(STATUSES_KEY, JSON.stringify(statuses));
}

// ─── Default General room ─────────────────────────────────────────────────────

export const GENERAL_ROOM: OnyxRoom = {
  id: "general",
  name: "General",
  isSecret: false,
  passwordHash: "",
  creatorId: "__system__",
  createdAt: 0,
};

// ─── Preset avatar colors ─────────────────────────────────────────────────────

export const PRESET_AVATARS = [
  { bg: "oklch(0.72 0.15 55)", label: "Gold" },
  { bg: "oklch(0.55 0.18 260)", label: "Violet" },
  { bg: "oklch(0.6 0.2 200)", label: "Teal" },
  { bg: "oklch(0.6 0.22 30)", label: "Ember" },
  { bg: "oklch(0.55 0.15 320)", label: "Rose" },
  { bg: "oklch(0.5 0.12 160)", label: "Jade" },
  { bg: "oklch(0.65 0.12 90)", label: "Citrine" },
  { bg: "oklch(0.5 0.02 260)", label: "Slate" },
];

// ─── Emoji categories ─────────────────────────────────────────────────────────

export const EMOJI_CATEGORIES = {
  Smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "🥲",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "🤐",
    "🤨",
    "😐",
    "😑",
    "😶",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤥",
    "😌",
    "😔",
    "😪",
    "🤤",
    "😴",
    "😷",
    "🤒",
    "🤕",
  ],
  Gestures: [
    "👍",
    "👎",
    "👌",
    "🤌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "👈",
    "👉",
    "👆",
    "👇",
    "☝️",
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👏",
    "🙌",
    "🤲",
    "🤝",
    "🙏",
    "✍️",
    "💪",
    "🦾",
    "🦿",
    "🦵",
    "🦶",
  ],
  Hearts: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
    "❤️‍🔥",
    "❤️‍🩹",
    "🫀",
  ],
  Objects: [
    "🔥",
    "⭐",
    "✨",
    "💫",
    "🌟",
    "💥",
    "❄️",
    "🌊",
    "🎵",
    "🎶",
    "🎸",
    "💎",
    "👑",
    "🏆",
    "🎯",
    "🎪",
    "🎭",
    "🎬",
    "📱",
    "💻",
    "⌨️",
    "🖥️",
    "🖨️",
    "📷",
    "📸",
    "📹",
    "🎥",
    "📡",
    "🔭",
    "🔬",
    "🧬",
    "💊",
    "🔑",
    "🗝️",
    "🔒",
    "🔓",
  ],
  Nature: [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐙",
    "🦄",
    "🐝",
    "🦋",
    "🌸",
    "🌺",
    "🌻",
    "🌹",
    "🍀",
    "🌿",
    "🌱",
    "🌲",
    "🌳",
    "🌴",
    "🍁",
    "🍂",
    "🍃",
  ],
};

// ─── System message parsing ───────────────────────────────────────────────────

export function parseSystemMessage(content: string): SystemPayload | null {
  try {
    const payload = JSON.parse(content) as SystemPayload;
    if (payload && typeof payload === "object" && "type" in payload) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Media content ────────────────────────────────────────────────────────────

export function isMediaContent(content: string): MediaContent | null {
  try {
    const parsed = JSON.parse(content) as MediaContent;
    if (parsed && parsed.type === "media") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function isEmojiOnly(text: string): boolean {
  const emojiRegex =
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}|\s)+$/u;
  return emojiRegex.test(text.trim()) && text.trim().length > 0;
}

// ─── File to data URL ─────────────────────────────────────────────────────────

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Last active tracking ─────────────────────────────────────────────────────

export function updateLastActive(roomId: string): void {
  localStorage.setItem(`onyx_last_active_${roomId}`, String(Date.now()));
}

export function getLastActive(roomId: string): number {
  const raw = localStorage.getItem(`onyx_last_active_${roomId}`);
  return raw ? Number(raw) : 0;
}

// ─── Video storage ────────────────────────────────────────────────────────────

const VIDEOS_KEY = "onyx_videos";

export function loadVideos(): OnyxVideo[] {
  try {
    const raw = localStorage.getItem(VIDEOS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OnyxVideo[];
  } catch {
    return [];
  }
}

export function saveVideos(videos: OnyxVideo[]): void {
  localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
}

export function loadVideoComments(videoId: string): OnyxVideoComment[] {
  try {
    const raw = localStorage.getItem(`onyx_video_comments_${videoId}`);
    if (!raw) return [];
    return JSON.parse(raw) as OnyxVideoComment[];
  } catch {
    return [];
  }
}

export function saveVideoComments(
  videoId: string,
  comments: OnyxVideoComment[],
): void {
  localStorage.setItem(
    `onyx_video_comments_${videoId}`,
    JSON.stringify(comments),
  );
}

// ─── Channel storage ──────────────────────────────────────────────────────────

export function loadChannel(username: string): OnyxChannel | null {
  try {
    const raw = localStorage.getItem(`onyx_channel_${username}`);
    if (!raw) return null;
    return JSON.parse(raw) as OnyxChannel;
  } catch {
    return null;
  }
}

export function saveChannel(channel: OnyxChannel): void {
  localStorage.setItem(
    `onyx_channel_${channel.username}`,
    JSON.stringify(channel),
  );
}

// ─── Video analytics ──────────────────────────────────────────────────────────

export interface VideoAnalyticsEntry {
  viewerUsername: string;
  watchTimeSeconds: number;
  viewedAt: number;
}

export function loadVideoAnalytics(videoId: string): VideoAnalyticsEntry[] {
  try {
    const raw = localStorage.getItem(`onyx_video_analytics_${videoId}`);
    if (!raw) return [];
    return JSON.parse(raw) as VideoAnalyticsEntry[];
  } catch {
    return [];
  }
}

export function saveVideoAnalytics(
  videoId: string,
  analytics: VideoAnalyticsEntry[],
): void {
  localStorage.setItem(
    `onyx_video_analytics_${videoId}`,
    JSON.stringify(analytics),
  );
}

// ─── Message deletion ─────────────────────────────────────────────────────────

const DELETED_MESSAGES_KEY = "onyx_deleted_messages";

export function loadDeletedMessages(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_MESSAGES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveDeletedMessages(ids: Set<string>): void {
  localStorage.setItem(DELETED_MESSAGES_KEY, JSON.stringify(Array.from(ids)));
}

export function makeMessageId(alias: string, timestamp: bigint): string {
  return `${alias}_${timestamp.toString()}`;
}

// ─── Call storage ─────────────────────────────────────────────────────────────

export function getOutgoingCall(): OnyxCallRecord | null {
  try {
    const raw = localStorage.getItem("onyx_outgoing_call");
    if (!raw) return null;
    return JSON.parse(raw) as OnyxCallRecord;
  } catch {
    return null;
  }
}

export function setOutgoingCall(call: OnyxCallRecord | null): void {
  if (call) {
    localStorage.setItem("onyx_outgoing_call", JSON.stringify(call));
  } else {
    localStorage.removeItem("onyx_outgoing_call");
  }
}

export function getIncomingCall(): OnyxCallRecord | null {
  try {
    const raw = localStorage.getItem("onyx_incoming_call");
    if (!raw) return null;
    return JSON.parse(raw) as OnyxCallRecord;
  } catch {
    return null;
  }
}

export function setIncomingCall(call: OnyxCallRecord | null): void {
  if (call) {
    localStorage.setItem("onyx_incoming_call", JSON.stringify(call));
  } else {
    localStorage.removeItem("onyx_incoming_call");
  }
}
