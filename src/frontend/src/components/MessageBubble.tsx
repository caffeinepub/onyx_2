import type { Message } from "@/backend.d";
import {
  PRESET_AVATARS,
  formatTime,
  isEmojiOnly,
  isMediaContent,
} from "@/lib/onyx-utils";
import type { OnyxProfile } from "@/lib/onyx-utils";
import { Trash2 } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  message: Message;
  username: string;
  isOwn: boolean;
  isDeleted?: boolean;
  senderProfile?: { avatarUrl: string; avatarType: string };
  index: number;
  onDelete?: () => void;
}

function AvatarBubble({
  username,
  avatarUrl,
  avatarType,
  size = 32,
}: {
  username: string;
  avatarUrl?: string;
  avatarType?: string;
  size?: number;
}) {
  const initials = username.slice(0, 2).toUpperCase();

  if (avatarType === "upload" && avatarUrl) {
    return (
      <div
        className="rounded-full overflow-hidden flex-shrink-0"
        style={{
          width: size,
          height: size,
          border: "1px solid oklch(0.22 0.01 260)",
        }}
      >
        <img
          src={avatarUrl}
          alt={username}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Generate deterministic color from username
  let colorIdx = 0;
  for (let i = 0; i < username.length; i++) {
    colorIdx = (colorIdx + username.charCodeAt(i)) % PRESET_AVATARS.length;
  }
  const bgColor = avatarUrl || PRESET_AVATARS[colorIdx].bg;

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        background: bgColor,
        color: "oklch(0.08 0.005 260)",
        fontSize: size * 0.35,
        border: "1px solid oklch(0.22 0.01 260)",
      }}
    >
      {initials}
    </div>
  );
}

export default function MessageBubble({
  message,
  username,
  isOwn,
  isDeleted,
  senderProfile,
  index,
  onDelete,
}: Props) {
  const media = isMediaContent(message.content);
  const isEmoji = !media && isEmojiOnly(message.content);
  const timestamp = formatTime(message.timestamp);
  const markerIndex = index + 1;

  return (
    <motion.div
      data-ocid={`chat.item.${markerIndex}`}
      initial={
        isOwn
          ? { opacity: 0, x: 16, scale: 0.97 }
          : { opacity: 0, x: -16, scale: 0.97 }
      }
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`group flex gap-2.5 items-end max-w-[80%] ${isOwn ? "ml-auto flex-row-reverse" : "mr-auto"}`}
    >
      {/* Avatar */}
      {!isOwn && (
        <AvatarBubble
          username={username}
          avatarUrl={senderProfile?.avatarUrl}
          avatarType={senderProfile?.avatarType}
          size={28}
        />
      )}

      {/* Delete button (own messages only, left of bubble since own messages are right-aligned) */}
      {isOwn && onDelete && !isDeleted && (
        <button
          type="button"
          data-ocid={`chat.delete_button.${markerIndex}`}
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity self-center w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: "oklch(0.55 0.2 27 / 0.12)",
            color: "oklch(0.55 0.2 27)",
          }}
          title="Delete message"
        >
          <Trash2 size={11} />
        </button>
      )}

      {/* Bubble */}
      <div
        className={`flex flex-col ${isOwn ? "items-end" : "items-start"} gap-0.5`}
      >
        {/* Username label for others */}
        {!isOwn && (
          <span
            className="text-[10px] font-medium pl-1"
            style={{ color: "oklch(0.55 0.015 260)" }}
          >
            {username}
          </span>
        )}

        {isDeleted ? (
          /* Deleted message placeholder */
          <div
            className="px-3 py-2 rounded-2xl"
            style={{
              background: isOwn
                ? "oklch(0.72 0.15 55 / 0.06)"
                : "oklch(0.13 0.01 260)",
              border: isOwn
                ? "1px solid oklch(0.72 0.15 55 / 0.12)"
                : "1px solid oklch(0.18 0.01 260)",
              borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              minWidth: "80px",
            }}
          >
            <p
              className="text-xs italic"
              style={{ color: "oklch(0.35 0.01 260)" }}
            >
              Message deleted
            </p>
          </div>
        ) : (
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: isOwn
                ? "oklch(0.72 0.15 55 / 0.15)"
                : "oklch(0.15 0.01 260)",
              border: isOwn
                ? "1px solid oklch(0.72 0.15 55 / 0.3)"
                : "1px solid oklch(0.22 0.01 260)",
              borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              minWidth: "80px",
            }}
          >
            {/* Media content */}
            {media ? (
              <div className="p-1">
                {media.mimeType.startsWith("video") ? (
                  // biome-ignore lint/a11y/useMediaCaption: user-uploaded video
                  <video
                    src={media.dataUrl}
                    controls
                    className="rounded-xl max-w-[240px] max-h-[200px]"
                  />
                ) : (
                  <img
                    src={media.dataUrl}
                    alt="media"
                    className="rounded-xl max-w-[240px] max-h-[200px] object-cover"
                  />
                )}
                <div className="px-2 pb-1.5">
                  <span
                    className="text-[10px] block text-right mt-1"
                    style={{
                      color: isOwn
                        ? "oklch(0.72 0.15 55 / 0.7)"
                        : "oklch(0.45 0.015 260)",
                    }}
                  >
                    {timestamp}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-3 py-2 pb-5">
                <p
                  className={`leading-relaxed break-words ${isEmoji ? "text-3xl" : "text-sm"}`}
                  style={{
                    color: isOwn
                      ? "oklch(0.93 0.01 260)"
                      : "oklch(0.88 0.01 260)",
                  }}
                >
                  {message.content}
                </p>
                {/* Timestamp inside bubble, bottom-right */}
                <span
                  className="absolute bottom-1.5 right-2.5 text-[10px]"
                  style={{
                    color: isOwn
                      ? "oklch(0.72 0.15 55 / 0.6)"
                      : "oklch(0.4 0.012 260)",
                  }}
                >
                  {timestamp}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Own avatar */}
      {isOwn && (
        <AvatarBubble
          username={username}
          avatarUrl={senderProfile?.avatarUrl}
          avatarType={senderProfile?.avatarType}
          size={28}
        />
      )}
    </motion.div>
  );
}
