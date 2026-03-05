import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type OnyxProfile,
  PRESET_AVATARS,
  fileToDataUrl,
  generateId,
} from "@/lib/onyx-utils";
import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";

interface Props {
  onComplete: (profile: OnyxProfile) => void;
}

export default function SetupScreen({ onComplete }: Props) {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].bg);
  const [avatarType, setAvatarType] = useState<"upload" | "preset">("preset");
  const [presetIndex, setPresetIndex] = useState(0);
  const [usernameError, setUsernameError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large. Please choose an image under 5MB.");
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

  const handleEnter = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameError("Choose a username to continue");
      return;
    }
    if (trimmed.length < 2) {
      setUsernameError("Username must be at least 2 characters");
      return;
    }
    setUsernameError("");

    const profile: OnyxProfile = {
      id: generateId(),
      username: trimmed,
      avatarUrl,
      avatarType,
      presetIndex,
    };
    onComplete(profile);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleEnter();
  };

  const initials = username.slice(0, 2).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-onyx-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background layers */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, oklch(0.14 0.02 55 / 0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, oklch(0.1 0.01 260 / 0.4) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "160px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: "oklch(0.11 0.008 260)",
            border: "1px solid oklch(0.22 0.01 260)",
            boxShadow:
              "0 32px 64px oklch(0 0 0 / 0.7), inset 0 1px 0 oklch(0.72 0.15 55 / 0.12)",
          }}
        >
          {/* Inner glow corner */}
          <div
            className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, oklch(0.72 0.15 55 / 0.06) 0%, transparent 70%)",
              transform: "translate(-50%, -50%)",
            }}
          />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "oklch(0.72 0.15 55 / 0.15)",
                  border: "1px solid oklch(0.72 0.15 55 / 0.3)",
                  boxShadow: "0 0 20px oklch(0.72 0.15 55 / 0.2)",
                }}
              >
                <Lock size={20} style={{ color: "oklch(0.72 0.15 55)" }} />
              </div>
              <h1
                className="text-4xl font-bold tracking-[0.2em] gold-shimmer"
                style={{ fontFamily: '"Sora", sans-serif' }}
              >
                ONYX
              </h1>
            </div>
            <p
              className="text-sm tracking-widest"
              style={{ color: "oklch(0.55 0.015 260)" }}
            >
              Solid ground for your deepest secrets
            </p>
          </motion.div>

          {/* Avatar section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Label
              className="text-xs tracking-widest mb-3 block"
              style={{ color: "oklch(0.55 0.015 260)" }}
            >
              PROFILE PICTURE
            </Label>

            {/* Avatar preview + upload */}
            <div className="flex items-start gap-4 mb-3">
              <button
                type="button"
                data-ocid="profile.avatar_upload"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-16 rounded-full flex-shrink-0 overflow-hidden transition-transform hover:scale-105 profile-ring"
                title="Click to upload photo"
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
                  <span className="text-[10px] text-white font-medium">
                    Upload
                  </span>
                </div>
              </button>

              {/* Preset grid */}
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
            <p className="text-xs" style={{ color: "oklch(0.45 0.015 260)" }}>
              Click avatar to upload your own photo (max 5MB)
            </p>
          </motion.div>

          {/* Username */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Label
              htmlFor="setup-username"
              className="text-xs tracking-widest mb-2 block"
              style={{ color: "oklch(0.55 0.015 260)" }}
            >
              USERNAME
            </Label>
            <input
              id="setup-username"
              data-ocid="profile.username_input"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.slice(0, 24));
                setUsernameError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter your alias..."
              maxLength={24}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: "oklch(0.08 0.005 260)",
                border: `1px solid ${usernameError ? "oklch(0.577 0.245 27)" : "oklch(0.22 0.01 260)"}`,
                color: "oklch(0.93 0.01 260)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.72 0.15 55 / 0.6)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px oklch(0.72 0.15 55 / 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = usernameError
                  ? "oklch(0.577 0.245 27)"
                  : "oklch(0.22 0.01 260)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            {usernameError && (
              <p
                data-ocid="profile.error_state"
                className="text-xs mt-1.5"
                style={{ color: "oklch(0.7 0.18 27)" }}
              >
                {usernameError}
              </p>
            )}
            <p
              className="text-xs mt-1.5"
              style={{ color: "oklch(0.4 0.012 260)" }}
            >
              {username.length}/24 characters
            </p>
          </motion.div>

          {/* Enter button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              type="button"
              data-ocid="profile.submit_button"
              onClick={handleEnter}
              disabled={!username.trim()}
              className="w-full py-3.5 rounded-xl font-semibold tracking-widest text-sm transition-all duration-200 uppercase disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "oklch(0.72 0.15 55)",
                color: "oklch(0.08 0.005 260)",
                boxShadow: "0 4px 20px oklch(0.72 0.15 55 / 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!username.trim()) return;
                e.currentTarget.style.background = "oklch(0.82 0.18 55)";
                e.currentTarget.style.boxShadow =
                  "0 6px 28px oklch(0.72 0.15 55 / 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "oklch(0.72 0.15 55)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px oklch(0.72 0.15 55 / 0.3)";
              }}
            >
              Enter ONYX
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
