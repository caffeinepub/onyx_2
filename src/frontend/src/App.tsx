import { Toaster } from "@/components/ui/sonner";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatArea from "./components/ChatArea";
import RoomSidebar from "./components/RoomSidebar";
import SetupScreen from "./components/SetupScreen";
import StatusPanel from "./components/StatusPanel";
import { useOnyx } from "./hooks/useOnyx";
import type { OnyxProfile } from "./lib/onyx-utils";

export default function App() {
  const onyx = useOnyx();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const activeRoom = onyx.rooms.find((r) => r.id === onyx.activeRoomId) ??
    onyx.rooms[0] ?? {
      id: "general",
      name: "General",
      isSecret: false,
      passwordHash: "",
      creatorId: "__system__",
      createdAt: 0,
    };

  const roomMessages = onyx.getRoomMessages(onyx.activeRoomId);
  const allMessages = onyx.getAllMessages();

  // Keyboard shortcut: right arrow key to open status panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && e.altKey) {
        onyx.toggleStatusPanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onyx.toggleStatusPanel]);

  const handleSendMessage = useCallback(
    async (alias: string, content: string) => {
      await onyx.postMessage.mutateAsync({ alias, content });
    },
    [onyx.postMessage],
  );

  if (!onyx.isSetupDone) {
    return <SetupScreen onComplete={onyx.completeSetup} />;
  }

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ background: "oklch(0.08 0.005 260)" }}
    >
      {/* Background atmosphere */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 80%, oklch(0.12 0.02 55 / 0.15) 0%, transparent 40%), radial-gradient(ellipse at 80% 10%, oklch(0.1 0.01 260 / 0.2) 0%, transparent 40%)",
        }}
      />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 lg:hidden"
            style={{ background: "oklch(0 0 0 / 0.7)" }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Left sidebar */}
      <AnimatePresence>
        <div
          className={`
            fixed top-0 left-0 h-full z-30 transition-transform duration-300
            lg:static lg:z-auto lg:translate-x-0
            ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <RoomSidebar
            profile={onyx.profile!}
            rooms={onyx.rooms}
            joinedRooms={onyx.joinedRooms}
            activeRoomId={onyx.activeRoomId}
            onSelectRoom={(id) => {
              onyx.setActiveRoom(id);
              setMobileSidebarOpen(false);
            }}
            onCreateRoom={onyx.createRoom}
            onUpdateRoom={onyx.updateRoom}
            onJoinRoom={onyx.joinRoom}
            onLeaveRoom={onyx.leaveRoom}
            onUpdateProfile={onyx.updateProfile}
          />
        </div>
      </AnimatePresence>

      {/* Center chat */}
      <main className="flex-1 min-w-0 flex flex-col relative z-10 h-full">
        {/* Mobile header bar */}
        <div
          className="lg:hidden flex items-center gap-2 px-3 py-2 flex-shrink-0"
          style={{ borderBottom: "1px solid oklch(0.18 0.01 260)" }}
        >
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl"
            style={{
              background: "oklch(0.13 0.01 260)",
              color: "oklch(0.72 0.15 55)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect y="2" width="16" height="2" rx="1" />
              <rect y="7" width="10" height="2" rx="1" />
              <rect y="12" width="16" height="2" rx="1" />
            </svg>
          </button>
          <span className="text-sm font-semibold gold-shimmer tracking-widest">
            ONYX
          </span>
          <button
            type="button"
            onClick={onyx.toggleStatusPanel}
            className="ml-auto p-2 rounded-xl"
            style={{
              background: "oklch(0.13 0.01 260)",
              color: "oklch(0.55 0.015 260)",
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <ChatArea
          profile={onyx.profile!}
          room={activeRoom}
          messages={roomMessages}
          allMessages={allMessages}
          onSendMessage={handleSendMessage}
          isSending={onyx.postMessage.isPending}
          onOpenStatus={onyx.toggleStatusPanel}
        />
      </main>

      {/* Status panel trigger button (desktop) */}
      {!onyx.statusPanelOpen && (
        <motion.button
          type="button"
          data-ocid="status.button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onyx.toggleStatusPanel}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col items-center justify-center gap-1 py-8 px-2 rounded-l-xl transition-all"
          style={{
            background: "oklch(0.13 0.01 260)",
            border: "1px solid oklch(0.22 0.01 260)",
            borderRight: "none",
            color: "oklch(0.45 0.015 260)",
          }}
          title="Status Updates (Alt+→)"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "oklch(0.72 0.15 55)";
            e.currentTarget.style.background = "oklch(0.15 0.01 260)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "oklch(0.45 0.015 260)";
            e.currentTarget.style.background = "oklch(0.13 0.01 260)";
          }}
        >
          <ChevronRight size={14} />
          <span
            className="text-[9px] tracking-widest"
            style={{ writingMode: "vertical-lr" }}
          >
            STATUS
          </span>
        </motion.button>
      )}

      {/* Right status panel */}
      <StatusPanel
        open={onyx.statusPanelOpen}
        onClose={() => onyx.setStatusPanelOpen(false)}
        profile={onyx.profile!}
        statuses={onyx.statuses}
        onAddStatus={onyx.addStatus}
      />

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(0.15 0.01 260)",
            border: "1px solid oklch(0.25 0.01 260)",
            color: "oklch(0.93 0.01 260)",
          },
        }}
      />
    </div>
  );
}
