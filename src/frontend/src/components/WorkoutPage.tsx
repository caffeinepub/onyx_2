import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Keyframe animation styles ────────────────────────────────────────────────

const ANIM_STYLES = `
@keyframes pushup-body {
  0%, 100% { transform: translateY(0px) rotate(-8deg); }
  50%       { transform: translateY(-12px) rotate(-8deg); }
}
@keyframes pushup-arm {
  0%, 100% { transform: rotate(0deg); transform-origin: 50% 0; }
  50%       { transform: rotate(-30deg); transform-origin: 50% 0; }
}
@keyframes pullup-body {
  0%, 100% { transform: translateY(14px); }
  50%       { transform: translateY(0px); }
}
@keyframes pullup-arm {
  0%, 100% { transform: rotate(20deg); transform-origin: 50% 0; }
  50%       { transform: rotate(-20deg); transform-origin: 50% 0; }
}
@keyframes dip-body {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(12px); }
}
@keyframes dip-arm {
  0%, 100% { transform: rotate(0deg); transform-origin: 50% 0; }
  50%       { transform: rotate(30deg); transform-origin: 50% 0; }
}
@keyframes squat-body {
  0%, 100% { transform: translateY(0px) scaleY(1); }
  50%       { transform: translateY(10px) scaleY(0.85); }
}
@keyframes squat-leg {
  0%, 100% { transform: rotate(0deg); transform-origin: 0 0; }
  50%       { transform: rotate(45deg); transform-origin: 0 0; }
}
@keyframes lunge-front-leg {
  0%, 100% { transform: rotate(0deg); transform-origin: 50% 0; }
  50%       { transform: rotate(35deg); transform-origin: 50% 0; }
}
@keyframes lunge-back-leg {
  0%, 100% { transform: rotate(0deg); transform-origin: 50% 0; }
  50%       { transform: rotate(-35deg); transform-origin: 50% 0; }
}
@keyframes lunge-body {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(8px); }
}
@keyframes plank-breathe {
  0%, 100% { transform: scaleY(1) rotate(-10deg); }
  50%       { transform: scaleY(1.04) rotate(-10deg); }
}
@keyframes plank-arm-breathe {
  0%, 100% { transform: rotate(0deg); }
  50%       { transform: rotate(-3deg); }
}
@keyframes handstand-sway {
  0%, 100% { transform: rotate(0deg); transform-origin: 50% 100%; }
  33%       { transform: rotate(4deg); transform-origin: 50% 100%; }
  66%       { transform: rotate(-4deg); transform-origin: 50% 100%; }
}
@keyframes stretch-lean {
  0%, 100% { transform: rotate(0deg); transform-origin: 50% 80%; }
  50%       { transform: rotate(25deg); transform-origin: 50% 80%; }
}
@keyframes stretch-arm {
  0%, 100% { transform: rotate(0deg); transform-origin: 0 0; }
  50%       { transform: rotate(40deg); transform-origin: 0 0; }
}
@keyframes head-bob {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-2px); }
}
`;

// ─── Types ───────────────────────────────────────────────────────────────────

type Category =
  | "All"
  | "Push"
  | "Pull"
  | "Dips"
  | "Legs"
  | "Core"
  | "Handstand"
  | "Mobility";

type AnimKey =
  | "push"
  | "pull"
  | "dip"
  | "squat"
  | "lunge"
  | "plank"
  | "handstand"
  | "stretch";

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

interface Exercise {
  id: string;
  name: string;
  category: Exclude<Category, "All">;
  muscle: string;
  sets: number;
  reps: string;
  difficulty: Difficulty;
  restSeconds: number;
  animKey: AnimKey;
  steps: string[];
  formCues: string[];
}

interface ActiveSet {
  exerciseId: string;
  setIndex: number;
  completed: boolean;
}

interface WorkoutLogEntry {
  id: string;
  date: string;
  timestamp: number;
  exercises: string[];
  totalSets: number;
  durationMinutes: number;
}

// ─── SVG Stick Figure Animations ─────────────────────────────────────────────

const GOLD = "oklch(0.72 0.15 55)";
const GOLD_DIM = "oklch(0.5 0.1 55)";

function PushAnimation() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      {/* Ground */}
      <line
        x1="8"
        y1="62"
        x2="72"
        y2="62"
        stroke={GOLD_DIM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Body (horizontal plank) */}
      <g style={{ animation: "pushup-body 1.6s ease-in-out infinite" }}>
        {/* Head */}
        <circle
          cx="62"
          cy="46"
          r="5"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.8"
          style={{ animation: "head-bob 1.6s ease-in-out infinite" }}
        />
        {/* Body line */}
        <line
          x1="57"
          y1="48"
          x2="22"
          y2="55"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Left arm */}
        <g
          style={{
            animation: "pushup-arm 1.6s ease-in-out infinite",
            transformOrigin: "50px 52px",
          }}
        >
          <line
            x1="50"
            y1="52"
            x2="45"
            y2="62"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        {/* Right arm */}
        <g
          style={{
            animation: "pushup-arm 1.6s ease-in-out infinite 0.1s",
            transformOrigin: "35px 54px",
          }}
        >
          <line
            x1="35"
            y1="54"
            x2="30"
            y2="62"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        {/* Legs */}
        <line
          x1="22"
          y1="55"
          x2="17"
          y2="62"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="22"
          y1="55"
          x2="14"
          y2="61"
          stroke={GOLD}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}

function PullAnimation() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      {/* Bar */}
      <line
        x1="15"
        y1="14"
        x2="65"
        y2="14"
        stroke={GOLD_DIM}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      <rect
        x="13"
        y="10"
        width="6"
        height="8"
        rx="2"
        fill={GOLD_DIM}
        opacity="0.3"
      />
      <rect
        x="61"
        y="10"
        width="6"
        height="8"
        rx="2"
        fill={GOLD_DIM}
        opacity="0.3"
      />
      {/* Body */}
      <g style={{ animation: "pullup-body 1.8s ease-in-out infinite" }}>
        {/* Head */}
        <circle
          cx="40"
          cy="26"
          r="5.5"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.8"
        />
        {/* Body */}
        <line
          x1="40"
          y1="32"
          x2="40"
          y2="52"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Arms */}
        <g
          style={{
            animation: "pullup-arm 1.8s ease-in-out infinite",
            transformOrigin: "32px 20px",
          }}
        >
          <line
            x1="40"
            y1="32"
            x2="28"
            y2="18"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <g
          style={{
            animation: "pullup-arm 1.8s ease-in-out infinite",
            transformOrigin: "48px 20px",
          }}
        >
          <line
            x1="40"
            y1="32"
            x2="52"
            y2="18"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        {/* Legs */}
        <line
          x1="40"
          y1="52"
          x2="34"
          y2="65"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="40"
          y1="52"
          x2="46"
          y2="65"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function DipAnimation() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      {/* Parallel bars */}
      <line
        x1="18"
        y1="28"
        x2="18"
        y2="65"
        stroke={GOLD_DIM}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="62"
        y1="28"
        x2="62"
        y2="65"
        stroke={GOLD_DIM}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="12"
        y1="28"
        x2="24"
        y2="28"
        stroke={GOLD_DIM}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="56"
        y1="28"
        x2="68"
        y2="28"
        stroke={GOLD_DIM}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Body */}
      <g style={{ animation: "dip-body 1.6s ease-in-out infinite" }}>
        {/* Head */}
        <circle
          cx="40"
          cy="15"
          r="5.5"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.8"
        />
        {/* Body */}
        <line
          x1="40"
          y1="21"
          x2="40"
          y2="40"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Arms to bars */}
        <g
          style={{
            animation: "dip-arm 1.6s ease-in-out infinite",
            transformOrigin: "22px 28px",
          }}
        >
          <line
            x1="40"
            y1="26"
            x2="18"
            y2="28"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <g
          style={{
            animation: "dip-arm 1.6s ease-in-out infinite",
            transformOrigin: "58px 28px",
          }}
        >
          <line
            x1="40"
            y1="26"
            x2="62"
            y2="28"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        {/* Legs */}
        <line
          x1="40"
          y1="40"
          x2="35"
          y2="55"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="40"
          y1="40"
          x2="45"
          y2="55"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function SquatAnimation() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      {/* Ground */}
      <line
        x1="8"
        y1="72"
        x2="72"
        y2="72"
        stroke={GOLD_DIM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Body */}
      <g style={{ animation: "squat-body 1.8s ease-in-out infinite" }}>
        {/* Head */}
        <circle
          cx="40"
          cy="16"
          r="5.5"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.8"
        />
        {/* Torso */}
        <line
          x1="40"
          y1="22"
          x2="40"
          y2="42"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Arms out */}
        <line
          x1="40"
          y1="28"
          x2="22"
          y2="34"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="40"
          y1="28"
          x2="58"
          y2="34"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Left leg */}
        <g
          style={{
            animation: "squat-leg 1.8s ease-in-out infinite",
            transformOrigin: "36px 42px",
          }}
        >
          <line
            x1="36"
            y1="42"
            x2="30"
            y2="57"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="30"
            y1="57"
            x2="22"
            y2="72"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        {/* Right leg */}
        <g
          style={{
            animation: "squat-leg 1.8s ease-in-out infinite 0.05s",
            transformOrigin: "44px 42px",
          }}
        >
          <line
            x1="44"
            y1="42"
            x2="50"
            y2="57"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="57"
            x2="58"
            y2="72"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}

