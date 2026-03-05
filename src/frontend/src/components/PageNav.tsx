import { Bell, MessageSquare, Phone, Tv2, Video } from "lucide-react";
import { motion } from "motion/react";

export type PageIndex = 0 | 1 | 2 | 3;
// 0 = Caller (left), 1 = Chat (center), 2 = Video Feed (right), 3 = VS Studio (up)

interface NavItem {
  page: PageIndex;
  icon: React.ReactNode;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { page: 0, icon: <Phone size={18} />, label: "Call" },
  { page: 1, icon: <MessageSquare size={18} />, label: "Chat" },
  { page: 2, icon: <Video size={18} />, label: "Feed" },
  { page: 3, icon: <Tv2 size={18} />, label: "Studio" },
];

interface Props {
  currentPage: PageIndex;
  onNavigate: (page: PageIndex) => void;
  statusPanelOpen: boolean;
  onToggleStatus: () => void;
}

export default function PageNav({
  currentPage,
  onNavigate,
  statusPanelOpen,
  onToggleStatus,
}: Props) {
  return (
    <nav
      data-ocid="nav.panel"
      className="flex items-center justify-around px-2 py-2 flex-shrink-0"
      style={{
        background: "oklch(0.09 0.008 260)",
        borderTop: "1px solid oklch(0.18 0.01 260)",
        height: 56,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = currentPage === item.page;
        return (
          <button
            key={item.page}
            type="button"
            data-ocid={`nav.${item.label.toLowerCase()}.tab`}
            onClick={() => onNavigate(item.page)}
            className="relative flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all"
            style={{
              color: isActive ? "oklch(0.72 0.15 55)" : "oklch(0.4 0.012 260)",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute inset-0 rounded-xl"
                style={{ background: "oklch(0.72 0.15 55 / 0.1)" }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10">{item.icon}</span>
            <span
              className="relative z-10 text-[10px] font-medium tracking-wide"
              style={{
                color: isActive
                  ? "oklch(0.72 0.15 55)"
                  : "oklch(0.35 0.01 260)",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Status tab — special action button */}
      <button
        type="button"
        data-ocid="nav.status.tab"
        onClick={onToggleStatus}
        className="relative flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all"
        style={{
          color: statusPanelOpen
            ? "oklch(0.72 0.15 55)"
            : "oklch(0.4 0.012 260)",
        }}
      >
        {statusPanelOpen && (
          <motion.div
            layoutId="nav-status-indicator"
            className="absolute inset-0 rounded-xl"
            style={{ background: "oklch(0.72 0.15 55 / 0.1)" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
        )}
        <span className="relative z-10">
          <Bell size={18} />
        </span>
        <span
          className="relative z-10 text-[10px] font-medium tracking-wide"
          style={{
            color: statusPanelOpen
              ? "oklch(0.72 0.15 55)"
              : "oklch(0.35 0.01 260)",
          }}
        >
          Status
        </span>
      </button>
    </nav>
  );
}
