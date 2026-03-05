import type { OnyxProfile, OnyxRoom } from "@/lib/onyx-utils";
import { PRESET_AVATARS } from "@/lib/onyx-utils";
import { Hash, Lock, LogOut, Search, Settings } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import CreateRoomDialog from "./CreateRoomDialog";
import EditRoomDialog from "./EditRoomDialog";
import JoinRoomDialog from "./JoinRoomDialog";
import ProfileDialog from "./ProfileDialog";

interface Props {
  profile: OnyxProfile;
  rooms: OnyxRoom[];
  joinedRooms: Set<string>;
  activeRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (
    name: string,
    isSecret: boolean,
    password: string,
  ) => Promise<void>;
  onUpdateRoom: (
    roomId: string,
    name: string,
    password: string,
  ) => Promise<void>;
  onJoinRoom: (roomId: string, password: string) => boolean;
  onLeaveRoom: (roomId: string) => void;
  onUpdateProfile: (profile: OnyxProfile) => void;
  unreadCounts?: Record<string, number>;
}

function RoomAvatar({ room }: { room: OnyxRoom }) {
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{
        background: room.isSecret
          ? "oklch(0.72 0.15 55 / 0.1)"
          : "oklch(0.15 0.01 260)",
        border: room.isSecret
          ? "1px solid oklch(0.72 0.15 55 / 0.3)"
          : "1px solid oklch(0.2 0.01 260)",
      }}
    >
      {room.isSecret ? (
        <Lock size={13} style={{ color: "oklch(0.72 0.15 55)" }} />
      ) : (
        <Hash size={13} style={{ color: "oklch(0.55 0.015 260)" }} />
      )}
    </div>
  );
}