function LungeAnimation() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      {/* Ground */}
      <line
        x1="8"
        y1="72"
        x2="72"
        y2="72"
        stroke={GOLD_DIM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Body */}
      <g style={{ animation: "lunge-body 1.8s ease-in-out infinite" }}>
        {/* Head */}
        <circle
          cx="42"
          cy="15"
          r="5.5"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.8"
        />
        {/* Torso */}
        <line
          x1="42"
          y1="21"
          x2="42"
          y2="42"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Arms */}
        <line
          x1="42"
          y1="28"
          x2="28"
          y2="36"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="42"
          y1="28"
          x2="56"
          y2="36"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Front leg */}
        <g
          style={{
            animation: "lunge-front-leg 1.8s ease-in-out infinite",
            transformOrigin: "42px 42px",
          }}
        >
          <line
            x1="42"
            y1="42"
            x2="55"
            y2="58"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="55"
            y1="58"
            x2="62"
            y2="72"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        {/* Back leg */}
        <g
          style={{
            animation: "lunge-back-leg 1.8s ease-in-out infinite",
            transformOrigin: "42px 42px",
          }}
        >
          <line
            x1="42"
            y1="42"
            x2="32"
            y2="58"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="32"
            y1="58"
            x2="20"
            y2="72"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}

function PlankAnimation() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      {/* Ground */}
      <line
        x1="8"
        y1="64"
        x2="72"
        y2="64"
        stroke={GOLD_DIM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Body in plank */}
      <g
        style={{
          animation: "plank-breathe 2.2s ease-in-out infinite",
          transformOrigin: "40px 50px",
        }}
      >
        {/* Head */}
        <circle
          cx="62"
          cy="44"
          r="5.5"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.8"
        />
        {/* Body diagonal */}
        <line
          x1="57"
          y1="46"
          x2="20"
          y2="54"
          stroke={GOLD}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Front arm */}
        <g style={{ animation: "plank-arm-breathe 2.2s ease-in-out infinite" }}>
          <line
            x1="48"
            y1="50"
            x2="44"
            y2="64"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="44"
            y1="64"
            x2="36"
            y2="64"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        {/* Back arm */}
        <line
          x1="32"
          y1="53"
          x2="22"
          y2="64"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="22"
          y1="64"
          x2="14"
          y2="64"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Feet */}
        <line
          x1="20"
          y1="54"
          x2="14"
          y2="64"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function HandstandAnimation() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      {/* Ground / mat */}
      <line
        x1="12"
        y1="68"
        x2="68"
        y2="68"
        stroke={GOLD_DIM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Inverted body */}
      <g
        style={{
          animation: "handstand-sway 2s ease-in-out infinite",
          transformOrigin: "40px 64px",
        }}
      >
        {/* Feet up */}
        <circle
          cx="40"
          cy="10"
          r="5.5"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.8"
        />
        {/* Legs up */}
        <line
          x1="40"
          y1="16"
          x2="36"
          y2="32"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="40"
          y1="16"
          x2="44"
          y2="32"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Torso */}
        <line
          x1="40"
          y1="32"
          x2="40"
          y2="55"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Arms spread to ground */}
        <line
          x1="40"
          y1="50"
          x2="25"
          y2="62"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="25"
          y1="62"
          x2="22"
          y2="68"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="40"
          y1="50"
          x2="55"
          y2="62"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="55"
          y1="62"
          x2="58"
          y2="68"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function StretchAnimation() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      {/* Ground */}
      <line
        x1="8"
        y1="72"
        x2="72"
        y2="72"
        stroke={GOLD_DIM}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Body */}
      <g
        style={{
          animation: "stretch-lean 2s ease-in-out infinite",
          transformOrigin: "40px 52px",
        }}
      >
        {/* Head */}
        <circle
          cx="40"
          cy="14"
          r="5.5"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.8"
        />
        {/* Torso */}
        <line
          x1="40"
          y1="20"
          x2="40"
          y2="44"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Stretch arm */}
        <g
          style={{
            animation: "stretch-arm 2s ease-in-out infinite",
            transformOrigin: "40px 28px",
          }}
        >
          <line
            x1="40"
            y1="28"
            x2="62"
            y2="24"
            stroke={GOLD}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="62"
            y1="24"
            x2="68"
            y2="20"
            stroke={GOLD}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
        {/* Other arm */}
        <line
          x1="40"
          y1="28"
          x2="20"
          y2="34"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Legs */}
        <line
          x1="40"
          y1="44"
          x2="32"
          y2="60"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="32"
          y1="60"
          x2="28"
          y2="72"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="40"
          y1="44"
          x2="48"
          y2="60"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="48"
          y1="60"
          x2="52"
          y2="72"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function ExerciseAnimation({ animKey }: { animKey: AnimKey }) {
  switch (animKey) {
    case "push":
      return <PushAnimation />;
    case "pull":
      return <PullAnimation />;
    case "dip":
      return <DipAnimation />;
    case "squat":
      return <SquatAnimation />;
    case "lunge":
      return <LungeAnimation />;
    case "plank":
      return <PlankAnimation />;
    case "handstand":
      return <HandstandAnimation />;
    case "stretch":
      return <StretchAnimation />;
    default:
      return <SquatAnimation />;
  }
}

// ─── Exercise Library ─────────────────────────────────────────────────────────

