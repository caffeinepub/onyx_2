import {
  Bell,
  Dumbbell,
  MessageSquare,
  Newspaper,
  Search,
  Tv2,
  Video,
} from "lucide-react";
import { motion } from "motion/react";

export type PageIndex = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = Chat, 1 = Video Feed, 2 = VS Studio, 3 = News, 4 = Web Search, 5 = Workout

interface NavItem {
  page: PageIndex;
  icon: React.ReactNode;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { page: 0, icon: <MessageSquare size={18} />, label: "Chat" },
  { page: 1, icon: <Video size={18} />, label: "Feed" },
  { page: 2, icon: <Tv2 size={18} />, label: "Studio" },
  { page: 3, icon: <Newspaper size={18} />, label: "News" },
  { page: 4, icon: <Search size={18} />, label: "Search" },
  { page: 5, icon: <Dumbbell size={18} />, label: "Workout" },
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
