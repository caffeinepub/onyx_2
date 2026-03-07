import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  ChevronRight,
  Dumbbell,
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

// ─── Types ───────────────────────────────────────────────────────────────────

type Category =
  | "All"
  | "Chest"
  | "Back"
  | "Legs"
  | "Arms"
  | "Core"
  | "Full Body";
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

// ─── Exercise Library ─────────────────────────────────────────────────────────

const EXERCISES: Exercise[] = [
  // Chest
  {
    id: "c1",
    name: "Barbell Bench Press",
    category: "Chest",
    muscle: "Pectorals",
    sets: 4,
    reps: "8–10",
    difficulty: "Intermediate",
    restSeconds: 90,
  },
  {
    id: "c2",
    name: "Incline Dumbbell Press",
    category: "Chest",
    muscle: "Upper Chest",
    sets: 3,
    reps: "10–12",
    difficulty: "Intermediate",
    restSeconds: 75,
  },
  {
    id: "c3",
    name: "Push-Up",
    category: "Chest",
    muscle: "Pectorals, Triceps",
    sets: 4,
    reps: "15–20",
    difficulty: "Beginner",
    restSeconds: 60,
  },
  {
    id: "c4",
    name: "Cable Fly",
    category: "Chest",
    muscle: "Pectorals",
    sets: 3,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 60,
  },
  // Back
  {
    id: "b1",
    name: "Deadlift",
    category: "Back",
    muscle: "Erectors, Glutes",
    sets: 5,
    reps: "5",
    difficulty: "Advanced",
    restSeconds: 120,
  },
  {
    id: "b2",
    name: "Pull-Up",
    category: "Back",
    muscle: "Lats, Biceps",
    sets: 4,
    reps: "6–10",
    difficulty: "Intermediate",
    restSeconds: 90,
  },
  {
    id: "b3",
    name: "Bent-Over Row",
    category: "Back",
    muscle: "Rhomboids, Lats",
    sets: 4,
    reps: "8–10",
    difficulty: "Intermediate",
    restSeconds: 90,
  },
  {
    id: "b4",
    name: "Lat Pulldown",
    category: "Back",
    muscle: "Latissimus Dorsi",
    sets: 3,
    reps: "10–12",
    difficulty: "Beginner",
    restSeconds: 75,
  },
  // Legs
  {
    id: "l1",
    name: "Barbell Back Squat",
    category: "Legs",
    muscle: "Quads, Glutes",
    sets: 5,
    reps: "5–6",
    difficulty: "Advanced",
    restSeconds: 120,
  },
  {
    id: "l2",
    name: "Romanian Deadlift",
    category: "Legs",
    muscle: "Hamstrings, Glutes",
    sets: 3,
    reps: "10–12",
    difficulty: "Intermediate",
    restSeconds: 90,
  },
  {
    id: "l3",
    name: "Leg Press",
    category: "Legs",
    muscle: "Quads",
    sets: 4,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 75,
  },
  {
    id: "l4",
    name: "Walking Lunges",
    category: "Legs",
    muscle: "Quads, Glutes",
    sets: 3,
    reps: "12 each",
    difficulty: "Beginner",
    restSeconds: 60,
  },
  // Arms
  {
    id: "a1",
    name: "Barbell Curl",
    category: "Arms",
    muscle: "Biceps",
    sets: 4,
    reps: "10–12",
    difficulty: "Beginner",
    restSeconds: 60,
  },
  {
    id: "a2",
    name: "Skull Crusher",
    category: "Arms",
    muscle: "Triceps",
    sets: 3,
    reps: "10–12",
    difficulty: "Intermediate",
    restSeconds: 75,
  },
  {
    id: "a3",
    name: "Hammer Curl",
    category: "Arms",
    muscle: "Brachialis",
    sets: 3,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 60,
  },
  {
    id: "a4",
    name: "Tricep Dips",
    category: "Arms",
    muscle: "Triceps, Chest",
    sets: 4,
    reps: "8–12",
    difficulty: "Intermediate",
    restSeconds: 75,
  },
  // Core
  {
    id: "o1",
    name: "Plank",
    category: "Core",
    muscle: "Abs, Obliques",
    sets: 3,
    reps: "60s hold",
    difficulty: "Beginner",
    restSeconds: 45,
  },
  {
    id: "o2",
    name: "Hanging Leg Raise",
    category: "Core",
    muscle: "Lower Abs",
    sets: 4,
    reps: "12–15",
    difficulty: "Intermediate",
    restSeconds: 60,
  },
  {
    id: "o3",
    name: "Cable Crunch",
    category: "Core",
    muscle: "Rectus Abdominis",
    sets: 3,
    reps: "15–20",
    difficulty: "Beginner",
    restSeconds: 45,
  },
  // Full Body
  {
    id: "f1",
    name: "Barbell Clean & Press",
    category: "Full Body",
    muscle: "Total Body",
    sets: 4,
    reps: "5–6",
    difficulty: "Advanced",
    restSeconds: 120,
  },
  {
    id: "f2",
    name: "Kettlebell Swing",
    category: "Full Body",
    muscle: "Glutes, Core, Shoulders",
    sets: 4,
    reps: "15–20",
    difficulty: "Intermediate",
    restSeconds: 60,
  },
  {
    id: "f3",
    name: "Burpee",
    category: "Full Body",
    muscle: "Total Body",
    sets: 3,
    reps: "10–15",
    difficulty: "Intermediate",
    restSeconds: 75,
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
  Chest: "oklch(0.62 0.18 25)",
  Back: "oklch(0.55 0.18 240)",
  Legs: "oklch(0.62 0.2 155)",
  Arms: "oklch(0.72 0.15 55)",
  Core: "oklch(0.55 0.18 310)",
  "Full Body": "oklch(0.55 0.14 185)",
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
  const today = todayStr();
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (current.lastDate === today) return current.count;
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

  // Global set index (flat across all exercises)
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

    // Mark set done
    const updated = [...sets];
    updated[globalSetIdx] = { ...updated[globalSetIdx], completed: true };
    setSets(updated);

    // Advance
    const nextSetInExercise = setIdx + 1;
    if (nextSetInExercise < currentExercise.sets) {
      setSetIdx(nextSetInExercise);
      startRest(currentExercise.restSeconds);
    } else {
      // Move to next exercise
      const nextEx = exerciseIdx + 1;
      if (nextEx < exercises.length) {
        setExerciseIdx(nextEx);
        setSetIdx(0);
        startRest(currentExercise.restSeconds);
      } else {
        // All done — auto finish
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

      {/* Exercise list mini-nav */}
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

      {/* Main session content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${exerciseIdx}-${setIdx}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Exercise name */}
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

        {/* Exercise queue preview */}
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
                  <Dumbbell
                    size={14}
                    style={{ color: "oklch(0.35 0.01 260)" }}
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
    "Chest",
    "Back",
    "Legs",
    "Arms",
    "Core",
    "Full Body",
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

    // Update streak
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
                  Select exercises · Start session · Log progress
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
              return (
                <button
                  key={cat}
                  type="button"
                  data-ocid="workout.filter.tab"
                  onClick={() => setCategory(cat)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all"
                  style={{
                    background: isActive
                      ? cat === "All"
                        ? "oklch(0.72 0.15 55)"
                        : `${CATEGORY_COLORS[cat as Exclude<Category, "All">]}`
                      : "oklch(0.13 0.01 260)",
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

          {/* ── Exercise cards grid ── */}
          <div className="grid gap-3">
            {filtered.map((ex, i) => {
              const isSelected = selected.has(ex.id);
              const diffStyle = DIFFICULTY_STYLE[ex.difficulty];
              const catColor = CATEGORY_COLORS[ex.category];

              return (
                <motion.div
                  key={ex.id}
                  data-ocid={`workout.item.${i + 1}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => toggleSelect(ex.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative rounded-2xl p-4 cursor-pointer transition-all select-none"
                  style={{
                    background: isSelected
                      ? "oklch(0.72 0.15 55 / 0.06)"
                      : "oklch(0.11 0.008 260)",
                    border: isSelected
                      ? "1px solid oklch(0.72 0.15 55 / 0.4)"
                      : "1px solid oklch(0.18 0.01 260)",
                  }}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: "oklch(0.72 0.15 55)",
                        color: "oklch(0.08 0.005 260)",
                      }}
                    >
                      <CheckCircle2 size={14} />
                    </motion.div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Category dot */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${catColor}1a` }}
                    >
                      <Dumbbell size={15} style={{ color: catColor }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3
                          className="font-semibold text-sm leading-tight"
                          style={{ color: "oklch(0.9 0.01 260)" }}
                        >
                          {ex.name}
                        </h3>
                      </div>
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
                          style={{
                            background: diffStyle.bg,
                            color: diffStyle.color,
                          }}
                        >
                          {ex.difficulty}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: `${catColor}15`,
                            color: catColor,
                          }}
                        >
                          {ex.category}
                        </span>
                      </div>
                    </div>

                    {!isSelected && (
                      <ChevronRight
                        size={16}
                        style={{
                          color: "oklch(0.3 0.01 260)",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Quick-start if nothing selected ── */}
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

          {/* Spacer for bottom nav */}
          <div className="h-4" />
        </div>
      </ScrollArea>
    </div>
  );
}
