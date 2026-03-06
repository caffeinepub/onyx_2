import type { OnyxProfile } from "@/lib/onyx-utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AICar {
  id: number;
  trackPos: number;
  speed: number;
  targetSpeed: number;
  lane: number; // -0.4 to 0.4 (fractional offset from center)
  color: string;
  bodyColor: string;
  accentColor: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface GameStateRef {
  speed: number; // km/h 0-300
  maxSpeed: number; // base 280, boosted 370
  trackPos: number; // 0-TRACK_LENGTH
  roadCurve: number; // current road curvature -1 to 1
  targetCurve: number; // steering target
  cameraX: number; // horizontal camera offset
  lap: number; // 1-indexed
  lapStartPos: number; // track position when lap started
  totalDist: number; // total distance traveled
  raceStartTime: number;
  lastFrameTime: number;
  keys: { [k: string]: boolean };
  boost: number; // 0-100 boost bar
  boostActive: boolean;
  aiCars: AICar[];
  particles: Particle[];
  started: boolean;
  finished: boolean;
  gear: number;
  driftFactor: number;
  sceneryOffset: number;
  touchLeft: boolean;
  touchRight: boolean;
  touchAccel: boolean;
  touchBrake: boolean;
  touchBoost: boolean;
}

interface HudState {
  speed: number;
  lap: number;
  position: number;
  boost: number;
  timerMs: number;
  gear: number;
  finished: boolean;
  countdown: number; // 0 = GO!, -1 = racing/done
  finalTime: number;
  finalPosition: number;
}

interface RemotePlayer {
  username: string;
  trackPos: number;
  lap: number;
  speed: number;
  ts: number;
  finished: boolean;
}

interface Props {
  profile: OnyxProfile;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRACK_LENGTH = 6000;
const TOTAL_LAPS = 3;
const ROAD_WIDTH = 2000;
const SEGMENT_COUNT = 200;
// Countdown: 4s total (3,2,1,GO)

// Color palette (literal values for Canvas API)
const COLORS = {
  grass1: "#2d7a2d",
  grass2: "#3a9e3a",
  road: "#4a4a4a",
  roadDark: "#3a3a3a",
  rumbleRed: "#cc2222",
  rumbleWhite: "#eeeeee",
  playerCar: "#1a7fcc",
  playerAccent: "#4fc3f7",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

function lerpCurve(trackPos: number): number {
  // Pre-defined track curve profile — creates varied left/right turns
  const t = (trackPos % TRACK_LENGTH) / TRACK_LENGTH;
  return (
    Math.sin(t * Math.PI * 4) * 0.5 +
    Math.sin(t * Math.PI * 7.3) * 0.3 +
    Math.sin(t * Math.PI * 2.1 + 1) * 0.2
  );
}

function mountainProfile(x: number): number {
  return (
    0.45 +
    Math.sin(x * 0.004) * 0.07 +
    Math.sin(x * 0.009 + 2) * 0.04 +
    Math.sin(x * 0.002 + 5) * 0.06
  );
}

// ─── Canvas Drawing Functions ─────────────────────────────────────────────────

function drawSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cameraX: number,
) {
  const horizonY = h * 0.38;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, "#0e4a8a");
  skyGrad.addColorStop(0.5, "#2271c2");
  skyGrad.addColorStop(0.8, "#6bb8e8");
  skyGrad.addColorStop(1, "#c8e8f8");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, horizonY);

  // Sun
  const sunX = w * 0.75 + Math.sin(cameraX * 0.01) * 30;
  const sunY = h * 0.1;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 90);
  sunGrad.addColorStop(0, "rgba(255,255,220,1)");
  sunGrad.addColorStop(0.15, "rgba(255,240,100,0.9)");
  sunGrad.addColorStop(0.4, "rgba(255,200,50,0.3)");
  sunGrad.addColorStop(1, "rgba(255,200,50,0)");
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - 90, sunY - 90, 180, 180);

  // Clouds
  ctx.save();
  ctx.translate(-cameraX * 0.03, 0);
  const cloudPositions = [
    { x: w * 0.1, y: h * 0.06, r: 28 },
    { x: w * 0.18, y: h * 0.07, r: 40 },
    { x: w * 0.26, y: h * 0.05, r: 22 },
    { x: w * 0.45, y: h * 0.09, r: 32 },
    { x: w * 0.55, y: h * 0.075, r: 45 },
    { x: w * 0.63, y: h * 0.085, r: 28 },
    { x: w * 0.88, y: h * 0.06, r: 35 },
    { x: w * 0.96, y: h * 0.05, r: 25 },
  ];
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (const c of cloudPositions) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.arc(c.x + c.r * 0.8, c.y + c.r * 0.3, c.r * 0.7, 0, Math.PI * 2);
    ctx.arc(c.x - c.r * 0.7, c.y + c.r * 0.35, c.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Mountains in background
  ctx.save();
  ctx.translate(-cameraX * 0.08, 0);
  const mtGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  mtGrad.addColorStop(0, "#5a8bbb");
  mtGrad.addColorStop(1, "#8bbfe0");
  ctx.fillStyle = mtGrad;
  ctx.beginPath();
  ctx.moveTo(-20, horizonY);
  for (let mx = -20; mx <= w + 20; mx += 4) {
    const my = horizonY - mountainProfile(mx + cameraX * 0.08) * horizonY;
    ctx.lineTo(mx, my);
  }
  ctx.lineTo(w + 20, horizonY);
  ctx.closePath();
  ctx.fill();

  // Snow caps
  ctx.fillStyle = "rgba(240,248,255,0.75)";
  ctx.beginPath();
  ctx.moveTo(-20, horizonY);
  for (let mx = -20; mx <= w + 20; mx += 4) {
    const baseH = mountainProfile(mx + cameraX * 0.08) * horizonY;
    const my = horizonY - baseH;
    const snowH = Math.max(0, baseH - horizonY * 0.28);
    ctx.lineTo(mx, my + Math.max(0, baseH - snowH * 1.5 - horizonY * 0.12));
  }
  ctx.lineTo(w + 20, horizonY);
  ctx.closePath();
  ctx.fill();

  // Horizon fade
  const horizGrad = ctx.createLinearGradient(
    0,
    horizonY - 18,
    0,
    horizonY + 10,
  );
  horizGrad.addColorStop(0, "rgba(220,238,220,0)");
  horizGrad.addColorStop(1, COLORS.grass1);
  ctx.fillStyle = horizGrad;
  ctx.fillRect(0, horizonY - 18, w, 28);
}