const EXERCISES: Exercise[] = [
  // ── Push ──────────────────────────────────────────────────────────────────
  {
    id: "p1",
    name: "Standard Push-Up",
    category: "Push",
    muscle: "Pectorals, Triceps, Shoulders",
    sets: 4,
    reps: "15–20",
    difficulty: "Beginner",
    restSeconds: 60,
    animKey: "push",
    steps: [
      "Start in a high plank: hands shoulder-width apart, body straight from head to heels.",
      "Lower your chest toward the floor by bending elbows at ~45° from your torso.",
      "Stop just before your chest touches the ground — keep tension throughout.",
      "Push through your palms to return to the start in a controlled motion.",
    ],
    formCues: [
      "Keep your core braced the entire set — no sagging hips.",
      "Gaze slightly ahead, not straight down, to keep the neck neutral.",
    ],
  },
  {
    id: "p2",
    name: "Diamond Push-Up",
    category: "Push",
    muscle: "Triceps, Inner Chest",
    sets: 3,
    reps: "10–15",
    difficulty: "Intermediate",
    restSeconds: 60,
    animKey: "push",
    steps: [
      "Form a diamond shape with your thumbs and index fingers directly under your chest.",
      "Lower your chest toward your hands, elbows flaring slightly outward.",
      "Pause briefly at the bottom, then explosively press back up.",
    ],
    formCues: [
      "Wrists must stay stacked under your chest, not too far forward.",
      "Scale to knee diamond push-ups if needed to maintain form.",
    ],
  },
  {
    id: "p3",
    name: "Wide Push-Up",
    category: "Push",
    muscle: "Outer Chest, Shoulders",
    sets: 3,
    reps: "12–18",
    difficulty: "Beginner",
    restSeconds: 60,
    animKey: "push",
    steps: [
      "Place hands 1.5× shoulder-width apart, fingers angled slightly outward.",
      "Lower chest to the ground keeping elbows wide and flared.",
      "Press back up driving through the outer part of your palms.",
    ],
    formCues: [
      "Don't let your elbows collapse inward — maintain the wide angle.",
      "Control the descent — take at least 2 seconds going down.",
    ],
  },
  {
    id: "p4",
    name: "Pike Push-Up",
    category: "Push",
    muscle: "Shoulders, Triceps, Upper Chest",
    sets: 3,
    reps: "8–12",
    difficulty: "Intermediate",
    restSeconds: 75,
    animKey: "push",
    steps: [
      "Start in a downward dog position: hands shoulder-width, hips high, straight legs.",
      "Bend elbows to lower the top of your head toward the floor between your hands.",
      "Press up powerfully to return to the inverted V position.",
    ],
    formCues: [
      "The steeper your angle, the more shoulder work — keep progressing.",
      "Keep legs as straight as possible to mimic overhead pressing mechanics.",
    ],
  },
  {
    id: "p5",
    name: "Archer Push-Up",
    category: "Push",
    muscle: "Chest, Triceps (Unilateral)",
    sets: 3,
    reps: "6–10 each side",
    difficulty: "Advanced",
    restSeconds: 90,
    animKey: "push",
    steps: [
      "Start wide: hands 2× shoulder-width, fingers pointing outward.",
      "Shift your weight to one arm, bending that elbow while keeping the other arm extended.",
      "Lower your chest toward the bent-arm side, then press back to center.",
      "Alternate sides each rep to work both evenly.",
    ],
    formCues: [
      "The extended arm stays straight — it assists but doesn't bend.",
      "This is a stepping stone to the one-arm push-up — use it consistently.",
    ],
  },
  {
    id: "p6",
    name: "Decline Push-Up",
    category: "Push",
    muscle: "Upper Chest, Front Deltoids",
    sets: 3,
    reps: "10–15",
    difficulty: "Intermediate",
    restSeconds: 75,
    animKey: "push",
    steps: [
      "Elevate your feet on a chair, bench, or step 30–60 cm high.",
      "Perform a standard push-up from this inclined position.",
      "Lower chest toward the floor and press back up with full extension.",
    ],
    formCues: [
      "The higher the feet, the more upper-chest and shoulder involvement.",
      "Brace abs hard — elevated feet make core stabilisation harder.",
    ],
  },

  // ── Pull ──────────────────────────────────────────────────────────────────
  {
    id: "pu1",
    name: "Pull-Up",
    category: "Pull",
    muscle: "Lats, Biceps, Rear Deltoids",
    sets: 4,
    reps: "6–10",
    difficulty: "Intermediate",
    restSeconds: 90,
    animKey: "pull",
    steps: [
      "Hang from a bar with palms facing away, hands shoulder-width apart.",
      "Depress and retract your shoulder blades to initiate the pull.",
      "Pull your chin above the bar driving elbows toward the floor.",
      "Lower with control to a full hang — don't shorten the range.",
    ],
    formCues: [
      "Don't kip or swing — dead-hang pull-ups build far more strength.",
      "If you can't do one, do negatives: jump to the top and lower for 5 seconds.",
    ],
  },
  {
    id: "pu2",
    name: "Wide-Grip Pull-Up",
    category: "Pull",
    muscle: "Latissimus Dorsi (Width)",
    sets: 3,
    reps: "5–8",
    difficulty: "Advanced",
    restSeconds: 90,
    animKey: "pull",
    steps: [
      "Grip the bar 1.5–2× shoulder-width with palms facing away.",
      "Hang with arms fully extended, then squeeze shoulder blades together.",
      "Pull your upper chest to the bar, leading with your elbows going wide.",
      "Pause at the top, then lower with control.",
    ],
    formCues: [
      "Widen the grip gradually — too wide can stress the wrist and shoulder.",
      "Focus on the lat stretch at full extension to maximise range.",
    ],
  },
  {
    id: "pu3",
    name: "Close-Grip Pull-Up",
    category: "Pull",
    muscle: "Lower Lats, Biceps",
    sets: 3,
    reps: "6–10",
    difficulty: "Intermediate",
    restSeconds: 90,
    animKey: "pull",
    steps: [
      "Grip the bar with hands 10–15 cm apart, palms facing away.",
      "From a dead hang, initiate by bringing the shoulder blades down and back.",
      "Pull until your chest is at bar height, elbows tracking close to your sides.",
      "Control the descent all the way to a full hang.",
    ],
    formCues: [
      "Close grip shifts stress to the lower lats and long head of the bicep.",
      "Keep chest up — don't round your back as you fatigue.",
    ],
  },
  {
    id: "pu4",
    name: "Chin-Up",
    category: "Pull",
    muscle: "Biceps, Lower Lats",
    sets: 4,
    reps: "8–12",
    difficulty: "Beginner",
    restSeconds: 75,
    animKey: "pull",
    steps: [
      "Hang with palms facing you (supinated), shoulder-width apart.",
      "Pull your chin above the bar by curling the arms and driving elbows down.",
      "Squeeze biceps at the top, then lower fully.",
    ],
    formCues: [
      "Supinated grip recruits the biceps more — great for arm development.",
      "Avoid shrugging your shoulders at the top — keep them depressed.",
    ],
  },
  {
    id: "pu5",
    name: "L-Sit Pull-Up",
    category: "Pull",
    muscle: "Lats, Core, Hip Flexors",
    sets: 3,
    reps: "4–8",
    difficulty: "Advanced",
    restSeconds: 120,
    animKey: "pull",
    steps: [
      "Hang from the bar and lift your legs to 90° (parallel to the floor).",
      "Hold the L-sit position throughout every single rep.",
      "Pull your chin to the bar while maintaining the leg position.",
      "Lower with control — do not let the legs drop.",
    ],
    formCues: [
      "If you can't hold a full L, tuck knees to chest as a progression.",
      "The L-sit position dramatically increases core demand on every pull.",
    ],
  },
  {
    id: "pu6",
    name: "Australian Row",
    category: "Pull",
    muscle: "Rhomboids, Middle Back, Biceps",
    sets: 3,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 60,
    animKey: "pull",
    steps: [
      "Use a low bar (hip height). Hang under it face-up with straight arms.",
      "Pull your chest up to the bar by rowing, squeezing the shoulder blades together.",
      "Keep your body in a straight line from head to heels throughout.",
      "Lower until arms are fully extended.",
    ],
    formCues: [
      "Lower the bar height to increase difficulty; elevate feet for even more.",
      "Drive elbows down and back — not flared wide like a push-up.",
    ],
  },

  // ── Dips ──────────────────────────────────────────────────────────────────
  {
    id: "d1",
    name: "Parallel Bar Dips",
    category: "Dips",
    muscle: "Triceps, Lower Chest, Shoulders",
    sets: 4,
    reps: "8–12",
    difficulty: "Intermediate",
    restSeconds: 90,
    animKey: "dip",
    steps: [
      "Mount parallel bars with straight arms and a slight forward lean.",
      "Lower yourself by bending elbows until upper arms are parallel to the floor.",
      "Keep elbows tracked slightly back, not flaring out wide.",
      "Press up powerfully to full arm extension.",
    ],
    formCues: [
      "Leaning forward more targets chest; staying upright targets triceps.",
      "Don't lock elbows aggressively at the top to protect joints.",
    ],
  },
  {
    id: "d2",
    name: "Bench Dips",
    category: "Dips",
    muscle: "Triceps, Chest",
    sets: 3,
    reps: "12–20",
    difficulty: "Beginner",
    restSeconds: 60,
    animKey: "dip",
    steps: [
      "Sit on the edge of a bench, hands gripping the edge beside your hips.",
      "Slide off the bench, arms extended, legs straight (or bent for easier version).",
      "Lower hips toward the floor by bending elbows to 90°.",
      "Press back up to the starting position.",
    ],
    formCues: [
      "Keep hips close to the bench — drifting forward puts strain on the shoulder.",
      "Straight legs make it harder; bent knees at 90° reduce the load.",
    ],
  },
  {
    id: "d3",
    name: "Ring Dips",
    category: "Dips",
    muscle: "Triceps, Chest, Stabilisers",
    sets: 3,
    reps: "6–10",
    difficulty: "Advanced",
    restSeconds: 90,
    animKey: "dip",
    steps: [
      "Mount the rings with arms straight, turn rings out at the top.",
      "Lean slightly forward and lower yourself until elbows reach 90°.",
      "Press up and turn the rings out at full extension to lock out.",
    ],
    formCues: [
      "The instability demands far more stabiliser work than fixed bars.",
      "Master bar dips to at least 10 clean reps before attempting ring dips.",
    ],
  },

  // ── Legs ──────────────────────────────────────────────────────────────────
  {
    id: "l1",
    name: "Bodyweight Squat",
    category: "Legs",
    muscle: "Quads, Glutes, Hamstrings",
    sets: 4,
    reps: "20–25",
    difficulty: "Beginner",
    restSeconds: 60,
    animKey: "squat",
    steps: [
      "Stand feet shoulder-width apart, toes pointing out 15–30°.",
      "Brace core, push hips back, and lower until thighs are parallel to the floor.",
      "Keep chest up and knees tracking over toes throughout.",
      "Drive through full foot to stand — squeeze glutes at the top.",
    ],
    formCues: [
      "Depth matters — aim for parallel or below for full glute activation.",
      "If heels rise, stretch the calves or widen stance slightly.",
    ],
  },
  {
    id: "l2",
    name: "Jump Squat",
    category: "Legs",
    muscle: "Quads, Glutes, Calves (Power)",
    sets: 4,
    reps: "12–15",
    difficulty: "Intermediate",
    restSeconds: 60,
    animKey: "squat",
    steps: [
      "Perform a standard squat to parallel.",
      "Drive explosively through the feet to propel yourself off the floor.",
      "Land softly with bent knees — absorb impact through your whole leg.",
      "Immediately load back into the next squat upon landing.",
    ],
    formCues: [
      "Land toe-ball-heel — never flat-footed — to protect your joints.",
      "Rest fully between sets; this is power training, not cardio.",
    ],
  },
  {
    id: "l3",
    name: "Pistol Squat",
    category: "Legs",
    muscle: "Quads, Glutes, Core (Unilateral)",
    sets: 3,
    reps: "4–8 each leg",
    difficulty: "Advanced",
    restSeconds: 90,
    animKey: "squat",
    steps: [
      "Stand on one leg, extend the other straight in front of you.",
      "Lower the standing-leg knee until your hamstring touches your calf.",
      "Keep the floating leg straight and arms forward for counter-balance.",
      "Press up to standing — control the whole range.",
    ],
    formCues: [
      "Use a doorframe or TRX for assistance while you build the skill.",
      "Progressions: box pistol → assisted pistol → full pistol.",
    ],
  },
  {
    id: "l4",
    name: "Sumo Squat",
    category: "Legs",
    muscle: "Inner Thighs, Glutes",
    sets: 3,
    reps: "15–20",
    difficulty: "Beginner",
    restSeconds: 60,
    animKey: "squat",
    steps: [
      "Widen stance to 1.5–2× shoulder-width, toes pointing out 45°.",
      "Lower hips straight down, keeping knees tracking outward.",
      "Descend until thighs are parallel, then drive up squeezing inner thighs.",
    ],
    formCues: [
      "Keep the torso more upright than a standard squat.",
      "Push knees out actively — don't let them cave inward.",
    ],
  },
  {
    id: "l5",
    name: "Wall Sit",
    category: "Legs",
    muscle: "Quads (Isometric)",
    sets: 3,
    reps: "45–90s hold",
    difficulty: "Beginner",
    restSeconds: 60,
    animKey: "squat",
    steps: [
      "Back flat against the wall, walk feet out until knees are at 90°.",
      "Thighs should be parallel to the floor, shins vertical.",
      "Hold the position, breathing steadily for the target duration.",
    ],
    formCues: [
      "The quad burn is normal — it's entirely isometric, embrace it.",
      "Don't let knees drift in or out — keep them directly over your feet.",
    ],
  },
  {
    id: "l6",
    name: "Forward Lunge",
    category: "Legs",
    muscle: "Quads, Glutes",
    sets: 3,
    reps: "12 each leg",
    difficulty: "Beginner",
    restSeconds: 60,
    animKey: "lunge",
    steps: [
      "Stand tall, step one foot forward about 60–80 cm.",
      "Lower the back knee toward the floor, keeping front knee above the ankle.",
      "Pause when both knees are at 90°, then push off the front foot to return.",
    ],
    formCues: [
      "Keep the torso upright — don't lean over the front knee.",
      "Front knee must stay directly over the foot, never past the toes.",
    ],
  },
  {
    id: "l7",
    name: "Reverse Lunge",
    category: "Legs",
    muscle: "Glutes, Hamstrings, Quads",
    sets: 3,
    reps: "12 each leg",
    difficulty: "Beginner",
    restSeconds: 60,
    animKey: "lunge",
    steps: [
      "Stand tall, step one foot back about 60–80 cm.",
      "Lower the back knee toward the floor, front shin stays vertical.",
      "Drive through the front heel to return to standing.",
    ],
    formCues: [
      "Reverse lunges are easier on the knee than forward lunges — start here.",
      "Don't let the front heel rise as you lower.",
    ],
  },
  {
    id: "l8",
    name: "Lateral Lunge",
    category: "Legs",
    muscle: "Inner Thigh, Glutes, Quads",
    sets: 3,
    reps: "10 each side",
    difficulty: "Beginner",
    restSeconds: 60,
    animKey: "lunge",
    steps: [
      "Stand with feet close together, step one foot wide to the side.",
      "Bend the stepping knee and push the hips back and to that side.",
      "Keep the other leg straight and foot flat on the floor.",
      "Push through the bent leg's heel to return to start.",
    ],
    formCues: [
      "Work the frontal plane — most people neglect it completely.",
      "Keep chest up and knee tracking over toes on the bent side.",
    ],
  },
  {
    id: "l9",
    name: "Walking Lunge",
    category: "Legs",
    muscle: "Quads, Glutes, Balance",
    sets: 3,
    reps: "20 steps",
    difficulty: "Beginner",
    restSeconds: 60,
    animKey: "lunge",
    steps: [
      "Step forward into a lunge, lowering the back knee close to the floor.",
      "Instead of returning, bring the back foot forward through to the next step.",
      "Continue walking forward alternating legs.",
    ],
    formCues: [
      "Stay tall — a rounded back defeats the purpose of the movement.",
      "Use a longer stride to emphasise glutes; shorter stride for quads.",
    ],
  },
  {
    id: "l10",
    name: "Jump Lunge",
    category: "Legs",
    muscle: "Quads, Glutes, Power",
    sets: 3,
    reps: "10 each leg",
    difficulty: "Advanced",
    restSeconds: 75,
    animKey: "lunge",
    steps: [
      "Drop into a lunge position, both knees at 90°.",
      "Explode upward, switching legs in mid-air.",
      "Land in a lunge on the opposite side, absorbing impact with soft knees.",
    ],
    formCues: [
      "Land softly and immediately load the lunge — don't pause mid-air.",
      "If knees hurt, master regular walking lunges first.",
    ],
  },

  // ── Core ──────────────────────────────────────────────────────────────────
  {
    id: "c1",
    name: "Plank",
    category: "Core",
    muscle: "Transverse Abs, Obliques",
    sets: 3,
    reps: "45–60s hold",
    difficulty: "Beginner",
    restSeconds: 45,
    animKey: "plank",
    steps: [
      "Forearms on the floor, elbows under shoulders, body in a straight line.",
      "Brace the core as if bracing for a punch — don't hold your breath.",
      "Push the floor away with your forearms to engage the serratus.",
      "Hold for target duration with continuous controlled breathing.",
    ],
    formCues: [
      "Hips level — neither sagging nor piked. Imagine a glass of water on your lower back.",
      "Squeeze the glutes as well — a tight posterior chain maximises the hold.",
    ],
  },
  {
    id: "c2",
    name: "Side Plank",
    category: "Core",
    muscle: "Obliques, Hip Abductors",
    sets: 3,
    reps: "30–45s each side",
    difficulty: "Beginner",
    restSeconds: 45,
    animKey: "plank",
    steps: [
      "Lie on your side, forearm on the floor, elbow under shoulder.",
      "Lift hips off the ground to form a straight line from head to feet.",
      "Stack feet or stagger them for stability.",
      "Hold, breathing steadily — repeat on the other side.",
    ],
    formCues: [
      "Don't let your hip sag or roll forward — the obliques should burn.",
      "Raise your top arm straight up to increase difficulty.",
    ],
  },
  {
    id: "c3",
    name: "Hollow Body Hold",
    category: "Core",
    muscle: "Entire Core, Hip Flexors",
    sets: 3,
    reps: "30–45s hold",
    difficulty: "Intermediate",
    restSeconds: 60,
    animKey: "plank",
    steps: [
      "Lie on your back, press your lower back firmly into the floor.",
      "Lift shoulders, arms (reaching overhead), and legs off the floor.",
      "Keep the lower back pressed down — that is the whole key.",
      "Hold the position, rock gently if you want extra challenge.",
    ],
    formCues: [
      "If the lower back lifts, raise legs higher or bend knees slightly.",
      "The hollow body is the foundation of nearly all gymnastics strength.",
    ],
  },
  {
    id: "c4",
    name: "L-Sit",
    category: "Core",
    muscle: "Hip Flexors, Core, Triceps",
    sets: 3,
    reps: "5–15s hold",
    difficulty: "Advanced",
    restSeconds: 90,
    animKey: "plank",
    steps: [
      "Sit on the floor between two chairs or parallel bars, hands beside hips.",
      "Press into the surface and lift your entire lower body off the floor.",
      "Extend legs parallel to the ground — hold the L position.",
    ],
    formCues: [
      "Tuck knees first, then one leg, then both — this is a genuine skill.",
      "Point toes hard — activates the hamstrings and makes legs more stable.",
    ],
  },
  {
    id: "c5",
    name: "Dragon Flag (Progression)",
    category: "Core",
    muscle: "Entire Core, Lower Back",
    sets: 3,
    reps: "5–8",
    difficulty: "Advanced",
    restSeconds: 90,
    animKey: "plank",
    steps: [
      "Lie on a bench, grip a fixed point overhead for support.",
      "Drive hips up into a shoulder stand — body straight, on upper back only.",
      "Lower body slowly while keeping the body rigid — do NOT let it fold.",
      "Stop just before hips touch the bench and raise again.",
    ],
    formCues: [
      "The secret is the lower: never let the lower back break. If it does — stop.",
      "Build first: tuck dragon flags, then one-leg extended, then full.",
    ],
  },
  {
    id: "c6",
    name: "Ab Wheel Rollout",
    category: "Core",
    muscle: "Transverse Abs, Serratus, Lats",
    sets: 3,
    reps: "8–12",
    difficulty: "Intermediate",
    restSeconds: 75,
    animKey: "plank",
    steps: [
      "Kneel with the ab wheel in front of you, hips directly above knees.",
      "Roll the wheel forward slowly, extending your body toward the floor.",
      "Keep the core braced — stop before your lower back arches.",
      "Use your core to pull the wheel back to the start position.",
    ],
    formCues: [
      "Go as far as you can with a flat back — the range will grow over time.",
      "Can also be done standing (much harder) — master kneeling first.",
    ],
  },
  {
    id: "c7",
    name: "Hanging Knee Raise",
    category: "Core",
    muscle: "Lower Abs, Hip Flexors",
    sets: 4,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 60,
    animKey: "pull",
    steps: [
      "Hang from a bar with straight arms, shoulders depressed.",
      "Draw your knees up toward your chest while keeping the core braced.",
      "Pause briefly at the top — don't swing.",
      "Lower with control to a full hang.",
    ],
    formCues: [
      "No swinging! If you swing, pause at the bottom and reset.",
      "Squeeze the abs intentionally at the top of every rep.",
    ],
  },
  {
    id: "c8",
    name: "Hanging Leg Raise",
    category: "Core",
    muscle: "Lower Abs, Hip Flexors",
    sets: 3,
    reps: "10–12",
    difficulty: "Intermediate",
    restSeconds: 75,
    animKey: "pull",
    steps: [
      "Hang from the bar with straight arms, no swing.",
      "Raise straight legs until they are parallel to the floor (90°).",
      "Hold 1 second at the top, then lower with control.",
    ],
    formCues: [
      "Straight legs make this dramatically harder than knee raises.",
      "Posterior tilt the pelvis at the top for maximum lower-ab contraction.",
    ],
  },
  {
    id: "c9",
    name: "V-Up",
    category: "Core",
    muscle: "Upper & Lower Abs",
    sets: 3,
    reps: "15–20",
    difficulty: "Intermediate",
    restSeconds: 60,
    animKey: "plank",
    steps: [
      "Lie flat on your back, arms extended overhead, legs straight.",
      "Simultaneously lift legs and torso — reach hands toward feet.",
      "Form a V shape at the top, then lower both halves with control.",
    ],
    formCues: [
      "If you feel it in your hip flexors too much, do alternating single-leg V-ups.",
      "Exhale sharply as you crunch up to fully engage the core.",
    ],
  },

  // ── Handstand ─────────────────────────────────────────────────────────────
  {
    id: "h1",
    name: "Wall Handstand Hold",
    category: "Handstand",
    muscle: "Shoulders, Triceps, Core",
    sets: 3,
    reps: "20–40s hold",
    difficulty: "Intermediate",
    restSeconds: 90,
    animKey: "handstand",
    steps: [
      "Place hands ~15–20 cm from the wall, kick up one leg at a time.",
      "Fully extend arms and engage shoulders actively.",
      "Press the floor away to create active shoulder elevation.",
      "Hold body straight — hips, shoulders, and wrists aligned vertically.",
    ],
    formCues: [
      "Arching the back at the wall is normal for beginners — work on straightening over time.",
      "Open-shoulder hold (chest to wall) is harder and more rewarding.",
    ],
  },
  {
    id: "h2",
    name: "Handstand Push-Up (Wall)",
    category: "Handstand",
    muscle: "Shoulders, Triceps, Upper Chest",
    sets: 3,
    reps: "4–8",
    difficulty: "Advanced",
    restSeconds: 120,
    animKey: "handstand",
    steps: [
      "Kick into a wall handstand, hands 15 cm from the wall.",
      "Bend elbows, lowering head toward the floor between your hands.",
      "Stop when head lightly touches a foam pad.",
      "Press back up to full extension powerfully.",
    ],
    formCues: [
      "Build wall handstand holds to 60 seconds before attempting HSPUs.",
      "Wrists and forearm strength are limiting factors — train them specifically.",
    ],
  },
  {
    id: "h3",
    name: "Muscle-Up (Progression)",
    category: "Handstand",
    muscle: "Lats, Chest, Triceps, Core",
    sets: 3,
    reps: "3–6",
    difficulty: "Advanced",
    restSeconds: 120,
    animKey: "pull",
    steps: [
      "Dead hang from the bar, then perform an explosive pull-up pulling the bar to your hips.",
      "At the apex, lean forward and press the wrists over the bar.",
      "Transition into a dip position and press to full arm extension.",
      "Control the descent back to a dead hang.",
    ],
    formCues: [
      "Prerequisites: 10 pull-ups + 10 dips. Build those first.",
      "The transition (false-grip helps) is the hardest part — drill it with a band.",
    ],
  },
  {
    id: "h4",
    name: "Front Lever (Tuck)",
    category: "Handstand",
    muscle: "Lats, Core, Rear Deltoids",
    sets: 3,
    reps: "10–15s hold",
    difficulty: "Advanced",
    restSeconds: 120,
    animKey: "pull",
    steps: [
      "Hang from a bar, then pull hips up to tuck position (knees to chest).",
      "Extend hips until they are level with the bar — body parallel to floor.",
      "Tuck knees tightly — hold with a completely flat body position.",
    ],
    formCues: [
      "Straight line from shoulders through hips to knees — no pike.",
      "Progress from tuck → advanced tuck → one-leg → full front lever.",
    ],
  },

  // ── Mobility ──────────────────────────────────────────────────────────────
  {
    id: "m1",
    name: "Shoulder Dislocates",
    category: "Mobility",
    muscle: "Shoulder Capsule, Rotator Cuff",
    sets: 3,
    reps: "10–15 slow rotations",
    difficulty: "Beginner",
    restSeconds: 30,
    animKey: "stretch",
    steps: [
      "Hold a band or broomstick with hands wide (wider than shoulder-width).",
      "With straight arms, slowly rotate the stick from in front to behind.",
      "Continue the full rotation overhead and all the way behind, then reverse.",
    ],
    formCues: [
      "Pain means the grip is too narrow — widen until it's smooth.",
      "Never force range. The range improves with consistent daily practice.",
    ],
  },
  {
    id: "m2",
    name: "Hip Flexor Stretch",
    category: "Mobility",
    muscle: "Hip Flexors, Psoas",
    sets: 3,
    reps: "30–60s each side",
    difficulty: "Beginner",
    restSeconds: 30,
    animKey: "lunge",
    steps: [
      "Drop into a kneeling lunge, back knee on the floor.",
      "Shift the hips forward until you feel a stretch at the front of the hip.",
      "Keep the torso upright and hold — breathe into the stretch.",
    ],
    formCues: [
      "Posterior tilt the pelvis (tuck the tailbone) to intensify the stretch.",
      "Tight hip flexors are the number-one cause of lower back pain in desk workers.",
    ],
  },
  {
    id: "m3",
    name: "Thoracic Bridge",
    category: "Mobility",
    muscle: "Thoracic Spine, Hip Flexors, Shoulders",
    sets: 3,
    reps: "6–8 slow reps",
    difficulty: "Intermediate",
    restSeconds: 45,
    animKey: "stretch",
    steps: [
      "Sit on the floor, knees bent, feet flat, hands behind you.",
      "Drive hips up into a table-top position, head dropping back gently.",
      "Reach one arm overhead and across to open the thoracic spine.",
      "Hold 2–3 seconds, then switch sides.",
    ],
    formCues: [
      "Move from the mid-back (T-spine), not the lower back.",
      "Progress to a full bridge (hands and feet on the floor) over time.",
    ],
  },
  {
    id: "m4",
    name: "World's Greatest Stretch",
    category: "Mobility",
    muscle: "Hips, Thoracic Spine, Hamstrings",
    sets: 3,
    reps: "5 each side",
    difficulty: "Beginner",
    restSeconds: 30,
    animKey: "stretch",
    steps: [
      "Step into a long lunge, drop the back knee if needed.",
      "Place the same-side hand as front foot flat on the floor.",
      "Rotate and reach the opposite arm toward the ceiling, opening the thoracic spine.",
      "Pause 2 seconds, then return and repeat on the other side.",
    ],
    formCues: [
      "Rotate through the mid-back, not just the arm. Let the chest follow.",
      "Do this sequence as a daily warm-up — it counters the effects of sitting.",
    ],
  },
];

