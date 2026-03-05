# ONYX

## Current State
- `CallerPage.tsx`: Simulated calls using localStorage + setTimeout. No real audio/video. Country code detection and mode tabs exist.
- `VideoFeedPage.tsx`: Upload, playback, likes, comments, share, shorts row. No user guidance/tutorial exists anywhere in the feed page.

## Requested Changes (Diff)

### Add
1. **Real-time WebRTC calls** in `CallerPage.tsx`:
   - On "Call" button press: get local media stream (`getUserMedia`) → create `RTCPeerConnection` → create SDP offer → exchange via localStorage-based signaling (offer/answer/ICE candidates stored per callId) → transition to connected when remote stream arrives
   - On incoming call detected (poll localStorage for offers addressed to current user): show existing incoming call UI → on accept, get local media → create SDP answer → exchange ICE candidates
   - Render local video stream in a small PiP `<video>` (muted, mirrored) and remote stream in the main video area during video calls
   - Mute button mutes/unmutes the local audio track in real time
   - Camera toggle enables/disables the local video track in real time
   - Graceful error handling: if `getUserMedia` is denied or WebRTC unavailable, show a clear inline error message
   - Remove all "Simulated call" / "WebRTC coming soon" placeholder text

2. **How-to guide / tutorial overlay** in `VideoFeedPage.tsx`:
   - A "How to use" button in the feed header (info icon, secondary style)
   - Clicking it opens a modal that explains: how to upload a video, public vs private videos, how to post as a Short (under 60s), how to like/comment/share, and how to watch private videos
   - The modal is dismissible via close button or backdrop click
   - Clean, readable layout with icons and short descriptions per step

### Modify
- `CallerPage.tsx`: Replace the setTimeout-based simulated call with real WebRTC peer connection logic using localStorage as the signaling channel (works in the same browser across tabs)
- `CallerPage.tsx`: The call screen shows real `<video>` streams when in video mode; audio-only keeps the avatar UI
- `VideoFeedPage.tsx`: Add a how-to button next to the Upload Video button in the header

### Remove
- `CallerPage.tsx`: `connectTimeoutRef` setTimeout fake connection
- `CallerPage.tsx`: "Simulated call — real WebRTC coming soon" text
- `CallerPage.tsx`: "Calls are simulated • WebRTC coming soon" footer text

## Implementation Plan
1. In `CallerPage.tsx`:
   - Add refs: `pcRef` (RTCPeerConnection), `localStreamRef`, `remoteStreamRef`, `localVideoRef`, `remoteVideoRef`
   - `startCall()`: getUserMedia → new RTCPeerConnection → addTracks → createOffer → setLocalDescription → write offer to localStorage signaling key → poll for answer + ICE candidates
   - `handleIncomingOffer()`: when an offer appears addressed to `profile.username` → show incoming call UI → on accept: getUserMedia → new RTCPeerConnection → setRemoteDescription(offer) → createAnswer → setLocalDescription → write answer → exchange ICE
   - ICE candidate signaling: write candidates to localStorage per callId, poll and addIceCandidate
   - `cleanupCall()`: stop all tracks, close pc, clear localStorage signaling keys
   - In the active call screen: render `<video ref={remoteVideoRef}>` for remote, `<video ref={localVideoRef}>` PiP for local (video mode only)
   - Remove all "simulated" text references

2. In `VideoFeedPage.tsx`:
   - Add `showHowTo` state (boolean)
   - Add `HowToModal` component with steps: Upload, Public/Private, Shorts, Like/Comment/Share, Watch private
   - Render a small "?" or info button in the header; clicking sets `showHowTo(true)`
   - Modal uses `AnimatePresence` + `motion.div` consistent with existing modal style