function UserAvatar({
  profile,
  size = 32,
}: { profile: OnyxProfile; size?: number }) {
  const initials = profile.username.slice(0, 2).toUpperCase();
  if (profile.avatarType === "upload") {
    return (
      <div
        className="rounded-full overflow-hidden flex-shrink-0 profile-ring"
        style={{ width: size, height: size }}
      >
        <img
          src={profile.avatarUrl}
          alt="avatar"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold flex-shrink-0 profile-ring"
      style={{
        width: size,
        height: size,
        background: profile.avatarUrl,
        color: "oklch(0.08 0.005 260)",
        fontSize: size * 0.34,
      }}
    >
      {initials}
    </div>
  );
}

export default function RoomSidebar({
  profile,
  rooms,
  joinedRooms,
  activeRoomId,
  onSelectRoom,
  onCreateRoom,
  onUpdateRoom,
  onJoinRoom,
  onLeaveRoom,
  onUpdateProfile,
  unreadCounts = {},
}: Props) {
  const [search, setSearch] = useState("");
  const [joinTarget, setJoinTarget] = useState<OnyxRoom | null>(null);

  // All rooms visible — secret rooms are shown to everyone, locked until joined
  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRoomClick = (room: OnyxRoom) => {
    if (room.isSecret && !joinedRooms.has(room.id)) {
      setJoinTarget(room);
    } else {
      onSelectRoom(room.id);
    }
  };

  return (
    <aside
      data-ocid="sidebar.panel"
      className="flex flex-col h-full"
      style={{
        width: "256px",
        minWidth: "256px",
        background: "oklch(0.1 0.008 260)",
        borderRight: "1px solid oklch(0.2 0.01 260)",
      }}
    >
      {/* Logo header */}
      <div
        className="px-4 py-3.5 flex items-center gap-2.5"
        style={{ borderBottom: "1px solid oklch(0.16 0.008 260)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: "oklch(0.72 0.15 55 / 0.1)",
            border: "1px solid oklch(0.72 0.15 55 / 0.2)",
          }}
        >
          <Lock size={13} style={{ color: "oklch(0.72 0.15 55)" }} />
        </div>
        <h1 className="text-sm font-bold tracking-[0.2em] gold-shimmer">
          ONYX
        </h1>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: "oklch(0.13 0.01 260)",
            border: "1px solid oklch(0.2 0.01 260)",
          }}
        >
          <Search size={13} style={{ color: "oklch(0.45 0.015 260)" }} />
          <input
            data-ocid="sidebar.search_input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms..."
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: "oklch(0.88 0.01 260)" }}
          />
        </div>
      </div>

      {/* Rooms label + create button */}
      <div className="px-3 py-1.5 flex items-center justify-between">
        <span
          className="text-[10px] tracking-widest font-medium"
          style={{ color: "oklch(0.45 0.015 260)" }}
        >
          ROOMS
        </span>
        <CreateRoomDialog onCreate={onCreateRoom} />
      </div>

      {/* Room list */}
      <nav
        data-ocid="room.list"
        className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2"
        style={{ scrollbarWidth: "thin" }}
      >
        <AnimatePresence>
          {filteredRooms.map((room, idx) => {
            const isActive = room.id === activeRoomId;
            const unread = unreadCounts[room.id] ?? 0;
            const isCreator = room.creatorId === profile.id;
            const isLocked = room.isSecret && !joinedRooms.has(room.id);
            const markerIndex = idx + 1;

            return (
              <motion.div
                key={room.id}
                data-ocid={`room.item.${markerIndex}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className="group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all"
                style={{
                  background: isActive
                    ? "oklch(0.72 0.15 55 / 0.1)"
                    : "transparent",
                  border: isActive
                    ? "1px solid oklch(0.72 0.15 55 / 0.2)"
                    : "1px solid transparent",
                  opacity: isLocked ? 0.65 : 1,
                }}
                onClick={() => handleRoomClick(room)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "oklch(0.14 0.01 260)";
                    if (isLocked)
                      (e.currentTarget as HTMLDivElement).style.opacity = "1";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "transparent";
                    if (isLocked)
                      (e.currentTarget as HTMLDivElement).style.opacity =
                        "0.65";
                  }
                }}
              >
                <RoomAvatar room={room} />

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{
                      color: isActive
                        ? "oklch(0.82 0.12 55)"
                        : isLocked
                          ? "oklch(0.65 0.012 260)"
                          : "oklch(0.82 0.01 260)",
                    }}
                  >
                    {room.name}
                  </p>
                  {isLocked && (
                    <p
                      className="text-[10px]"
                      style={{ color: "oklch(0.45 0.015 260)" }}
                    >
                      Enter password to join
                    </p>
                  )}
                </div>

                {/* Unread badge */}
                {unread > 0 && !isLocked && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: "oklch(0.72 0.15 55)",
                      color: "oklch(0.08 0.005 260)",
                    }}
                  >
                    {unread > 9 ? "9+" : unread}
                  </div>
                )}

                {/* Room actions (creator only) */}
                {isCreator && isActive && !isLocked && (
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <EditRoomDialog
                      room={room}
                      onUpdate={onUpdateRoom}
                      trigger={
                        <button
                          type="button"
                          className="p-1 rounded-md transition-colors"
                          style={{ color: "oklch(0.45 0.015 260)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "oklch(0.72 0.15 55)";
                            e.currentTarget.style.background =
                              "oklch(0.15 0.01 260)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color =
                              "oklch(0.45 0.015 260)";
                            e.currentTarget.style.background = "transparent";
                          }}
                          title="Edit room"
                        >
                          <Settings size={12} />
                        </button>
                      }
                    />
                  </div>
                )}

                {/* Leave room (non-general, joined) */}
                {room.id !== "general" &&
                  !isCreator &&
                  isActive &&
                  !isLocked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeaveRoom(room.id);
                      }}
                      className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: "oklch(0.5 0.15 27)" }}
                      title="Leave room"
                    >
                      <LogOut size={12} />
                    </button>
                  )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredRooms.length === 0 && search && (
          <div
            data-ocid="room.empty_state"
            className="text-center py-8 text-xs"
            style={{ color: "oklch(0.45 0.015 260)" }}
          >
            No rooms match "{search}"
          </div>
        )}
      </nav>

      {/* Profile section */}
      <div
        className="px-3 py-3 flex items-center gap-2.5"
        style={{ borderTop: "1px solid oklch(0.18 0.01 260)" }}
      >
        <UserAvatar profile={profile} size={34} />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "oklch(0.88 0.01 260)" }}
          >
            {profile.username}
          </p>
          <div className="flex items-center gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full onyx-pulse"
              style={{ background: "oklch(0.72 0.15 55)" }}
            />
            <span
              className="text-[10px]"
              style={{ color: "oklch(0.45 0.015 260)" }}
            >
              Online
            </span>
          </div>
        </div>
        <ProfileDialog
          profile={profile}
          onSave={onUpdateProfile}
          trigger={
            <button
              type="button"
              data-ocid="profile.edit_button"
              className="p-1.5 rounded-lg transition-all"
              style={{ color: "oklch(0.45 0.015 260)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "oklch(0.72 0.15 55)";
                e.currentTarget.style.background = "oklch(0.15 0.01 260)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "oklch(0.45 0.015 260)";
                e.currentTarget.style.background = "transparent";
              }}
              title="Edit profile"
            >
              <Settings size={15} />
            </button>
          }
        />
      </div>

      {/* Join secret room dialog */}
      {joinTarget && (
        <JoinRoomDialog
          roomName={joinTarget.name}
          open={joinTarget !== null}
          onClose={() => setJoinTarget(null)}
          onJoin={(password) => {
            const success = onJoinRoom(joinTarget.id, password);
            if (success) onSelectRoom(joinTarget.id);
            return success;
          }}
        />
      )}
    </aside>
  );
}
