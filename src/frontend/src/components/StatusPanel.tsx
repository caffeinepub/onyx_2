import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { OnyxProfile, OnyxStatus } from "@/lib/onyx-utils";
import {
  PRESET_AVATARS,
  fileToDataUrl,
  formatRelativeTime,
  generateId,
} from "@/lib/onyx-utils";
import {
  ChevronRight,
  Image as ImageIcon,
  Plus,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  profile: OnyxProfile;
  statuses: OnyxStatus[];
  onAddStatus: (status: OnyxStatus) => Promise<void>;
}

function StatusAvatar({
  username,
  avatarUrl,
  avatarType,
  size = 40,
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
        className="rounded-full overflow-hidden flex-shrink-0 profile-ring"
        style={{ width: size, height: size }}
      >
        <img
          src={avatarUrl}
          alt={username}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  let colorIdx = 0;
  for (let i = 0; i < username.length; i++) {
    colorIdx = (colorIdx + username.charCodeAt(i)) % PRESET_AVATARS.length;
  }
  const bg = avatarUrl || PRESET_AVATARS[colorIdx].bg;

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center font-semibold profile-ring"
      style={{
        width: size,
        height: size,
        background: bg,
        color: "oklch(0.08 0.005 260)",
        fontSize: size * 0.34,
      }}
    >
      {initials}
    </div>
  );
}

