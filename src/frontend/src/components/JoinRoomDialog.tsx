import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Lock } from "lucide-react";
import { useState } from "react";

interface Props {
  roomName: string;
  open: boolean;
  onClose: () => void;
  onJoin: (password: string) => boolean;
}

export default function JoinRoomDialog({
  roomName,
  open,
  onClose,
  onJoin,
}: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleJoin = () => {
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    const success = onJoin(password);
    if (!success) {
      setError("Incorrect password. Access denied.");
      return;
    }
    setPassword("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        data-ocid="join_room.dialog"
        className="border-0 p-0 w-full max-w-sm"
        style={{
          background: "oklch(0.13 0.01 260)",
          border: "1px solid oklch(0.25 0.01 260)",
          boxShadow: "0 24px 48px oklch(0 0 0 / 0.8)",
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "oklch(0.72 0.15 55 / 0.1)",
                border: "1px solid oklch(0.72 0.15 55 / 0.3)",
              }}
            >
              <Lock size={16} style={{ color: "oklch(0.72 0.15 55)" }} />
            </div>
            <div>
              <DialogTitle
                className="text-base font-semibold"
                style={{ color: "oklch(0.93 0.01 260)" }}
              >
                Secret Room
              </DialogTitle>
              <p className="text-xs" style={{ color: "oklch(0.55 0.015 260)" }}>
                {roomName}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm" style={{ color: "oklch(0.65 0.015 260)" }}>
            This room is password protected. Enter the password to join.
          </p>

          <div>
            <input
              data-ocid="join_room.password_input"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJoin();
              }}
              placeholder="Enter room password..."
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "oklch(0.08 0.005 260)",
                border: `1px solid ${error ? "oklch(0.577 0.245 27)" : "oklch(0.22 0.01 260)"}`,
                color: "oklch(0.93 0.01 260)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = error
                  ? "oklch(0.577 0.245 27)"
                  : "oklch(0.72 0.15 55 / 0.5)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error
                  ? "oklch(0.577 0.245 27)"
                  : "oklch(0.22 0.01 260)";
              }}
            />

            {error && (
              <div
                data-ocid="join_room.error_state"
                className="flex items-center gap-1.5 mt-2"
              >
                <AlertCircle
                  size={13}
                  style={{ color: "oklch(0.7 0.18 27)" }}
                />
                <p className="text-xs" style={{ color: "oklch(0.7 0.18 27)" }}>
                  {error}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              data-ocid="join_room.cancel_button"
              onClick={handleClose}
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
              data-ocid="join_room.submit_button"
              onClick={handleJoin}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all"
              style={{
                background: "oklch(0.72 0.15 55)",
                color: "oklch(0.08 0.005 260)",
                boxShadow: "0 2px 12px oklch(0.72 0.15 55 / 0.3)",
              }}
            >
              Join Room
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
