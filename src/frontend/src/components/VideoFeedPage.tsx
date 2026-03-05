import type {
  OnyxProfile,
  OnyxVideo,
  OnyxVideoComment,
} from "@/lib/onyx-utils";
import {
  checkPassword,
  fileToDataUrl,
  formatRelativeTime,
  generateId,
  hashPassword,
  loadVideoComments,
  loadVideos,
  saveVideoComments,
  saveVideos,
} from "@/lib/onyx-utils";
import {
  Eye,
  Heart,
  HelpCircle,
  Link as LinkIcon,
  Lock,
  MessageCircle,
  Play,
  Plus,
  Send,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

interface Props {
  profile: OnyxProfile;
}

function VideoCard({
  video,
  onPlay,
}: {
  video: OnyxVideo;
  onPlay: (video: OnyxVideo) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        background: "oklch(0.11 0.008 260)",
        border: "1px solid oklch(0.2 0.01 260)",
      }}
      onClick={() => onPlay(video)}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-video overflow-hidden"
        style={{ background: "oklch(0.09 0.008 260)" }}
      >
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={32} style={{ color: "oklch(0.35 0.012 260)" }} />
          </div>
        )}

        {/* Play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "oklch(0 0 0 / 0.5)" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: "oklch(0.72 0.15 55 / 0.9)",
              boxShadow: "0 4px 16px oklch(0.72 0.15 55 / 0.4)",
            }}
          >
            <Play size={18} style={{ color: "oklch(0.08 0.005 260)" }} />
          </div>
        </div>

        {video.isPrivate && (
          <div
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full flex items-center gap-1.5 text-[10px] font-semibold"
            style={{
              background: "oklch(0.08 0.005 260 / 0.85)",
              color: "oklch(0.72 0.15 55)",
              border: "1px solid oklch(0.72 0.15 55 / 0.3)",
            }}
          >
            <Lock size={9} />
            Private
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 space-y-1">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "oklch(0.88 0.01 260)" }}
        >
          {video.title}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "oklch(0.5 0.015 260)" }}>
            @{video.uploaderUsername}
          </p>
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "oklch(0.45 0.015 260)" }}
            >
              <Eye size={11} />
              {video.viewCount}
            </span>
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "oklch(0.45 0.015 260)" }}
            >
              <Heart size={11} />
              {video.likesCount}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Short Card ───────────────────────────────────────────────────────────────

function ShortCard({
  video,
  onPlay,
}: {
  video: OnyxVideo;
  onPlay: (video: OnyxVideo) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-shrink-0 cursor-pointer group rounded-xl overflow-hidden relative"
      style={{
        width: 120,
        aspectRatio: "9/16",
        background: "oklch(0.1 0.008 260)",
        border: "1px solid oklch(0.72 0.15 55 / 0.25)",
      }}
      onClick={() => onPlay(video)}
    >
      {/* Thumbnail / placeholder */}
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: "oklch(0.09 0.008 260)" }}
        >
          <Play size={22} style={{ color: "oklch(0.35 0.012 260)" }} />
        </div>
      )}

      {/* Overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 40%, oklch(0 0 0 / 0.75) 100%)",
        }}
      />

      {/* ⚡ SHORT badge */}
      <div
        className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
        style={{
          background: "oklch(0.72 0.15 55)",
          color: "oklch(0.08 0.005 260)",
        }}
      >
        <Zap size={8} />
        SHORT
      </div>

      {/* Play hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "oklch(0.72 0.15 55 / 0.9)",
            boxShadow: "0 4px 12px oklch(0.72 0.15 55 / 0.4)",
          }}
        >
          <Play size={14} style={{ color: "oklch(0.08 0.005 260)" }} />
        </div>
      </div>

      {/* Title & uploader */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p
          className="text-[10px] font-semibold truncate leading-tight"
          style={{ color: "oklch(0.93 0.01 260)" }}
        >
          {video.title}
        </p>
        <p
          className="text-[9px] truncate"
          style={{ color: "oklch(0.65 0.015 260)" }}
        >
          @{video.uploaderUsername}
        </p>
      </div>
    </motion.div>
  );
}

