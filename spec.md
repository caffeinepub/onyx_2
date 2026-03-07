# ONYX

## Current State
ONYX is a full-stack chat + media app with:
- Chat page with rooms (public + secret), messages, profile customization
- Video Feed page (shorts, public/private videos, likes/comments/sharing)
- VS Studio page (channel creation, video uploads, watch analytics)
- Daily News page (rotated daily articles)
- Web Search page
- Workout page (generic exercise tracker with sets/reps/rest timer)
- Status panel (WhatsApp-style status updates)

## Requested Changes (Diff)

### Add
- Calisthenics-only exercise library covering: push-ups (standard, diamond, wide, pike, archer), pull-ups (standard, wide, close, chin-up, L-sit), dips (parallel bar, bench, ring), squats (bodyweight, jump, pistol/single-leg, sumo, wall sit), lunges (forward, reverse, lateral, walking, jumping), core (plank, side plank, hollow body hold, L-sit, dragon flag, ab wheel rollout), handstand (wall handstand, freestanding attempt, handstand push-up), muscle-up (progression steps), and stretch/mobility (shoulder dislocates, hip flexor stretch, thoracic bridge)
- Small looping CSS/SVG animation for each exercise showing the movement pattern (stick figure or silhouette animation)
- "How to do it" modal/expandable panel per exercise with step-by-step instructions and form cues

### Modify
- WorkoutPage: replace generic gym exercises with the calisthenics library above
- Exercise cards: show animated how-to inline (small, looping), with a tap to expand full instructions
- Workout session tracker: remains (sets, reps, rest timer)

### Remove
- Any gym/equipment-based exercises from WorkoutPage

## Implementation Plan
1. Build a `CALISTHENICS_EXERCISES` data array with name, muscle group, description, steps[], form cues[], and an animation key
2. Create `ExerciseAnimation` component: pure CSS keyframe animations (SVG stick figures) per exercise type, looping
3. Update `WorkoutPage.tsx`: replace exercise list with calisthenics data, render exercise cards with inline animation + expand-to-instructions panel
4. Keep rest timer and sets/reps tracker intact