function drawRoad(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  trackPos: number,
  cameraX: number,
  speed: number,
) {
  const horizonY = h * 0.38;
  const roadBase = h;
  const vanishX = w / 2 - cameraX;
  const segH = (roadBase - horizonY) / SEGMENT_COUNT;

  // Fill grass base
  const grassGrad = ctx.createLinearGradient(0, horizonY, 0, h);
  grassGrad.addColorStop(0, COLORS.grass1);
  grassGrad.addColorStop(0.5, COLORS.grass2);
  grassGrad.addColorStop(1, "#1a5a1a");
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, horizonY, w, h - horizonY);

  // Road strips from horizon to bottom
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const t = i / SEGMENT_COUNT;
    const y1 = horizonY + t * (roadBase - horizonY);

    // Perspective: how far ahead in track this segment is
    const depth = 1 - t;
    const perspScale = 1 / (depth * depth * 400 + 0.01);

    // Road width at this depth
    const rw = ROAD_WIDTH * perspScale;

    // Curve offset based on track position + integrated curvature
    const segTrackOffset = (1 - t) * TRACK_LENGTH * 0.15;
    const segCurve = lerpCurve(trackPos + segTrackOffset);
    const curveOffset = segCurve * perspScale * 800;

    const cx = vanishX + curveOffset;
    const roadLeft = cx - rw / 2;
    const roadRight = cx + rw / 2;

    // Alternating segment color (creates speed illusion)
    const segIndex = Math.floor((trackPos * 0.04 + i * 2) % 2);

    // Grass stripes
    const grassStripeW = rw * 0.6;
    ctx.fillStyle = segIndex === 0 ? COLORS.grass1 : COLORS.grass2;
    ctx.fillRect(roadLeft - grassStripeW, y1, grassStripeW, segH + 1);
    ctx.fillRect(roadRight, y1, grassStripeW, segH + 1);

    // Rumble strips
    const rumbleW = rw * 0.08;
    ctx.fillStyle = segIndex === 0 ? COLORS.rumbleRed : COLORS.rumbleWhite;
    ctx.fillRect(roadLeft - rumbleW, y1, rumbleW, segH + 1);
    ctx.fillRect(roadRight, y1, rumbleW, segH + 1);

    // Road surface
    ctx.fillStyle = segIndex === 0 ? COLORS.road : COLORS.roadDark;
    ctx.fillRect(roadLeft, y1, rw, segH + 1);

    // Center dashes
    if (Math.floor((trackPos * 0.04 + i) % 4) < 2) {
      const dashW = rw * 0.015;
      const dashX = cx - dashW / 2;
      ctx.fillStyle = "rgba(255,255,200,0.9)";
      ctx.fillRect(dashX, y1, dashW, segH + 1);
    }

    // Lane markings
    const laneW = rw * 0.006;
    ctx.fillStyle = "rgba(255,255,200,0.4)";
    ctx.fillRect(cx - rw * 0.3 - laneW / 2, y1, laneW, segH + 1);
    ctx.fillRect(cx + rw * 0.3 - laneW / 2, y1, laneW, segH + 1);
  }

  // Roadside scenery (cacti/agave)
  drawScenery(ctx, w, h, trackPos, cameraX, speed);
}