// ─── Difficulty colors ─────────────────────────────────────────────────────────

const DIFFICULTY_STYLE: Record<Difficulty, { color: string; bg: string }> = {
  Beginner: {
    color: "oklch(0.62 0.18 155)",
    bg: "oklch(0.62 0.18 155 / 0.12)",
  },
  Intermediate: {
    color: "oklch(0.72 0.15 55)",
    bg: "oklch(0.72 0.15 55 / 0.12)",
  },
  Advanced: { color: "oklch(0.62 0.18 25)", bg: "oklch(0.62 0.18 25 / 0.12)" },
};

const CATEGORY_COLORS: Record<Exclude<Category, "All">, string> = {
  Push: "oklch(0.62 0.18 25)",
  Pull: "oklch(0.55 0.18 240)",
  Dips: "oklch(0.72 0.15 55)",
  Legs: "oklch(0.62 0.2 155)",
  Core: "oklch(0.55 0.18 310)",
  Handstand: "oklch(0.55 0.14 185)",
  Mobility: "oklch(0.6 0.15 90)",
};

// ─── Local storage helpers ────────────────────────────────────────────────────

function loadLog(): WorkoutLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem("onyx_workout_log") ?? "[]");
  } catch {
    return [];
  }
}

function saveLog(entries: WorkoutLogEntry[]) {
  localStorage.setItem(
    "onyx_workout_log",
    JSON.stringify(entries.slice(0, 20)),
  );
}