function AddStatusDialog({
  profile,
  onAdd,
}: {
  profile: OnyxProfile;
  onAdd: (status: OnyxStatus) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [mediaPreview, setMediaPreview] = useState<{
    dataUrl: string;
    type: "image" | "video";
  } | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum 10MB.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setMediaPreview({
      dataUrl,
      type: file.type.startsWith("video") ? "video" : "image",
    });
  };

  const handlePost = async () => {
    if (!mediaPreview) return;
    setIsPosting(true);
    try {
      const status: OnyxStatus = {
        id: generateId(),
        userId: profile.id,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        mediaUrl: mediaPreview.dataUrl,
        mediaType: mediaPreview.type,
        caption,
        timestamp: Date.now(),
      };
      await onAdd(status);
      setOpen(false);
      setCaption("");
      setMediaPreview(null);
    } catch {
      alert("Failed to post status.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setCaption("");
          setMediaPreview(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          data-ocid="status.open_modal_button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{
            background: "oklch(0.72 0.15 55 / 0.1)",
            color: "oklch(0.72 0.15 55)",
            border: "1px solid oklch(0.72 0.15 55 / 0.25)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "oklch(0.72 0.15 55 / 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "oklch(0.72 0.15 55 / 0.1)";
          }}
        >
          <Plus size={13} />
          Add Status
        </button>
      </DialogTrigger>

      <DialogContent
        className="border-0 p-0 w-full max-w-sm"
        style={{
          background: "oklch(0.13 0.01 260)",
          border: "1px solid oklch(0.25 0.01 260)",
          boxShadow: "0 24px 48px oklch(0 0 0 / 0.8)",
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle
            className="text-base font-semibold"
            style={{ color: "oklch(0.93 0.01 260)" }}
          >
            Add Status
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {/* Media preview */}
          {mediaPreview ? (
            <div className="relative rounded-xl overflow-hidden">
              {mediaPreview.type === "video" ? (
                // biome-ignore lint/a11y/useMediaCaption: user-uploaded preview video
                <video
                  src={mediaPreview.dataUrl}
                  className="w-full max-h-48 object-cover rounded-xl"
                  controls
                />
              ) : (
                <img
                  src={mediaPreview.dataUrl}
                  alt="preview"
                  className="w-full max-h-48 object-cover rounded-xl"
                />
              )}
              <button
                type="button"
                onClick={() => setMediaPreview(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0 0 0 / 0.7)" }}
              >
                <X size={13} style={{ color: "oklch(0.93 0.01 260)" }} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-ocid="status.upload_button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-10 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition-all"
              style={{
                borderColor: "oklch(0.25 0.01 260)",
                color: "oklch(0.45 0.015 260)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.72 0.15 55 / 0.4)";
                e.currentTarget.style.color = "oklch(0.72 0.15 55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.25 0.01 260)";
                e.currentTarget.style.color = "oklch(0.45 0.015 260)";
              }}
            >
              <div className="flex gap-3">
                <ImageIcon size={24} />
                <VideoIcon size={24} />
              </div>
              <p className="text-xs">Tap to upload photo or video</p>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Caption */}
          <div className="space-y-2">
            <Label
              className="text-xs tracking-widest"
              style={{ color: "oklch(0.55 0.015 260)" }}
            >
              CAPTION (OPTIONAL)
            </Label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 100))}
              placeholder="Add a caption..."
              maxLength={100}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{
                background: "oklch(0.08 0.005 260)",
                border: "1px solid oklch(0.22 0.01 260)",
                color: "oklch(0.93 0.01 260)",
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
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
              onClick={handlePost}
              disabled={!mediaPreview || isPosting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{
                background: "oklch(0.72 0.15 55)",
                color: "oklch(0.08 0.005 260)",
                boxShadow: "0 2px 12px oklch(0.72 0.15 55 / 0.3)",
              }}
            >
              {isPosting ? "Posting..." : "Post Status"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StatusPanel({
  open,
  onClose,
  profile,
  statuses,
  onAddStatus,
}: Props) {
  // Group statuses by user, show own first
  const ownStatuses = statuses.filter((s) => s.userId === profile.id);
  const othersStatuses = statuses.filter((s) => s.userId !== profile.id);

  // Get latest status per user
  const userLatestMap = new Map<string, OnyxStatus>();
  for (const s of [...ownStatuses, ...othersStatuses]) {
    const existing = userLatestMap.get(s.userId);
    if (!existing || s.timestamp > existing.timestamp) {
      userLatestMap.set(s.userId, s);
    }
  }

  const groupedStatuses = [
    ...(ownStatuses.length > 0 ? [userLatestMap.get(profile.id)!] : []),
    ...Array.from(userLatestMap.values()).filter(
      (s) => s.userId !== profile.id,
    ),
  ];

  const [viewingStatus, setViewingStatus] = useState<OnyxStatus | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 lg:hidden"
            style={{ background: "oklch(0 0 0 / 0.6)" }}
            onClick={onClose}
          />

          <motion.aside
            data-ocid="status.panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full z-30 flex flex-col lg:static lg:z-auto"
            style={{
              width: "320px",
              background: "oklch(0.1 0.008 260)",
              borderLeft: "1px solid oklch(0.2 0.01 260)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid oklch(0.18 0.01 260)" }}
            >
              <h2
                className="text-sm font-semibold tracking-wide"
                style={{ color: "oklch(0.93 0.01 260)" }}
              >
                Status Updates
              </h2>
              <div className="flex items-center gap-2">
                <AddStatusDialog profile={profile} onAdd={onAddStatus} />
                <button
                  type="button"
                  data-ocid="status.close_button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: "oklch(0.45 0.015 260)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "oklch(0.88 0.01 260)";
                    e.currentTarget.style.background = "oklch(0.15 0.01 260)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "oklch(0.45 0.015 260)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Status list */}
            <div
              data-ocid="status.list"
              className="flex-1 overflow-y-auto py-3 px-3 space-y-2"
              style={{ scrollbarWidth: "thin" }}
            >
              {groupedStatuses.length === 0 ? (
                <div
                  data-ocid="status.empty_state"
                  className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4 text-center"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "oklch(0.13 0.01 260)",
                      border: "1px solid oklch(0.2 0.01 260)",
                    }}
                  >
                    <ImageIcon
                      size={24}
                      style={{ color: "oklch(0.4 0.012 260)" }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "oklch(0.55 0.012 260)" }}
                    >
                      No status updates
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "oklch(0.38 0.012 260)" }}
                    >
                      Post a photo or video to share with others
                    </p>
                  </div>
                </div>
              ) : (
                groupedStatuses.map((status, idx) => {
                  const isOwn = status.userId === profile.id;
                  const markerIndex = idx + 1;
                  return (
                    <motion.button
                      key={status.id}
                      type="button"
                      data-ocid={`status.item.${markerIndex}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setViewingStatus(status)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                      style={{
                        background: "oklch(0.13 0.01 260)",
                        border: "1px solid oklch(0.2 0.01 260)",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "oklch(0.15 0.01 260)";
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "oklch(0.25 0.01 260)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "oklch(0.13 0.01 260)";
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "oklch(0.2 0.01 260)";
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                        style={{
                          border: "2px solid oklch(0.72 0.15 55 / 0.4)",
                        }}
                      >
                        {status.mediaType === "video" ? (
                          // biome-ignore lint/a11y/useMediaCaption: user-uploaded status video
                          <video
                            src={status.mediaUrl}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={status.mediaUrl}
                            alt="status"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: "oklch(0.88 0.01 260)" }}
                          >
                            {isOwn ? "Your Story" : status.username}
                          </p>
                          {isOwn && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{
                                background: "oklch(0.72 0.15 55 / 0.1)",
                                color: "oklch(0.72 0.15 55)",
                              }}
                            >
                              You
                            </span>
                          )}
                        </div>
                        {status.caption && (
                          <p
                            className="text-xs truncate mt-0.5"
                            style={{ color: "oklch(0.55 0.015 260)" }}
                          >
                            {status.caption}
                          </p>
                        )}
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: "oklch(0.4 0.012 260)" }}
                        >
                          {formatRelativeTime(status.timestamp)}
                        </p>
                      </div>

                      <ChevronRight
                        size={14}
                        style={{ color: "oklch(0.4 0.012 260)" }}
                      />
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      )}

      {/* Status viewer modal */}
      {viewingStatus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.9)" }}
          onClick={() => setViewingStatus(null)}
        >
          <div
            className="relative max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <StatusAvatar
                username={viewingStatus.username}
                avatarUrl={viewingStatus.avatarUrl}
                avatarType={
                  viewingStatus.userId === profile.id
                    ? profile.avatarType
                    : undefined
                }
                size={36}
              />
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.93 0.01 260)" }}
                >
                  {viewingStatus.userId === profile.id
                    ? "Your Story"
                    : viewingStatus.username}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "oklch(0.5 0.015 260)" }}
                >
                  {formatRelativeTime(viewingStatus.timestamp)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingStatus(null)}
                className="ml-auto p-2 rounded-full"
                style={{ background: "oklch(0.15 0.01 260)" }}
              >
                <X size={16} style={{ color: "oklch(0.88 0.01 260)" }} />
              </button>
            </div>

            {/* Media */}
            <div className="rounded-2xl overflow-hidden">
              {viewingStatus.mediaType === "video" ? (
                // biome-ignore lint/a11y/useMediaCaption: user-uploaded status video
                <video
                  src={viewingStatus.mediaUrl}
                  className="w-full max-h-[70vh] object-contain"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={viewingStatus.mediaUrl}
                  alt="status"
                  className="w-full max-h-[70vh] object-contain"
                />
              )}
            </div>

            {viewingStatus.caption && (
              <p
                className="text-sm text-center mt-3"
                style={{ color: "oklch(0.75 0.015 260)" }}
              >
                {viewingStatus.caption}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
