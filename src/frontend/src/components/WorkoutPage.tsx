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

// ─── Types ───────────────────────────────────────────────────────────────────

type Category =
  | "All"
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Arms"
  | "Legs"
  | "Core"
  | "Cardio";

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

// ─── Exercise Library ─────────────────────────────────────────────────────────

const EXERCISES: Exercise[] = [
  // ── Chest ─────────────────────────────────────────────────────────────────
  {
    id: "ch1",
    name: "Barbell Bench Press",
    category: "Chest",
    muscle: "Pectorals, Triceps, Front Deltoids",
    sets: 4,
    reps: "8–12",
    difficulty: "Intermediate",
    restSeconds: 90,
    steps: [
      "Lie on a flat bench, feet flat on the floor. Grip the bar slightly wider than shoulder-width.",
      "Unrack the bar and lower it slowly to mid-chest, elbows at roughly 75°.",
      "Pause briefly at the chest without bouncing, then press explosively back to full extension.",
      "Re-rack only when arms are fully locked out.",
    ],
    formCues: [
      "Keep shoulder blades retracted and depressed throughout — protect the shoulder joint.",
      "Drive your feet into the floor to create full-body tension.",
    ],
  },
  {
    id: "ch2",
    name: "Incline Dumbbell Press",
    category: "Chest",
    muscle: "Upper Chest, Front Deltoids",
    sets: 3,
    reps: "10–14",
    difficulty: "Beginner",
    restSeconds: 75,
    steps: [
      "Set a bench to 30–45°. Sit with a dumbbell on each knee, then kick them up as you lie back.",
      "Press the dumbbells up until arms are fully extended, palms facing forward.",
      "Lower with control until elbows are slightly below the bench level.",
      "Press back up driving through the upper chest.",
    ],
    formCues: [
      "Don't flare elbows to 90° — a slight tuck (75°) reduces shoulder impingement.",
      "Squeeze the chest hard at the top of every rep.",
    ],
  },
  {
    id: "ch3",
    name: "Cable Fly",
    category: "Chest",
    muscle: "Pectorals (Isolation)",
    sets: 3,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 60,
    steps: [
      "Set cable pulleys at shoulder height. Stand centered, one foot slightly forward.",
      "With a slight bend in both elbows, bring handles together in front of your chest in a hugging arc.",
      "Squeeze the chest hard for 1 second at the peak contraction.",
      "Open arms back with control — don't let cables snap you open.",
    ],
    formCues: [
      "The bend in the elbows stays fixed — never straighten or bend further during the rep.",
      "Lean slightly forward to keep the force vector aligned with the muscle fibers.",
    ],
  },
  {
    id: "ch4",
    name: "Chest Dips",
    category: "Chest",
    muscle: "Lower Chest, Triceps",
    sets: 3,
    reps: "10–15",
    difficulty: "Intermediate",
    restSeconds: 75,
    steps: [
      "Mount parallel bars, lean your torso forward to shift emphasis to chest.",
      "Lower yourself until upper arms are parallel to the floor.",
      "Press back up powerfully, maintaining the forward lean.",
    ],
    formCues: [
      "The forward lean is essential — upright torso targets triceps instead.",
      "Add a weight belt once bodyweight reps exceed 15.",
    ],
  },
  {
    id: "ch5",
    name: "Pec Deck Machine",
    category: "Chest",
    muscle: "Pectorals (Isolation)",
    sets: 3,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 60,
    steps: [
      "Adjust the seat so your elbows are at shoulder height on the pads.",
      "Bring the pads together in front of you, squeezing the chest at full contraction.",
      "Return slowly, resisting the weight on the way back.",
    ],
    formCues: [
      "Don't let the weight stack slam — control the eccentric for maximum growth.",
      "Keep your back firmly against the pad throughout.",
    ],
  },

  // ── Back ──────────────────────────────────────────────────────────────────
  {
    id: "ba1",
    name: "Barbell Deadlift",
    category: "Back",
    muscle: "Entire Posterior Chain",
    sets: 4,
    reps: "5–8",
    difficulty: "Advanced",
    restSeconds: 120,
    steps: [
      "Stand with feet hip-width, bar over mid-foot. Hinge down and grip just outside your legs.",
      "Take slack out of the bar by pulling chest up and engaging lats ('protect your armpits').",
      "Push the floor away rather than pulling — drive hips forward as bar passes knees.",
      "Lock out with hips forward, glutes squeezed, body tall. Hinge back to lower.",
    ],
    formCues: [
      "Never round the lower back. If you lose the arch, the weight is too heavy.",
      "Bar stays in contact with your legs the entire lift — shin scrape is normal.",
    ],
  },
  {
    id: "ba2",
    name: "Barbell Bent-Over Row",
    category: "Back",
    muscle: "Lats, Rhomboids, Traps",
    sets: 4,
    reps: "8–12",
    difficulty: "Intermediate",
    restSeconds: 90,
    steps: [
      "Hip hinge to about 45°, back flat, bar hanging at arms' length.",
      "Row the bar to your lower sternum, driving elbows back past your torso.",
      "Squeeze shoulder blades together at the top for 1 second.",
      "Lower under control to full arm extension.",
    ],
    formCues: [
      "Don't use momentum — a slight body sway is OK, full hip extension defeats the purpose.",
      "Pull with the elbows, not the hands, to maximize back engagement.",
    ],
  },
  {
    id: "ba3",
    name: "Lat Pulldown",
    category: "Back",
    muscle: "Latissimus Dorsi, Biceps",
    sets: 4,
    reps: "10–14",
    difficulty: "Beginner",
    restSeconds: 75,
    steps: [
      "Grip the bar slightly wider than shoulder-width, palms facing forward.",
      "Lean back slightly and pull the bar to your upper chest, driving elbows down.",
      "Squeeze the lats hard at full contraction.",
      "Let the bar rise with control until arms are fully extended.",
    ],
    formCues: [
      "Initiate with the lats — depress the shoulder blades before you pull.",
      "Don't let the weight yank you up — control the full range.",
    ],
  },
  {
    id: "ba4",
    name: "Seated Cable Row",
    category: "Back",
    muscle: "Middle Back, Rhomboids, Biceps",
    sets: 3,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 75,
    steps: [
      "Sit upright with a slight lean forward, handles at arm's length.",
      "Row the handles to your lower abdomen, driving elbows back.",
      "Squeeze your shoulder blades together and hold 1 second.",
      "Extend arms fully with controlled resistance on the way out.",
    ],
    formCues: [
      "Don't rock your torso — the movement comes from the arms and back, not hips.",
      "Keep chest tall and shoulders down throughout.",
    ],
  },
  {
    id: "ba5",
    name: "T-Bar Row",
    category: "Back",
    muscle: "Lats, Middle Back, Rear Deltoids",
    sets: 3,
    reps: "10–12",
    difficulty: "Intermediate",
    restSeconds: 90,
    steps: [
      "Straddle the bar, grip the handles with both hands, hinge forward to 45°.",
      "Row the bar to your chest, keeping elbows close to your sides.",
      "Pause at the top, then lower with a 2-second count.",
    ],
    formCues: [
      "Chest pad (if available) prevents lower back compensation — use it.",
      "Full extension at the bottom — no short-stroking the reps.",
    ],
  },

  // ── Shoulders ─────────────────────────────────────────────────────────────
  {
    id: "sh1",
    name: "Overhead Press (Barbell)",
    category: "Shoulders",
    muscle: "Front & Side Deltoids, Triceps",
    sets: 4,
    reps: "6–10",
    difficulty: "Intermediate",
    restSeconds: 90,
    steps: [
      "Grip the bar just outside shoulder-width, bar resting on upper chest.",
      "Brace the core hard, then press the bar directly overhead to full arm extension.",
      "Squeeze glutes and abs to prevent lower-back arch at the top.",
      "Lower the bar back to upper chest under control.",
    ],
    formCues: [
      "The bar path should be nearly vertical — move your head back slightly as it passes.",
      "Lock out fully overhead — partial reps shortchange tricep and shoulder development.",
    ],
  },
  {
    id: "sh2",
    name: "Dumbbell Lateral Raise",
    category: "Shoulders",
    muscle: "Medial Deltoids",
    sets: 4,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 60,
    steps: [
      "Stand with dumbbells at your sides, slight bend in the elbows.",
      "Raise arms out to the sides until they're parallel to the floor.",
      "Pinky side slightly higher than thumb — think 'pouring a glass of water'.",
      "Lower slowly over 2–3 seconds.",
    ],
    formCues: [
      "Avoid shrugging — if your traps are burning, the weight is too heavy.",
      "Lean forward 10–15° to better align the lateral head of the deltoid.",
    ],
  },
  {
    id: "sh3",
    name: "Face Pull",
    category: "Shoulders",
    muscle: "Rear Deltoids, Rotator Cuff",
    sets: 3,
    reps: "15–20",
    difficulty: "Beginner",
    restSeconds: 60,
    steps: [
      "Set a cable pulley to head height with a rope attachment.",
      "Pull the rope to your face, separating hands at full contraction.",
      "Elbows stay above wrists throughout the pull.",
      "Return to full extension with control.",
    ],
    formCues: [
      "This exercise is essential for shoulder health and posture — do it every session.",
      "Use light-to-moderate weight and focus on the rear delt contraction.",
    ],
  },
  {
    id: "sh4",
    name: "Arnold Press",
    category: "Shoulders",
    muscle: "All Three Deltoid Heads",
    sets: 3,
    reps: "10–12",
    difficulty: "Intermediate",
    restSeconds: 75,
    steps: [
      "Hold dumbbells at chin height, palms facing you.",
      "As you press up, rotate palms outward so they face forward at the top.",
      "Fully extend overhead, then reverse the rotation as you lower.",
    ],
    formCues: [
      "The rotation is the key — it recruits all three heads of the deltoid.",
      "Keep the core tight and avoid leaning back to compensate.",
    ],
  },

  // ── Arms ──────────────────────────────────────────────────────────────────
  {
    id: "ar1",
    name: "Barbell Curl",
    category: "Arms",
    muscle: "Biceps Brachii",
    sets: 4,
    reps: "10–12",
    difficulty: "Beginner",
    restSeconds: 60,
    steps: [
      "Stand with barbell at arms' length, supinated grip, elbows pinned to your sides.",
      "Curl the bar toward your shoulders while keeping upper arms completely still.",
      "Squeeze the biceps hard at the top, then lower with a 3-second count.",
    ],
    formCues: [
      "No body swinging — if you have to swing, the weight is too heavy.",
      "Full extension at the bottom — partial reps limit bicep stretch.",
    ],
  },
  {
    id: "ar2",
    name: "Hammer Curl",
    category: "Arms",
    muscle: "Biceps, Brachialis, Forearms",
    sets: 3,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 60,
    steps: [
      "Hold dumbbells with a neutral grip (thumbs up), arms at your sides.",
      "Curl both or alternating arms keeping the neutral grip throughout.",
      "Lower fully to a dead hang each rep.",
    ],
    formCues: [
      "The neutral grip shifts emphasis to the brachialis — key for arm thickness.",
      "Keep elbows tight to your sides — no flaring.",
    ],
  },
  {
    id: "ar3",
    name: "Skull Crusher",
    category: "Arms",
    muscle: "Triceps (Long Head)",
    sets: 3,
    reps: "10–12",
    difficulty: "Intermediate",
    restSeconds: 75,
    steps: [
      "Lie on a flat bench, hold an EZ-bar or dumbbells above your chest, arms extended.",
      "Bend only at the elbows to lower the weight toward your forehead.",
      "Stop just above your head, then press back up via the triceps.",
    ],
    formCues: [
      "Upper arms stay perpendicular to the floor — don't let elbows flare wide.",
      "Control the eccentric phase — this is where most muscle damage occurs.",
    ],
  },
  {
    id: "ar4",
    name: "Tricep Pushdown",
    category: "Arms",
    muscle: "Triceps (All Heads)",
    sets: 3,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 60,
    steps: [
      "Stand at a cable with a rope or bar at chest height, elbows pinned at your sides.",
      "Push the attachment down until arms are fully extended.",
      "Pause with triceps fully contracted, then let the cable rise under control.",
    ],
    formCues: [
      "Elbows stay stationary — the forearms are the only thing moving.",
      "For rope pushdowns: separate the rope at the bottom to hit the lateral head.",
    ],
  },
  {
    id: "ar5",
    name: "Preacher Curl",
    category: "Arms",
    muscle: "Biceps (Peak Contraction)",
    sets: 3,
    reps: "10–12",
    difficulty: "Beginner",
    restSeconds: 60,
    steps: [
      "Sit at the preacher bench, upper arms resting fully on the pad.",
      "Curl the bar or dumbbell toward your shoulders in a strict arc.",
      "Lower until arms are nearly straight — don't lock out aggressively.",
    ],
    formCues: [
      "The preacher pad eliminates cheating — every rep is pure bicep work.",
      "The bottom of the movement provides maximum stretch — control it fully.",
    ],
  },

  // ── Legs ──────────────────────────────────────────────────────────────────
  {
    id: "le1",
    name: "Barbell Back Squat",
    category: "Legs",
    muscle: "Quads, Glutes, Hamstrings",
    sets: 4,
    reps: "6–10",
    difficulty: "Advanced",
    restSeconds: 120,
    steps: [
      "Bar resting on upper traps (high bar) or rear deltoids (low bar), feet shoulder-width.",
      "Break at the hips and knees simultaneously, descending until thighs are parallel or below.",
      "Keep chest tall and knees tracking over toes throughout.",
      "Drive through the full foot to stand, squeezing glutes at lockout.",
    ],
    formCues: [
      "Brace your core like you're about to be punched — this protects your spine.",
      "If knees cave in, strengthen your glutes and stretch your hip flexors.",
    ],
  },
  {
    id: "le2",
    name: "Leg Press",
    category: "Legs",
    muscle: "Quads, Glutes",
    sets: 4,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 90,
    steps: [
      "Sit in the machine, feet shoulder-width on the platform at mid-height.",
      "Release the safety handles and lower the platform until knees reach 90°.",
      "Press back up without locking the knees at full extension.",
    ],
    formCues: [
      "Never let your lower back peel off the pad — reduce the range if needed.",
      "Foot position changes emphasis: high = glutes/hamstrings, low = quads.",
    ],
  },
  {
    id: "le3",
    name: "Romanian Deadlift",
    category: "Legs",
    muscle: "Hamstrings, Glutes, Lower Back",
    sets: 3,
    reps: "10–12",
    difficulty: "Intermediate",
    restSeconds: 90,
    steps: [
      "Stand with barbell at arms' length, feet hip-width, soft knees.",
      "Hinge at the hips, pushing them back as the bar travels down your legs.",
      "Lower until you feel a deep hamstring stretch — typically just past the knee.",
      "Drive hips forward powerfully to return to standing.",
    ],
    formCues: [
      "The bar stays in contact with your legs the whole movement.",
      "Don't confuse with a stiff-leg deadlift — keep the slight knee bend.",
    ],
  },
  {
    id: "le4",
    name: "Leg Curl (Machine)",
    category: "Legs",
    muscle: "Hamstrings",
    sets: 3,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 60,
    steps: [
      "Lie face-down on the machine, pad resting just above your heels.",
      "Curl your heels toward your glutes as far as the machine allows.",
      "Hold the peak contraction for 1 second, then lower fully.",
    ],
    formCues: [
      "Point toes slightly — this recruits more of the outer hamstring.",
      "Don't let your hips rise off the pad during the curl.",
    ],
  },
  {
    id: "le5",
    name: "Leg Extension (Machine)",
    category: "Legs",
    muscle: "Quadriceps",
    sets: 3,
    reps: "12–15",
    difficulty: "Beginner",
    restSeconds: 60,
    steps: [
      "Sit in the machine, pad resting on your lower shins, knees at 90°.",
      "Extend legs fully until knees are locked out.",
      "Squeeze quads hard at the top, then lower with control.",
    ],
    formCues: [
      "Full extension is key — stopping short limits the quad contraction.",
      "Use moderate weight — this is an isolation exercise, not a power movement.",
    ],
  },
  {
    id: "le6",
    name: "Standing Calf Raise",
    category: "Legs",
    muscle: "Gastrocnemius, Soleus",
    sets: 4,
    reps: "15–20",
    difficulty: "Beginner",
    restSeconds: 45,
    steps: [
      "Stand on a step or platform, heels hanging off the edge.",
      "Lower your heels as far as possible to get a full stretch.",
      "Rise onto your toes as high as possible and hold 1 second.",
      "Lower slowly — calves grow from slow, controlled reps.",
    ],
    formCues: [
      "Straight knee = gastrocnemius dominant; bent knee = soleus dominant.",
      "The deep stretch at the bottom is what most people skip — don't.",
    ],
  },

  // ── Core ──────────────────────────────────────────────────────────────────
  {
    id: "co1",
    name: "Cable Crunch",
    category: "Core",
    muscle: "Rectus Abdominis",
    sets: 3,
    reps: "15–20",
    difficulty: "Beginner",
    restSeconds: 60,
    steps: [
      "Kneel in front of a cable, rope attachment at the top.",
      "Hold the rope beside your head and crunch your elbows toward your knees.",
      "Round your back fully — the contraction is at the spine, not the hips.",
      "Return slowly to the start position.",
    ],
    formCues: [
      "This is a spine flexion exercise — the hips stay still throughout.",
      "Add weight progressively — the abs respond to load just like any muscle.",
    ],
  },
  {
    id: "co2",
    name: "Hanging Leg Raise",
    category: "Core",
    muscle: "Lower Abs, Hip Flexors",
    sets: 3,
    reps: "10–15",
    difficulty: "Intermediate",
    restSeconds: 75,
    steps: [
      "Hang from a pull-up bar with a dead hang, no swing.",
      "Raise straight legs to 90° or higher while controlling the movement.",
      "Posterior tilt the pelvis at the top for maximum lower-ab engagement.",
      "Lower under control — don't let momentum carry you.",
    ],
    formCues: [
      "Slow negatives (3–4 seconds down) dramatically increase difficulty.",
      "If straight legs are too hard, bend the knees as a regression.",
    ],
  },
  {
    id: "co3",
    name: "Ab Wheel Rollout",
    category: "Core",
    muscle: "Transverse Abs, Serratus, Lats",
    sets: 3,
    reps: "8–12",
    difficulty: "Intermediate",
    restSeconds: 75,
    steps: [
      "Kneel with the ab wheel in front, hips above knees.",
      "Roll out slowly, extending your body toward the floor.",
      "Keep the core braced — stop before the lower back arches.",
      "Pull the wheel back to start using the core.",
    ],
    formCues: [
      "Go only as far as you can maintain a neutral spine.",
      "Can progress to standing rollouts once you master kneeling.",
    ],
  },
  {
    id: "co4",
    name: "Plank",
    category: "Core",
    muscle: "Entire Core (Isometric)",
    sets: 3,
    reps: "45–90s hold",
    difficulty: "Beginner",
    restSeconds: 45,
    steps: [
      "Forearms on the floor, elbows under shoulders, body in a straight line.",
      "Brace core as if bracing for a punch — breathe steadily.",
      "Push the floor away with forearms to engage the serratus.",
      "Hold for the target duration.",
    ],
    formCues: [
      "Hips level — neither sagging nor piked.",
      "Squeeze glutes as well for maximum full-body tension.",
    ],
  },

  // ── Cardio ────────────────────────────────────────────────────────────────
  {
    id: "ca1",
    name: "Treadmill Intervals",
    category: "Cardio",
    muscle: "Cardiovascular System, Legs",
    sets: 6,
    reps: "30s sprint / 90s walk",
    difficulty: "Intermediate",
    restSeconds: 0,
    steps: [
      "Warm up at a comfortable walk/jog pace for 5 minutes.",
      "Sprint at 80–90% max effort for 30 seconds.",
      "Recover at a slow walk for 90 seconds.",
      "Repeat 6–8 rounds, then cool down for 5 minutes.",
    ],
    formCues: [
      "Don't hold the handrails during sprints — it reduces calorie burn and alters gait.",
      "Land mid-foot, not heel-first, to reduce impact stress.",
    ],
  },
  {
    id: "ca2",
    name: "Rowing Machine",
    category: "Cardio",
    muscle: "Full Body (Legs 60%, Back 30%, Arms 10%)",
    sets: 1,
    reps: "20 min steady",
    difficulty: "Beginner",
    restSeconds: 0,
    steps: [
      "Sit on the rower, strap feet in. Start with legs bent and arms extended.",
      "Drive with the legs first, then lean back slightly, then pull the handle to lower chest.",
      "Reverse: extend arms, lean forward, then bend knees to return.",
      "Maintain a steady 18–22 strokes per minute for endurance.",
    ],
    formCues: [
      "The drive sequence is always Legs → Back → Arms. Don't break this.",
      "80% of the power should come from your legs, not your arms.",
    ],
  },
  {
    id: "ca3",
    name: "Battle Ropes",
    category: "Cardio",
    muscle: "Shoulders, Core, Conditioning",
    sets: 5,
    reps: "20s on / 10s off",
    difficulty: "Intermediate",
    restSeconds: 0,
    steps: [
      "Hold one end of the rope in each hand, slight squat position.",
      "Alternate arms to create wave patterns as fast as possible.",
      "Keep hips low, core tight, and breathe rhythmically.",
      "Rest 10 seconds between 20-second effort rounds.",
    ],
    formCues: [
      "The closer to the anchor you stand, the heavier the rope feels.",
      "Don't neglect the legs — use a slight squat to generate power.",
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
  Chest: "oklch(0.62 0.18 25)",
  Back: "oklch(0.55 0.18 240)",
  Shoulders: "oklch(0.72 0.15 55)",
  Arms: "oklch(0.62 0.2 155)",
  Legs: "oklch(0.55 0.18 310)",
  Core: "oklch(0.55 0.14 185)",
  Cardio: "oklch(0.6 0.15 90)",
};

// ─── Category icons (simple text labels) ─────────────────────────────────────

const CATEGORY_ICONS: Record<Exclude<Category, "All">, string> = {
  Chest: "💪",
  Back: "🏋️",
  Shoulders: "🔱",
  Arms: "💎",
  Legs: "🦵",
  Core: "⚡",
  Cardio: "🔥",
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
  const catIcon = CATEGORY_ICONS[ex.category];

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

        {/* Category icon box */}
        <div
          className="flex-shrink-0 rounded-xl flex items-center justify-center text-2xl"
          style={{
            width: 56,
            height: 56,
            background: `oklch(from ${catColor} l c h / 0.1)`,
            border: `1px solid oklch(from ${catColor} l c h / 0.2)`,
          }}
        >
          {catIcon}
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
    "Chest",
    "Back",
    "Shoulders",
    "Arms",
    "Legs",
    "Core",
    "Cardio",
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
                  GYM
                </h1>
                <h1
                  className="text-2xl font-black tracking-widest leading-none"
                  style={{ color: "oklch(0.72 0.15 55)" }}
                >
                  WORKOUT
                </h1>
                <p
                  className="text-xs mt-1 tracking-wide"
                  style={{ color: "oklch(0.4 0.012 260)" }}
                >
                  Select exercises · Build your session · Start
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