function loadStreak(): { count: number; lastDate: string } {
  try {
    return JSON.parse(
      localStorage.getItem("onyx_workout_streak") ??
        '{"count":0,"lastDate":""}',
    );
  } catch {
    return { count: 0, lastDate: "" };
  }
}

function saveStreak(count: number, lastDate: string) {
  localStorage.setItem(
    "onyx_workout_streak",
    JSON.stringify({ count, lastDate }),
  );
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function computeStreak(current: { count: number; lastDate: string }): number {
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (current.lastDate === todayStr()) return current.count;
  if (current.lastDate === yesterday) return current.count;
  return 0;
}

// ─── Session view ─────────────────────────────────────────────────────────────

interface SessionProps {
  exercises: Exercise[];
  onFinish: (totalSets: number, durationMs: number) => void;
  onCancel: () => void;
}

function SessionView({ exercises, onFinish, onCancel }: SessionProps) {
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [sets, setSets] = useState<ActiveSet[]>(() =>
    exercises.flatMap((ex) =>
      Array.from({ length: ex.sets }, (_, i) => ({
        exerciseId: ex.id,
        setIndex: i,
        completed: false,
      })),
    ),
  );
  const [resting, setResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentExercise = exercises[exerciseIdx];
  const totalSets = sets.length;
  const completedCount = sets.filter((s) => s.completed).length;
  const progressPct = (completedCount / totalSets) * 100;

  const globalSetIdx =
    exercises.slice(0, exerciseIdx).reduce((acc, ex) => acc + ex.sets, 0) +
    setIdx;

  const currentSetState = sets[globalSetIdx];

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRest = useCallback(
    (seconds: number) => {
      setResting(true);
      setRestRemaining(seconds);
      timerRef.current = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            setResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  function handleCompleteSet() {
    if (!currentSetState || currentSetState.completed || resting) return;

    const updated = [...sets];
    updated[globalSetIdx] = { ...updated[globalSetIdx], completed: true };
    setSets(updated);

    const nextSetInExercise = setIdx + 1;
    if (nextSetInExercise < currentExercise.sets) {
      setSetIdx(nextSetInExercise);
      startRest(currentExercise.restSeconds);
    } else {
      const nextEx = exerciseIdx + 1;
      if (nextEx < exercises.length) {
        setExerciseIdx(nextEx);
        setSetIdx(0);
        startRest(currentExercise.restSeconds);
      } else {
        const duration = Date.now() - startTimeRef.current;
        onFinish(updated.filter((s) => s.completed).length, duration);
      }
    }
  }

  function handleSkipRest() {
    clearTimer();
    setResting(false);
    setRestRemaining(0);
  }

  function handleFinish() {
    clearTimer();
    onFinish(completedCount, Date.now() - startTimeRef.current);
  }

  return (
    <motion.div
      data-ocid="session.panel"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="flex flex-col h-full"
      style={{ background: "oklch(0.08 0.005 260)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid oklch(0.18 0.01 260)" }}
      >
        <div className="flex items-center gap-2">
          <Zap size={18} style={{ color: "oklch(0.72 0.15 55)" }} />
          <span
            className="font-bold tracking-widest text-sm"
            style={{ color: "oklch(0.9 0.01 260)" }}
          >
            ACTIVE SESSION
          </span>
        </div>
        <button
          type="button"
          data-ocid="session.cancel.button"
          onClick={onCancel}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: "oklch(0.45 0.012 260)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "oklch(0.62 0.18 25)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "oklch(0.45 0.012 260)";
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 flex-shrink-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs" style={{ color: "oklch(0.45 0.012 260)" }}>
            {completedCount} / {totalSets} sets
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: "oklch(0.72 0.15 55)" }}
          >
            {Math.round(progressPct)}%
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "oklch(0.15 0.01 260)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.72 0.15 55), oklch(0.65 0.18 30))",
            }}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        </div>
      </div>

      {/* Exercise mini-nav dots */}
      <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0">
        {exercises.map((ex, i) => (
          <div
            key={ex.id}
            className="flex-shrink-0 h-1 rounded-full transition-all"
            style={{
              width: i === exerciseIdx ? 28 : 12,
              background:
                i < exerciseIdx
                  ? "oklch(0.72 0.15 55)"
                  : i === exerciseIdx
                    ? "oklch(0.72 0.15 55 / 0.7)"
                    : "oklch(0.22 0.01 260)",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${exerciseIdx}-${setIdx}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mt-4 mb-6 text-center">
              <p
                className="text-xs tracking-widest mb-1"
                style={{ color: "oklch(0.45 0.012 260)" }}
              >
                {exerciseIdx + 1} of {exercises.length}
              </p>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: "oklch(0.9 0.01 260)" }}
              >
                {currentExercise?.name}
              </h2>
              <p className="text-sm" style={{ color: "oklch(0.45 0.012 260)" }}>
                {currentExercise?.muscle}
              </p>
            </div>

            {/* Set counter */}
            <div
              className="rounded-2xl p-6 text-center mb-4"
              style={{
                background: "oklch(0.11 0.008 260)",
                border: "1px solid oklch(0.18 0.01 260)",
              }}
            >
              <p
                className="text-xs tracking-widest mb-2"
                style={{ color: "oklch(0.45 0.012 260)" }}
              >
                CURRENT SET
              </p>
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span
                  className="text-6xl font-black"
                  style={{ color: "oklch(0.72 0.15 55)" }}
                >
                  {setIdx + 1}
                </span>
                <span
                  className="text-2xl"
                  style={{ color: "oklch(0.35 0.01 260)" }}
                >
                  /{currentExercise?.sets}
                </span>
              </div>
              <p
                className="text-sm mt-2"
                style={{ color: "oklch(0.55 0.012 260)" }}
              >
                {currentExercise?.reps} reps
              </p>

              {/* Individual set checkmarks */}
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: currentExercise?.sets ?? 0 }, (_, i) => {
                  const flatIdx =
                    exercises
                      .slice(0, exerciseIdx)
                      .reduce((acc, ex) => acc + ex.sets, 0) + i;
                  const isDone = sets[flatIdx]?.completed;
                  const isCurrent = i === setIdx;
                  return (
                    <motion.div
                      key={`set-${currentExercise?.id ?? exerciseIdx}-${i + 1}`}
                      animate={isDone ? { scale: [1, 1.3, 1] } : {}}
                      className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                      style={{
                        borderColor: isDone
                          ? "oklch(0.62 0.18 155)"
                          : isCurrent
                            ? "oklch(0.72 0.15 55)"
                            : "oklch(0.22 0.01 260)",
                        background: isDone
                          ? "oklch(0.62 0.18 155 / 0.15)"
                          : isCurrent
                            ? "oklch(0.72 0.15 55 / 0.1)"
                            : "transparent",
                        color: isDone
                          ? "oklch(0.62 0.18 155)"
                          : "oklch(0.35 0.01 260)",
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Rest timer */}
            <AnimatePresence>
              {resting && (
                <motion.div
                  data-ocid="session.rest.panel"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="rounded-2xl p-4 mb-4 flex items-center justify-between"
                  style={{
                    background: "oklch(0.55 0.18 240 / 0.1)",
                    border: "1px solid oklch(0.55 0.18 240 / 0.25)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Timer
                      size={20}
                      style={{ color: "oklch(0.55 0.18 240)" }}
                    />
                    <div>
                      <p
                        className="text-xs tracking-widest"
                        style={{ color: "oklch(0.55 0.18 240)" }}
                      >
                        REST
                      </p>
                      <p
                        className="text-2xl font-black font-mono"
                        style={{ color: "oklch(0.9 0.01 260)" }}
                      >
                        {restRemaining}s
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-ocid="session.skip_rest.button"
                    onClick={handleSkipRest}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: "oklch(0.55 0.18 240 / 0.2)",
                      color: "oklch(0.55 0.18 240)",
                      border: "1px solid oklch(0.55 0.18 240 / 0.3)",
                    }}
                  >
                    <SkipForward size={14} />
                    Skip
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Complete set button */}
            <motion.button
              type="button"
              data-ocid="session.complete_set.button"
              onClick={handleCompleteSet}
              disabled={resting || currentSetState?.completed}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-bold text-base tracking-wide transition-all flex items-center justify-center gap-2"
              style={{
                background:
                  resting || currentSetState?.completed
                    ? "oklch(0.15 0.01 260)"
                    : "linear-gradient(135deg, oklch(0.72 0.15 55), oklch(0.65 0.18 30))",
                color:
                  resting || currentSetState?.completed
                    ? "oklch(0.35 0.01 260)"
                    : "oklch(0.08 0.005 260)",
                border: "none",
                cursor:
                  resting || currentSetState?.completed
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              <CheckCircle2 size={20} />
              {currentSetState?.completed ? "Set Done" : "Complete Set"}
            </motion.button>
          </motion.div>
        </AnimatePresence>

        {/* Up next queue */}
        {exercises.length > 1 && (
          <div className="mt-6">
            <p
              className="text-xs tracking-widest mb-3"
              style={{ color: "oklch(0.35 0.01 260)" }}
            >
              UP NEXT
            </p>
            <div className="space-y-2">
              {exercises.slice(exerciseIdx + 1, exerciseIdx + 3).map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: "oklch(0.11 0.008 260)",
                    border: "1px solid oklch(0.15 0.01 260)",
                  }}
                >
                  {/* Simple circle dot in place of dumbbell */}
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: "oklch(0.35 0.01 260)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "oklch(0.7 0.01 260)" }}
                    >
                      {ex.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(0.35 0.01 260)" }}
                    >
                      {ex.sets}×{ex.reps}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid oklch(0.15 0.01 260)" }}
      >
        <button
          type="button"
          data-ocid="session.finish.button"
          onClick={handleFinish}
          className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all"
          style={{
            background: "oklch(0.13 0.01 260)",
            color: "oklch(0.55 0.012 260)",
            border: "1px solid oklch(0.2 0.01 260)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "oklch(0.62 0.18 155 / 0.15)";
            (e.currentTarget as HTMLElement).style.color =
              "oklch(0.62 0.18 155)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "oklch(0.62 0.18 155 / 0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "oklch(0.13 0.01 260)";
            (e.currentTarget as HTMLElement).style.color =
              "oklch(0.55 0.012 260)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "oklch(0.2 0.01 260)";
          }}
        >
          Finish Workout
        </button>
      </div>
    </motion.div>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  ex: Exercise;
  index: number;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function ExerciseCard({ ex, index, isSelected, onToggle }: ExerciseCardProps) {
  const [howToOpen, setHowToOpen] = useState(false);
  const diffStyle = DIFFICULTY_STYLE[ex.difficulty];
  const catColor = CATEGORY_COLORS[ex.category];

  return (
    <motion.div
      data-ocid={`workout.item.${index + 1}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{
        background: isSelected
          ? "oklch(0.72 0.15 55 / 0.06)"
          : "oklch(0.11 0.008 260)",
        border: isSelected
          ? "1px solid oklch(0.72 0.15 55 / 0.4)"
          : "1px solid oklch(0.18 0.01 260)",
      }}
    >
      {/* Main card row */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        onClick={() => onToggle(ex.id)}
        className="relative flex items-start gap-3 p-4"
      >
        {/* Selected checkmark */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center z-10"
            style={{
              background: "oklch(0.72 0.15 55)",
              color: "oklch(0.08 0.005 260)",
            }}
          >
            <CheckCircle2 size={14} />
          </motion.div>
        )}

        {/* Animation container */}
        <div
          className="flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            background: `oklch(from ${catColor} l c h / 0.07)`,
            border: `1px solid oklch(from ${catColor} l c h / 0.15)`,
          }}
        >
          <ExerciseAnimation animKey={ex.animKey} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-sm leading-tight pr-6"
            style={{ color: "oklch(0.9 0.01 260)" }}
          >
            {ex.name}
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{ color: "oklch(0.45 0.012 260)" }}
          >
            {ex.muscle}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
              style={{
                background: "oklch(0.15 0.01 260)",
                color: "oklch(0.65 0.012 260)",
              }}
            >
              {ex.sets}×{ex.reps}
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: diffStyle.bg, color: diffStyle.color }}
            >
              {ex.difficulty}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${catColor}15`, color: catColor }}
            >
              {ex.category}
            </span>
          </div>
        </div>
      </motion.div>

      {/* How to do it toggle */}
      <div style={{ borderTop: "1px solid oklch(0.16 0.01 260)" }}>
        <button
          type="button"
          data-ocid={`workout.item.${index + 1}.toggle`}
          onClick={(e) => {
            e.stopPropagation();
            setHowToOpen((o) => !o);
          }}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold tracking-wide transition-all"
          style={{
            color: howToOpen ? "oklch(0.72 0.15 55)" : "oklch(0.42 0.012 260)",
          }}
        >
          <span>HOW TO DO IT</span>
          {howToOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <AnimatePresence>
          {howToOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {/* Steps */}
                <ol className="space-y-2">
                  {ex.steps.map((step, i) => (
                    <li
                      key={step.slice(0, 20)}
                      className="flex gap-2.5 items-start"
                    >
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black mt-0.5"
                        style={{
                          background: "oklch(0.72 0.15 55 / 0.15)",
                          color: "oklch(0.72 0.15 55)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="text-xs leading-relaxed"
                        style={{ color: "oklch(0.68 0.01 260)" }}
                      >
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>

                {/* Form cues */}
                <div
                  className="rounded-xl p-3 space-y-1.5"
                  style={{
                    background: "oklch(0.13 0.01 260)",
                    border: "1px solid oklch(0.22 0.01 260)",
                  }}
                >
                  <p
                    className="text-xs font-bold tracking-widest mb-2"
                    style={{ color: "oklch(0.5 0.012 260)" }}
                  >
                    FORM CUES
                  </p>
                  {ex.formCues.map((cue) => (
                    <div
                      key={cue.slice(0, 20)}
                      className="flex gap-2 items-start"
                    >
                      <span
                        style={{
                          color: "oklch(0.72 0.15 55)",
                          fontSize: 10,
                          marginTop: 3,
                        }}
                      >
                        ▸
                      </span>
                      <span
                        className="text-xs leading-relaxed"
                        style={{ color: "oklch(0.55 0.01 260)" }}
                      >
                        {cue}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main WorkoutPage ─────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const [category, setCategory] = useState<Category>("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionExercises, setSessionExercises] = useState<Exercise[]>([]);
  const [showFinish, setShowFinish] = useState<{
    sets: number;
    duration: number;
  } | null>(null);
  const [log, setLog] = useState<WorkoutLogEntry[]>(loadLog);
  const [streak, setStreak] = useState(() => {
    const s = loadStreak();
    return { ...s, displayCount: computeStreak(s) };
  });

  const CATEGORIES: Category[] = [
    "All",
    "Push",
    "Pull",
    "Dips",
    "Legs",
    "Core",
    "Handstand",
    "Mobility",
  ];

  const filtered =
    category === "All"
      ? EXERCISES
      : EXERCISES.filter((e) => e.category === category);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleStartWorkout() {
    const exercisesToDo =
      selected.size > 0
        ? EXERCISES.filter((e) => selected.has(e.id))
        : filtered.slice(0, 4);
    setSessionExercises(exercisesToDo);
    setSessionActive(true);
  }

  function handleFinishSession(totalSets: number, durationMs: number) {
    setSessionActive(false);
    const durationMinutes = Math.round(durationMs / 60000);

    const entry: WorkoutLogEntry = {
      id: `w_${Date.now()}`,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      timestamp: Date.now(),
      exercises: sessionExercises.map((e) => e.name),
      totalSets,
      durationMinutes,
    };

    const newLog = [entry, ...log];
    setLog(newLog);
    saveLog(newLog);

    const today = todayStr();
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const s = loadStreak();
    let newCount = 1;
    if (s.lastDate === yesterday) newCount = s.count + 1;
    else if (s.lastDate === today) newCount = s.count;
    saveStreak(newCount, today);
    setStreak({ count: newCount, lastDate: today, displayCount: newCount });

    setShowFinish({ sets: totalSets, duration: durationMinutes });
    setSelected(new Set());
  }

  function handleCancelSession() {
    setSessionActive(false);
    setSessionExercises([]);
  }

  // Inject CSS keyframes once into document head
  useEffect(() => {
    const id = "onyx-workout-anim-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = ANIM_STYLES;
      document.head.appendChild(el);
    }
    return () => {
      // leave style in DOM — no cleanup needed
    };
  }, []);

  if (sessionActive) {
    return (
      <AnimatePresence>
        <SessionView
          exercises={sessionExercises}
          onFinish={handleFinishSession}
          onCancel={handleCancelSession}
        />
      </AnimatePresence>
    );
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.08 0.005 260)" }}
    >
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 max-w-2xl mx-auto space-y-6">
          {/* ── Finish celebration ── */}
          <AnimatePresence>
            {showFinish && (
              <motion.div
                data-ocid="workout.success_state"
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.15 55 / 0.12), oklch(0.65 0.18 30 / 0.1))",
                  border: "1px solid oklch(0.72 0.15 55 / 0.3)",
                }}
              >
                <Trophy
                  size={28}
                  style={{ color: "oklch(0.72 0.15 55)", flexShrink: 0 }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-sm"
                    style={{ color: "oklch(0.9 0.01 260)" }}
                  >
                    Workout Complete!
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "oklch(0.55 0.012 260)" }}
                  >
                    {showFinish.sets} sets · {showFinish.duration} min · Streak{" "}
                    {streak.displayCount} 🔥
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFinish(null)}
                  className="p-1 rounded-lg"
                  style={{ color: "oklch(0.45 0.012 260)" }}
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Hero header ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h1
                  className="text-2xl font-black tracking-widest leading-none"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.9 0.01 260), oklch(0.72 0.15 55))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  FORGE YOUR
                </h1>
                <h1
                  className="text-2xl font-black tracking-widest leading-none"
                  style={{ color: "oklch(0.72 0.15 55)" }}
                >
                  LIMITS
                </h1>
                <p
                  className="text-xs mt-1 tracking-wide"
                  style={{ color: "oklch(0.4 0.012 260)" }}
                >
                  Calisthenics · Select exercises · Start session
                </p>
              </div>

              {/* Streak badge */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center px-4 py-3 rounded-2xl"
                style={{
                  background:
                    streak.displayCount > 0
                      ? "linear-gradient(135deg, oklch(0.62 0.18 25 / 0.15), oklch(0.72 0.15 55 / 0.1))"
                      : "oklch(0.11 0.008 260)",
                  border:
                    streak.displayCount > 0
                      ? "1px solid oklch(0.72 0.15 55 / 0.3)"
                      : "1px solid oklch(0.18 0.01 260)",
                }}
              >
                <Flame
                  size={22}
                  style={{
                    color:
                      streak.displayCount > 0
                        ? "oklch(0.72 0.15 55)"
                        : "oklch(0.3 0.01 260)",
                  }}
                />
                <span
                  className="text-xl font-black leading-none mt-0.5"
                  style={{
                    color:
                      streak.displayCount > 0
                        ? "oklch(0.72 0.15 55)"
                        : "oklch(0.35 0.01 260)",
                  }}
                >
                  {streak.displayCount}
                </span>
                <span
                  className="text-[9px] tracking-widest mt-0.5"
                  style={{ color: "oklch(0.4 0.012 260)" }}
                >
                  STREAK
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* ── Category filters ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = category === cat;
              const catCol =
                cat === "All"
                  ? "oklch(0.72 0.15 55)"
                  : CATEGORY_COLORS[cat as Exclude<Category, "All">];
              return (
                <button
                  key={cat}
                  type="button"
                  data-ocid="workout.filter.tab"
                  onClick={() => setCategory(cat)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all"
                  style={{
                    background: isActive ? catCol : "oklch(0.13 0.01 260)",
                    color: isActive
                      ? "oklch(0.08 0.005 260)"
                      : "oklch(0.5 0.012 260)",
                    border: isActive ? "none" : "1px solid oklch(0.2 0.01 260)",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </motion.div>

          {/* ── Selection toolbar ── */}
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{
                    background: "oklch(0.72 0.15 55 / 0.08)",
                    border: "1px solid oklch(0.72 0.15 55 / 0.25)",
                  }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "oklch(0.72 0.15 55)" }}
                  >
                    {selected.size} exercise{selected.size !== 1 ? "s" : ""}{" "}
                    selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected(new Set())}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ color: "oklch(0.45 0.012 260)" }}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      data-ocid="workout.primary_button"
                      onClick={handleStartWorkout}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.72 0.15 55), oklch(0.65 0.18 30))",
                        color: "oklch(0.08 0.005 260)",
                      }}
                    >
                      <Play size={12} />
                      Start Workout
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Exercise cards ── */}
          <div className="grid gap-3">
            {filtered.map((ex, i) => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                index={i}
                isSelected={selected.has(ex.id)}
                onToggle={toggleSelect}
              />
            ))}
          </div>

          {/* ── Quick start ── */}
          {selected.size === 0 && (
            <motion.button
              type="button"
              data-ocid="workout.secondary_button"
              onClick={handleStartWorkout}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl font-bold tracking-widest text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.15 55), oklch(0.65 0.18 30))",
                color: "oklch(0.08 0.005 260)",
                border: "none",
              }}
            >
              <Play size={16} />
              START {category === "All" ? "QUICK" : category.toUpperCase()}{" "}
              WORKOUT
            </motion.button>
          )}

          {/* ── Workout log ── */}
          {log.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-sm font-bold tracking-widest"
                  style={{ color: "oklch(0.55 0.012 260)" }}
                >
                  RECENT WORKOUTS
                </h2>
                {log.length > 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const cleared: WorkoutLogEntry[] = [];
                      setLog(cleared);
                      saveLog(cleared);
                    }}
                    className="text-xs flex items-center gap-1"
                    style={{ color: "oklch(0.4 0.012 260)" }}
                  >
                    <RotateCcw size={12} />
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {log.slice(0, 5).map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    data-ocid={`workout.log.item.${i + 1}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl p-3 flex items-center gap-3"
                    style={{
                      background: "oklch(0.11 0.008 260)",
                      border: "1px solid oklch(0.16 0.01 260)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "oklch(0.62 0.18 155 / 0.12)" }}
                    >
                      <CheckCircle2
                        size={16}
                        style={{ color: "oklch(0.62 0.18 155)" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: "oklch(0.75 0.01 260)" }}
                      >
                        {entry.exercises.slice(0, 2).join(", ")}
                        {entry.exercises.length > 2
                          ? ` +${entry.exercises.length - 2}`
                          : ""}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "oklch(0.38 0.01 260)" }}
                      >
                        {entry.date} · {entry.totalSets} sets ·{" "}
                        {entry.durationMinutes > 0
                          ? `${entry.durationMinutes} min`
                          : "< 1 min"}
                      </p>
                    </div>
                    <Trophy
                      size={14}
                      style={{
                        color: "oklch(0.72 0.15 55 / 0.5)",
                        flexShrink: 0,
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Empty log state ── */}
          {log.length === 0 && (
            <div
              data-ocid="workout.log.empty_state"
              className="rounded-2xl p-6 text-center"
              style={{
                background: "oklch(0.11 0.008 260)",
                border: "1px dashed oklch(0.2 0.01 260)",
              }}
            >
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "oklch(0.45 0.012 260)" }}
              >
                No workouts logged yet
              </p>
              <p className="text-xs" style={{ color: "oklch(0.3 0.01 260)" }}>
                Complete a session to see your history here
              </p>
            </div>
          )}

          <div className="h-4" />
        </div>
      </ScrollArea>
    </div>
  );
}
