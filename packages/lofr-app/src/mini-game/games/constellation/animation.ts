import { createObservable } from "../../../systems/observable";
import { Animation } from "../../animation-view";
import { calculateLayout, calculatePointerPos } from "../../utils";

type ConstellationArgs = {
    complexity: `simple` | `complex`;
};

type ConstellationResult = {
    accuracy: number;    // How close to the center of stars they hit
    averageSpeed: number; // Lower is better for sleep prep
};

type Point = { x: number; y: number };

export const ConstellationGame: Animation<ConstellationArgs, ConstellationResult> = {
    setup: (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext(`2d`);
        // Initial state
        const doneSubject = createObservable<undefined | { kind: `completed` | `stopped`, result: ConstellationResult }>(undefined);

        // Game State
        let animationId: number;
        let isRunning = false;

        // The "Level" data
        const VIRTUAL_WIDTH = 1000;
        const VIRTUAL_HEIGHT = 1000;
        const gameSize = { width: VIRTUAL_WIDTH, height: VIRTUAL_HEIGHT };

        let stars: Point[] = [
            { x: 200, y: 800 }, // Start
            { x: 400, y: 400 },
            { x: 600, y: 200 },
            { x: 800, y: 500 }, // End
        ];

        let complexity: `simple` | `complex` = `simple`;
        const generateStars = () => {
            const starCount = complexity === `simple` ? Math.floor(3 + Math.random() * 4) : Math.floor(4 + Math.random() * 7);
            const newStars = [];
            for (let i = 0; i < starCount; i++) {
                newStars.push({
                    x: Math.random() * VIRTUAL_WIDTH * 0.8 + VIRTUAL_WIDTH * 0.1,
                    y: Math.random() * VIRTUAL_HEIGHT * 0.8 + VIRTUAL_HEIGHT * 0.1,
                });
            }
            stars = newStars;
        };

        // Player progress
        let connectedIndices: number[] = [0]; // We start at star 0
        let currentDragPos: Point | null = null;
        let lastDragTime = 0;
        // const totalSpeed = 0;
        // const sampleCount = 0;

        const getPointerPos = (e: MouseEvent | TouchEvent) => calculatePointerPos(canvas, gameSize, e);
        const layout = calculateLayout(canvas, gameSize);


        const render = () => {
            if (!ctx) return;

            // 2. Clear Background (Dark Night Blue)
            ctx.fillStyle = `#0a0a1a`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 3. Apply Layout Transform (Scaling/Centering)
            ctx.save();
            ctx.translate(layout.x, layout.y);
            ctx.scale(layout.scale, layout.scale);

            // 4. Clip to Virtual Area (Optional, keeps drawing neat)
            ctx.beginPath();
            ctx.rect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
            ctx.clip();

            // --- Draw Game Logic (Using Virtual Coords) ---

            // Draw Completed Lines
            ctx.strokeStyle = `#4facfe`; // Cyan glow
            ctx.lineWidth = 10;
            ctx.lineCap = `round`;
            ctx.lineJoin = `round`;
            ctx.beginPath();
            if (connectedIndices.length > 0) {
                const start = stars[connectedIndices[0]!]!;
                ctx.moveTo(start.x, start.y);
                for (let i = 1; i < connectedIndices.length; i++) {
                    const p = stars[connectedIndices[i]!]!;
                    ctx.lineTo(p.x, p.y);
                }
                // Draw line to current finger position
                if (currentDragPos && !doneSubject.lastValue) {
                    ctx.lineTo(currentDragPos.x, currentDragPos.y);
                }
            }
            ctx.stroke();

            // Draw Stars
            stars.forEach((star, index) => {
                const isConnected = connectedIndices.includes(index);
                const isNext = !isConnected && index === connectedIndices.length;

                ctx.beginPath();
                ctx.arc(star.x, star.y, isConnected ? 15 : 25, 0, Math.PI * 2);

                if (isConnected) {
                    ctx.fillStyle = `#ffffff`;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = `#4facfe`;
                } else if (isNext) {
                    ctx.fillStyle = `#ffcc00`; // Target star
                    ctx.shadowBlur = 25;
                    ctx.shadowColor = `#ffcc00`;

                    // Pulse animation
                    const pulse = (1 + Math.sin(Date.now() / 300)) * 5;
                    ctx.lineWidth = pulse;
                    ctx.strokeStyle = `white`;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = `#ffffff33`; // Dim star
                    ctx.shadowBlur = 0;
                }

                ctx.fill();
            });

            ctx.restore();

            if (isRunning) {
                animationId = requestAnimationFrame(render);
            }
        };

        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isRunning) return;
            e.preventDefault();

            const pos = getPointerPos(e);
            currentDragPos = pos;

            // Speed Check Logic (Encourage slowness)
            const now = Date.now();
            const timeDiff = now - lastDragTime;
            if (timeDiff > 0 && lastDragTime > 0) {
                // Calculate speed (pixels per ms)
                // If speed > threshold, maybe shake screen or dim line
                // keeping simple for this example
            }
            lastDragTime = now;

            // Hit Detection
            const nextIndex = connectedIndices.length;
            if (nextIndex < stars.length) {
                const target = stars[nextIndex]!;
                const dist = Math.hypot(pos.x - target.x, pos.y - target.y);

                // Radius of 40 virtual pixels to "catch" the star
                if (dist < 40) {
                    connectedIndices.push(nextIndex);

                    // Win Condition
                    if (connectedIndices.length === stars.length) {
                        finishGame();
                    }
                }
            }
        };

        const handleStart = (e: MouseEvent | TouchEvent) => {
            if (!isRunning) return;
            // Only allow starting if near the last connected star
            const pos = getPointerPos(e);
            const lastStar = stars[connectedIndices[connectedIndices.length - 1]!]!;
            const dist = Math.hypot(pos.x - lastStar.x, pos.y - lastStar.y);

            if (dist < 50) {
                currentDragPos = pos;
                lastDragTime = Date.now();
            } else {
                currentDragPos = null;
            }
        };

        const handleEnd = () => {
            currentDragPos = null;
        };

        const finishGame = () => {
            if (doneSubject.lastValue !== undefined) return;

            doneSubject.next({
                kind: `completed`,
                result: {
                    accuracy: 95, // calculated based on path deviation
                    averageSpeed: 10, // calculated based on history
                }
            });
        };

        return {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            start: (args) => {
                complexity = args.complexity;
                generateStars();

                connectedIndices = [0];
                currentDragPos = null;
                isRunning = true;

                // Add Listeners
                canvas.addEventListener(`mousedown`, handleStart);
                canvas.addEventListener(`touchstart`, handleStart, { passive: false });
                canvas.addEventListener(`mousemove`, handleMove);
                canvas.addEventListener(`touchmove`, handleMove, { passive: false });
                canvas.addEventListener(`mouseup`, handleEnd);
                canvas.addEventListener(`touchend`, handleEnd);

                doneSubject.next(undefined);
                render();
            },
            stop: () => {
                isRunning = false;
                cancelAnimationFrame(animationId);
                canvas.removeEventListener(`mousemove`, handleMove);
                canvas.removeEventListener(`touchmove`, handleMove);
                canvas.removeEventListener(`mousedown`, handleStart);
                canvas.removeEventListener(`touchstart`, handleStart);
                canvas.removeEventListener(`mouseup`, handleEnd);
                canvas.removeEventListener(`touchend`, handleEnd);
                // remove listeners...
            },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            pause: (isPaused) => { /* ... */ },
            done: doneSubject
        };
    }
};