import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  type OnyxProfile,
  PRESET_AVATARS,
  fileToDataUrl,
} from "@/lib/onyx-utils";
import { UserCircle } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  profile: OnyxProfile;
  onSave: (profile: OnyxProfile) => void;
  trigger?: React.ReactNode;
}

export default function ProfileDialog({ profile, onSave, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [avatarType, setAvatarType] = useState<"upload" | "preset">(
    profile.avatarType,
  );
  const [presetIndex, setPresetIndex] = useState(profile.presetIndex ?? 0);
  const [usernameError, setUsernameError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large. Please choose under 5MB.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setAvatarUrl(dataUrl);
    setAvatarType("upload");
  };

  const handlePresetSelect = (idx: number) => {
    setPresetIndex(idx);
    setAvatarUrl(PRESET_AVATARS[idx].bg);
    setAvatarType("preset");
  };

  const handleSave = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameError("Username is required");
      return;
    }
    if (trimmed.length < 2) {
      setUsernameError("At least 2 characters");
      return;
    }
    setUsernameError("");
    onSave({
      ...profile,
      username: trimmed,
      avatarUrl,
      avatarType,
      presetIndex,
    });
    setOpen(false);
  };

  const initials = username.slice(0, 2).toUpperCase() || "?";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setUsername(profile.username);
          setAvatarUrl(profile.avatarUrl);
          setAvatarType(profile.avatarType);
          setPresetIndex(profile.presetIndex ?? 0);
          setUsernameError("");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            data-ocid="profile.edit_button"
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "oklch(0.45 0.015 260)" }}
            title="Edit profile"
          >
            <UserCircle size={16} />
          </button>
        )}
      </DialogTrigger>

      <DialogContent
        data-ocid="profile.dialog"
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
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Avatar */}
          <div className="space-y-3">
            <Label
              className="text-xs tracking-widest"
              style={{ color: "oklch(0.55 0.015 260)" }}
            >
              PROFILE PICTURE
            </Label>
            <div className="flex items-start gap-4">
              <button
                type="button"
                data-ocid="profile.avatar_upload"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-16 rounded-full flex-shrink-0 overflow-hidden hover:scale-105 transition-transform profile-ring"
              >
                {avatarType === "upload" ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-lg font-bold"
                    style={{
                      background: avatarUrl,
                      color: "oklch(0.08 0.005 260)",
                    }}
                  >
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-full">
                  <span className="text-[10px] text-white">Upload</span>
                </div>
              </button>
              <div className="flex flex-wrap gap-2">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetSelect(idx)}
                    className="w-8 h-8 rounded-full transition-all hover:scale-110"
                    style={{
                      background: preset.bg,
                      boxShadow:
                        avatarType === "preset" && presetIndex === idx
                          ? "0 0 0 2px oklch(0.08 0.005 260), 0 0 0 3px oklch(0.72 0.15 55)"
                          : "none",
                    }}
                    title={preset.label}
                  />
                ))}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label
              className="text-xs tracking-widest"
              style={{ color: "oklch(0.55 0.015 260)" }}
            >
              USERNAME
            </Label>
            <input
              data-ocid="profile.username_input"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.slice(0, 24));
                setUsernameError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              maxLength={24}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "oklch(0.08 0.005 260)",
                border: `1px solid ${usernameError ? "oklch(0.577 0.245 27)" : "oklch(0.22 0.01 260)"}`,
                color: "oklch(0.93 0.01 260)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.72 0.15 55 / 0.5)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = usernameError
                  ? "oklch(0.577 0.245 27)"
                  : "oklch(0.22 0.01 260)";
              }}
            />
            {usernameError && (
              <p className="text-xs" style={{ color: "oklch(0.7 0.18 27)" }}>
                {usernameError}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              data-ocid="profile.cancel_button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
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
              data-ocid="profile.save_button"
              onClick={handleSave}
              disabled={!username.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all disabled:opacity-40"
              style={{
                background: "oklch(0.72 0.15 55)",
                color: "oklch(0.08 0.005 260)",
                boxShadow: "0 2px 12px oklch(0.72 0.15 55 / 0.3)",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
