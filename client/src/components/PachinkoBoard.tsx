import { useEffect, useRef } from "react";
import Matter from "matter-js";
import { ActiveBall } from "@/hooks/use-pachinko";

const W = 500;
const H = 300;
const BALL_R = 5;
const PEG_R = 4;
const CHUCKER_COUNT = 5;
const CHUCKER_W = W / CHUCKER_COUNT;
const SLOT_INDICES = new Set([1, 3]);
const DIVIDER_H = 36;
const FLOOR_Y = H - 4;

// ── Proper staggered pachinko peg layout ──────────────────────────────────
// Even rows: 8 pegs  Odd rows: 7 pegs (offset by half-step)
// Total: 3 × 8 + 2 × 7 = 38 pegs  (~2/3 of previous ~57)
function makePegBodies(): Matter.Body[] {
  const ROWS = 5;
  const EVEN_COUNT = 8;
  const PAD_X = 26;
  const START_Y = 22;
  const END_Y = H - DIVIDER_H - 22;
  const step = (W - PAD_X * 2) / (EVEN_COUNT - 1);
  const rowStep = (END_Y - START_Y) / (ROWS - 1);

  const bodies: Matter.Body[] = [];
  for (let r = 0; r < ROWS; r++) {
    const isEven = r % 2 === 0;
    const count = isEven ? EVEN_COUNT : EVEN_COUNT - 1;
    const xStart = isEven ? PAD_X : PAD_X + step / 2;
    const y = START_Y + r * rowStep;
    for (let c = 0; c < count; c++) {
      bodies.push(
        Matter.Bodies.circle(xStart + c * step, y, PEG_R, {
          isStatic: true,
          label: "peg",
          restitution: 0.65,
          friction: 0.01,
          frictionAir: 0,
          collisionFilter: { category: 0x0001, mask: 0x0002 },
        })
      );
    }
  }
  return bodies;
}

function makeStaticBodies(): Matter.Body[] {
  const half = 10;
  const left  = Matter.Bodies.rectangle(-half,      H / 2,          half * 2, H * 2, { isStatic: true, label: "wall" });
  const right = Matter.Bodies.rectangle(W + half,   H / 2,          half * 2, H * 2, { isStatic: true, label: "wall" });
  const floor = Matter.Bodies.rectangle(W / 2,      FLOOR_Y + half, W,        half * 2, { isStatic: true, label: "floor" });
  const dividers: Matter.Body[] = [];
  for (let i = 1; i < CHUCKER_COUNT; i++) {
    dividers.push(
      Matter.Bodies.rectangle(i * CHUCKER_W, H - DIVIDER_H / 2, 4, DIVIDER_H, {
        isStatic: true, label: "divider",
        collisionFilter: { category: 0x0001, mask: 0x0002 },
      })
    );
  }
  return [left, right, floor, ...dividers, ...makePegBodies()];
}

interface Props {
  activeBalls: ActiveBall[];
  onBallLanded: (id: string) => void;
}