function drawScenery(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  trackPos: number,
  cameraX: number,
  _speed: number,
) {
  const horizonY = h * 0.38;

  // Generate pseudo-random but consistent scenery positions
  for (let i = 0; i < 12; i++) {
    const basePos = (i * 500 + 250) % TRACK_LENGTH;
    const relPos =
      (((basePos - trackPos) % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
    if (relPos > TRACK_LENGTH * 0.6) continue;

    const t = 1 - relPos / (TRACK_LENGTH * 0.6);
    if (t < 0.02) continue;

    const perspScale = t * t;
    const depth = 1 - t;
    const rw = ROAD_WIDTH * (1 / (depth * depth * 400 + 0.01));

    const segCurve = lerpCurve(trackPos + relPos * 0.3);
    const curveOffset = segCurve * (1 / (depth * depth * 400 + 0.01)) * 800;
    const cx = w / 2 - cameraX + curveOffset;

    const y = horizonY + (1 - t) * (h - horizonY);

    // Left side scenery
    const seed = Math.floor(basePos / 500);
    const isAgave = seed % 3 === 0;
    const isCactus = seed % 3 === 1;

    const lx = cx - rw / 2 - rw * 0.4 * perspScale;
    const rx = cx + rw / 2 + rw * 0.4 * perspScale;
    const sh = 60 * perspScale;

    if (isAgave) {
      drawAgave(ctx, lx, y, sh);
      drawAgave(ctx, rx, y, sh);
    } else if (isCactus) {
      drawCactus(ctx, lx, y, sh);
      drawCactus(ctx, rx, y, sh);
    } else {
      // Bush/shrub
      ctx.fillStyle = "#2a6e1a";
      ctx.beginPath();
      ctx.ellipse(lx, y - sh * 0.3, sh * 0.5, sh * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rx, y - sh * 0.3, sh * 0.5, sh * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawAgave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const s = size * 0.015;
  ctx.save();
  ctx.translate(x, y);
  const leaves = 8;
  for (let i = 0; i < leaves; i++) {
    const angle = (i / leaves) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = i % 2 === 0 ? "#3d8a30" : "#2e6e24";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s * 3, -s * 20, s * 8, -s * 60, s * 2, -s * 80);
    ctx.bezierCurveTo(-s * 2, -s * 60, -s * 3, -s * 20, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawCactus(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const s = size * 0.018;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#3a7a2a";
  // Main trunk
  ctx.fillRect(-s * 4, -size, s * 8, size);
  ctx.beginPath();
  ctx.arc(0, -size, s * 4, Math.PI, 0);
  ctx.fill();
  // Left arm
  ctx.fillRect(-s * 14, -size * 0.7, s * 10, s * 5);
  ctx.beginPath();
  ctx.arc(-s * 9, -size * 0.7, s * 5, Math.PI, 0);
  ctx.fill();
  // Right arm
  ctx.fillRect(s * 4, -size * 0.6, s * 10, s * 5);
  ctx.beginPath();
  ctx.arc(s * 9, -size * 0.6, s * 5, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

function drawAICar(
  ctx: CanvasRenderingContext2D,
  car: AICar,
  w: number,
  h: number,
  trackPos: number,
  cameraX: number,
) {
  const horizonY = h * 0.38;
  const relPos =
    (((car.trackPos - trackPos) % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
  // Only draw cars ahead (within reasonable distance)
  if (relPos > TRACK_LENGTH * 0.25 || relPos < 5) return;

  const t = 1 - relPos / (TRACK_LENGTH * 0.25);
  if (t < 0.03) return;

  const depth = 1 - t;
  const perspScale = 1 / (depth * depth * 400 + 0.01);

  const rw = ROAD_WIDTH * perspScale;
  const segCurve = lerpCurve(trackPos + relPos * 0.3);
  const curveOffset = segCurve * perspScale * 800;
  const cx = w / 2 - cameraX + curveOffset;

  const carX = cx + car.lane * rw;
  const carY = horizonY + (1 - t) * (h - horizonY);

  const carW = 90 * perspScale;
  const carH = 45 * perspScale;

  if (carW < 2) return;

  drawCarSprite(
    ctx,
    carX,
    carY,
    carW,
    carH,
    car.bodyColor,
    car.accentColor,
    car.color,
    false,
  );
}

function drawRemotePlayer(
  ctx: CanvasRenderingContext2D,
  player: RemotePlayer,
  w: number,
  h: number,
  myTrackPos: number,
  cameraX: number,
) {
  const horizonY = h * 0.38;
  const relPos =
    (((player.trackPos - myTrackPos) % TRACK_LENGTH) + TRACK_LENGTH) %
    TRACK_LENGTH;
  if (relPos > TRACK_LENGTH * 0.25 || relPos < 5) return;

  const t = 1 - relPos / (TRACK_LENGTH * 0.25);
  if (t < 0.03) return;

  const depth = 1 - t;
  const perspScale = 1 / (depth * depth * 400 + 0.01);

  const _rw = ROAD_WIDTH * perspScale;
  const segCurve = lerpCurve(myTrackPos + relPos * 0.3);
  const curveOffset = segCurve * perspScale * 800;
  const cx = w / 2 - cameraX + curveOffset;

  const carX = cx; // center lane
  const carY = horizonY + (1 - t) * (h - horizonY);

  const carW = 90 * perspScale;
  const carH = 45 * perspScale;

  if (carW < 2) return;

  // Draw car with purple/violet theme for remote players
  drawCarSprite(
    ctx,
    carX,
    carY,
    carW,
    carH,
    "#6622aa",
    "#bb88ff",
    "#8844cc",
    false,
  );

  // Draw username label above the car
  if (carW > 6) {
    const labelY = carY - carH - 4 * perspScale;
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 2);
    ctx.font = `bold ${Math.max(8, 11 * perspScale)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#cc99ff";
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeText(player.username, carX, labelY);
    ctx.fillText(player.username, carX, labelY);
    ctx.restore();
  }
}

function drawCarSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  carW: number,
  carH: number,
  bodyColor: string,
  accentColor: string,
  roofColor: string,
  isPlayer: boolean,
) {
  ctx.save();
  ctx.translate(x, y - carH / 2);

  const w = carW;
  const h = carH;

  // Shadow
  ctx.save();
  ctx.scale(1, 0.3);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(0, h * 2, w * 0.6, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body lower
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(-w * 0.5, -h * 0.15, w, h * 0.6, h * 0.15);
  ctx.fill();

  // Body upper (cabin)
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.roundRect(-w * 0.28, -h * 0.7, w * 0.56, h * 0.55, h * 0.15);
  ctx.fill();

  // Windshield
  ctx.fillStyle = "rgba(180,220,255,0.7)";
  ctx.beginPath();
  ctx.roundRect(-w * 0.22, -h * 0.65, w * 0.44, h * 0.28, 3);
  ctx.fill();

  // Hood scoop / accent line
  ctx.fillStyle = accentColor;
  ctx.fillRect(-w * 0.1, -h * 0.15, w * 0.2, h * 0.07);

  // Headlights
  ctx.fillStyle = isPlayer ? "#a0d4f8" : "#fff8cc";
  ctx.beginPath();
  ctx.ellipse(-w * 0.35, -h * 0.05, w * 0.08, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.35, -h * 0.05, w * 0.08, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rear lights (red glow)
  if (!isPlayer) {
    ctx.fillStyle = "rgba(255,50,50,0.9)";
    ctx.beginPath();
    ctx.ellipse(-w * 0.35, -h * 0.05, w * 0.07, h * 0.065, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.35, -h * 0.05, w * 0.07, h * 0.065, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wheels
  ctx.fillStyle = "#222";
  const wheelR = h * 0.2;
  const wheelPositions = [
    [-w * 0.38, h * 0.35],
    [w * 0.38, h * 0.35],
    [-w * 0.32, -h * 0.05],
    [w * 0.32, -h * 0.05],
  ];
  for (const [wx, wy] of wheelPositions) {
    ctx.beginPath();
    ctx.arc(wx, wy, wheelR, 0, Math.PI * 2);
    ctx.fill();
    // Rim
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.arc(wx, wy, wheelR * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(wx, wy, wheelR * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Side racing stripe
  ctx.fillStyle = `${accentColor}88`;
  ctx.fillRect(-w * 0.5, -h * 0.15, w * 0.06, h * 0.6);
  ctx.fillRect(w * 0.44, -h * 0.15, w * 0.06, h * 0.6);

  ctx.restore();
}

function drawPlayerCar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  steering: number,
  boost: boolean,
  drift: number,
) {
  const carW = w * 0.18;
  const carH = carW * 0.5;
  const carX = w / 2;
  const carY = h * 0.82;

  // Tilt on steering
  ctx.save();
  ctx.translate(carX, carY);
  ctx.rotate(steering * 0.06 + drift * 0.04);

  drawCarSprite(
    ctx,
    0,
    0,
    carW,
    carH,
    COLORS.playerCar,
    COLORS.playerAccent,
    "#0d5f99",
    true,
  );

  // Exhaust flames when boosting
  if (boost) {
    const flameGrad = ctx.createRadialGradient(
      0,
      carH * 0.4,
      0,
      0,
      carH * 0.4,
      carH * 0.4,
    );
    flameGrad.addColorStop(0, "rgba(255,200,50,0.95)");
    flameGrad.addColorStop(0.4, "rgba(255,100,20,0.7)");
    flameGrad.addColorStop(1, "rgba(255,50,0,0)");
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.ellipse(0, carH * 0.5, carW * 0.15, carH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawSpeedBlur(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  speed: number,
  boost: boolean,
) {
  const intensity = Math.max(0, (speed - 150) / 300);
  if (intensity <= 0) return;

  // Radial vignette blur at edges
  const grad = ctx.createRadialGradient(
    w / 2,
    h / 2,
    h * 0.3,
    w / 2,
    h / 2,
    w * 0.8,
  );
  const color = boost ? "rgba(0,200,255," : "rgba(255,255,255,";
  grad.addColorStop(0, `${color}0)`);
  grad.addColorStop(0.7, `${color}${0.05 * intensity})`);
  grad.addColorStop(1, `${color}${0.15 * intensity})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Speed lines from center
  if (speed > 200) {
    const lineCount = Math.floor(intensity * 25);
    ctx.save();
    ctx.globalAlpha = intensity * 0.15;
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      const startR = h * 0.25;
      const endR = h * 0.5 + Math.random() * h * 0.2;
      const lineColor = boost ? "#00ffff" : "#ffffff";
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = Math.random() * 2 + 0.5;
      ctx.beginPath();
      ctx.moveTo(
        w / 2 + Math.cos(angle) * startR,
        h / 2 + Math.sin(angle) * startR,
      );
      ctx.lineTo(
        w / 2 + Math.cos(angle) * endR,
        h / 2 + Math.sin(angle) * endR,
      );
      ctx.stroke();
    }
    ctx.restore();
  }
}

function spawnExhaustParticles(state: GameStateRef, w: number, h: number) {
  if (state.speed < 30) return;
  const carX = w / 2;
  const carY = h * 0.85;
  const speed = state.speed;
  for (let i = 0; i < (state.boostActive ? 4 : 2); i++) {
    state.particles.push({
      x: carX + (Math.random() - 0.5) * 20,
      y: carY,
      vx: (Math.random() - 0.5) * 1.5,
      vy: Math.random() * 2 + 1,
      life: 1,
      maxLife: 1,
      size: state.boostActive ? 8 : 4,
      color: state.boostActive
        ? `hsl(${Math.random() * 40 + 10}, 100%, ${50 + Math.random() * 30}%)`
        : `hsl(0,0%,${60 + Math.random() * 30}%)`,
    });
    void speed;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ForzaRacingPage({ profile }: Props) {
  const { actor } = useActor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  // Multiplayer state
  const remotePlayersRef = useRef<Map<string, RemotePlayer>>(new Map());
  const [remotePlayersList, setRemotePlayersList] = useState<RemotePlayer[]>(
    [],
  );
  const stateRef = useRef<GameStateRef>({
    speed: 0,
    maxSpeed: 280,
    trackPos: 0,
    roadCurve: 0,
    targetCurve: 0,
    cameraX: 0,
    lap: 1,
    lapStartPos: 0,
    totalDist: 0,
    raceStartTime: 0,
    lastFrameTime: 0,
    keys: {},
    boost: 100,
    boostActive: false,
    aiCars: [
      {
        id: 1,
        trackPos: 200,
        speed: 220,
        targetSpeed: 225,
        lane: -0.2,
        color: "#993322",
        bodyColor: "#cc3322",
        accentColor: "#ff6644",
      },
      {
        id: 2,
        trackPos: 400,
        speed: 235,
        targetSpeed: 230,
        lane: 0.2,
        color: "#997700",
        bodyColor: "#ddaa00",
        accentColor: "#ffdd44",
      },
      {
        id: 3,
        trackPos: 100,
        speed: 210,
        targetSpeed: 215,
        lane: 0.0,
        color: "#aaaaaa",
        bodyColor: "#dddddd",
        accentColor: "#ffffff",
      },
    ],
    particles: [],
    started: false,
    finished: false,
    gear: 1,
    driftFactor: 0,
    sceneryOffset: 0,
    touchLeft: false,
    touchRight: false,
    touchAccel: false,
    touchBrake: false,
    touchBoost: false,
  });

  const countdownRef = useRef<number>(3); // 3,2,1,0=GO!,-1=racing
  const countdownStartRef = useRef<number>(0);
  const raceStartedRef = useRef<boolean>(false);

  const [hudState, setHudState] = useState<HudState>({
    speed: 0,
    lap: 1,
    position: 1,
    boost: 100,
    timerMs: 0,
    gear: 1,
    finished: false,
    countdown: 3,
    finalTime: 0,
    finalPosition: 1,
  });

  const lastHudUpdate = useRef<number>(0);

  const startRace = useCallback(() => {
    const s = stateRef.current;
    s.speed = 0;
    s.trackPos = 0;
    s.roadCurve = 0;
    s.targetCurve = 0;
    s.cameraX = 0;
    s.lap = 1;
    s.lapStartPos = 0;
    s.totalDist = 0;
    s.boost = 100;
    s.boostActive = false;
    s.finished = false;
    s.started = false;
    s.gear = 1;
    s.driftFactor = 0;
    s.particles = [];
    s.aiCars = [
      {
        id: 1,
        trackPos: 200,
        speed: 220,
        targetSpeed: 225,
        lane: -0.2,
        color: "#993322",
        bodyColor: "#cc3322",
        accentColor: "#ff6644",
      },
      {
        id: 2,
        trackPos: 400,
        speed: 235,
        targetSpeed: 230,
        lane: 0.2,
        color: "#997700",
        bodyColor: "#ddaa00",
        accentColor: "#ffdd44",
      },
      {
        id: 3,
        trackPos: 100,
        speed: 210,
        targetSpeed: 215,
        lane: 0.0,
        color: "#aaaaaa",
        bodyColor: "#dddddd",
        accentColor: "#ffffff",
      },
    ];
    countdownRef.current = 3;
    countdownStartRef.current = performance.now();
    raceStartedRef.current = false;

    setHudState({
      speed: 0,
      lap: 1,
      position: 1,
      boost: 100,
      timerMs: 0,
      gear: 1,
      finished: false,
      countdown: 3,
      finalTime: 0,
      finalPosition: 1,
    });
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = stateRef.current;
    const dt = Math.min((timestamp - state.lastFrameTime) / 1000, 0.05);
    state.lastFrameTime = timestamp;

    const w = canvas.width;
    const h = canvas.height;

    // ── Countdown logic ──
    const now = performance.now();
    const elapsed = now - countdownStartRef.current;
    let countdownVal = countdownRef.current;

    if (!raceStartedRef.current) {
      if (elapsed < 1000) countdownVal = 3;
      else if (elapsed < 2000) countdownVal = 2;
      else if (elapsed < 3000) countdownVal = 1;
      else if (elapsed < 4000)
        countdownVal = 0; // GO!
      else {
        countdownVal = -1;
        raceStartedRef.current = true;
        state.started = true;
        state.raceStartTime = timestamp;
      }
      countdownRef.current = countdownVal;
    }

    // ── Physics ──
    const canControl = raceStartedRef.current && !state.finished;
    const left =
      state.keys.ArrowLeft || state.keys.a || state.keys.A || state.touchLeft;
    const right =
      state.keys.ArrowRight || state.keys.d || state.keys.D || state.touchRight;
    const accel =
      state.keys.ArrowUp || state.keys.w || state.keys.W || state.touchAccel;
    const brake =
      state.keys.ArrowDown || state.keys.s || state.keys.S || state.touchBrake;
    const boostKey = state.keys.Shift || state.touchBoost;

    if (canControl) {
      // Boost
      state.boostActive = boostKey && state.boost > 0;
      if (state.boostActive) {
        state.boost = Math.max(0, state.boost - dt * 40);
        state.maxSpeed = 380;
      } else {
        state.maxSpeed = 280;
        if (!boostKey) state.boost = Math.min(100, state.boost + dt * 15);
      }

      // Acceleration
      const accelForce = state.boostActive ? 120 : 80;
      const drag = state.speed * 0.018;
      if (accel) {
        state.speed = Math.min(state.maxSpeed, state.speed + accelForce * dt);
      } else if (brake) {
        state.speed = Math.max(0, state.speed - 180 * dt);
      } else {
        state.speed = Math.max(0, state.speed - (drag + 25) * dt);
      }

      // Gear simulation
      const gearRanges = [0, 40, 80, 130, 180, 230, 280, 380];
      for (let g = 0; g < gearRanges.length - 1; g++) {
        if (state.speed >= gearRanges[g] && state.speed < gearRanges[g + 1]) {
          state.gear = g + 1;
          break;
        }
      }

      // Steering
      const steerStrength = 1.2;
      if (left) {
        state.targetCurve = Math.max(
          -1,
          state.targetCurve - steerStrength * dt * 3,
        );
      } else if (right) {
        state.targetCurve = Math.min(
          1,
          state.targetCurve + steerStrength * dt * 3,
        );
      } else {
        state.targetCurve *= 0.92;
      }

      // Drift at high speed + sharp turn
      const speedFactor = state.speed / 280;
      const turnSharpness = Math.abs(state.targetCurve);
      if (speedFactor > 0.65 && turnSharpness > 0.5) {
        state.driftFactor = Math.min(1, state.driftFactor + dt * 2);
        state.speed *= 1 - dt * 0.08 * state.driftFactor;
      } else {
        state.driftFactor = Math.max(0, state.driftFactor - dt * 3);
      }
    } else if (!raceStartedRef.current) {
      state.speed = 0;
    }

    // Update road curvature
    state.roadCurve += (state.targetCurve - state.roadCurve) * dt * 8;

    // Camera drift
    state.cameraX += (state.targetCurve * 120 - state.cameraX) * dt * 6;

    // Track position update
    const metersPerSecond = state.speed / 3.6;
    state.trackPos = (state.trackPos + metersPerSecond * dt * 8) % TRACK_LENGTH;
    state.totalDist += metersPerSecond * dt * 8;

    // Lap tracking
    if (canControl) {
      const distThisLap = state.totalDist - state.lapStartPos;
      if (distThisLap >= TRACK_LENGTH) {
        state.lap++;
        state.lapStartPos = state.totalDist;
        if (state.lap > TOTAL_LAPS) {
          state.finished = true;
        }
      }
    }

    // AI updates
    for (const car of state.aiCars) {
      car.speed += (car.targetSpeed - car.speed) * dt * 0.5;
      if (Math.random() < 0.005) {
        car.targetSpeed = 200 + Math.random() * 60;
      }
      car.trackPos = (car.trackPos + (car.speed / 3.6) * dt * 8) % TRACK_LENGTH;
      // Gentle lane weaving
      car.lane +=
        (Math.sin(car.trackPos * 0.002 + car.id) * 0.3 - car.lane) * dt * 0.5;
    }

    // Particles
    if (state.speed > 20 && canControl) {
      spawnExhaustParticles(state, w, h);
    }
    state.particles = state.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 2.5;
      return p.life > 0;
    });

    // Race position calculation
    const playerTotalDist = state.totalDist;
    const aiDistances = state.aiCars.map(
      (c) => c.trackPos + (c.trackPos < state.trackPos ? TRACK_LENGTH : 0),
    );
    const ahead = aiDistances.filter(
      (d) => d > playerTotalDist % TRACK_LENGTH,
    ).length;
    const racePosition = ahead + 1;

    // ── Render ──
    ctx.clearRect(0, 0, w, h);
    drawSky(ctx, w, h, state.cameraX);
    drawRoad(ctx, w, h, state.trackPos, state.cameraX, state.speed);
    drawParticles(ctx, state.particles);

    // Draw AI cars sorted by distance (farthest first)
    const sortedAI = [...state.aiCars].sort((a, b) => {
      const da =
        (((a.trackPos - state.trackPos) % TRACK_LENGTH) + TRACK_LENGTH) %
        TRACK_LENGTH;
      const db =
        (((b.trackPos - state.trackPos) % TRACK_LENGTH) + TRACK_LENGTH) %
        TRACK_LENGTH;
      return db - da;
    });
    for (const car of sortedAI) {
      drawAICar(ctx, car, w, h, state.trackPos, state.cameraX);
    }

    // Draw remote players (sorted farthest first)
    const remotePlayers = Array.from(remotePlayersRef.current.values());
    const sortedRemote = [...remotePlayers].sort((a, b) => {
      const da =
        (((a.trackPos - state.trackPos) % TRACK_LENGTH) + TRACK_LENGTH) %
        TRACK_LENGTH;
      const db =
        (((b.trackPos - state.trackPos) % TRACK_LENGTH) + TRACK_LENGTH) %
        TRACK_LENGTH;
      return db - da;
    });
    for (const rp of sortedRemote) {
      drawRemotePlayer(ctx, rp, w, h, state.trackPos, state.cameraX);
    }

    drawPlayerCar(
      ctx,
      w,
      h,
      state.targetCurve,
      state.boostActive,
      state.driftFactor,
    );
    drawSpeedBlur(ctx, w, h, state.speed, state.boostActive);

    // ── HUD update (throttled) ──
    if (timestamp - lastHudUpdate.current > 50 || state.finished) {
      lastHudUpdate.current = timestamp;
      const timerMs = state.started ? timestamp - state.raceStartTime : 0;
      setHudState((prev) => ({
        speed: Math.round(state.speed),
        lap: Math.min(state.lap, TOTAL_LAPS),
        position: racePosition,
        boost: Math.round(state.boost),
        timerMs: state.finished ? prev.timerMs : timerMs,
        gear: state.gear,
        finished: state.finished,
        countdown: countdownRef.current,
        finalTime: state.finished ? timerMs : prev.finalTime,
        finalPosition: state.finished ? racePosition : prev.finalPosition,
      }));
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Canvas resize
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, []);

  // Keyboard events
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = true;
      // Prevent arrow key scrolling
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = false;
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("keyup", onKeyUp, { capture: true });
    };
  }, []);

  // Init game loop
  useEffect(() => {
    resizeCanvas();
    startRace();
    stateRef.current.lastFrameTime = performance.now();
    animFrameRef.current = requestAnimationFrame(gameLoop);

    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);

    // Multiplayer: broadcast our position every 500ms
    const broadcastInterval = setInterval(async () => {
      if (!actor) return;
      if (!stateRef.current.started || stateRef.current.finished) return;
      const payload = JSON.stringify({
        username: profile.username,
        trackPos: stateRef.current.trackPos,
        lap: stateRef.current.lap,
        speed: Math.round(stateRef.current.speed),
        ts: Date.now(),
        finished: stateRef.current.finished,
      });
      try {
        await actor.postMessage("__race__", payload);
      } catch {
        // ignore network errors
      }
    }, 500);

    // Multiplayer: poll for other players every 600ms
    const pollInterval = setInterval(async () => {
      if (!actor) return;
      try {
        const msgs = await actor.getAllMessages();
        const now = Date.now();
        const raceMap = new Map<string, RemotePlayer>();
        for (const msg of msgs) {
          if (msg.alias !== "__race__") continue;
          try {
            const data = JSON.parse(msg.content) as RemotePlayer;
            if (data.username === profile.username) continue; // skip self
            if (now - data.ts > 10000) continue; // stale
            const existing = raceMap.get(data.username);
            if (!existing || data.ts > existing.ts) {
              raceMap.set(data.username, data);
            }
          } catch {
            // ignore parse errors
          }
        }
        remotePlayersRef.current = raceMap;
        setRemotePlayersList(Array.from(raceMap.values()));
      } catch {
        // ignore
      }
    }, 600);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", onResize);
      clearInterval(broadcastInterval);
      clearInterval(pollInterval);
    };
  }, [gameLoop, resizeCanvas, startRace, profile.username, actor]);

  const ordinal = (n: number) => {
    if (n === 1) return "1ST";
    if (n === 2) return "2ND";
    if (n === 3) return "3RD";
    return `${n}TH`;
  };

  // Touch controls
  const setTouch = (key: keyof GameStateRef, val: boolean) => {
    (stateRef.current[key] as boolean) = val;
  };

  return (
    <div
      ref={containerRef}
      data-ocid="race.page"
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: "#000", touchAction: "none" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* ── HUD Overlay ── */}

      {/* Top Left: Lap + Position */}
      <div
        className="absolute top-3 left-3 flex flex-col gap-1"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          pointerEvents: "none",
        }}
      >
        <div
          className="px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(0,0,0,0.65)",
            border: "1px solid rgba(232,184,75,0.4)",
          }}
        >
          <div className="text-xs tracking-widest" style={{ color: "#e8b84b" }}>
            LAP
          </div>
          <div
            className="text-2xl font-bold leading-none"
            style={{ color: "#ffffff" }}
          >
            {hudState.lap}
            <span className="text-sm" style={{ color: "#888" }}>
              /{TOTAL_LAPS}
            </span>
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(0,0,0,0.65)",
            border: "1px solid rgba(232,184,75,0.4)",
          }}
        >
          <div className="text-xs tracking-widest" style={{ color: "#e8b84b" }}>
            POS
          </div>
          <div
            className="text-2xl font-bold leading-none"
            style={{ color: "#ffffff" }}
          >
            {ordinal(hudState.position)}
          </div>
        </div>
      </div>

      {/* Top Right: Timer */}
      <div
        className="absolute top-3 right-3"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          pointerEvents: "none",
        }}
      >
        <div
          className="px-3 py-2 rounded-lg"
          style={{
            background: "rgba(0,0,0,0.65)",
            border: "1px solid rgba(232,184,75,0.4)",
          }}
        >
          <div
            className="text-xs tracking-widest mb-0.5"
            style={{ color: "#e8b84b" }}
          >
            RACE TIME
          </div>
          <div
            className="text-xl font-bold tabular-nums"
            style={{ color: "#ffffff" }}
          >
            {formatTime(hudState.timerMs)}
          </div>
        </div>
      </div>

      {/* Top Center-Right: Multiplayer Leaderboard */}
      <MultiplayerLeaderboard
        myUsername={profile.username}
        myLap={hudState.lap}
        mySpeed={hudState.speed}
        remotePlayers={remotePlayersList}
      />

      {/* Bottom Right: Speedometer + Gear + Boost */}
      <div
        className="absolute bottom-20 right-3 flex flex-col items-end gap-2"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          pointerEvents: "none",
        }}
      >
        {/* Boost bar */}
        <div
          className="px-3 py-1.5 rounded-lg w-32"
          style={{
            background: "rgba(0,0,0,0.65)",
            border: "1px solid rgba(0,200,255,0.4)",
          }}
        >
          <div
            className="text-[10px] tracking-widest mb-1"
            style={{ color: "#00c8ff" }}
          >
            BOOST
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 6, background: "rgba(255,255,255,0.15)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${hudState.boost}%`,
                background:
                  hudState.boost > 30
                    ? "linear-gradient(90deg, #00b4ff, #00ffee)"
                    : "linear-gradient(90deg, #ff4400, #ff8800)",
              }}
            />
          </div>
        </div>

        {/* Speedometer */}
        <div
          className="px-4 py-3 rounded-xl text-center"
          style={{
            background: "rgba(0,0,0,0.75)",
            border: "1px solid rgba(232,184,75,0.5)",
            minWidth: 120,
          }}
        >
          <div
            className="text-4xl font-black leading-none tabular-nums"
            style={{ color: "#ffffff" }}
          >
            {hudState.speed}
          </div>
          <div
            className="text-xs tracking-widest mt-0.5"
            style={{ color: "#e8b84b" }}
          >
            KM/H
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="text-xs" style={{ color: "#666" }}>
              GEAR
            </div>
            <div
              className="text-lg font-black w-8 h-8 rounded flex items-center justify-center"
              style={{ background: "rgba(232,184,75,0.2)", color: "#e8b84b" }}
            >
              {hudState.gear}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Left: Mini-map */}
      <div
        className="absolute bottom-20 left-3"
        style={{ pointerEvents: "none" }}
      >
        <MiniMap
          hudState={hudState}
          aiCars={stateRef.current.aiCars}
          trackPos={stateRef.current.trackPos}
        />
      </div>

      {/* Controls hint */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          pointerEvents: "none",
        }}
      >
        <div
          className="px-3 py-1.5 rounded-lg text-[10px] tracking-widest"
          style={{ background: "rgba(0,0,0,0.5)", color: "#666" }}
        >
          ↑ ACCEL &nbsp; ↓ BRAKE &nbsp; ←→ STEER &nbsp; SHIFT BOOST
        </div>
      </div>

      {/* ── Countdown overlay ── */}
      {hudState.countdown >= 0 && !hudState.finished && (
        <CountdownOverlay countdown={hudState.countdown} />
      )}

      {/* ── Finish overlay ── */}
      {hudState.finished && (
        <FinishOverlay
          time={hudState.finalTime}
          position={hudState.finalPosition}
          onRestart={startRace}
        />
      )}

      {/* ── Touch Controls ── */}
      <TouchControls onTouch={setTouch} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniMap({
  hudState,
  aiCars,
  trackPos,
}: {
  hudState: HudState;
  aiCars: AICar[];
  trackPos: number;
}) {
  const size = 90;
  const cx = size / 2;
  const cy = size / 2;
  const rx = size * 0.42;
  const ry = size * 0.28;

  const trackAngle = (pos: number) =>
    (pos / TRACK_LENGTH) * Math.PI * 2 - Math.PI / 2;

  const playerAngle = trackAngle(trackPos);
  const px = cx + Math.cos(playerAngle) * rx;
  const py = cy + Math.sin(playerAngle) * ry;

  return (
    <svg
      width={size}
      height={size}
      role="img"
      aria-label="Race mini-map"
      style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}
    >
      {/* Background */}
      <rect
        x="0"
        y="0"
        width={size}
        height={size}
        rx="8"
        fill="rgba(0,0,0,0.7)"
        stroke="rgba(232,184,75,0.4)"
        strokeWidth="1"
      />
      {/* Track oval */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="5"
      />
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke="rgba(100,100,100,0.5)"
        strokeWidth="3"
      />
      {/* AI cars */}
      {aiCars.map((car) => {
        const angle = trackAngle(car.trackPos);
        const ax = cx + Math.cos(angle) * rx;
        const ay = cy + Math.sin(angle) * ry;
        return (
          <circle
            key={car.id}
            cx={ax}
            cy={ay}
            r="3.5"
            fill={car.bodyColor}
            opacity="0.9"
          />
        );
      })}
      {/* Player */}
      <circle
        cx={px}
        cy={py}
        r="4.5"
        fill="#1a7fcc"
        stroke="#4fc3f7"
        strokeWidth="1.5"
      />
      {/* Lap indicator */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fill="rgba(232,184,75,0.8)"
        fontSize="9"
        fontFamily="monospace"
      >
        L{hudState.lap}
      </text>
    </svg>
  );
}

function CountdownOverlay({ countdown }: { countdown: number }) {
  const label = countdown === 0 ? "GO!" : countdown.toString();
  const color = countdown === 0 ? "#00ff88" : "#ffffff";

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ pointerEvents: "none" }}
    >
      <div
        key={label}
        className="text-center"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          animation: "countdown-pop 0.3s ease-out",
        }}
      >
        <div
          className="font-black"
          style={{
            fontSize: "clamp(80px, 15vw, 160px)",
            color,
            textShadow: `0 0 40px ${color}, 0 0 80px ${color}66`,
            lineHeight: 1,
          }}
        >
          {label}
        </div>
        {countdown > 0 && (
          <div
            className="text-sm tracking-widest mt-2"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            GET READY
          </div>
        )}
      </div>
    </div>
  );
}

