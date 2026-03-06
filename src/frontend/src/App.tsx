import { Toaster } from "@/components/ui/sonner";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatArea from "./components/ChatArea";
import DailyNewsPage from "./components/DailyNewsPage";
import PageNav, { type PageIndex } from "./components/PageNav";
import RoomSidebar from "./components/RoomSidebar";
import SetupScreen from "./components/SetupScreen";
import StatusPanel from "./components/StatusPanel";
import VSStudioPage from "./components/VSStudioPage";
import VideoFeedPage from "./components/VideoFeedPage";
import { useOnyx } from "./hooks/useOnyx";

// Page map: 0=Chat, 1=VideoFeed, 2=VSStudio, 3=News
const PAGE_X: Record<PageIndex, number> = {
  0: 0,
  1: 100,
  2: 0,
  3: 100,
};
const PAGE_Y: Record<PageIndex, number> = { 0: 0, 1: 0, 2: -100, 3: 0 };

export default function App() {
  const onyx = useOnyx();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageIndex>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Status panel toggle: Alt+Right
      if (e.key === "ArrowRight" && e.altKey) {
        onyx.toggleStatusPanel();
        return;
      }

      // Don't navigate if focused on an input/textarea
      const tag = (
        document.activeElement as HTMLElement
      )?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "ArrowRight") {
        setCurrentPage(1);
      } else if (e.key === "ArrowUp") {
        setCurrentPage(2);
      } else if (e.key === "ArrowDown") {
        setCurrentPage(0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onyx.toggleStatusPanel]);

  // Touch swipe navigation
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      const tag = (
        document.activeElement as HTMLElement
      )?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const threshold = 60;

      if (absDx > absDy && absDx > threshold) {
        // Horizontal swipe
        if (dx < 0)
          setCurrentPage(1); // swipe left → video feed
        else setCurrentPage(0); // swipe right → chat
      } else if (absDy > absDx && absDy > threshold) {
        // Vertical swipe
        if (dy < 0)
          setCurrentPage(2); // swipe up → studio
        else setCurrentPage(0); // swipe down → chat
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const handleSendMessage = useCallback(
    async (alias: string, content: string) => {
      await onyx.postMessage.mutateAsync({ alias, content });
    },
    [onyx.postMessage],
  );

  if (!onyx.isSetupDone) {
    return <SetupScreen onComplete={onyx.completeSetup} />;
  }

  const isChatPage = currentPage === 0;

  return (
    <div
      className="flex flex-col h-screen overflow-hidden relative"
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

      {/* Main content area (grows) */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative z-10">
        {/* Sidebar — only on chat page (desktop always visible) */}
        <AnimatePresence>
          {mobileSidebarOpen && isChatPage && (
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

        {/* Left sidebar (chat only) */}
        <div
          className={`
            fixed top-0 left-0 h-full z-30 transition-transform duration-300
            lg:static lg:z-auto
            ${isChatPage ? "lg:translate-x-0 lg:flex" : "lg:hidden"}
            ${mobileSidebarOpen && isChatPage ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
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
            onDeleteRoom={onyx.deleteRoom}
            onJoinRoom={onyx.joinRoom}
            onLeaveRoom={onyx.leaveRoom}
            onUpdateProfile={onyx.updateProfile}
          />
        </div>

        {/* Page container */}
        <div className="flex-1 min-w-0 relative overflow-hidden">
          {/* Mobile header (chat page only) */}
          {isChatPage && (
            <div
              className="lg:hidden flex items-center gap-2 px-3 py-2 flex-shrink-0 absolute top-0 left-0 right-0 z-10"
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
          )}

          {/* Animated pages */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{
                x: `${-PAGE_X[currentPage]}%`,
                y: `${-PAGE_Y[currentPage]}%`,
                opacity: 0,
              }}
              animate={{ x: "0%", y: "0%", opacity: 1 }}
              exit={{
                x: `${PAGE_X[currentPage]}%`,
                y: `${PAGE_Y[currentPage]}%`,
                opacity: 0,
              }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="absolute inset-0 flex flex-col"
              style={{
                paddingTop: isChatPage ? undefined : 0,
              }}
            >
              {currentPage === 0 && (
                <main
                  className="flex-1 min-w-0 flex flex-col relative h-full"
                  style={{ paddingTop: "0" }}
                >
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
              )}

              {currentPage === 1 && <VideoFeedPage profile={onyx.profile!} />}

              {currentPage === 2 && <VSStudioPage profile={onyx.profile!} />}

              {currentPage === 3 && <DailyNewsPage profile={onyx.profile!} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Status panel trigger button (desktop, chat only) */}
        {!onyx.statusPanelOpen && isChatPage && (
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
      </div>

      {/* Bottom page navigation */}
      <PageNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        statusPanelOpen={onyx.statusPanelOpen}
        onToggleStatus={onyx.toggleStatusPanel}
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
