import type { Message } from "@/backend.d";
import type { OnyxProfile, OnyxRoom } from "@/lib/onyx-utils";
import {
  decodeAlias,
  encodeAlias,
  fileToDataUrl,
  formatTime,
  updateLastActive,
} from "@/lib/onyx-utils";
import { ChevronRight, Hash, Lock, Paperclip, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import EmojiPicker from "./EmojiPicker";
import MessageBubble from "./MessageBubble";

interface Props {
  profile: OnyxProfile;
  room: OnyxRoom;
  messages: Message[];
  allMessages: Message[];
  onSendMessage: (alias: string, content: string) => Promise<void>;
  isSending: boolean;
  onOpenStatus: () => void;
}

interface PendingMessage {
  id: string;
  content: string;
  timestamp: number;
  status: "pending";
  alias: string;
}

function countActiveUsers(messages: Message[], roomId: string): number {
  const recent = Date.now() - 5 * 60 * 1000; // 5 min window
  const users = new Set<string>();
  for (const m of messages) {
    if (!m.alias.startsWith(`${roomId}|`)) continue;
    const ts = Number(m.timestamp / 1_000_000n);
    if (ts > recent) {
      const decoded = decodeAlias(m.alias);
      if (decoded) users.add(decoded.username);
    }
  }
  return users.size;
}

const DELETE_PREFIX = "__DELETE__:";

export default function ChatArea({
  profile,
  room,
  messages,
  allMessages,
  onSendMessage,
  isSending,
  onOpenStatus,
}: Props) {
  const [inputText, setInputText] = useState("");
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevCountRef = useRef(0);

  // Sort messages chronologically
  const sortedMessages = [...messages].sort((a, b) => {
    const diff = a.timestamp - b.timestamp;
    return diff < 0n ? -1 : diff > 0n ? 1 : 0;
  });

  // Build a set of deleted message keys from delete-marker messages
  // Each delete marker has content: __DELETE__:<alias>:<timestamp>
  const deletedSet = new Set<string>();
  for (const msg of sortedMessages) {
    if (msg.content.startsWith(DELETE_PREFIX)) {
      const rest = msg.content.slice(DELETE_PREFIX.length);
      // alias can contain colons in theory but timestamp is always last segment
      // format: __DELETE__:<alias>:<timestamp>
      // We need to split on the last colon to get timestamp
      const lastColon = rest.lastIndexOf(":");
      if (lastColon !== -1) {
        const alias = rest.slice(0, lastColon);
        const timestamp = rest.slice(lastColon + 1);
        deletedSet.add(`${alias}|${timestamp}`);
      }
    }
  }

  // Filter out delete-marker messages from visible list
  const visibleMessages = sortedMessages.filter(
    (msg) => !msg.content.startsWith(DELETE_PREFIX),
  );

  // Remove pending messages that have been confirmed by server
  // biome-ignore lint/correctness/useExhaustiveDependencies: visibleMessages is recreated each render; using it directly avoids stale closure
  useEffect(() => {
    if (pendingMessages.length === 0) return;
    setPendingMessages((prev) =>
      prev.filter((pm) => {
        // Check if a real message with matching content appeared
        const confirmed = visibleMessages.some((msg) => {
          const decoded = decodeAlias(msg.alias);
          if (!decoded) return false;
          if (decoded.username !== profile.username) return false;
          const msgTs = Number(msg.timestamp / 1_000_000n);
          // Match by content and approximate time (within 30s)
          return (
            msg.content === pm.content && Math.abs(msgTs - pm.timestamp) < 30000
          );
        });
        return !confirmed;
      }),
    );
  }, [visibleMessages, pendingMessages.length, profile.username]);

  // Auto-scroll on new messages
  useEffect(() => {
    const count = visibleMessages.length + pendingMessages.length;
    if (count > prevCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      prevCountRef.current = count;
    }
  }, [visibleMessages.length, pendingMessages.length]);

  // Initial scroll
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only run when room changes
  useEffect(() => {
    if (visibleMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
    // Clear pending messages when switching rooms
    setPendingMessages([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]);

  // Track last active
  useEffect(() => {
    if (messages.length > 0) {
      updateLastActive(room.id);
    }
  }, [messages.length, room.id]);

  // Delete a message for everyone by posting a delete marker to the backend
  const handleDeleteMessage = useCallback(
    async (alias: string, timestamp: bigint) => {
      const markerContent = `${DELETE_PREFIX}${alias}:${timestamp.toString()}`;
      const senderAlias = encodeAlias(room.id, profile.username);
      try {
        await onSendMessage(senderAlias, markerContent);
      } catch {
        // Silently swallow — delete marker failed to post, no UI needed
      }
    },
    [room.id, profile.username, onSendMessage],
  );

  const doSend = useCallback(
    async (content: string, pendingId: string) => {
      const alias = encodeAlias(room.id, profile.username);
      try {
        await onSendMessage(alias, content);
        updateLastActive(room.id);
        // Remove this pending message (server version will appear via polling)
        setPendingMessages((prev) => prev.filter((m) => m.id !== pendingId));
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      } catch {
        // Silently remove the failed pending message — no retry UI
        setPendingMessages((prev) => prev.filter((m) => m.id !== pendingId));
      }
    },
    [room.id, profile.username, onSendMessage],
  );

  const handleSend = useCallback(async () => {
    const content = inputText.trim();
    if (!content) return;

    const pendingId = `pending-${Date.now()}-${Math.random()}`;
    const alias = encodeAlias(room.id, profile.username);

    // Optimistically add to pending list
    const newPending: PendingMessage = {
      id: pendingId,
      content,
      timestamp: Date.now(),
      status: "pending",
      alias,
    };
    setPendingMessages((prev) => [...prev, newPending]);
    setInputText("");

    // Fire and don't await — non-blocking
    doSend(content, pendingId);
  }, [inputText, profile.username, room.id, doSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleEmojiSelect = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > 1.5 * 1024 * 1024) {
      alert("File too large. Maximum 1.5MB for chat media.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const media = JSON.stringify({
        type: "media",
        dataUrl,
        mimeType: file.type || "application/octet-stream",
        fileName: file.name,
      });
      const alias = encodeAlias(room.id, profile.username);
      await onSendMessage(alias, media);
      updateLastActive(room.id);
    } catch {
      alert("Failed to upload media.");
    }
  };

  const activeUsers = countActiveUsers(allMessages, room.id);
  const isQuiet =
    visibleMessages.length === 0 &&
    Date.now() -
      (Number.parseInt(
        localStorage.getItem(`onyx_last_active_${room.id}`) ?? "0",
      ) || 0) >
      5 * 60 * 1000;

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Chat header */}
      <header
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{
          background: "oklch(0.1 0.008 260)",
          borderBottom: "1px solid oklch(0.18 0.01 260)",
        }}
      >
        <div className="flex items-center gap-2.5">
          {room.isSecret ? (
            <Lock size={15} style={{ color: "oklch(0.72 0.15 55)" }} />
          ) : (
            <Hash size={15} style={{ color: "oklch(0.45 0.015 260)" }} />
          )}
          <h2
            className="text-sm font-semibold"
            style={{ color: "oklch(0.93 0.01 260)" }}
          >
            {room.name}
          </h2>
          {activeUsers > 0 && (
            <span
              className="text-[11px] flex items-center gap-1"
              style={{ color: "oklch(0.45 0.015 260)" }}
            >
              <span style={{ color: "oklch(0.72 0.15 55)" }}>·</span>
              {activeUsers} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenStatus}
            className="hidden md:flex items-center gap-1 text-xs transition-colors"
            style={{ color: "oklch(0.4 0.012 260)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "oklch(0.72 0.15 55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "oklch(0.4 0.012 260)";
            }}
          >
            Status
            <ChevronRight size={13} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <main
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3"
        style={{ scrollbarWidth: "thin" }}
      >
        {visibleMessages.length === 0 && pendingMessages.length === 0 ? (
          <motion.div
            data-ocid="chat.empty_state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "oklch(0.13 0.01 260)",
                border: "1px solid oklch(0.2 0.01 260)",
              }}
            >
              {room.isSecret ? (
                <Lock
                  size={28}
                  style={{ color: "oklch(0.72 0.15 55 / 0.4)" }}
                />
              ) : (
                <Hash size={28} style={{ color: "oklch(0.45 0.015 260)" }} />
              )}
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "oklch(0.65 0.012 260)" }}
              >
                {isQuiet ? "Room is quiet" : "No messages yet"}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "oklch(0.4 0.012 260)" }}
              >
                {isQuiet
                  ? "Start a new conversation"
                  : `Be the first to say something in ${room.name}`}
              </p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleMessages.map((msg, i) => {
              const decoded = decodeAlias(msg.alias);
              const username = decoded?.username ?? msg.alias;
              const isOwn = username === profile.username;
              const deleteKey = `${msg.alias}|${msg.timestamp.toString()}`;
              const isDeleted = deletedSet.has(deleteKey);
              return (
                <MessageBubble
                  key={`${msg.alias}-${msg.timestamp}`}
                  message={msg}
                  username={username}
                  isOwn={isOwn}
                  isDeleted={isDeleted}
                  senderProfile={
                    isOwn
                      ? {
                          avatarUrl: profile.avatarUrl,
                          avatarType: profile.avatarType,
                        }
                      : undefined
                  }
                  index={i}
                  onDelete={() => handleDeleteMessage(msg.alias, msg.timestamp)}
                />
              );
            })}

            {/* Pending / optimistic messages */}
            {pendingMessages.map((pm, i) => (
              <motion.div
                key={pm.id}
                data-ocid={`chat.item.${visibleMessages.length + i + 1}`}
                initial={{ opacity: 0, x: 16, scale: 0.97 }}
                animate={{ opacity: 0.55, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex gap-2.5 items-end max-w-[80%] ml-auto flex-row-reverse"
              >
                {/* Own avatar placeholder */}
                <div
                  className="rounded-full flex-shrink-0 flex items-center justify-center font-semibold"
                  style={{
                    width: 28,
                    height: 28,
                    background: "oklch(0.25 0.01 260)",
                    fontSize: 10,
                    color: "oklch(0.7 0.01 260)",
                    border: "1px solid oklch(0.22 0.01 260)",
                  }}
                >
                  {profile.username.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex flex-col items-end gap-0.5">
                  {/* Message bubble */}
                  <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      background: "oklch(0.72 0.15 55 / 0.15)",
                      border: "1px solid oklch(0.72 0.15 55 / 0.3)",
                      borderRadius: "18px 18px 4px 18px",
                      minWidth: "80px",
                    }}
                  >
                    <div className="px-3 py-2 pb-5">
                      <p
                        className="text-sm leading-relaxed break-words"
                        style={{ color: "oklch(0.93 0.01 260)" }}
                      >
                        {pm.content}
                      </p>
                      <span
                        className="absolute bottom-1.5 right-2.5 text-[10px] flex items-center gap-1"
                        style={{ color: "oklch(0.72 0.15 55 / 0.6)" }}
                      >
                        <span className="inline-block w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />
                        {formatTime(BigInt(pm.timestamp) * 1_000_000n)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input bar */}
      <footer
        className="flex-shrink-0 px-3 py-3"
        style={{ borderTop: "1px solid oklch(0.15 0.008 260)" }}
      >
        <div
          className="flex items-end gap-1.5 rounded-xl px-2 py-1.5 transition-all"
          style={{
            background: "oklch(0.12 0.008 260)",
            border: "1px solid oklch(0.2 0.01 260)",
          }}
        >
          {/* Emoji picker */}
          <div className="flex-shrink-0 self-end pb-0.5">
            <EmojiPicker onSelect={handleEmojiSelect} />
          </div>

          {/* Attach */}
          <button
            type="button"
            data-ocid="chat.upload_button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 self-end pb-0.5 p-1.5 rounded-lg transition-colors"
            style={{ color: "oklch(0.45 0.015 260)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "oklch(0.72 0.15 55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "oklch(0.45 0.015 260)";
            }}
            title="Attach image/video/GIF"
          >
            <Paperclip size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.gif"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Text input */}
          <textarea
            ref={textareaRef}
            data-ocid="chat.textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${room.name}...`}
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed py-2"
            style={{
              color: "oklch(0.93 0.01 260)",
              maxHeight: "120px",
              overflowY: "auto",
            }}
            onInput={(e) => {
              const target = e.currentTarget;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />

          {/* Send button — only disabled when no text, not when isSending */}
          <button
            type="button"
            data-ocid="chat.submit_button"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="flex-shrink-0 self-end w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 active:scale-95"
            style={{
              background: inputText.trim()
                ? "oklch(0.72 0.15 55)"
                : "transparent",
              color: inputText.trim()
                ? "oklch(0.08 0.005 260)"
                : "oklch(0.35 0.012 260)",
              boxShadow: inputText.trim()
                ? "0 2px 10px oklch(0.72 0.15 55 / 0.3)"
                : "none",
            }}
          >
            {isSending ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