function FinishOverlay({
  time,
  position,
  onRestart,
}: {
  time: number;
  position: number;
  onRestart: () => void;
}) {
  const posLabels = ["", "1ST PLACE", "2ND PLACE", "3RD PLACE", "4TH PLACE"];
  const posColors = ["", "#FFD700", "#C0C0C0", "#CD7F32", "#aaaaaa"];

  return (
    <div
      data-ocid="race.modal"
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="text-center px-10 py-8 rounded-2xl max-w-sm w-full mx-4"
        style={{
          background: "rgba(10,10,20,0.95)",
          border: "2px solid rgba(232,184,75,0.6)",
          fontFamily: "'JetBrains Mono', monospace",
          boxShadow: "0 0 60px rgba(232,184,75,0.2)",
        }}
      >
        {/* Checkered flag icon */}
        <div className="text-5xl mb-3">🏁</div>

        <div
          className="text-xs tracking-[0.3em] mb-1"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          RACE COMPLETE
        </div>

        <div
          className="text-3xl font-black mb-4"
          style={{ color: posColors[Math.min(position, 4)] }}
        >
          {posLabels[Math.min(position, 4)]}
        </div>

        <div
          className="mb-1 text-xs tracking-widest"
          style={{ color: "rgba(232,184,75,0.7)" }}
        >
          FINAL TIME
        </div>
        <div className="text-2xl font-bold mb-6" style={{ color: "#ffffff" }}>
          {formatTime(time)}
        </div>

        {/* Trophy stars for 1st */}
        {position === 1 && (
          <div className="flex justify-center gap-1 mb-4 text-2xl">
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
          </div>
        )}

        <button
          data-ocid="race.primary_button"
          type="button"
          onClick={onRestart}
          className="w-full py-3 rounded-xl font-bold text-sm tracking-widest transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #e8b84b, #c49030)",
            color: "#000",
            border: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(135deg, #f0c85b, #d4a040)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(135deg, #e8b84b, #c49030)";
          }}
        >
          RACE AGAIN
        </button>
      </div>
    </div>
  );
}