function VideoPlayer({
  video,
  profile,
  onClose,
}: {
  video: OnyxVideo;
  profile: OnyxProfile;
  onClose: () => void;
}) {
  const [unlocked, setUnlocked] = useState(!video.isPrivate);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [comments, setComments] = useState<OnyxVideoComment[]>(() =>
    loadVideoComments(video.id),
  );
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(video.likedBy.includes(profile.username));
  const [likesCount, setLikesCount] = useState(video.likesCount);
  const [copied, setCopied] = useState(false);

  const handleUnlock = () => {
    if (checkPassword(passwordInput, video.passwordHash)) {
      setUnlocked(true);
      setPasswordError("");
      // Increment view count
      const videos = loadVideos();
      const updated = videos.map((v) =>
        v.id === video.id ? { ...v, viewCount: v.viewCount + 1 } : v,
      );
      saveVideos(updated);
    } else {
      setPasswordError("Incorrect password");
    }
  };

  const handleLike = () => {
    const videos = loadVideos();
    const isLiked = !liked;
    const updated = videos.map((v) => {
      if (v.id !== video.id) return v;
      return {
        ...v,
        likesCount: isLiked ? v.likesCount + 1 : Math.max(0, v.likesCount - 1),
        likedBy: isLiked
          ? [...v.likedBy, profile.username]
          : v.likedBy.filter((u) => u !== profile.username),
      };
    });
    saveVideos(updated);
    setLiked(isLiked);
    setLikesCount((c) => (isLiked ? c + 1 : Math.max(0, c - 1)));
  };

  const handleComment = () => {
    const text = commentText.trim();
    if (!text) return;
    const comment: OnyxVideoComment = {
      id: generateId(),
      videoId: video.id,
      commenterUsername: profile.username,
      text,
      timestamp: Date.now(),
    };
    const updated = [...comments, comment];
    setComments(updated);
    saveVideoComments(video.id, updated);
    setCommentText("");
  };

  const handleShare = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/?video=${video.id}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  if (!unlocked) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "oklch(0 0 0 / 0.9)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-sm rounded-2xl p-6 space-y-5"
          style={{
            background: "oklch(0.12 0.008 260)",
            border: "1px solid oklch(0.25 0.01 260)",
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label="Unlock private video"
        >
          <div className="text-center space-y-2">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "oklch(0.72 0.15 55 / 0.1)" }}
            >
              <Lock size={24} style={{ color: "oklch(0.72 0.15 55)" }} />
            </div>
            <p
              className="text-base font-semibold"
              style={{ color: "oklch(0.88 0.01 260)" }}
            >
              Private Video
            </p>
            <p className="text-sm" style={{ color: "oklch(0.5 0.015 260)" }}>
              "{video.title}"
            </p>
          </div>

          <input
            data-ocid="video.input"
            type="password"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setPasswordError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Enter password to watch..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "oklch(0.08 0.005 260)",
              border: `1px solid ${passwordError ? "oklch(0.6 0.2 27)" : "oklch(0.22 0.01 260)"}`,
              color: "oklch(0.93 0.01 260)",
            }}
          />

          {passwordError && (
            <p
              data-ocid="video.error_state"
              className="text-xs"
              style={{ color: "oklch(0.6 0.2 27)" }}
            >
              {passwordError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              data-ocid="video.cancel_button"
              className="flex-1 py-2.5 rounded-xl text-sm"
              style={{
                background: "oklch(0.15 0.01 260)",
                color: "oklch(0.55 0.015 260)",
                border: "1px solid oklch(0.22 0.01 260)",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUnlock}
              data-ocid="video.confirm_button"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: "oklch(0.72 0.15 55)",
                color: "oklch(0.08 0.005 260)",
              }}
            >
              Unlock
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col lg:flex-row"
      style={{ background: "oklch(0.07 0.005 260)" }}
    >
      {/* Close btn */}
      <button
        type="button"
        onClick={onClose}
        data-ocid="video.close_button"
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: "oklch(0 0 0 / 0.6)",
          border: "1px solid oklch(0.25 0.01 260)",
        }}
      >
        <X size={16} style={{ color: "oklch(0.88 0.01 260)" }} />
      </button>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center bg-black min-h-0">
        {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded video */}
        <video
          src={video.videoDataUrl}
          controls
          autoPlay
          className="max-w-full max-h-full object-contain"
          style={{ maxHeight: "100vh" }}
        />
      </div>

      {/* Sidebar */}
      <div
        className="w-full lg:w-80 flex flex-col flex-shrink-0 overflow-hidden"
        style={{
          background: "oklch(0.1 0.008 260)",
          borderLeft: "1px solid oklch(0.2 0.01 260)",
        }}
      >
        {/* Video info */}
        <div
          className="p-4 space-y-3"
          style={{ borderBottom: "1px solid oklch(0.18 0.01 260)" }}
        >
          <div className="flex items-center gap-2">
            <h3
              className="text-base font-semibold flex-1"
              style={{ color: "oklch(0.93 0.01 260)" }}
            >
              {video.title}
            </h3>
            {video.isShort && (
              <span
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                style={{
                  background: "oklch(0.72 0.15 55)",
                  color: "oklch(0.08 0.005 260)",
                }}
              >
                <Zap size={9} />
                SHORT
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: "oklch(0.55 0.015 260)" }}>
            @{video.uploaderUsername} · {formatRelativeTime(video.timestamp)}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLike}
              data-ocid="video.toggle"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: liked
                  ? "oklch(0.6 0.2 30 / 0.15)"
                  : "oklch(0.15 0.01 260)",
                color: liked ? "oklch(0.7 0.2 30)" : "oklch(0.55 0.015 260)",
                border: `1px solid ${liked ? "oklch(0.6 0.2 30 / 0.4)" : "oklch(0.22 0.01 260)"}`,
              }}
            >
              <Heart size={14} fill={liked ? "currentColor" : "none"} />
              {likesCount}
            </button>

            <button
              type="button"
              onClick={handleShare}
              data-ocid="video.secondary_button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: copied
                  ? "oklch(0.5 0.12 142 / 0.15)"
                  : "oklch(0.15 0.01 260)",
                color: copied
                  ? "oklch(0.65 0.15 142)"
                  : "oklch(0.55 0.015 260)",
                border: `1px solid ${copied ? "oklch(0.5 0.12 142 / 0.3)" : "oklch(0.22 0.01 260)"}`,
              }}
            >
              <LinkIcon size={14} />
              {copied ? "Copied!" : "Share"}
            </button>

            <span
              className="flex items-center gap-1.5 text-xs ml-auto"
              style={{ color: "oklch(0.45 0.015 260)" }}
            >
              <Eye size={12} />
              {video.viewCount} views
            </span>
          </div>
        </div>

        {/* Comments */}
        <div
          className="flex-1 overflow-y-auto p-3 space-y-3"
          style={{ scrollbarWidth: "thin" }}
        >
          {comments.length === 0 ? (
            <div
              data-ocid="video.empty_state"
              className="flex flex-col items-center justify-center min-h-[100px] gap-2 text-center"
            >
              <MessageCircle
                size={24}
                style={{ color: "oklch(0.3 0.01 260)" }}
              />
              <p className="text-xs" style={{ color: "oklch(0.4 0.012 260)" }}>
                No comments yet
              </p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: "oklch(0.72 0.15 55 / 0.15)",
                      color: "oklch(0.72 0.15 55)",
                    }}
                  >
                    {c.commenterUsername.slice(0, 1).toUpperCase()}
                  </div>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "oklch(0.72 0.12 55)" }}
                  >
                    {c.commenterUsername}
                  </span>
                  <span
                    className="text-[10px] ml-auto"
                    style={{ color: "oklch(0.35 0.01 260)" }}
                  >
                    {formatRelativeTime(c.timestamp)}
                  </span>
                </div>
                <p
                  className="text-sm pl-8"
                  style={{ color: "oklch(0.78 0.01 260)" }}
                >
                  {c.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Comment input */}
        <div
          className="p-3 flex gap-2"
          style={{ borderTop: "1px solid oklch(0.18 0.01 260)" }}
        >
          <input
            data-ocid="video.textarea"
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              background: "oklch(0.13 0.008 260)",
              border: "1px solid oklch(0.22 0.01 260)",
              color: "oklch(0.88 0.01 260)",
            }}
          />
          <button
            type="button"
            onClick={handleComment}
            data-ocid="video.submit_button"
            disabled={!commentText.trim()}
            className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30"
            style={{
              background: "oklch(0.72 0.15 55)",
              color: "oklch(0.08 0.005 260)",
            }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── How To Use Modal ────────────────────────────────────────────────────────

const HOW_TO_STEPS = [
  {
    icon: Upload,
    title: "Upload a Video",
    description:
      'Tap "Upload Video", pick a file (max 50MB), and add a title. Optionally add a custom thumbnail.',
  },
  {
    icon: Lock,
    title: "Public vs Private",
    description:
      'Toggle "Private" to password-protect your video. Share the password with friends to let them watch.',
  },
  {
    icon: Zap,
    title: "Post as Short",
    description:
      "Videos under 60 seconds can be posted as Shorts — they appear in the scrollable strip at the top.",
  },
  {
    icon: Heart,
    title: "Like, Comment & Share",
    description:
      "Open any video to like it, leave a comment, or copy the share link.",
  },
  {
    icon: Eye,
    title: "Watch Private Videos",
    description:
      "Private videos show a lock icon. Click to enter the password and watch.",
  },
] as const;

function HowToUseModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.85)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        data-ocid="howto.modal"
        className="w-full max-w-sm rounded-2xl p-6 space-y-5 relative"
        style={{
          background: "oklch(0.12 0.008 260)",
          border: "1px solid oklch(0.25 0.01 260)",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        aria-label="How to use Video Feed"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          data-ocid="howto.close_button"
          className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{
            background: "oklch(0.18 0.01 260)",
            color: "oklch(0.55 0.015 260)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "oklch(0.88 0.01 260)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "oklch(0.55 0.015 260)";
          }}
        >
          <X size={14} />
        </button>

        {/* Title */}
        <div>
          <h3
            className="text-base font-bold"
            style={{ color: "oklch(0.93 0.01 260)" }}
          >
            How to use Video Feed
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{ color: "oklch(0.45 0.015 260)" }}
          >
            Everything you need to know
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {HOW_TO_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex items-start gap-3">
                {/* Step icon */}
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: "oklch(0.72 0.15 55 / 0.12)",
                    border: "1px solid oklch(0.72 0.15 55 / 0.25)",
                  }}
                >
                  <Icon size={14} style={{ color: "oklch(0.72 0.15 55)" }} />
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold tabular-nums"
                      style={{ color: "oklch(0.72 0.15 55 / 0.7)" }}
                    >
                      {idx + 1}
                    </span>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "oklch(0.88 0.01 260)" }}
                    >
                      {step.title}
                    </p>
                  </div>
                  <p
                    className="text-xs mt-0.5 leading-relaxed"
                    style={{ color: "oklch(0.5 0.015 260)" }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Detect video duration ────────────────────────────────────────────────────

function detectVideoDuration(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    video.onerror = () => resolve(Number.POSITIVE_INFINITY);
    video.src = dataUrl;
  });
}

