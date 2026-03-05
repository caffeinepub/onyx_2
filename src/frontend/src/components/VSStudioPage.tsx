import type {
  OnyxChannel,
  OnyxProfile,
  OnyxVideo,
  VideoAnalyticsEntry,
} from "@/lib/onyx-utils";
import {
  fileToDataUrl,
  formatRelativeTime,
  generateId,
  hashPassword,
  loadChannel,
  loadVideoAnalytics,
  loadVideos,
  saveChannel,
  saveVideoAnalytics,
  saveVideos,
} from "@/lib/onyx-utils";
import {
  BarChart2,
  Eye,
  Heart,
  Lock,
  Pencil,
  Play,
  Plus,
  Save,
  Tv2,
  Upload,
  User,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

interface Props {
  profile: OnyxProfile;
}

function VideoAnalyticsRow({ video }: { video: OnyxVideo }) {
  const [expanded, setExpanded] = useState(false);
  const analytics = loadVideoAnalytics(video.id);

  // Generate some mock analytics if empty
  const displayAnalytics: VideoAnalyticsEntry[] =
    analytics.length > 0
      ? analytics
      : video.viewCount > 0
        ? Array.from({ length: Math.min(video.viewCount, 5) }, (_, i) => ({
            viewerUsername: `viewer_${i + 1}`,
            watchTimeSeconds: Math.floor(Math.random() * 180) + 30,
            viewedAt: video.timestamp + i * 60000 + Math.random() * 3600000,
          }))
        : [];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "oklch(0.12 0.008 260)",
        border: "1px solid oklch(0.2 0.01 260)",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        data-ocid="studio.row"
        className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-white/5"
      >
        {/* Thumb */}
        <div
          className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background: "oklch(0.09 0.008 260)" }}
        >
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Video size={14} style={{ color: "oklch(0.35 0.01 260)" }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "oklch(0.88 0.01 260)" }}
            >
              {video.title}
            </p>
            {video.isPrivate && (
              <Lock size={11} style={{ color: "oklch(0.72 0.15 55 / 0.7)" }} />
            )}
          </div>
          <p className="text-[11px]" style={{ color: "oklch(0.4 0.012 260)" }}>
            {formatRelativeTime(video.timestamp)}
          </p>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <span
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "oklch(0.55 0.015 260)" }}
          >
            <Eye size={12} />
            {video.viewCount}
          </span>
          <span
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "oklch(0.55 0.015 260)" }}
          >
            <Heart size={12} />
            {video.likesCount}
          </span>
          <BarChart2
            size={14}
            style={{
              color: expanded ? "oklch(0.72 0.15 55)" : "oklch(0.4 0.012 260)",
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "all 0.2s",
            }}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="p-3 pt-0"
              style={{ borderTop: "1px solid oklch(0.18 0.01 260)" }}
            >
              {displayAnalytics.length === 0 ? (
                <p
                  className="text-xs text-center py-4"
                  style={{ color: "oklch(0.4 0.012 260)" }}
                >
                  No viewer data yet
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  <p
                    className="text-[10px] tracking-widest"
                    style={{ color: "oklch(0.4 0.012 260)" }}
                  >
                    VIEWER ANALYTICS
                  </p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: "oklch(0.45 0.015 260)" }}>
                        <th className="text-left py-1 pr-3 font-medium">
                          Viewer
                        </th>
                        <th className="text-right py-1 pr-3 font-medium">
                          Watch time
                        </th>
                        <th className="text-right py-1 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayAnalytics.map((entry, i) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: analytics entries
                        <tr key={i} style={{ color: "oklch(0.7 0.01 260)" }}>
                          <td className="py-1 pr-3">
                            <span className="flex items-center gap-1.5">
                              <User
                                size={10}
                                style={{ color: "oklch(0.55 0.015 260)" }}
                              />
                              {entry.viewerUsername}
                            </span>
                          </td>
                          <td className="text-right py-1 pr-3">
                            {Math.floor(entry.watchTimeSeconds / 60)}m{" "}
                            {entry.watchTimeSeconds % 60}s
                          </td>
                          <td
                            className="text-right py-1"
                            style={{ color: "oklch(0.4 0.012 260)" }}
                          >
                            {formatRelativeTime(entry.viewedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UploadToChannelDialog({
  profile,
  onUpload,
}: {
  profile: OnyxProfile;
  onUpload: (video: OnyxVideo) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
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
  };

  const handleThumbSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setThumbnailFile(dataUrl);
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      setError("Title required");
      return;
    }
    if (!videoFile) {
      setError("Select a video file");
      return;
    }
    if (isPrivate && !password.trim()) {
      setError("Password required");
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
        passwordHash: isPrivate ? hashPassword(password) : "",
        likesCount: 0,
        viewCount: 0,
        likedBy: [],
        timestamp: Date.now(),
      };
      // Add mock analytics
      saveVideoAnalytics(video.id, []);
      onUpload(video);
      setOpen(false);
      setTitle("");
      setIsPrivate(false);
      setPassword("");
      setVideoFile(null);
      setThumbnailFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        data-ocid="studio.open_modal_button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
        style={{
          background: "oklch(0.72 0.15 55 / 0.1)",
          color: "oklch(0.72 0.15 55)",
          border: "1px solid oklch(0.72 0.15 55 / 0.25)",
        }}
      >
        <Plus size={14} />
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
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{
                background: "oklch(0.12 0.008 260)",
                border: "1px solid oklch(0.25 0.01 260)",
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <h3
                className="text-base font-semibold"
                style={{ color: "oklch(0.93 0.01 260)" }}
              >
                Upload to Channel
              </h3>

              <button
                type="button"
                data-ocid="studio.upload_button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-all"
                style={{
                  borderColor: videoFile
                    ? "oklch(0.72 0.15 55 / 0.5)"
                    : "oklch(0.25 0.01 260)",
                  color: videoFile
                    ? "oklch(0.72 0.15 55)"
                    : "oklch(0.45 0.015 260)",
                }}
              >
                <Upload size={20} />
                <span className="text-xs">
                  {videoFile
                    ? "Video selected ✓"
                    : "Select video file (max 50MB)"}
                </span>
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoSelect}
              />

              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs transition-all"
                style={{
                  borderColor: thumbnailFile
                    ? "oklch(0.72 0.15 55 / 0.4)"
                    : "oklch(0.2 0.01 260)",
                  color: thumbnailFile
                    ? "oklch(0.72 0.15 55)"
                    : "oklch(0.4 0.012 260)",
                }}
              >
                <Plus size={12} />
                {thumbnailFile ? "Thumbnail set ✓" : "Add thumbnail (optional)"}
              </button>
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbSelect}
              />

              <input
                data-ocid="studio.input"
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

              <div className="flex items-center justify-between">
                <span
                  className="text-sm"
                  style={{ color: "oklch(0.78 0.01 260)" }}
                >
                  {isPrivate ? "Private" : "Public"}
                </span>
                <button
                  type="button"
                  data-ocid="studio.toggle"
                  onClick={() => setIsPrivate((p) => !p)}
                  className="w-10 h-5 rounded-full relative"
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
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Set password..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(0.08 0.005 260)",
                    border: "1px solid oklch(0.22 0.01 260)",
                    color: "oklch(0.93 0.01 260)",
                  }}
                />
              )}

              {error && (
                <p className="text-xs" style={{ color: "oklch(0.6 0.2 27)" }}>
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  data-ocid="studio.cancel_button"
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
                  data-ocid="studio.submit_button"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{
                    background: "oklch(0.72 0.15 55)",
                    color: "oklch(0.08 0.005 260)",
                  }}
                >
                  {isUploading ? "Uploading..." : "Publish"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function VSStudioPage({ profile }: Props) {
  const [studioUsername, setStudioUsername] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [channel, setChannel] = useState<OnyxChannel | null>(null);
  const [myVideos, setMyVideos] = useState<OnyxVideo[]>([]);
  const [editingChannel, setEditingChannel] = useState(false);
  const [editChannelName, setEditChannelName] = useState("");
  const [editChannelDesc, setEditChannelDesc] = useState("");

  const handleSignIn = useCallback(() => {
    if (
      studioUsername.trim().toLowerCase() !== profile.username.toLowerCase()
    ) {
      setSignInError("Username doesn't match your ONYX profile");
      return;
    }
    setSignInError("");
    setSignedIn(true);

    // Load or create channel
    let ch = loadChannel(profile.username);
    if (!ch) {
      ch = {
        username: profile.username,
        channelName: `${profile.username}'s Channel`,
        description: "Welcome to my channel!",
        createdAt: Date.now(),
      };
      saveChannel(ch);
    }
    setChannel(ch);
    setEditChannelName(ch.channelName);
    setEditChannelDesc(ch.description);

    // Load this user's videos
    const allVideos = loadVideos();
    setMyVideos(
      allVideos.filter((v) => v.uploaderUsername === profile.username),
    );
  }, [studioUsername, profile.username]);

  const handleSaveChannel = useCallback(() => {
    if (!channel) return;
    const updated: OnyxChannel = {
      ...channel,
      channelName: editChannelName.trim() || channel.channelName,
      description: editChannelDesc.trim(),
    };
    saveChannel(updated);
    setChannel(updated);
    setEditingChannel(false);
  }, [channel, editChannelName, editChannelDesc]);

  const handleUpload = useCallback((video: OnyxVideo) => {
    // Add to global video list
    const allVideos = loadVideos();
    const next = [video, ...allVideos];
    saveVideos(next);
    // Add mock analytics entry
    saveVideoAnalytics(video.id, []);
    setMyVideos((prev) => [video, ...prev]);
  }, []);

  const totalViews = myVideos.reduce((sum, v) => sum + v.viewCount, 0);
  const totalLikes = myVideos.reduce((sum, v) => sum + v.likesCount, 0);

  if (!signedIn) {
    return (
      <div
        className="flex flex-col h-full w-full items-center justify-center px-6"
        style={{ background: "oklch(0.08 0.005 260)" }}
      >
        {/* BG glow */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, oklch(0.72 0.15 55 / 0.05) 0%, transparent 60%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xs space-y-6 relative"
        >
          <div className="text-center space-y-2">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{
                background: "oklch(0.72 0.15 55 / 0.1)",
                border: "1px solid oklch(0.72 0.15 55 / 0.25)",
              }}
            >
              <Tv2 size={28} style={{ color: "oklch(0.72 0.15 55)" }} />
            </div>
            <h2
              className="text-xl font-bold tracking-[0.15em]"
              style={{ color: "oklch(0.88 0.01 260)" }}
            >
              ONYX VS
            </h2>
            <p className="text-sm" style={{ color: "oklch(0.5 0.015 260)" }}>
              Video Sharer Studio
            </p>
            <p className="text-xs" style={{ color: "oklch(0.38 0.012 260)" }}>
              Sign in with your ONYX username to access your creator dashboard
            </p>
          </div>

          <div className="space-y-3">
            <input
              data-ocid="studio.input"
              type="text"
              value={studioUsername}
              onChange={(e) => {
                setStudioUsername(e.target.value);
                setSignInError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              placeholder="Enter your ONYX username..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "oklch(0.12 0.008 260)",
                border: `1px solid ${signInError ? "oklch(0.6 0.2 27)" : "oklch(0.22 0.01 260)"}`,
                color: "oklch(0.93 0.01 260)",
              }}
            />

            {signInError && (
              <p
                data-ocid="studio.error_state"
                className="text-xs"
                style={{ color: "oklch(0.6 0.2 27)" }}
              >
                {signInError}
              </p>
            )}

            <button
              type="button"
              onClick={handleSignIn}
              data-ocid="studio.primary_button"
              disabled={!studioUsername.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold tracking-wide disabled:opacity-40 transition-all"
              style={{
                background: "oklch(0.72 0.15 55)",
                color: "oklch(0.08 0.005 260)",
                boxShadow: "0 2px 14px oklch(0.72 0.15 55 / 0.3)",
              }}
            >
              Sign in to Studio
            </button>
          </div>

          <p
            className="text-[11px] text-center"
            style={{ color: "oklch(0.35 0.01 260)" }}
          >
            Your current username:{" "}
            <span style={{ color: "oklch(0.72 0.15 55 / 0.8)" }}>
              {profile.username}
            </span>
          </p>
        </motion.div>
      </div>
    );
  }

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
        <div className="flex items-center gap-2.5">
          <Tv2 size={18} style={{ color: "oklch(0.72 0.15 55)" }} />
          <div>
            <h2
              className="text-sm font-bold tracking-[0.1em]"
              style={{ color: "oklch(0.88 0.01 260)" }}
            >
              VS STUDIO
            </h2>
            <p
              className="text-[11px]"
              style={{ color: "oklch(0.45 0.015 260)" }}
            >
              @{profile.username}
            </p>
          </div>
        </div>
        <UploadToChannelDialog profile={profile} onUpload={handleUpload} />
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-5"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Channel card */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "oklch(0.11 0.008 260)",
            border: "1px solid oklch(0.2 0.01 260)",
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold"
                style={{
                  background: "oklch(0.72 0.15 55 / 0.1)",
                  color: "oklch(0.72 0.15 55)",
                  border: "1px solid oklch(0.72 0.15 55 / 0.25)",
                }}
              >
                {channel?.channelName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                {editingChannel ? (
                  <input
                    data-ocid="studio.search_input"
                    type="text"
                    value={editChannelName}
                    onChange={(e) => setEditChannelName(e.target.value)}
                    className="text-base font-semibold bg-transparent outline-none border-b"
                    style={{
                      color: "oklch(0.93 0.01 260)",
                      borderColor: "oklch(0.72 0.15 55 / 0.5)",
                    }}
                  />
                ) : (
                  <p
                    className="text-base font-semibold"
                    style={{ color: "oklch(0.93 0.01 260)" }}
                  >
                    {channel?.channelName}
                  </p>
                )}
                <p
                  className="text-xs"
                  style={{ color: "oklch(0.45 0.015 260)" }}
                >
                  Created {channel ? formatRelativeTime(channel.createdAt) : ""}
                </p>
              </div>
            </div>

            {editingChannel ? (
              <button
                type="button"
                onClick={handleSaveChannel}
                data-ocid="studio.save_button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: "oklch(0.72 0.15 55)",
                  color: "oklch(0.08 0.005 260)",
                }}
              >
                <Save size={12} />
                Save
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditingChannel(true)}
                data-ocid="studio.edit_button"
                className="p-2 rounded-xl transition-all"
                style={{
                  color: "oklch(0.45 0.015 260)",
                  background: "oklch(0.15 0.01 260)",
                }}
              >
                <Pencil size={14} />
              </button>
            )}
          </div>

          {editingChannel ? (
            <textarea
              data-ocid="studio.textarea"
              value={editChannelDesc}
              onChange={(e) => setEditChannelDesc(e.target.value)}
              placeholder="Channel description..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{
                background: "oklch(0.09 0.008 260)",
                border: "1px solid oklch(0.22 0.01 260)",
                color: "oklch(0.88 0.01 260)",
              }}
            />
          ) : (
            channel?.description && (
              <p className="text-sm" style={{ color: "oklch(0.55 0.015 260)" }}>
                {channel.description}
              </p>
            )
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: <Video size={16} />,
                label: "Videos",
                value: myVideos.length,
              },
              {
                icon: <Eye size={16} />,
                label: "Total Views",
                value: totalViews,
              },
              {
                icon: <Heart size={16} />,
                label: "Total Likes",
                value: totalLikes,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center py-3 rounded-xl"
                style={{
                  background: "oklch(0.09 0.008 260)",
                  border: "1px solid oklch(0.18 0.01 260)",
                }}
              >
                <div
                  className="flex justify-center mb-1"
                  style={{ color: "oklch(0.72 0.15 55 / 0.8)" }}
                >
                  {stat.icon}
                </div>
                <p
                  className="text-lg font-bold"
                  style={{ color: "oklch(0.93 0.01 260)" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "oklch(0.4 0.012 260)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Video list */}
        <div>
          <h3
            className="text-[11px] tracking-widest mb-3"
            style={{ color: "oklch(0.45 0.015 260)" }}
          >
            YOUR VIDEOS
          </h3>

          {myVideos.length === 0 ? (
            <div
              data-ocid="studio.empty_state"
              className="flex flex-col items-center justify-center min-h-[160px] gap-3 text-center rounded-2xl"
              style={{
                background: "oklch(0.11 0.008 260)",
                border: "1px solid oklch(0.2 0.01 260)",
              }}
            >
              <Play size={28} style={{ color: "oklch(0.3 0.01 260)" }} />
              <div>
                <p
                  className="text-sm"
                  style={{ color: "oklch(0.5 0.012 260)" }}
                >
                  No videos yet
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "oklch(0.35 0.01 260)" }}
                >
                  Upload your first video to see analytics
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {myVideos.map((video, idx) => (
                <div key={video.id} data-ocid={`studio.item.${idx + 1}`}>
                  <VideoAnalyticsRow video={video} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