function TouchControls({
  onTouch,
}: { onTouch: (key: keyof GameStateRef, val: boolean) => void }) {
  return (
    <div
      className="absolute bottom-20 left-0 right-0 flex justify-between px-4 pointer-events-none md:hidden"
      style={{ pointerEvents: "none" }}
    >
      {/* Left: Steer */}
      <div className="flex gap-2 pointer-events-auto">
        <TouchBtn
          label="◀"
          onStart={() => onTouch("touchLeft", true)}
          onEnd={() => onTouch("touchLeft", false)}
        />
        <TouchBtn
          label="▶"
          onStart={() => onTouch("touchRight", true)}
          onEnd={() => onTouch("touchRight", false)}
        />
      </div>
      {/* Right: Accel/Brake/Boost */}
      <div className="flex flex-col gap-2 items-end pointer-events-auto">
        <TouchBtn
          label="⚡"
          onStart={() => onTouch("touchBoost", true)}
          onEnd={() => onTouch("touchBoost", false)}
          color="#00c8ff"
        />
        <div className="flex gap-2">
          <TouchBtn
            label="▼"
            onStart={() => onTouch("touchBrake", true)}
            onEnd={() => onTouch("touchBrake", false)}
            color="#ff4444"
          />
          <TouchBtn
            label="▲"
            onStart={() => onTouch("touchAccel", true)}
            onEnd={() => onTouch("touchAccel", false)}
            color="#44ff88"
          />
        </div>
      </div>
    </div>
  );
}

