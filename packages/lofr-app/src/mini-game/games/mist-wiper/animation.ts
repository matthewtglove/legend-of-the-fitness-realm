import { createObservable } from "../../../systems/observable";
import { Animation } from "../../animation-view";
import { calculatePointerPos } from "../../utils";

type MistArgs = {
    difficulty: `easy` | `hard`;
    brushSizeRatio?: number;
};

type MistResult = {
    timeTakenMs: number;
    percentCleared: number;
    averageSpeed: number;
};

export const MistWiperGame: Animation<MistArgs, MistResult> = {
    setup: (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext(`2d`, { willReadFrequently: true });

        // 1. Setup Offscreen Canvas for the "Mist" layer
        // We use a separate canvas so we can erase pixels from it without losing the background.
        const mistCanvas = document.createElement(`canvas`);
        const mistCtx = mistCanvas.getContext(`2d`, { willReadFrequently: true });

        // 2. State Management
        // We initialize with a "stopped" state.
        const doneSubject = createObservable<undefined | { kind: `completed` | `stopped`, result: MistResult }>(undefined);

        let isRunning = false;
        let animationFrame: number;
        let startTime = 0;
        let totalPixels = 0;
        let clearedPixels = 0;
        let lastCheckTime = 0;
        let brushSizeRatio = 0.1;

        // Input tracking
        let lastPos = { x: 0, y: 0 };
        let totalDistance = 0;

        // Resize handler to keep layers synced
        const resize = () => {
            mistCanvas.width = canvas.width;
            mistCanvas.height = canvas.height;
            totalPixels = canvas.width * canvas.height;
            // resetMist();
        };

        const resetMist = () => {
            if (!mistCtx) return;
            mistCtx.globalCompositeOperation = `source-over`;
            mistCtx.fillStyle = `#b0b5b9`; // Fog color (Greyish Blue)
            mistCtx.fillRect(0, 0, mistCanvas.width, mistCanvas.height);
            clearedPixels = 0;
        };

        // 3. The Render Loop
        const draw = () => {
            if (!ctx || !mistCtx) return;

            // A. Draw Background (The Sunrise)
            // Create a nice warm gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, `#4facfe`); // Blue sky top
            gradient.addColorStop(0.6, `#ffd194`); // Orange horizon
            gradient.addColorStop(1, `#ff9a9e`); // Pink bottom
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // B. Draw The Sun (rising based on cleared percentage)
            const riseProgress = clearedPixels / totalPixels;
            const sunY = canvas.height - (canvas.height * 0.3) - (riseProgress * 100);

            ctx.beginPath();
            ctx.arc(canvas.width / 2, sunY, 60, 0, Math.PI * 2);
            ctx.fillStyle = `#ffde59`;
            ctx.shadowColor = `#ffae00`;
            ctx.shadowBlur = 40;
            ctx.fill();
            ctx.shadowBlur = 0;

            // C. Draw the Mist Layer on top
            ctx.globalAlpha = 0.8;
            ctx.drawImage(mistCanvas, 0, 0);
            ctx.globalAlpha = 1.0;

            // D. Periodic Check (Performance optimization: don't check pixels every frame)
            const now = Date.now();
            if (isRunning && now - lastCheckTime > 500) {
                checkCompletion();
                lastCheckTime = now;
            }

            if (isRunning) {
                animationFrame = requestAnimationFrame(draw);
            }
        };

        // 4. Input Logic (The Wiping)
        const wipe = (x: number, y: number) => {
            if (!isRunning || !mistCtx) return;

            const brushSize = Math.ceil(brushSizeRatio * (canvas.width + canvas.height) / 2);

            mistCtx.globalCompositeOperation = `destination-out`; // This makes ink transparent
            mistCtx.beginPath();
            mistCtx.arc(x, y, brushSize, 0, Math.PI * 2);
            mistCtx.fill();

            // Track speed/movement
            const dist = Math.hypot(x - lastPos.x, y - lastPos.y);
            totalDistance += dist;
            lastPos = { x, y };
        };

        const onMove = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            const pos = calculatePointerPos(canvas, { width: canvas.width, height: canvas.height }, e);
            const clientX = pos.x;
            const clientY = pos.y;

            wipe(clientX, clientY);
        };

        // 5. Completion Logic
        const checkCompletion = () => {
            if (!mistCtx) return;

            // NOTE: frequent getImageData is slow. In a real app, 
            // use a smaller grid or math-based approximation. 
            // For this demo, we verify the center 100x100 pixels or downsample.
            // Here is a simplified pixel count logic:

            // Sample every 10th pixel to save CPU
            const stride = 10;
            const frame = mistCtx.getImageData(0, 0, mistCanvas.width, mistCanvas.height);
            let alphaZeros = 0;
            let totalSampled = 0;

            for (let i = 3; i < frame.data.length; i += 4 * stride) {
                totalSampled++;
                if (frame.data[i] === 0) { // Alpha channel
                    alphaZeros++;
                }
            }

            clearedPixels = (alphaZeros / totalSampled) * totalPixels; // Approximate
            const percent = alphaZeros / totalSampled;

            if (percent > 0.90) { // 90% cleared is "done"
                finishGame(`completed`, percent);
            }
        };

        const finishGame = (kind: `completed` | `stopped`, finalPercent: number) => {
            if (doneSubject.lastValue !== undefined) return;

            const timeElapsed = Date.now() - startTime;

            doneSubject.next({
                kind: kind,
                result: {
                    timeTakenMs: timeElapsed,
                    percentCleared: Math.floor(finalPercent * 100),
                    averageSpeed: Math.floor(totalDistance / (timeElapsed / 1000))
                }
            });

            // We do not call doneSubject.complete() here because the user
            // might restart the game without re-running setup(), depending on app logic.
        };

        // --- Interface Implementation ---
        return {
            start: (args: MistArgs) => {
                resize();
                resetMist();
                brushSizeRatio = args.brushSizeRatio ?? (args.difficulty === `hard` ? 0.1 : 0.25);

                // Reset State
                startTime = Date.now();
                totalDistance = 0;
                lastCheckTime = 0;
                isRunning = true;

                // Attach Events
                canvas.addEventListener(`mousemove`, onMove);
                canvas.addEventListener(`touchmove`, onMove, { passive: false });

                doneSubject.next(undefined);
                draw();
            },
            stop: () => {
                canvas.removeEventListener(`mousemove`, onMove);
                canvas.removeEventListener(`touchmove`, onMove);
                finishGame(`stopped`, clearedPixels / totalPixels);
            },
            pause: (isPaused: boolean) => {
                if (isPaused) {
                    isRunning = false;
                    cancelAnimationFrame(animationFrame);
                } else {
                    if (!isRunning) {
                        isRunning = true;
                        lastCheckTime = Date.now(); // avoid huge time jump
                        draw();
                    }
                }
            },
            done: doneSubject
        };
    }
};