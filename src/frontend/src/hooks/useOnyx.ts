import { useCallback, useEffect, useMemo, useState } from "react";
import type { Message } from "../backend.d";
import {
  GENERAL_ROOM,
  type OnyxProfile,
  type OnyxRoom,
  type OnyxStatus,
  type SystemPayload,
  generateId,
  hashPassword,
  loadJoinedRooms,
  loadProfile,
  loadRooms,
  loadStatuses,
  parseSystemMessage,
  saveJoinedRooms,
  saveProfile,
  saveRooms,
  saveStatuses,
} from "../lib/onyx-utils";
import { useGetAllMessages, usePostMessage } from "./useQueries";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnyxState {
  profile: OnyxProfile | null;
  rooms: OnyxRoom[];
  joinedRooms: Set<string>;
  activeRoomId: string;
  statuses: OnyxStatus[];
  isSetupDone: boolean;
  statusPanelOpen: boolean;
}

export interface OnyxActions {
  completeSetup: (profile: OnyxProfile) => void;
  updateProfile: (profile: OnyxProfile) => void;
  setActiveRoom: (roomId: string) => void;
  createRoom: (
    name: string,
    isSecret: boolean,
    password: string,
  ) => Promise<void>;
  updateRoom: (roomId: string, name: string, password: string) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  joinRoom: (roomId: string, password: string) => boolean;
  leaveRoom: (roomId: string) => void;
  addStatus: (status: OnyxStatus) => Promise<void>;
  toggleStatusPanel: () => void;
  setStatusPanelOpen: (open: boolean) => void;
  getRoomMessages: (roomId: string) => Message[];
  getAllMessages: () => Message[];
  postMessage: ReturnType<typeof usePostMessage>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOnyx(): OnyxState & OnyxActions {
  const [profile, setProfile] = useState<OnyxProfile | null>(loadProfile);
  const [rooms, setRooms] = useState<OnyxRoom[]>(() => {
    const stored = loadRooms();
    return stored.length > 0 ? stored : [GENERAL_ROOM];
  });
  const [joinedRooms, setJoinedRooms] = useState<Set<string>>(loadJoinedRooms);
  const [activeRoomId, setActiveRoomId] = useState("general");
  const [statuses, setStatuses] = useState<OnyxStatus[]>(loadStatuses);
  const [statusPanelOpen, setStatusPanelOpen] = useState(false);

  const { data: messagesData } = useGetAllMessages();
  const postMessageMutation = usePostMessage();

  // Process system messages from backend to sync rooms/statuses
  useEffect(() => {
    if (!messagesData) return;

    const systemMessages = messagesData.filter((m) => m.alias === "__SYSTEM__");
    if (systemMessages.length === 0) return;

    let roomsUpdated = false;
    const currentRooms = loadRooms();
    const roomMap = new Map<string, OnyxRoom>(
      currentRooms.map((r) => [r.id, r]),
    );

    // Always ensure general room
    if (!roomMap.has("general")) {
      roomMap.set("general", GENERAL_ROOM);
      roomsUpdated = true;
    }

    const currentStatuses = loadStatuses();
    const statusMap = new Map<string, OnyxStatus>(
      currentStatuses.map((s) => [s.id, s]),
    );
    let statusesUpdated = false;

    for (const msg of systemMessages) {
      const payload = parseSystemMessage(msg.content);
      if (!payload) continue;

      if (payload.type === "room_create") {
        const room = payload.room as OnyxRoom;
        if (!roomMap.has(room.id)) {
          roomMap.set(room.id, room);
          roomsUpdated = true;
        }
      } else if (payload.type === "room_update") {
        const p = payload as {
          type: "room_update";
          roomId: string;
          name?: string;
          passwordHash?: string;
        };
        const existing = roomMap.get(p.roomId);
        if (existing) {
          const updated = {
            ...existing,
            ...(p.name !== undefined ? { name: p.name } : {}),
            ...(p.passwordHash !== undefined
              ? { passwordHash: p.passwordHash }
              : {}),
          };
          roomMap.set(p.roomId, updated);
          roomsUpdated = true;
        }
      } else if (payload.type === "status_post") {
        const p = payload as { type: "status_post"; status: OnyxStatus };
        if (!statusMap.has(p.status.id)) {
          statusMap.set(p.status.id, p.status);
          statusesUpdated = true;
        }
      } else if (payload.type === "room_delete") {
        const p = payload as { type: "room_delete"; roomId: string };
        if (roomMap.has(p.roomId) && p.roomId !== "general") {
          roomMap.delete(p.roomId);
          roomsUpdated = true;
        }
      }
    }

    if (roomsUpdated) {
      const newRooms = Array.from(roomMap.values());
      saveRooms(newRooms);
      setRooms(newRooms);
    }

    if (statusesUpdated) {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const newStatuses = Array.from(statusMap.values()).filter(
        (s) => s.timestamp > oneDayAgo,
      );
      saveStatuses(newStatuses);
      setStatuses(newStatuses);
    }
  }, [messagesData]);

  // Ensure general room always exists
  useEffect(() => {
    setRooms((prev) => {
      if (prev.find((r) => r.id === "general")) return prev;
      const next = [GENERAL_ROOM, ...prev];
      saveRooms(next);
      return next;
    });
  }, []);

  const completeSetup = useCallback((newProfile: OnyxProfile) => {
    saveProfile(newProfile);
    setProfile(newProfile);
  }, []);

  const updateProfile = useCallback((newProfile: OnyxProfile) => {
    saveProfile(newProfile);
    setProfile(newProfile);
  }, []);

  const setActiveRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
  }, []);

  const createRoom = useCallback(
    async (name: string, isSecret: boolean, password: string) => {
      if (!profile) return;
      const room: OnyxRoom = {
        id: generateId(),
        name,
        isSecret,
        passwordHash: isSecret ? hashPassword(password) : "",
        creatorId: profile.id,
        createdAt: Date.now(),
      };

      // Update local state
      setRooms((prev) => {
        const next = [...prev, room];
        saveRooms(next);
        return next;
      });

      // Only auto-join public rooms — secret rooms require password entry
      if (!isSecret) {
        setJoinedRooms((prev) => {
          const next = new Set(prev);
          next.add(room.id);
          saveJoinedRooms(next);
          return next;
        });
        setActiveRoomId(room.id);
      }
      // Secret rooms: creator must enter password to join, just like everyone else

      // Broadcast to backend
      const payload: SystemPayload = { type: "room_create", room };
      await postMessageMutation.mutateAsync({
        alias: "__SYSTEM__",
        content: JSON.stringify(payload),
      });
    },
    [profile, postMessageMutation],
  );

  const updateRoom = useCallback(
    async (roomId: string, name: string, password: string) => {
      if (!profile) return;
      const room = rooms.find((r) => r.id === roomId);
      if (!room || room.creatorId !== profile.id) return;

      const passwordHash = password
        ? hashPassword(password)
        : room.passwordHash;

      setRooms((prev) => {
        const next = prev.map((r) =>
          r.id === roomId ? { ...r, name, passwordHash } : r,
        );
        saveRooms(next);
        return next;
      });

      const payload: {
        type: "room_update";
        roomId: string;
        name?: string;
        passwordHash?: string;
      } = {
        type: "room_update",
        roomId,
        name,
        passwordHash,
      };
      await postMessageMutation.mutateAsync({
        alias: "__SYSTEM__",
        content: JSON.stringify(payload),
      });
    },
    [profile, rooms, postMessageMutation],
  );

  const joinRoom = useCallback(
    (roomId: string, password: string): boolean => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return false;

      if (room.isSecret) {
        const hash = hashPassword(password);
        if (hash !== room.passwordHash) return false;
      }

      setJoinedRooms((prev) => {
        const next = new Set(prev);
        next.add(roomId);
        saveJoinedRooms(next);
        return next;
      });
      return true;
    },
    [rooms],
  );

  const leaveRoom = useCallback((roomId: string) => {
    if (roomId === "general") return;
    setJoinedRooms((prev) => {
      const next = new Set(prev);
      next.delete(roomId);
      saveJoinedRooms(next);
      return next;
    });
    setActiveRoomId((current) => (current === roomId ? "general" : current));
  }, []);

  const deleteRoom = useCallback(
    async (roomId: string) => {
      if (!profile) return;
      if (roomId === "general") return;
      const room = rooms.find((r) => r.id === roomId);
      if (!room || room.creatorId !== profile.id) return;

      // Remove from local rooms state
      setRooms((prev) => {
        const next = prev.filter((r) => r.id !== roomId);
        saveRooms(next);
        return next;
      });

      // Remove from joinedRooms if present
      setJoinedRooms((prev) => {
        if (!prev.has(roomId)) return prev;
        const next = new Set(prev);
        next.delete(roomId);
        saveJoinedRooms(next);
        return next;
      });

      // Switch to general if this was the active room
      setActiveRoomId((current) => (current === roomId ? "general" : current));

      // Broadcast deletion
      const payload: SystemPayload = { type: "room_delete", roomId };
      await postMessageMutation.mutateAsync({
        alias: "__SYSTEM__",
        content: JSON.stringify(payload),
      });
    },
    [profile, rooms, postMessageMutation],
  );

  const addStatus = useCallback(
    async (status: OnyxStatus) => {
      setStatuses((prev) => {
        const next = [...prev, status];
        saveStatuses(next);
        return next;
      });

      const payload: SystemPayload = { type: "status_post", status };
      await postMessageMutation.mutateAsync({
        alias: "__SYSTEM__",
        content: JSON.stringify(payload),
      });
    },
    [postMessageMutation],
  );

  const toggleStatusPanel = useCallback(() => {
    setStatusPanelOpen((p) => !p);
  }, []);

  const getRoomMessages = useCallback(
    (roomId: string): Message[] => {
      if (!messagesData) return [];
      return messagesData.filter((m) => m.alias.startsWith(`${roomId}|`));
    },
    [messagesData],
  );

  const getAllMessages = useCallback((): Message[] => {
    return messagesData ?? [];
  }, [messagesData]);

  const isSetupDone = profile !== null;

  // Visible rooms: ALL rooms are visible (secret rooms show as locked until joined)
  const visibleRooms = useMemo(() => {
    return rooms;
  }, [rooms]);

  return {
    profile,
    rooms: visibleRooms,
    joinedRooms,
    activeRoomId,
    statuses,
    isSetupDone,
    statusPanelOpen,
    completeSetup,
    updateProfile,
    setActiveRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    joinRoom,
    leaveRoom,
    addStatus,
    toggleStatusPanel,
    setStatusPanelOpen,
    getRoomMessages,
    getAllMessages,
    postMessage: postMessageMutation,
  };
}