function TouchBtn({
  label,
  onStart,
  onEnd,
  color = "rgba(255,255,255,0.8)",
}: {
  label: string;
  onStart: () => void;
  onEnd: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onTouchStart={(e) => {
        e.preventDefault();
        onStart();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onEnd();
      }}
      onMouseDown={onStart}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold active:scale-95 transition-transform"
      style={{
        background: "rgba(0,0,0,0.6)",
        border: `1px solid ${color}44`,
        color,
        pointerEvents: "auto",
        touchAction: "none",
      }}
    >
      {label}
    </button>
  );
}

// ─── Multiplayer Leaderboard ──────────────────────────────────────────────────

interface LeaderboardEntry {
  username: string;
  lap: number;
  speed: number;
  isMe: boolean;
}

function MultiplayerLeaderboard({
  myUsername,
  myLap,
  mySpeed,
  remotePlayers,
}: {
  myUsername: string;
  myLap: number;
  mySpeed: number;
  remotePlayers: RemotePlayer[];
}) {
  const entries: LeaderboardEntry[] = [
    { username: myUsername, lap: myLap, speed: mySpeed, isMe: true },
    ...remotePlayers.map((p) => ({
      username: p.username,
      lap: p.lap,
      speed: p.speed,
      isMe: false,
    })),
  ].sort((a, b) => {
    if (b.lap !== a.lap) return b.lap - a.lap;
    return b.speed - a.speed;
  });

  const visible = entries.slice(0, 4);

  return (
    <div
      className="absolute"
      style={{
        top: 12,
        right: 140,
        fontFamily: "'JetBrains Mono', monospace",
        pointerEvents: "none",
        minWidth: 160,
      }}
    >
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "rgba(0,0,0,0.65)",
          border: "1px solid rgba(136,68,204,0.5)",
        }}
      >
        <div
          className="px-3 py-1 text-[10px] tracking-widest font-bold flex items-center gap-1"
          style={{
            color: "#bb88ff",
            borderBottom: "1px solid rgba(136,68,204,0.3)",
          }}
        >
          <span>👥</span> PLAYERS {entries.length > 1 && `(${entries.length})`}
        </div>
        {visible.map((entry, idx) => (
          <div
            key={entry.username}
            className="flex items-center gap-2 px-3 py-1.5"
            style={{
              background: entry.isMe
                ? "rgba(232,184,75,0.08)"
                : idx % 2 === 0
                  ? "transparent"
                  : "rgba(255,255,255,0.02)",
              borderBottom:
                idx < visible.length - 1
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "none",
            }}
          >
            <span
              className="text-[9px] font-bold w-4 text-center"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {idx + 1}
            </span>
            <span
              className="flex-1 text-[10px] font-medium truncate"
              style={{
                color: entry.isMe ? "#e8b84b" : "#cc99ff",
                maxWidth: 80,
              }}
            >
              {entry.isMe ? `★ ${entry.username}` : entry.username}
            </span>
            <span
              className="text-[9px] tabular-nums"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              L{entry.lap}
            </span>
            <span
              className="text-[9px] tabular-nums"
              style={{
                color: "rgba(255,255,255,0.35)",
                minWidth: 28,
                textAlign: "right",
              }}
            >
              {entry.speed}
            </span>
          </div>
        ))}
        {entries.length === 1 && (
          <div
            className="px-3 py-2 text-[10px] text-center"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            waiting for racers...
          </div>
        )}
      </div>
    </div>
  );
}
