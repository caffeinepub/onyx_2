import type { OnyxProfile } from "@/lib/onyx-utils";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Pencil,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ProfileDialog from "./ProfileDialog";

interface Props {
  profile: OnyxProfile;
  onUpdateProfile: (profile: OnyxProfile) => void;
}

type CallState = "idle" | "calling" | "connected" | "ended";
type CallMode = "audio" | "video";

const DIAL_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

function formatCallTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Country dial code map ─────────────────────────────────────────────────────

interface CountryInfo {
  name: string;
  flag: string;
}

const COUNTRY_CODES: Record<string, CountryInfo> = {
  "1": { name: "United States / Canada", flag: "🇺🇸" },
  "7": { name: "Russia", flag: "🇷🇺" },
  "20": { name: "Egypt", flag: "🇪🇬" },
  "27": { name: "South Africa", flag: "🇿🇦" },
  "30": { name: "Greece", flag: "🇬🇷" },
  "31": { name: "Netherlands", flag: "🇳🇱" },
  "32": { name: "Belgium", flag: "🇧🇪" },
  "33": { name: "France", flag: "🇫🇷" },
  "34": { name: "Spain", flag: "🇪🇸" },
  "36": { name: "Hungary", flag: "🇭🇺" },
  "39": { name: "Italy", flag: "🇮🇹" },
  "40": { name: "Romania", flag: "🇷🇴" },
  "41": { name: "Switzerland", flag: "🇨🇭" },
  "43": { name: "Austria", flag: "🇦🇹" },
  "44": { name: "United Kingdom", flag: "🇬🇧" },
  "45": { name: "Denmark", flag: "🇩🇰" },
  "46": { name: "Sweden", flag: "🇸🇪" },
  "47": { name: "Norway", flag: "🇳🇴" },
  "48": { name: "Poland", flag: "🇵🇱" },
  "49": { name: "Germany", flag: "🇩🇪" },
  "51": { name: "Peru", flag: "🇵🇪" },
  "52": { name: "Mexico", flag: "🇲🇽" },
  "53": { name: "Cuba", flag: "🇨🇺" },
  "54": { name: "Argentina", flag: "🇦🇷" },
  "55": { name: "Brazil", flag: "🇧🇷" },
  "56": { name: "Chile", flag: "🇨🇱" },
  "57": { name: "Colombia", flag: "🇨🇴" },
  "58": { name: "Venezuela", flag: "🇻🇪" },
  "60": { name: "Malaysia", flag: "🇲🇾" },
  "61": { name: "Australia", flag: "🇦🇺" },
  "62": { name: "Indonesia", flag: "🇮🇩" },
  "63": { name: "Philippines", flag: "🇵🇭" },
  "64": { name: "New Zealand", flag: "🇳🇿" },
  "65": { name: "Singapore", flag: "🇸🇬" },
  "66": { name: "Thailand", flag: "🇹🇭" },
  "81": { name: "Japan", flag: "🇯🇵" },
  "82": { name: "South Korea", flag: "🇰🇷" },
  "84": { name: "Vietnam", flag: "🇻🇳" },
  "86": { name: "China", flag: "🇨🇳" },
  "90": { name: "Turkey", flag: "🇹🇷" },
  "91": { name: "India", flag: "🇮🇳" },
  "92": { name: "Pakistan", flag: "🇵🇰" },
  "93": { name: "Afghanistan", flag: "🇦🇫" },
  "94": { name: "Sri Lanka", flag: "🇱🇰" },
  "95": { name: "Myanmar", flag: "🇲🇲" },
  "98": { name: "Iran", flag: "🇮🇷" },
  "212": { name: "Morocco", flag: "🇲🇦" },
  "213": { name: "Algeria", flag: "🇩🇿" },
  "216": { name: "Tunisia", flag: "🇹🇳" },
  "218": { name: "Libya", flag: "🇱🇾" },
  "220": { name: "Gambia", flag: "🇬🇲" },
  "221": { name: "Senegal", flag: "🇸🇳" },
  "222": { name: "Mauritania", flag: "🇲🇷" },
  "223": { name: "Mali", flag: "🇲🇱" },
  "224": { name: "Guinea", flag: "🇬🇳" },
  "225": { name: "Ivory Coast", flag: "🇨🇮" },
  "226": { name: "Burkina Faso", flag: "🇧🇫" },
  "227": { name: "Niger", flag: "🇳🇪" },
  "228": { name: "Togo", flag: "🇹🇬" },
  "229": { name: "Benin", flag: "🇧🇯" },
  "230": { name: "Mauritius", flag: "🇲🇺" },
  "231": { name: "Liberia", flag: "🇱🇷" },
  "232": { name: "Sierra Leone", flag: "🇸🇱" },
  "233": { name: "Ghana", flag: "🇬🇭" },
  "234": { name: "Nigeria", flag: "🇳🇬" },
  "235": { name: "Chad", flag: "🇹🇩" },
  "236": { name: "Central African Republic", flag: "🇨🇫" },
  "237": { name: "Cameroon", flag: "🇨🇲" },
  "238": { name: "Cape Verde", flag: "🇨🇻" },
  "239": { name: "São Tomé and Príncipe", flag: "🇸🇹" },
  "240": { name: "Equatorial Guinea", flag: "🇬🇶" },
  "241": { name: "Gabon", flag: "🇬🇦" },
  "242": { name: "Congo", flag: "🇨🇬" },
  "243": { name: "DR Congo", flag: "🇨🇩" },
  "244": { name: "Angola", flag: "🇦🇴" },
  "245": { name: "Guinea-Bissau", flag: "🇬🇼" },
  "246": { name: "British Indian Ocean Territory", flag: "🇮🇴" },
  "247": { name: "Ascension Island", flag: "🇸🇭" },
  "248": { name: "Seychelles", flag: "🇸🇨" },
  "249": { name: "Sudan", flag: "🇸🇩" },
  "250": { name: "Rwanda", flag: "🇷🇼" },
  "251": { name: "Ethiopia", flag: "🇪🇹" },
  "252": { name: "Somalia", flag: "🇸🇴" },
  "253": { name: "Djibouti", flag: "🇩🇯" },
  "254": { name: "Kenya", flag: "🇰🇪" },
  "255": { name: "Tanzania", flag: "🇹🇿" },
  "256": { name: "Uganda", flag: "🇺🇬" },
  "257": { name: "Burundi", flag: "🇧🇮" },
  "258": { name: "Mozambique", flag: "🇲🇿" },
  "260": { name: "Zambia", flag: "🇿🇲" },
  "261": { name: "Madagascar", flag: "🇲🇬" },
  "262": { name: "Réunion", flag: "🇷🇪" },
  "263": { name: "Zimbabwe", flag: "🇿🇼" },
  "264": { name: "Namibia", flag: "🇳🇦" },
  "265": { name: "Malawi", flag: "🇲🇼" },
  "266": { name: "Lesotho", flag: "🇱🇸" },
  "267": { name: "Botswana", flag: "🇧🇼" },
  "268": { name: "Eswatini", flag: "🇸🇿" },
  "269": { name: "Comoros", flag: "🇰🇲" },
  "290": { name: "Saint Helena", flag: "🇸🇭" },
  "291": { name: "Eritrea", flag: "🇪🇷" },
  "297": { name: "Aruba", flag: "🇦🇼" },
  "298": { name: "Faroe Islands", flag: "🇫🇴" },
  "299": { name: "Greenland", flag: "🇬🇱" },
  "350": { name: "Gibraltar", flag: "🇬🇮" },
  "351": { name: "Portugal", flag: "🇵🇹" },
  "352": { name: "Luxembourg", flag: "🇱🇺" },
  "353": { name: "Ireland", flag: "🇮🇪" },
  "354": { name: "Iceland", flag: "🇮🇸" },
  "355": { name: "Albania", flag: "🇦🇱" },
  "356": { name: "Malta", flag: "🇲🇹" },
  "357": { name: "Cyprus", flag: "🇨🇾" },
  "358": { name: "Finland", flag: "🇫🇮" },
  "359": { name: "Bulgaria", flag: "🇧🇬" },
  "370": { name: "Lithuania", flag: "🇱🇹" },
  "371": { name: "Latvia", flag: "🇱🇻" },
  "372": { name: "Estonia", flag: "🇪🇪" },
  "373": { name: "Moldova", flag: "🇲🇩" },
  "374": { name: "Armenia", flag: "🇦🇲" },
  "375": { name: "Belarus", flag: "🇧🇾" },
  "376": { name: "Andorra", flag: "🇦🇩" },
  "377": { name: "Monaco", flag: "🇲🇨" },
  "378": { name: "San Marino", flag: "🇸🇲" },
  "380": { name: "Ukraine", flag: "🇺🇦" },
  "381": { name: "Serbia", flag: "🇷🇸" },
  "382": { name: "Montenegro", flag: "🇲🇪" },
  "383": { name: "Kosovo", flag: "🇽🇰" },
  "385": { name: "Croatia", flag: "🇭🇷" },
  "386": { name: "Slovenia", flag: "🇸🇮" },
  "387": { name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  "389": { name: "North Macedonia", flag: "🇲🇰" },
  "420": { name: "Czech Republic", flag: "🇨🇿" },
  "421": { name: "Slovakia", flag: "🇸🇰" },
  "423": { name: "Liechtenstein", flag: "🇱🇮" },
  "500": { name: "Falkland Islands", flag: "🇫🇰" },
  "501": { name: "Belize", flag: "🇧🇿" },
  "502": { name: "Guatemala", flag: "🇬🇹" },
  "503": { name: "El Salvador", flag: "🇸🇻" },
  "504": { name: "Honduras", flag: "🇭🇳" },
  "505": { name: "Nicaragua", flag: "🇳🇮" },
  "506": { name: "Costa Rica", flag: "🇨🇷" },
  "507": { name: "Panama", flag: "🇵🇦" },
  "508": { name: "Saint Pierre and Miquelon", flag: "🇵🇲" },
  "509": { name: "Haiti", flag: "🇭🇹" },
  "590": { name: "Guadeloupe", flag: "🇬🇵" },
  "591": { name: "Bolivia", flag: "🇧🇴" },
  "592": { name: "Guyana", flag: "🇬🇾" },
  "593": { name: "Ecuador", flag: "🇪🇨" },
  "595": { name: "Paraguay", flag: "🇵🇾" },
  "596": { name: "Martinique", flag: "🇲🇶" },
  "597": { name: "Suriname", flag: "🇸🇷" },
  "598": { name: "Uruguay", flag: "🇺🇾" },
  "599": { name: "Netherlands Antilles", flag: "🇧🇶" },
  "670": { name: "East Timor", flag: "🇹🇱" },
  "672": { name: "Norfolk Island", flag: "🇳🇫" },
  "673": { name: "Brunei", flag: "🇧🇳" },
  "674": { name: "Nauru", flag: "🇳🇷" },
  "675": { name: "Papua New Guinea", flag: "🇵🇬" },
  "676": { name: "Tonga", flag: "🇹🇴" },
  "677": { name: "Solomon Islands", flag: "🇸🇧" },
  "678": { name: "Vanuatu", flag: "🇻🇺" },
  "679": { name: "Fiji", flag: "🇫🇯" },
  "680": { name: "Palau", flag: "🇵🇼" },
  "681": { name: "Wallis and Futuna", flag: "🇼🇫" },
  "682": { name: "Cook Islands", flag: "🇨🇰" },
  "683": { name: "Niue", flag: "🇳🇺" },
  "685": { name: "Samoa", flag: "🇼🇸" },
  "686": { name: "Kiribati", flag: "🇰🇮" },
  "687": { name: "New Caledonia", flag: "🇳🇨" },
  "688": { name: "Tuvalu", flag: "🇹🇻" },
  "689": { name: "French Polynesia", flag: "🇵🇫" },
  "690": { name: "Tokelau", flag: "🇹🇰" },
  "691": { name: "Micronesia", flag: "🇫🇲" },
  "692": { name: "Marshall Islands", flag: "🇲🇭" },
  "850": { name: "North Korea", flag: "🇰🇵" },
  "852": { name: "Hong Kong", flag: "🇭🇰" },
  "853": { name: "Macau", flag: "🇲🇴" },
  "855": { name: "Cambodia", flag: "🇰🇭" },
  "856": { name: "Laos", flag: "🇱🇦" },
  "880": { name: "Bangladesh", flag: "🇧🇩" },
  "886": { name: "Taiwan", flag: "🇹🇼" },
  "960": { name: "Maldives", flag: "🇲🇻" },
  "961": { name: "Lebanon", flag: "🇱🇧" },
  "962": { name: "Jordan", flag: "🇯🇴" },
  "963": { name: "Syria", flag: "🇸🇾" },
  "964": { name: "Iraq", flag: "🇮🇶" },
  "965": { name: "Kuwait", flag: "🇰🇼" },
  "966": { name: "Saudi Arabia", flag: "🇸🇦" },
  "967": { name: "Yemen", flag: "🇾🇪" },
  "968": { name: "Oman", flag: "🇴🇲" },
  "970": { name: "Palestine", flag: "🇵🇸" },
  "971": { name: "United Arab Emirates", flag: "🇦🇪" },
  "972": { name: "Israel", flag: "🇮🇱" },
  "973": { name: "Bahrain", flag: "🇧🇭" },
  "974": { name: "Qatar", flag: "🇶🇦" },
  "975": { name: "Bhutan", flag: "🇧🇹" },
  "976": { name: "Mongolia", flag: "🇲🇳" },
  "977": { name: "Nepal", flag: "🇳🇵" },
  "992": { name: "Tajikistan", flag: "🇹🇯" },
  "993": { name: "Turkmenistan", flag: "🇹🇲" },
  "994": { name: "Azerbaijan", flag: "🇦🇿" },
  "995": { name: "Georgia", flag: "🇬🇪" },
  "996": { name: "Kyrgyzstan", flag: "🇰🇬" },
  "998": { name: "Uzbekistan", flag: "🇺🇿" },
};

function detectCountry(input: string): CountryInfo | null {
  if (!input.startsWith("+")) return null;
  const digits = input.slice(1).replace(/\D/g, "");
  if (!digits) return null;
  for (const len of [3, 2, 1]) {
    const prefix = digits.slice(0, len);
    if (COUNTRY_CODES[prefix]) return COUNTRY_CODES[prefix];
  }
  return null;
}

// ─── WebRTC signaling helpers (localStorage) ───────────────────────────────────

function appendIce(
  callId: string,
  fromUser: string,
  candidate: RTCIceCandidate,
) {
  const key = `onyx_signal_ice_${callId}_${fromUser}`;
  const existing = JSON.parse(
    localStorage.getItem(key) ?? "[]",
  ) as RTCIceCandidateInit[];
  existing.push(candidate.toJSON());
  localStorage.setItem(key, JSON.stringify(existing));
}

function getIceCandidates(
  callId: string,
  fromUser: string,
): RTCIceCandidateInit[] {
  const key = `onyx_signal_ice_${callId}_${fromUser}`;
  try {
    return JSON.parse(
      localStorage.getItem(key) ?? "[]",
    ) as RTCIceCandidateInit[];
  } catch {
    return [];
  }
}

function cleanupSignal(callId: string) {
  const prefix = "onyx_signal_";
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(prefix) && key.includes(callId)) {
      localStorage.removeItem(key);
    }
  }
}