function UploadVideoDialog({
  profile,
  onUpload,
}: {
  profile: OnyxProfile;
  onUpload: (video: OnyxVideo) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isShort, setIsShort] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(
    Number.POSITIVE_INFINITY,
  );
  const [password, setPassword] = useState("");
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError("Video too large (max 50MB)");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setVideoFile(dataUrl);
    // Detect duration to offer shorts toggle
    const dur = await detectVideoDuration(dataUrl);
    setVideoDuration(dur);
    // Reset short if duration >= 60
    if (dur >= 60) setIsShort(false);
  };

  const handleThumbSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setThumbnailFile(dataUrl);
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!videoFile) {
      setError("Please select a video");
      return;
    }
    if (isPrivate && !password.trim()) {
      setError("Password required for private videos");
      return;
    }
    setIsUploading(true);
    try {
      const video: OnyxVideo = {
        id: generateId(),
        title: title.trim(),
        uploaderUsername: profile.username,
        videoDataUrl: videoFile,
        thumbnailUrl: thumbnailFile ?? undefined,
        isPrivate,
        isShort: videoDuration < 60 ? isShort : false,
        passwordHash: isPrivate ? hashPassword(password) : "",
        likesCount: 0,
        viewCount: 0,
        likedBy: [],
        timestamp: Date.now(),
      };
      onUpload(video);
      setOpen(false);
      setTitle("");
      setIsPrivate(false);
      setIsShort(false);
      setVideoDuration(Number.POSITIVE_INFINITY);
      setPassword("");
      setVideoFile(null);
      setThumbnailFile(null);
      setError("");
    } finally {
      setIsUploading(false);
    }
  };

  const canPostAsShort = videoDuration < 60 && videoFile !== null;

  return (
    <>
      <button
        type="button"
        data-ocid="video.open_modal_button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: "oklch(0.72 0.15 55)",
          color: "oklch(0.08 0.005 260)",
          boxShadow: "0 2px 14px oklch(0.72 0.15 55 / 0.35)",
        }}
      >
        <Upload size={15} />
        Upload Video
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "oklch(0 0 0 / 0.85)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4 overflow-y-auto"
              style={{
                background: "oklch(0.12 0.008 260)",
                border: "1px solid oklch(0.25 0.01 260)",
                maxHeight: "90vh",
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3
                  className="text-base font-semibold"
                  style={{ color: "oklch(0.93 0.01 260)" }}
                >
                  Upload Video
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  data-ocid="upload.close_button"
                  className="p-1.5 rounded-lg"
                  style={{ color: "oklch(0.45 0.015 260)" }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Video file */}
              <div>
                <p
                  className="text-[11px] tracking-widest mb-2"
                  style={{ color: "oklch(0.45 0.015 260)" }}
                >
                  VIDEO FILE
                </p>
                <button
                  type="button"
                  data-ocid="upload.upload_button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-all"
                  style={{
                    borderColor: videoFile
                      ? "oklch(0.72 0.15 55 / 0.5)"
                      : "oklch(0.25 0.01 260)",
                    color: videoFile
                      ? "oklch(0.72 0.15 55)"
                      : "oklch(0.45 0.015 260)",
                    background: videoFile
                      ? "oklch(0.72 0.15 55 / 0.05)"
                      : "transparent",
                  }}
                >
                  <Upload size={20} />
                  <span className="text-xs">
                    {videoFile
                      ? "Video selected ✓"
                      : "Click to select video (max 50MB)"}
                  </span>
                  {videoFile && videoDuration < 60 && (
                    <span
                      className="text-[10px] flex items-center gap-1"
                      style={{ color: "oklch(0.72 0.15 55 / 0.8)" }}
                    >
                      <Zap size={9} />
                      Under 60s — can post as Short
                    </span>
                  )}
                </button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoSelect}
                />
              </div>

              {/* Post as Short toggle — only if under 60s */}
              {canPostAsShort && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Zap size={14} style={{ color: "oklch(0.72 0.15 55)" }} />
                    <span
                      className="text-sm"
                      style={{ color: "oklch(0.78 0.01 260)" }}
                    >
                      Post as Short
                    </span>
                  </div>
                  <button
                    type="button"
                    data-ocid="upload.short_toggle"
                    onClick={() => setIsShort((s) => !s)}
                    className="w-10 h-5 rounded-full relative transition-all"
                    style={{
                      background: isShort
                        ? "oklch(0.72 0.15 55)"
                        : "oklch(0.2 0.01 260)",
                    }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                      style={{
                        background: isShort
                          ? "oklch(0.08 0.005 260)"
                          : "oklch(0.5 0.015 260)",
                        left: isShort ? "calc(100% - 18px)" : "2px",
                      }}
                    />
                  </button>
                </motion.div>
              )}

              {/* Thumbnail */}
              <div>
                <p
                  className="text-[11px] tracking-widest mb-2"
                  style={{ color: "oklch(0.45 0.015 260)" }}
                >
                  THUMBNAIL (OPTIONAL)
                </p>
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  className="w-full py-3 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs transition-all"
                  style={{
                    borderColor: thumbnailFile
                      ? "oklch(0.72 0.15 55 / 0.4)"
                      : "oklch(0.2 0.01 260)",
                    color: thumbnailFile
                      ? "oklch(0.72 0.15 55)"
                      : "oklch(0.4 0.012 260)",
                  }}
                >
                  <Plus size={13} />
                  {thumbnailFile ? "Thumbnail set ✓" : "Add thumbnail"}
                </button>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbSelect}
                />
              </div>

              {/* Title */}
              <input
                data-ocid="upload.input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError("");
                }}
                placeholder="Video title..."
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: "oklch(0.08 0.005 260)",
                  border: "1px solid oklch(0.22 0.01 260)",
                  color: "oklch(0.93 0.01 260)",
                }}
              />

              {/* Private toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPrivate ? (
                    <Lock size={14} style={{ color: "oklch(0.72 0.15 55)" }} />
                  ) : (
                    <Play
                      size={14}
                      style={{ color: "oklch(0.55 0.015 260)" }}
                    />
                  )}
                  <span
                    className="text-sm"
                    style={{ color: "oklch(0.78 0.01 260)" }}
                  >
                    {isPrivate ? "Private (password protected)" : "Public"}
                  </span>
                </div>
                <button
                  type="button"
                  data-ocid="upload.toggle"
                  onClick={() => setIsPrivate((p) => !p)}
                  className="w-10 h-5 rounded-full relative transition-all"
                  style={{
                    background: isPrivate
                      ? "oklch(0.72 0.15 55)"
                      : "oklch(0.2 0.01 260)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                    style={{
                      background: isPrivate
                        ? "oklch(0.08 0.005 260)"
                        : "oklch(0.5 0.015 260)",
                      left: isPrivate ? "calc(100% - 18px)" : "2px",
                    }}
                  />
                </button>
              </div>

              {isPrivate && (
                <input
                  data-ocid="upload.password_input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Set video password..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(0.08 0.005 260)",
                    border: "1px solid oklch(0.22 0.01 260)",
                    color: "oklch(0.93 0.01 260)",
                  }}
                />
              )}

              {error && (
                <p
                  data-ocid="upload.error_state"
                  className="text-xs"
                  style={{ color: "oklch(0.6 0.2 27)" }}
                >
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  data-ocid="upload.cancel_button"
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{
                    background: "oklch(0.15 0.01 260)",
                    color: "oklch(0.55 0.015 260)",
                    border: "1px solid oklch(0.22 0.01 260)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading || !videoFile || !title.trim()}
                  data-ocid="upload.submit_button"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{
                    background: "oklch(0.72 0.15 55)",
                    color: "oklch(0.08 0.005 260)",
                  }}
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function VideoFeedPage({ profile }: Props) {
  const [videos, setVideos] = useState<OnyxVideo[]>(() => loadVideos());
  const [playingVideo, setPlayingVideo] = useState<OnyxVideo | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);

  const handleUpload = useCallback((video: OnyxVideo) => {
    setVideos((prev) => {
      const next = [video, ...prev];
      saveVideos(next);
      return next;
    });
  }, []);

  const sortedVideos = [...videos].sort((a, b) => b.timestamp - a.timestamp);

  // Split into shorts and regular videos
  const shorts = sortedVideos.filter((v) => v.isShort === true);
  const regularVideos = sortedVideos.filter((v) => v.isShort !== true);

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden"
      style={{ background: "oklch(0.08 0.005 260)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
        style={{
          background: "oklch(0.1 0.008 260)",
          borderBottom: "1px solid oklch(0.18 0.01 260)",
        }}
      >
        <div>
          <h2
            className="text-base font-bold tracking-[0.1em]"
            style={{ color: "oklch(0.88 0.01 260)" }}
          >
            VIDEO FEED
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: "oklch(0.45 0.015 260)" }}
          >
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="howto.open_modal_button"
            onClick={() => setShowHowTo(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: "oklch(0.15 0.01 260)",
              border: "1px solid oklch(0.25 0.01 260)",
              color: "oklch(0.55 0.015 260)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "oklch(0.72 0.15 55 / 0.4)";
              e.currentTarget.style.color = "oklch(0.72 0.15 55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "oklch(0.25 0.01 260)";
              e.currentTarget.style.color = "oklch(0.55 0.015 260)";
            }}
          >
            <HelpCircle size={14} />
            <span className="hidden sm:inline">How to use</span>
          </button>
          <UploadVideoDialog profile={profile} onUpload={handleUpload} />
        </div>
      </div>

      {/* Feed */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-6"
        style={{ scrollbarWidth: "thin" }}
      >
        {sortedVideos.length === 0 ? (
          <div
            data-ocid="feed.empty_state"
            className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "oklch(0.13 0.01 260)",
                border: "1px solid oklch(0.2 0.01 260)",
              }}
            >
              <Play size={28} style={{ color: "oklch(0.35 0.012 260)" }} />
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "oklch(0.55 0.012 260)" }}
              >
                No videos yet
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "oklch(0.38 0.012 260)" }}
              >
                Be the first to share a video
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Shorts row */}
            {shorts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} style={{ color: "oklch(0.72 0.15 55)" }} />
                  <span
                    className="text-[11px] tracking-widest font-semibold"
                    style={{ color: "oklch(0.72 0.15 55)" }}
                  >
                    SHORTS
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: "oklch(0.4 0.012 260)" }}
                  >
                    {shorts.length} short{shorts.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div
                  className="flex gap-3 overflow-x-auto pb-2"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {shorts.map((video, idx) => (
                    <div key={video.id} data-ocid={`shorts.item.${idx + 1}`}>
                      <ShortCard video={video} onPlay={setPlayingVideo} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular videos grid */}
            {regularVideos.length > 0 && (
              <div>
                {shorts.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-[11px] tracking-widest font-semibold"
                      style={{ color: "oklch(0.55 0.015 260)" }}
                    >
                      VIDEOS
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularVideos.map((video, idx) => (
                    <div key={video.id} data-ocid={`feed.item.${idx + 1}`}>
                      <VideoCard video={video} onPlay={setPlayingVideo} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Video player modal */}
      <AnimatePresence>
        {playingVideo && (
          <VideoPlayer
            video={playingVideo}
            profile={profile}
            onClose={() => setPlayingVideo(null)}
          />
        )}
      </AnimatePresence>

      {/* How to use modal */}
      <AnimatePresence>
        {showHowTo && <HowToUseModal onClose={() => setShowHowTo(false)} />}
      </AnimatePresence>
    </div>
  );
}
