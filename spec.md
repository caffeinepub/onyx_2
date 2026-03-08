# ONYX

## Current State
The chat system stores messages in a backend Motoko canister. Message deletion is currently handled client-side only via localStorage (`deletedIds`). When a user deletes a message, it only disappears for them -- nobody else sees the deletion.

## Requested Changes (Diff)

### Add
- Backend `deleteMessage(alias: Text, timestamp: Time)` function that marks a message as deleted for everyone
- Backend stores a set of deleted message IDs (alias + timestamp)
- `getAllMessages` returns all messages with a `deleted: Bool` flag (or filters them out server-side)
- Frontend calls `deleteMessage` on the backend instead of writing to localStorage
- Any user (not just the sender) can delete any message, and the deletion is visible to all

### Modify
- `main.mo`: add deleted message tracking and `deleteMessage` endpoint
- `backend.d.ts`: add `deleteMessage` to the interface, update `Message` type if needed
- `ChatArea.tsx`: replace `handleDeleteMessage` localStorage logic with backend `deleteMessage` call; re-poll messages to reflect server state
- `MessageBubble.tsx`: no structural changes needed; deleted state still driven by prop

### Remove
- `loadDeletedMessages` / `saveDeletedMessages` localStorage usage for per-message deletion in `ChatArea.tsx`

## Implementation Plan
1. Update `main.mo`: add a `deletedMessages` hash set keyed by `(alias, timestamp)`, add `deleteMessage(alias, timestamp)` public func, mark deleted messages in `getAllMessages` response (return content as empty string or add a `deleted` flag)
2. Update `backend.d.ts`: add `deleteMessage(alias: string, timestamp: bigint): Promise<void>` to `backendInterface`; add `deleted?: boolean` to `Message`
3. Update `ChatArea.tsx`: import and call `backend.deleteMessage`; remove localStorage delete logic; derive `isDeleted` from `msg.deleted` field returned by server
4. Validate and deploy