function makeCallId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function CallerPage({ profile, onUpdateProfile }: Props) {
  const [mode, setMode] = useState<CallMode>("audio");
  const [dialInput, setDialInput] = useState("");
  const [callState, setCallState] = useState<CallState>("idle");
  const [callTarget, setCallTarget] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOn, setIsCamOn] = useState(true);
  const [callTimer, setCallTimer] = useState(0);
  const [mediaError, setMediaError] = useState("");
  const [incomingCall, setIncomingCall] = useState<{
    id: string;
    from: string;
    type: CallMode;
    offerSdp: string;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callIdRef = useRef<string>("");
  const appliedIceRef = useRef<Set<string>>(new Set());

  const detectedCountry = detectCountry(dialInput);

  // ─── Cleanup helper ────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const teardownCall = useCallback(
    (notifyRemote = true) => {
      stopPolling();

      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getTracks()) t.stop();
        localStreamRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (notifyRemote && callIdRef.current) {
        localStorage.setItem(`onyx_signal_hangup_${callIdRef.current}`, "1");
      }
      if (callIdRef.current) {
        cleanupSignal(callIdRef.current);
        callIdRef.current = "";
      }
      appliedIceRef.current.clear();

      setCallState("idle");
      setCallTarget("");
      setIsMuted(false);
      setIsCamOn(true);
      setMediaError("");

      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    },
    [stopPolling],
  );

  // ─── Apply queued ICE candidates ─────────────────────────────────────────

  const applyQueuedIce = useCallback((callId: string, fromUser: string) => {
    if (!pcRef.current) return;
    const candidates = getIceCandidates(callId, fromUser);
    for (const c of candidates) {
      const key = JSON.stringify(c);
      if (!appliedIceRef.current.has(key)) {
        appliedIceRef.current.add(key);
        pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      }
    }
  }, []);

  // ─── Start polling loop (common) ─────────────────────────────────────────

  const startPolling = useCallback(
    (callId: string, remoteUser: string, isCaller: boolean) => {
      stopPolling();
      pollingRef.current = setInterval(() => {
        // Check hangup
        if (localStorage.getItem(`onyx_signal_hangup_${callId}`) === "1") {
          teardownCall(false);
          return;
        }

        if (isCaller) {
          // Check for answer
          const answerRaw = localStorage.getItem(
            `onyx_signal_answer_${callId}`,
          );
          if (
            answerRaw &&
            pcRef.current &&
            pcRef.current.remoteDescription === null
          ) {
            try {
              const { sdp } = JSON.parse(answerRaw) as { sdp: string };
              pcRef.current
                .setRemoteDescription({ type: "answer", sdp })
                .then(() => {
                  setCallState("connected");
                  applyQueuedIce(callId, remoteUser);
                })
                .catch(() => {});
            } catch {
              // ignore
            }
          }
        }

        // Apply any new ICE candidates from remote
        applyQueuedIce(callId, remoteUser);
      }, 1000);
    },
    [stopPolling, teardownCall, applyQueuedIce],
  );

  // ─── Incoming call polling ─────────────────────────────────────────────────

  useEffect(() => {
    const poll = setInterval(() => {
      if (callState !== "idle" || incomingCall) return;
      try {
        for (const key of Object.keys(localStorage)) {
          if (!key.startsWith("onyx_signal_offer_")) continue;
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const offer = JSON.parse(raw) as {
            callId: string;
            from: string;
            to: string;
            type: CallMode;
            sdp: string;
            timestamp: number;
          };
          // Offer expired after 90s
          if (
            offer.to === profile.username &&
            Date.now() - offer.timestamp < 90_000
          ) {
            setIncomingCall({
              id: offer.callId,
              from: offer.from,
              type: offer.type,
              offerSdp: offer.sdp,
            });
            break;
          }
        }
      } catch {
        // ignore
      }
    }, 1500);
    return () => clearInterval(poll);
  }, [profile.username, callState, incomingCall]);

  // ─── Call timer ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => {
        setCallTimer((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallTimer(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // ─── Dialer helpers ───────────────────────────────────────────────────────

  const handleDial = (key: string) => {
    setDialInput((prev) => (prev + key).slice(0, 24));
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    setDialInput((prev) => prev.slice(0, -1));
  };

  // ─── Start outgoing call ──────────────────────────────────────────────────

  const handleCall = useCallback(async () => {
    const target = dialInput.trim();
    if (!target || callState !== "idle") return;

    setMediaError("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === "video",
      });
    } catch {
      setMediaError(
        "Microphone/camera permission denied. Please allow access and try again.",
      );
      return;
    }

    localStreamRef.current = stream;
    if (mode === "video" && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const callId = makeCallId();
    callIdRef.current = callId;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    for (const t of stream.getTracks()) pc.addTrack(t, stream);

    pc.onicecandidate = (e) => {
      if (e.candidate) appendIce(callId, profile.username, e.candidate);
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    localStorage.setItem(
      `onyx_signal_offer_${callId}`,
      JSON.stringify({
        callId,
        from: profile.username,
        to: target,
        type: mode,
        sdp: offer.sdp,
        timestamp: Date.now(),
      }),
    );

    setCallTarget(target);
    setCallState("calling");
    startPolling(callId, target, true);
  }, [dialInput, callState, mode, profile.username, startPolling]);

  // ─── Accept incoming call ─────────────────────────────────────────────────

  const handleAcceptIncoming = useCallback(async () => {
    if (!incomingCall) return;

    setMediaError("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.type === "video",
      });
    } catch {
      setMediaError(
        "Microphone/camera permission denied. Please allow access and try again.",
      );
      setIncomingCall(null);
      return;
    }

    localStreamRef.current = stream;
    if (incomingCall.type === "video" && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const callId = incomingCall.id;
    callIdRef.current = callId;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    for (const t of stream.getTracks()) pc.addTrack(t, stream);

    pc.onicecandidate = (e) => {
      if (e.candidate) appendIce(callId, profile.username, e.candidate);
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    await pc.setRemoteDescription({
      type: "offer",
      sdp: incomingCall.offerSdp,
    });

    // Apply any already-queued ICE from caller
    applyQueuedIce(callId, incomingCall.from);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    localStorage.setItem(
      `onyx_signal_answer_${callId}`,
      JSON.stringify({ callId, sdp: answer.sdp }),
    );

    // Remove the offer so it's not picked up again
    localStorage.removeItem(`onyx_signal_offer_${callId}`);

    setCallTarget(incomingCall.from);
    setMode(incomingCall.type);
    setIncomingCall(null);
    setCallState("connected");

    startPolling(callId, incomingCall.from, false);
  }, [incomingCall, profile.username, applyQueuedIce, startPolling]);

  const handleDeclineIncoming = useCallback(() => {
    if (incomingCall) {
      localStorage.setItem(`onyx_signal_hangup_${incomingCall.id}`, "1");
      localStorage.removeItem(`onyx_signal_offer_${incomingCall.id}`);
    }
    setIncomingCall(null);
  }, [incomingCall]);

  const handleEndCall = useCallback(() => {
    teardownCall(true);
  }, [teardownCall]);

  // ─── Mute / camera toggle ─────────────────────────────────────────────────

  const handleToggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getAudioTracks()) {
          t.enabled = !next;
        }
      }
      return next;
    });
  }, []);

  const handleToggleCam = useCallback(() => {
    setIsCamOn((c) => {
      const next = !c;
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getVideoTracks()) {
          t.enabled = next;
        }
      }
      return next;
    });
  }, []);

  const canCall = dialInput.trim().length > 0 && callState === "idle";

  return (
    <div
      className="flex flex-col h-full w-full items-center relative overflow-hidden"
      style={{ background: "oklch(0.07 0.005 260)" }}
    >
      {/* Ambient bg */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, oklch(0.72 0.15 55 / 0.06) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, oklch(0.4 0.05 260 / 0.1) 0%, transparent 50%)",
        }}
      />

      {/* Hidden video elements for WebRTC */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />
      {/* biome-ignore lint/a11y/useMediaCaption: real-time peer-to-peer call — no captions applicable */}
      <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />

      {/* Incoming call overlay */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-8"
            style={{ background: "oklch(0.05 0.005 260 / 0.97)" }}
          >
            <div className="relative flex items-center justify-center">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 80 + i * 32,
                    height: 80 + i * 32,
                    border: `1px solid oklch(0.72 0.15 55 / ${0.4 - i * 0.1})`,
                  }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{
                    duration: 1.8,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.3,
                  }}
                />
              ))}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{
                  background: "oklch(0.15 0.01 260)",
                  border: "2px solid oklch(0.72 0.15 55 / 0.6)",
                  color: "oklch(0.72 0.15 55)",
                  boxShadow: "0 0 30px oklch(0.72 0.15 55 / 0.3)",
                }}
              >
                {incomingCall.from.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="text-center space-y-2">
              <p
                className="text-xl font-semibold"
                style={{ color: "oklch(0.93 0.01 260)" }}
              >
                {incomingCall.from}
              </p>
              <p
                className="text-sm flex items-center gap-2 justify-center"
                style={{ color: "oklch(0.55 0.015 260)" }}
              >
                <PhoneIncoming
                  size={14}
                  style={{ color: "oklch(0.72 0.15 55)" }}
                />
                Incoming {incomingCall.type} call...
              </p>
            </div>

            <div className="flex gap-8">
              <button
                type="button"
                onClick={handleDeclineIncoming}
                data-ocid="caller.cancel_button"
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: "oklch(0.55 0.2 27)",
                  boxShadow: "0 4px 20px oklch(0.55 0.2 27 / 0.4)",
                }}
              >
                <PhoneOff size={22} style={{ color: "oklch(0.95 0.01 260)" }} />
              </button>
              <button
                type="button"
                onClick={handleAcceptIncoming}
                data-ocid="caller.confirm_button"
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: "oklch(0.55 0.18 142)",
                  boxShadow: "0 4px 20px oklch(0.55 0.18 142 / 0.4)",
                }}
              >
                <Phone size={22} style={{ color: "oklch(0.95 0.01 260)" }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active call screen */}
      <AnimatePresence>
        {(callState === "calling" || callState === "connected") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-8 px-6"
            style={{ background: "oklch(0.07 0.005 260)" }}
          >
            {/* BG glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 30%, oklch(0.72 0.15 55 / 0.08) 0%, transparent 60%)",
              }}
            />

            {mode === "video" && callState === "connected" ? (
              <div
                className="w-full max-w-sm aspect-video rounded-3xl overflow-hidden flex items-center justify-center relative"
                style={{
                  background: "oklch(0.12 0.01 260)",
                  border: "1px solid oklch(0.25 0.01 260)",
                }}
              >
                {/* Remote video feed */}
                {/* biome-ignore lint/a11y/useMediaCaption: real-time peer-to-peer call — no captions applicable */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Local PiP */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute bottom-3 right-3 w-24 h-16 rounded-xl object-cover"
                  style={{ border: "2px solid oklch(0.72 0.15 55 / 0.4)" }}
                />
              </div>
            ) : (
              <div className="relative flex items-center justify-center">
                {callState === "calling" &&
                  [1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: 96 + i * 36,
                        height: 96 + i * 36,
                        border: `1px solid oklch(0.72 0.15 55 / ${0.35 - i * 0.08})`,
                      }}
                      animate={{
                        scale: [1, 1.06, 1],
                        opacity: [0.5, 0.15, 0.5],
                      }}
                      transition={{
                        duration: 1.6,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: i * 0.28,
                      }}
                    />
                  ))}
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold z-10"
                  style={{
                    background: "oklch(0.15 0.01 260)",
                    border: "2px solid oklch(0.72 0.15 55 / 0.6)",
                    color: "oklch(0.72 0.15 55)",
                    boxShadow: "0 0 40px oklch(0.72 0.15 55 / 0.25)",
                  }}
                >
                  {callTarget ? callTarget.slice(0, 2).toUpperCase() : "??"}
                </div>
              </div>
            )}

            <div className="text-center space-y-1.5 z-10">
              <p
                className="text-xl font-semibold"
                style={{
                  color: "oklch(0.93 0.01 260)",
                  fontFamily: "'Geist Mono', monospace",
                  letterSpacing: "0.05em",
                }}
              >
                {callTarget || "0"}
              </p>
              {callState === "calling" ? (
                <motion.p
                  className="text-sm"
                  style={{ color: "oklch(0.55 0.015 260)" }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{
                    duration: 1.4,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  Calling...
                </motion.p>
              ) : (
                <p
                  className="text-sm font-mono"
                  style={{ color: "oklch(0.72 0.15 55)" }}
                >
                  {formatCallTimer(callTimer)}
                </p>
              )}
            </div>

            {/* Call controls */}
            <div className="flex items-center gap-5 z-10">
              <button
                type="button"
                onClick={handleToggleMute}
                data-ocid="caller.toggle"
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: isMuted
                    ? "oklch(0.55 0.015 260)"
                    : "oklch(0.15 0.01 260)",
                  border: "1px solid oklch(0.25 0.01 260)",
                }}
              >
                {isMuted ? (
                  <MicOff
                    size={20}
                    style={{ color: "oklch(0.08 0.005 260)" }}
                  />
                ) : (
                  <Mic size={20} style={{ color: "oklch(0.65 0.015 260)" }} />
                )}
              </button>

              {mode === "video" && (
                <button
                  type="button"
                  onClick={handleToggleCam}
                  data-ocid="caller.secondary_button"
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{
                    background: isCamOn
                      ? "oklch(0.15 0.01 260)"
                      : "oklch(0.55 0.015 260)",
                    border: "1px solid oklch(0.25 0.01 260)",
                  }}
                >
                  {isCamOn ? (
                    <Camera
                      size={20}
                      style={{ color: "oklch(0.65 0.015 260)" }}
                    />
                  ) : (
                    <CameraOff
                      size={20}
                      style={{ color: "oklch(0.08 0.005 260)" }}
                    />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleEndCall}
                data-ocid="caller.delete_button"
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: "oklch(0.55 0.2 27)",
                  boxShadow: "0 4px 20px oklch(0.55 0.2 27 / 0.4)",
                }}
              >
                <PhoneOff size={22} style={{ color: "oklch(0.95 0.01 260)" }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialer UI */}
      <div className="flex flex-col items-center w-full max-w-xs mx-auto px-4 pt-6 pb-4 gap-5 relative z-10">
        {/* Header */}
        <div className="text-center w-full">
          <h2
            className="text-lg font-bold tracking-[0.15em]"
            style={{ color: "oklch(0.88 0.01 260)" }}
          >
            CALL
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: "oklch(0.45 0.015 260)" }}
          >
            Solid ground for your deepest secrets
          </p>

          {/* Change Name button */}
          <div className="mt-3 flex justify-center">
            <ProfileDialog
              profile={profile}
              onSave={onUpdateProfile}
              trigger={
                <button
                  type="button"
                  data-ocid="caller.edit_button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "oklch(0.12 0.008 260)",
                    border: "1px solid oklch(0.22 0.01 260)",
                    color: "oklch(0.55 0.015 260)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "oklch(0.72 0.15 55 / 0.4)";
                    e.currentTarget.style.color = "oklch(0.72 0.15 55)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.22 0.01 260)";
                    e.currentTarget.style.color = "oklch(0.55 0.015 260)";
                  }}
                >
                  <Pencil size={11} />
                  <span>
                    Change Name
                    <span
                      className="ml-1.5"
                      style={{ color: "oklch(0.72 0.15 55)" }}
                    >
                      {profile.username}
                    </span>
                  </span>
                </button>
              }
            />
          </div>
        </div>

        {/* Mode tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl w-full"
          style={{ background: "oklch(0.12 0.008 260)" }}
        >
          {(["audio", "video"] as CallMode[]).map((m) => (
            <button
              key={m}
              type="button"
              data-ocid={`caller.${m === "audio" ? "tab" : "secondary_button"}`}
              onClick={() => setMode(m)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all"
              style={{
                background: mode === m ? "oklch(0.72 0.15 55)" : "transparent",
                color:
                  mode === m
                    ? "oklch(0.08 0.005 260)"
                    : "oklch(0.55 0.015 260)",
                boxShadow:
                  mode === m ? "0 2px 10px oklch(0.72 0.15 55 / 0.3)" : "none",
              }}
            >
              {m === "audio" ? <Phone size={13} /> : <Video size={13} />}
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Input display */}
        <div className="w-full space-y-2">
          <div
            className="w-full rounded-2xl px-4 py-3 flex items-center gap-2"
            style={{
              background: "oklch(0.1 0.008 260)",
              border: "1px solid oklch(0.2 0.01 260)",
              minHeight: 60,
            }}
          >
            <input
              ref={inputRef}
              data-ocid="caller.input"
              type="text"
              value={dialInput}
              onChange={(e) => setDialInput(e.target.value.slice(0, 24))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCall) handleCall();
                if (e.key === "Backspace" && !dialInput) e.preventDefault();
              }}
              placeholder="Enter username or +1234567890"
              className="flex-1 bg-transparent outline-none text-xl font-light tracking-widest placeholder:text-sm placeholder:tracking-normal"
              style={{
                color: dialInput
                  ? "oklch(0.88 0.01 260)"
                  : "oklch(0.3 0.012 260)",
                fontFamily: "'Geist Mono', monospace",
              }}
            />
            {dialInput && (
              <button
                type="button"
                onClick={handleBackspace}
                className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                style={{ color: "oklch(0.45 0.015 260)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "oklch(0.72 0.15 55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "oklch(0.45 0.015 260)";
                }}
              >
                ⌫
              </button>
            )}
          </div>

          {/* Country chip */}
          <AnimatePresence>
            {detectedCountry && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit"
                style={{
                  background: "oklch(0.11 0.01 55 / 0.6)",
                  border: "1px solid oklch(0.72 0.15 55 / 0.3)",
                }}
              >
                <span className="text-base leading-none">
                  {detectedCountry.flag}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: "oklch(0.72 0.15 55)" }}
                >
                  {detectedCountry.name}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "oklch(0.45 0.015 260)" }}
                >
                  · call {detectedCountry.name.split(" ")[0]}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media error */}
          <AnimatePresence>
            {mediaError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                data-ocid="caller.error_state"
                className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
                style={{
                  background: "oklch(0.55 0.2 27 / 0.1)",
                  border: "1px solid oklch(0.55 0.2 27 / 0.3)",
                  color: "oklch(0.72 0.15 27)",
                }}
              >
                <span className="text-base leading-none flex-shrink-0">⚠</span>
                <span>{mediaError}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dial pad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {DIAL_KEYS.flat().map((key) => (
            <motion.button
              key={key}
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={() => handleDial(key)}
              className="aspect-square rounded-2xl flex items-center justify-center text-xl font-semibold transition-colors"
              style={{
                background: "oklch(0.12 0.008 260)",
                border: "1px solid oklch(0.2 0.01 260)",
                color: "oklch(0.82 0.01 260)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.16 0.01 260)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "oklch(0.93 0.01 260)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.12 0.008 260)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "oklch(0.82 0.01 260)";
              }}
            >
              {key}
            </motion.button>
          ))}
        </div>

        {/* Call button */}
        <motion.button
          type="button"
          data-ocid="caller.primary_button"
          whileTap={{ scale: 0.95 }}
          onClick={handleCall}
          disabled={!canCall}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
          style={{
            background: "oklch(0.55 0.18 142)",
            boxShadow: canCall
              ? "0 4px 24px oklch(0.55 0.18 142 / 0.5)"
              : "none",
          }}
        >
          <PhoneCall size={24} style={{ color: "oklch(0.97 0.01 260)" }} />
        </motion.button>

        <p
          className="text-[11px] text-center"
          style={{ color: "oklch(0.35 0.01 260)" }}
        >
          Real-time calls via WebRTC · Open in two tabs to test
        </p>
      </div>
    </div>
  );
}
