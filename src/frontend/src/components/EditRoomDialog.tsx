import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { OnyxRoom } from "@/lib/onyx-utils";
import { Settings } from "lucide-react";
import { useState } from "react";

interface Props {
  room: OnyxRoom;
  onUpdate: (roomId: string, name: string, password: string) => Promise<void>;
  trigger?: React.ReactNode;
}

export default function EditRoomDialog({ room, onUpdate, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(room.name);
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Room name is required");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await onUpdate(room.id, name.trim(), password);
      setOpen(false);
      setPassword("");
    } catch {
      setError("Failed to update room.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setName(room.name);
          setPassword("");
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            data-ocid="room.edit_button"
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "oklch(0.45 0.015 260)" }}
            title="Edit room"
          >
            <Settings size={13} />
          </button>
        )}
      </DialogTrigger>

      <DialogContent
        data-ocid="edit_room.dialog"
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
            Edit Room
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label
              className="text-xs tracking-widest"
              style={{ color: "oklch(0.55 0.015 260)" }}
            >
              ROOM NAME
            </Label>
            <input
              data-ocid="edit_room.name_input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value.slice(0, 32));
                setError("");
              }}
              maxLength={32}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "oklch(0.08 0.005 260)",
                border: "1px solid oklch(0.22 0.01 260)",
                color: "oklch(0.93 0.01 260)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.72 0.15 55 / 0.5)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.22 0.01 260)";
              }}
            />
          </div>

          {room.isSecret && (
            <div className="space-y-2">
              <Label
                className="text-xs tracking-widest"
                style={{ color: "oklch(0.55 0.015 260)" }}
              >
                NEW PASSWORD
              </Label>
              <input
                data-ocid="edit_room.password_input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: "oklch(0.08 0.005 260)",
                  border: "1px solid oklch(0.22 0.01 260)",
                  color: "oklch(0.93 0.01 260)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor =
                    "oklch(0.72 0.15 55 / 0.5)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.22 0.01 260)";
                }}
              />
              <p
                className="text-[11px]"
                style={{ color: "oklch(0.4 0.012 260)" }}
              >
                Leave blank to keep existing password
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs" style={{ color: "oklch(0.7 0.18 27)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              data-ocid="edit_room.cancel_button"
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
              data-ocid="edit_room.save_button"
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all disabled:opacity-40"
              style={{
                background: "oklch(0.72 0.15 55)",
                color: "oklch(0.08 0.005 260)",
                boxShadow: "0 2px 12px oklch(0.72 0.15 55 / 0.3)",
              }}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
