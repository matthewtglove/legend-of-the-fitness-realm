import { createObservable } from "../../../systems/observable";
import { Animation } from "../../animation-view";
import { calculateLayout, calculatePointerPos } from "../../utils";

type RipplePondArgs = {
    leafCount: number;
};

type RipplePondResult = {
    clearingTimeMs: number;
    calmnessScore: number; // 0 to 100
};

type Leaf = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    color: string;
    isCleared: boolean;
};

type Ripple = {
    x: number;
    y: number;
    radius: number;
    opacity: number;
};

export const RipplePondGame: Animation<RipplePondArgs, RipplePondResult> = {
    setup: (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext(`2d`);
        const doneSubject = createObservable<undefined | { kind: `completed` | `stopped`, result: RipplePondResult }>(undefined);

        // Constants
        const VIRTUAL_SIZE = 1000;
        const gameSize = { width: VIRTUAL_SIZE, height: VIRTUAL_SIZE };
        const LEAF_RADIUS = 25;
        const RIPPLE_SPEED = 15;
        // const MAX_RIPPLE_RADIUS = 250;
        const FORCE_MULTIPLIER = 1.5;

        // State
        let leaves: Leaf[] = [];
        let ripples: Ripple[] = [];
        let isRunning = false;
        let animId = 0;

        // Stats
        let startTime = 0;
        let tapCount = 0;

        const colors = [`#88d498`, `#c6dabf`, `#f3e9d2`, `#1a936f`];

        const reset = (count: number) => {
            leaves = [];
            ripples = [];
            tapCount = 0;
            startTime = Date.now();

            for (let i = 0; i < count; i++) {
                leaves.push({
                    x: Math.random() * (VIRTUAL_SIZE - 200) + 100, // Keep initially centered
                    y: Math.random() * (VIRTUAL_SIZE - 200) + 100,
                    vx: 0,
                    vy: 0,
                    rotation: Math.random() * Math.PI * 2,
                    color: colors[Math.floor(Math.random() * colors.length)]!,
                    isCleared: false,
                });
            }
        };

        const render = () => {
            if (!isRunning) return;
            if (!ctx) return;

            // 1. Setup Layout
            const layout = calculateLayout(canvas, gameSize);
            // Clear entire canvas with "Water" color
            ctx.fillStyle = `#112233`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(layout.x, layout.y);
            ctx.scale(layout.scale, layout.scale);

            // Optional: Draw a "Moon" reflection for aesthetics
            ctx.fillStyle = `#ffffff11`;
            ctx.beginPath();
            ctx.arc(VIRTUAL_SIZE / 2, VIRTUAL_SIZE / 2, 100, 0, Math.PI * 2);
            ctx.fill();

            // 2. Physics & Logic Update
            let activeLeafCount = 0;

            // A. Update Ripples
            for (let i = ripples.length - 1; i >= 0; i--) {
                const r = ripples[i]!;
                r.radius += RIPPLE_SPEED;
                r.opacity -= 0.02;

                if (r.opacity <= 0) {
                    ripples.splice(i, 1);
                }
            }

            // B. Update Leaves
            for (const leaf of leaves) {
                if (leaf.isCleared) continue;
                activeLeafCount++;

                // Friction (slow down naturally)
                leaf.vx *= 0.95;
                leaf.vy *= 0.95;

                // React to Ripples
                for (const r of ripples) {
                    // Only push if the ripple "wavefront" is near the leaf
                    const dx = leaf.x - r.x;
                    const dy = leaf.y - r.y;
                    const dist = Math.hypot(dx, dy);

                    // If the ripple circle edge (radius) hits the leaf
                    const distToWave = Math.abs(dist - r.radius);

                    if (distToWave < 30 && r.opacity > 0.2) {
                        const angle = Math.atan2(dy, dx);
                        const push = (100 / (dist + 1)) * FORCE_MULTIPLIER; // Stronger when closer to center
                        leaf.vx += Math.cos(angle) * push;
                        leaf.vy += Math.sin(angle) * push;
                        leaf.rotation += (Math.random() - 0.5) * 0.2; // Spin slightly
                    }
                }

                // Move
                leaf.x += leaf.vx;
                leaf.y += leaf.vy;

                // Check Bounds (Win Condition)
                if (
                    leaf.x < -LEAF_RADIUS ||
                    leaf.x > VIRTUAL_SIZE + LEAF_RADIUS ||
                    leaf.y < -LEAF_RADIUS ||
                    leaf.y > VIRTUAL_SIZE + LEAF_RADIUS
                ) {
                    leaf.isCleared = true;
                }
            }

            // 3. Drawing

            // Draw Ripples
            ctx.lineWidth = 4;
            for (const r of ripples) {
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 255, 255, ${r.opacity})`;
                ctx.stroke();
            }

            // Draw Leaves
            for (const leaf of leaves) {
                if (leaf.isCleared) continue;

                ctx.save();
                ctx.translate(leaf.x, leaf.y);
                ctx.rotate(leaf.rotation);

                // Draw a simple leaf shape
                ctx.beginPath();
                ctx.ellipse(0, 0, LEAF_RADIUS, LEAF_RADIUS / 2, 0, 0, Math.PI * 2);
                ctx.fillStyle = leaf.color;
                ctx.fill();

                // Vein line
                ctx.beginPath();
                ctx.moveTo(-LEAF_RADIUS + 5, 0);
                ctx.lineTo(LEAF_RADIUS - 5, 0);
                ctx.strokeStyle = `#00000033`;
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.restore();
            }

            ctx.restore();

            // 4. Check Complete
            if (activeLeafCount === 0) {
                finish(`completed`);
            }

            animId = requestAnimationFrame(render);
        };

        const handleTap = (e: MouseEvent | TouchEvent) => {
            if (!isRunning) return;
            e.preventDefault(); // Stop scrolling

            tapCount++;
            const pos = calculatePointerPos(canvas, gameSize, e);

            ripples.push({
                x: pos.x,
                y: pos.y,
                radius: 10,
                opacity: 1.0
            });
        };

        const finish = (kind: `completed` | `stopped`) => {
            if (doneSubject.lastValue) return;

            const timeMs = Date.now() - startTime;

            // Calculate Calmness: 
            // 1 leaf should ideally take 1-2 taps.
            // If they spam 50 taps for 5 leaves, score is low.
            const efficiency = Math.min(1, (leaves.length * 3) / (tapCount || 1));
            const score = Math.floor(efficiency * 100);

            doneSubject.next({
                kind,
                result: {
                    clearingTimeMs: timeMs,
                    calmnessScore: score
                }
            });
        };

        return {
            start: (args) => {
                reset(args.leafCount);
                isRunning = true;

                canvas.addEventListener(`mousedown`, handleTap);
                canvas.addEventListener(`touchstart`, handleTap, { passive: false });

                doneSubject.next(undefined);
                cancelAnimationFrame(animId);
                animId = requestAnimationFrame(render);
            },
            stop: () => {
                finish(`stopped`);
                isRunning = false;
                cancelAnimationFrame(animId);

                canvas.removeEventListener(`mousedown`, handleTap);
                canvas.removeEventListener(`touchstart`, handleTap);
            },
            pause: (isPaused) => {
                cancelAnimationFrame(animId);
                if (isPaused) return;
                isRunning = true;
                animId = requestAnimationFrame(render);
            },
            done: doneSubject
        };
    }
};