export function PachinkoBoard({ activeBalls, onBallLanded }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const engineRef   = useRef<Matter.Engine | null>(null);
  const ballMapRef  = useRef<Map<string, { body: Matter.Body; isSlot: boolean; landed: boolean }>>(new Map());
  const rafRef      = useRef<number>(0);
  const onLandedRef = useRef(onBallLanded);
  onLandedRef.current = onBallLanded;

  // ── Effect state (no re-render needed) ────────────────────────────────────
  // bodyId → flash intensity 0..1  (decays each frame)
  const pegFlashRef      = useRef<Map<number, number>>(new Map());
  // ballId → last N positions for trail
  const ballTrailsRef    = useRef<Map<string, { x: number; y: number }[]>>(new Map());
  // chucker index → flash intensity 0..1
  const chuckerFlashRef  = useRef<Float32Array>(new Float32Array(CHUCKER_COUNT));

  // ── One-time physics + render setup ───────────────────────────────────────
  useEffect(() => {
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.0 } });
    engineRef.current = engine;
    Matter.Composite.add(engine.world, makeStaticBodies());

    // Peg hit detection → flash
    Matter.Events.on(engine, "collisionStart", (event) => {
      for (const { bodyA, bodyB } of event.pairs) {
        const peg = bodyA.label === "peg" ? bodyA : bodyB.label === "peg" ? bodyB : null;
        if (peg) pegFlashRef.current.set(peg.id, 1.0);
      }
    });

    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    let lastTime = 0;
    function loop(time: number) {
      rafRef.current = requestAnimationFrame(loop);
      const raw   = Math.min(time - lastTime, 50);
      lastTime    = time;
      const steps = Math.ceil(raw / 16.667);
      for (let s = 0; s < steps; s++) Matter.Engine.update(engine, raw / steps);

      ctx.clearRect(0, 0, W, H);

      // ── Background scan-line shimmer ──────────────────────────────────────
      const scanX = ((time * 0.04) % (W + 60)) - 30;
      const scanGrad = ctx.createLinearGradient(scanX - 30, 0, scanX + 30, 0);
      scanGrad.addColorStop(0,   "rgba(212,175,55,0)");
      scanGrad.addColorStop(0.5, "rgba(212,175,55,0.04)");
      scanGrad.addColorStop(1,   "rgba(212,175,55,0)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, 0, W, H);

      const bodies = Matter.Composite.allBodies(engine.world);

      // ── Peg flash decay & draw ────────────────────────────────────────────
      for (const b of bodies) {
        if (b.label !== "peg") continue;
        const flash = pegFlashRef.current.get(b.id) ?? 0;
        // Decay
        if (flash > 0) {
          const next = flash - 0.07;
          next <= 0 ? pegFlashRef.current.delete(b.id) : pegFlashRef.current.set(b.id, next);
        }

        const glowSize  = flash > 0 ? 4 + flash * 14 : 4;
        const alpha     = 0.55 + flash * 0.45;
        ctx.shadowColor = `rgba(212,175,55,${0.4 + flash * 0.6})`;
        ctx.shadowBlur  = glowSize;
        ctx.fillStyle   = flash > 0
          ? `rgba(255,${200 + Math.floor(flash * 55)},80,${alpha})`
          : "rgba(212,175,55,0.75)";
        ctx.beginPath();
        ctx.arc(b.position.x, b.position.y, PEG_R + (flash > 0 ? flash * 2 : 0), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // ── Chucker flash decay & draw ────────────────────────────────────────
      for (let i = 0; i < CHUCKER_COUNT; i++) {
        const isSlot = SLOT_INDICES.has(i);
        const flash  = chuckerFlashRef.current[i];
        if (flash > 0) chuckerFlashRef.current[i] = Math.max(0, flash - 0.05);

        const x = i * CHUCKER_W;
        if (isSlot) {
          const pulse = 0.18 + 0.10 * Math.sin(time * 0.004 + i) + flash * 0.5;
          ctx.fillStyle = `rgba(212,175,55,${pulse})`;
          ctx.shadowColor = flash > 0 ? "rgba(255,230,80,0.9)" : "rgba(212,175,55,0.3)";
          ctx.shadowBlur  = flash > 0 ? 20 : 6;
        } else {
          ctx.fillStyle = `rgba(255,255,255,${0.04 + flash * 0.2})`;
          ctx.shadowColor = "rgba(255,255,255,0.3)";
          ctx.shadowBlur  = flash * 10;
        }
        ctx.fillRect(x + 2, H - DIVIDER_H, CHUCKER_W - 4, DIVIDER_H);
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle   = isSlot
          ? `rgba(212,175,55,${0.8 + flash * 0.2})`
          : `rgba(255,255,255,${0.2 + flash * 0.4})`;
        ctx.font        = isSlot ? "bold 9px monospace" : "8px monospace";
        ctx.textAlign   = "center";
        ctx.fillText(isSlot ? "SLOT" : `CH${i + 1}`, x + CHUCKER_W / 2, H - DIVIDER_H / 2 + 3);
      }

      // ── Chucker divider lines ─────────────────────────────────────────────
      ctx.strokeStyle = "rgba(212,175,55,0.3)";
      ctx.lineWidth   = 2;
      for (const b of bodies) {
        if (b.label !== "divider") continue;
        ctx.beginPath();
        ctx.moveTo(b.position.x, H - DIVIDER_H);
        ctx.lineTo(b.position.x, H);
        ctx.stroke();
      }

      // ── Balls: trail + body ───────────────────────────────────────────────
      ballMapRef.current.forEach((entry, id) => {
        const { body, isSlot } = entry;
        const { x, y } = body.position;

        // Update trail
        const trail = ballTrailsRef.current.get(id) ?? [];
        trail.push({ x, y });
        if (trail.length > 7) trail.shift();
        ballTrailsRef.current.set(id, trail);

        // Draw trail
        for (let t = 0; t < trail.length - 1; t++) {
          const alpha = ((t + 1) / trail.length) * (isSlot ? 0.45 : 0.25);
          const r2    = BALL_R * ((t + 1) / trail.length) * 0.7;
          ctx.fillStyle = isSlot
            ? `rgba(212,175,55,${alpha})`
            : `rgba(200,200,200,${alpha})`;
          ctx.beginPath();
          ctx.arc(trail[t].x, trail[t].y, r2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw ball
        ctx.shadowColor = isSlot ? "rgba(212,175,55,0.9)" : "rgba(255,255,255,0.5)";
        ctx.shadowBlur  = isSlot ? 12 : 6;
        const grad = ctx.createRadialGradient(x - 1.5, y - 1.5, 0, x, y, BALL_R);
        if (isSlot) {
          grad.addColorStop(0, "#fffde7");
          grad.addColorStop(1, "#d4af37");
        } else {
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(1, "#9e9e9e");
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Landing detection
        if (!entry.landed && y >= FLOOR_Y - BALL_R - 2) {
          entry.landed = true;
          // Flash the chucker it fell into
          const chIdx = Math.min(4, Math.max(0, Math.floor(x / CHUCKER_W)));
          chuckerFlashRef.current[chIdx] = 1.0;
          onLandedRef.current(id);
        }
      });
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      Matter.Events.off(engine, "collisionStart");
      Matter.Engine.clear(engine);
      Matter.Composite.clear(engine.world, false);
      engineRef.current = null;
    };
  }, []);

  // ── Sync activeBalls → matter world ──────────────────────────────────────
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const activeIds = new Set(activeBalls.map((b) => b.id));

    for (const ball of activeBalls) {
      if (ballMapRef.current.has(ball.id)) continue;
      const targetX = (ball.targetChucker + 0.5) * CHUCKER_W;
      const startX  = Math.max(BALL_R + 2, Math.min(W - BALL_R - 2, targetX + (Math.random() - 0.5) * 60));
      const body    = Matter.Bodies.circle(startX, BALL_R + 2, BALL_R, {
        restitution: 0.45,
        friction: 0.02,
        frictionAir: 0.008,
        label: "ball",
        collisionFilter: { category: 0x0002, mask: 0x0001 },
      });
      Matter.Body.setVelocity(body, { x: (targetX - startX) * 0.025, y: 0 });
      Matter.Composite.add(engine.world, body);
      ballMapRef.current.set(ball.id, { body, isSlot: ball.isSlotChucker, landed: false });
    }

    ballMapRef.current.forEach((entry, id) => {
      if (!activeIds.has(id)) {
        Matter.Composite.remove(engine.world, entry.body);
        ballTrailsRef.current.delete(id);
        ballMapRef.current.delete(id);
      }
    });
  }, [activeBalls]);

  return (
    <div
      className="w-full relative rounded-2xl border border-primary/30 overflow-hidden bg-black/85"
      style={{ aspectRatio: `${W} / ${H}` }}
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary/50 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary/50 to-transparent pointer-events-none" />
    </div>
  );
}
