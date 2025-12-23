import { createObservable } from "../../../systems/observable";
import { Animation } from "../../animation-view";
import { calculateLayout, } from "../../utils";

type MomentumArgs = {
    targetSpeed: number; // 1 to 10
};

type MomentumResult = {
    perfectHits: number;
    misses: number;
};

export const MomentumWheelGame: Animation<MomentumArgs, MomentumResult> = {
    setup: (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext(`2d`);
        const doneSubject = createObservable<undefined | { kind: `completed` | `stopped`, result: MomentumResult }>(undefined);

        // Layout Constants
        const VIRTUAL_SIZE = 1000;
        const gameSize = { width: VIRTUAL_SIZE, height: VIRTUAL_SIZE };
        const CENTER = VIRTUAL_SIZE / 2;
        const RADIUS = 300;

        // State
        let angle = 0;
        let speed = 0.05;
        let targetZoneStart = 0; // Radians
        const targetZoneSize = Math.PI / 4; // 45 degrees slice

        const badHitAngles = [] as number[];

        let hits = 0;
        let misses = 0;
        let isRunning = false;
        let animId = 0;

        // Randomize target zone location
        const resetTarget = () => {
            targetZoneStart = Math.random() * Math.PI * 2;
            badHitAngles.splice(0, badHitAngles.length);
        };

        const render = () => {
            if (!isRunning) return;
            if (!ctx) return;

            // 1. Layout
            const layout = calculateLayout(canvas, gameSize);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(layout.x, layout.y);
            ctx.scale(layout.scale, layout.scale);

            // 2. Logic
            angle += speed;
            if (angle > Math.PI * 2) angle -= Math.PI * 2;

            // 3. Draw Wheel Background
            ctx.beginPath();
            ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
            ctx.strokeStyle = `#333`;
            ctx.lineWidth = 20;
            ctx.stroke();

            // 4. Draw Target Zone
            ctx.beginPath();
            ctx.arc(CENTER, CENTER, RADIUS, targetZoneStart, targetZoneStart + targetZoneSize);
            ctx.strokeStyle = `#00ffcc`; // Bright Cyan
            ctx.lineWidth = 20;
            ctx.stroke();

            // 5. Draw Spinning Marker
            const markerX = CENTER + Math.cos(angle) * RADIUS;
            const markerY = CENTER + Math.sin(angle) * RADIUS;

            ctx.beginPath();
            ctx.arc(markerX, markerY, 30, 0, Math.PI * 2);
            ctx.fillStyle = `white`;
            ctx.fill();

            for (const badHitAngle of badHitAngles) {
                const badX = CENTER + Math.cos(badHitAngle) * RADIUS;
                const badY = CENTER + Math.sin(badHitAngle) * RADIUS;
                ctx.beginPath();
                ctx.arc(badX, badY, 30, 0, Math.PI * 2);
                ctx.fillStyle = `red`;
                ctx.fill();
            }

            ctx.restore();
            animId = requestAnimationFrame(render);
        };

        const handleTap = (e: Event) => {
            if (!isRunning) return;
            e.preventDefault();

            // Normalize angle for comparison
            const currentAngle = angle;
            // Check collision (Simple angle overlap)
            // Note: In a real game, handle the wrap-around logic (0 vs 360 degrees) carefully
            // This is a simplified check:
            // const dist = Math.abs(currentAngle - (targetZoneStart + targetZoneSize / 2));

            // Check if within the slice (handling some wrap-around math roughly)
            const isHit = (currentAngle > targetZoneStart && currentAngle < targetZoneStart + targetZoneSize);

            if (isHit) {
                hits++;
                speed *= 2;
                resetTarget();
            } else {
                misses++;
                speed = Math.max(0.0001, speed * 0.75);
                badHitAngles.push(currentAngle);
            }

            if (hits >= 5) {
                finish(`completed`);
            }
        };

        const finish = (kind: `completed` | `stopped`) => {
            if (doneSubject.lastValue) return;

            doneSubject.next({
                kind,
                result: { perfectHits: hits, misses }
            });
        };

        return {
            start: (args) => {
                hits = 0;
                misses = 0;
                speed = args.targetSpeed * 0.01;
                resetTarget();
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
            pause: (p) => {
                cancelAnimationFrame(animId);
                if (p) {
                    return;
                }
                animId = requestAnimationFrame(render)
            },
            done: doneSubject
        };
    }
};