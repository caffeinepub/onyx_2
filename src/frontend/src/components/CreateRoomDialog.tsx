import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Globe, Lock, Plus } from "lucide-react";
import { useState } from "react";

interface Props {
  onCreate: (
    name: string,
    isSecret: boolean,
    password: string,
  ) => Promise<void>;
  trigger?: React.ReactNode;
}

export default function CreateRoomDialog({ onCreate, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Room name is required");
      return;
    }
    if (isSecret && !password.trim()) {
      setError("Password is required for secret rooms");
      return;
    }
    setError("");
    setIsCreating(true);
    try {
      await onCreate(name.trim(), isSecret, password);
      setOpen(false);
      setName("");
      setIsSecret(false);
      setPassword("");
    } catch {
      setError("Failed to create room. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            data-ocid="room.create_button"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{
              color: "oklch(0.55 0.015 260)",
              background: "oklch(0.15 0.01 260)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "oklch(0.72 0.15 55)";
              e.currentTarget.style.background = "oklch(0.72 0.15 55 / 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "oklch(0.55 0.015 260)";
              e.currentTarget.style.background = "oklch(0.15 0.01 260)";
            }}
            title="Create new room"
          >
            <Plus size={14} />
          </button>
        )}
      </DialogTrigger>

      <DialogContent
        data-ocid="create_room.dialog"
        className="border-0 p-0 w-full max-w-sm"
        style={{
          background: "oklch(0.13 0.01 260)",
          border: "1px solid oklch(0.25 0.01 260)",
          boxShadow: "0 24px 48px oklch(0 0 0 / 0.8)",
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle
            className="text-base font-semibold tracking-wide"
            style={{ color: "oklch(0.93 0.01 260)" }}
          >
            Create Room
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Room name */}
          <div className="space-y-2">
            <Label
              className="text-xs tracking-widest"
              style={{ color: "oklch(0.55 0.015 260)" }}
            >
              ROOM NAME
            </Label>
            <input
              data-ocid="create_room.input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value.slice(0, 32));
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. night owls, strategy..."
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

          {/* Secret toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isSecret ? (
                <Lock size={15} style={{ color: "oklch(0.72 0.15 55)" }} />
              ) : (
                <Globe size={15} style={{ color: "oklch(0.55 0.015 260)" }} />
              )}
              <div>
                <p
                  className="text-sm"
                  style={{ color: "oklch(0.88 0.01 260)" }}
                >
                  {isSecret ? "Secret Room" : "Public Room"}
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: "oklch(0.45 0.015 260)" }}
                >
                  {isSecret ? "Password protected" : "Visible to everyone"}
                </p>
              </div>
            </div>
            <Switch
              data-ocid="create_room.secret_toggle"
              checked={isSecret}
              onCheckedChange={setIsSecret}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* Password (conditional) */}
          {isSecret && (
            <div className="space-y-2">
              <Label
                className="text-xs tracking-widest"
                style={{ color: "oklch(0.55 0.015 260)" }}
              >
                PASSWORD
              </Label>
              <input
                data-ocid="create_room.password_input"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Set a room password..."
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
            </div>
          )}

          {error && (
            <p
              data-ocid="create_room.error_state"
              className="text-xs"
              style={{ color: "oklch(0.7 0.18 27)" }}
            >
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              data-ocid="create_room.cancel_button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "oklch(0.15 0.01 260)",
                color: "oklch(0.55 0.015 260)",
                border: "1px solid oklch(0.22 0.01 260)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "oklch(0.88 0.01 260)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "oklch(0.55 0.015 260)";
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              data-ocid="create_room.submit_button"
              onClick={handleCreate}
              disabled={isCreating || !name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all disabled:opacity-40"
              style={{
                background: "oklch(0.72 0.15 55)",
                color: "oklch(0.08 0.005 260)",
                boxShadow: "0 2px 12px oklch(0.72 0.15 55 / 0.3)",
              }}
            >
              {isCreating ? "Creating..." : "Create Room"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
