import { createObservable } from "../../../systems/observable";
import { Animation } from "../../animation-view";
import { calculateLayout, calculatePointerPos } from "../../utils";

type PatternArgs = {
    startingDifficulty: number; // 3 to 5 (number of dots)
};

type PatternResult = {
    roundsCompleted: number;
    averageTimePerRoundMs: number;
};

type Dot = {
    id: number;
    x: number;
    y: number;
};

type GamePhase = `memorize` | `input` | `feedback`;

export const PatternSprintGame: Animation<PatternArgs, PatternResult> = {
    setup: (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext(`2d`);
        const doneSubject = createObservable<undefined | { kind: `completed` | `stopped`, result: PatternResult }>(undefined);

        // --- Constants ---
        const VIRTUAL_SIZE = 1000;
        const gameSize = { width: VIRTUAL_SIZE, height: VIRTUAL_SIZE };
        const GRID_SPACING = 250;
        const DOT_RADIUS = 30;
        const HIT_RADIUS = 60;

        // --- State ---
        let isRunning = false;
        let animId = 0;

        // Game Logic State
        let dots: Dot[] = [];
        let targetSequence: number[] = [];
        let inputSequence: number[] = [];
        let phase: GamePhase = `memorize`;

        let round = 0;
        let lives = 3;
        let currentDifficulty = 3; // sequence length

        // Timers
        let phaseStartTime = 0;
        let roundTimes: number[] = [];
        let feedbackColor = ``; // Used during 'feedback' phase

        // Input
        let currentDragPos: { x: number, y: number } | null = null;

        // Initialize 3x3 Grid
        const initGrid = () => {
            dots = [];
            const offsetX = (VIRTUAL_SIZE - (GRID_SPACING * 2)) / 2;
            const offsetY = (VIRTUAL_SIZE - (GRID_SPACING * 2)) / 2;

            for (let i = 0; i < 9; i++) {
                const row = Math.floor(i / 3);
                const col = i % 3;
                dots.push({
                    id: i,
                    x: offsetX + (col * GRID_SPACING),
                    y: offsetY + (row * GRID_SPACING)
                });
            }
        };

        const nextRound = () => {
            if (round >= 3) { // Game Length: 3 Rounds
                finish(`completed`);
                return;
            }

            round++;
            inputSequence = [];
            currentDragPos = null;

            // Generate Pattern
            // Simple random walk, no repeats
            const length = currentDifficulty;
            const seq: number[] = [];
            const available = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]);

            const current = Math.floor(Math.random() * 9);
            seq.push(current);
            available.delete(current);

            while (seq.length < length) {
                // Find valid neighbors or just pick random available (teleporting pattern allowed for difficulty)
                // For "Sprint", allowing jumps makes it harder to memorize visually
                const remaining = Array.from(available);
                if (remaining.length === 0) break;

                const nextIndex = Math.floor(Math.random() * remaining.length);
                const next = remaining[nextIndex]!;

                seq.push(next);
                available.delete(next);
            }
            targetSequence = seq;

            // Start Memorize Phase
            phase = `memorize`;
            phaseStartTime = Date.now();
        };

        const render = () => {
            if (!isRunning) return;
            if (!ctx) return;

            // 1. Layout
            const layout = calculateLayout(canvas, gameSize);
            ctx.fillStyle = `#1a1a2e`; // Dark Navy
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(layout.x, layout.y);
            ctx.scale(layout.scale, layout.scale);

            // 2. Draw Connections (Lines)
            ctx.lineWidth = 15;
            ctx.lineCap = `round`;
            ctx.lineJoin = `round`;

            // Decide what to draw based on phase
            if (phase === `memorize`) {
                // Draw Target Pattern
                // Fade out effect? 
                const timeInPhase = Date.now() - phaseStartTime;
                const alpha = Math.max(0, 1 - (timeInPhase / 1500)); // Show for 1.5s

                if (alpha <= 0) {
                    phase = `input`;
                    phaseStartTime = Date.now(); // Start timer for user speed
                }

                ctx.strokeStyle = `rgba(255, 165, 0, ${alpha})`; // Orange
                drawPath(targetSequence);

            } else if (phase === `input`) {
                // Draw User Input
                ctx.strokeStyle = `#4facfe`; // Blue
                drawPath(inputSequence);

                // Rubber band to finger
                if (inputSequence.length > 0 && currentDragPos) {
                    const lastId = inputSequence[inputSequence.length - 1]!;
                    const lastDot = dots[lastId]!;
                    ctx.beginPath();
                    ctx.moveTo(lastDot.x, lastDot.y);
                    ctx.lineTo(currentDragPos.x, currentDragPos.y);
                    ctx.stroke();
                }

            } else if (phase === `feedback`) {
                // Draw Result (Green or Red)
                ctx.strokeStyle = feedbackColor;
                drawPath(inputSequence.length > 0 ? inputSequence : targetSequence);

                if (Date.now() - phaseStartTime > 800) {
                    // Feedback over
                    if (feedbackColor === `#ff4b4b`) {
                        // Was a fail
                        if (lives <= 0) finish(`completed`); // Game Over
                        else {
                            // Retry same round? or New round? Let's do new round but easier
                            currentDifficulty = Math.max(3, currentDifficulty - 1);
                            nextRound();
                        }
                    } else {
                        // Was a success
                        currentDifficulty++;
                        nextRound();
                    }
                }
            }

            // 3. Draw Dots (The Grid)
            for (const dot of dots) {
                // const isActive = (phase === `input` && inputSequence.includes(dot.id)) ||
                //     (phase === `memorize`); // Show all dots active in memorize? No, just the path.

                // Base dot
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = `#ffffff33`; // Dim gray
                ctx.fill();

                // Active overlay
                const isInData = (phase === `memorize` && targetSequence.includes(dot.id)) ||
                    (phase === `input` && inputSequence.includes(dot.id)) ||
                    (phase === `feedback` && (inputSequence.includes(dot.id) || targetSequence.includes(dot.id)));

                if (isInData) {
                    ctx.beginPath();
                    ctx.arc(dot.x, dot.y, DOT_RADIUS - 5, 0, Math.PI * 2);
                    ctx.fillStyle = `#ffffff`;
                    ctx.fill();
                }
            }

            // 4. UI (Lives / Text)
            ctx.fillStyle = `white`;
            ctx.font = `40px sans-serif`;
            ctx.textAlign = `center`;
            if (phase === `memorize`) {
                ctx.fillText(`Memorize!`, VIRTUAL_SIZE / 2, 100);
            } else if (phase === `input`) {
                ctx.fillText(`Repeat!`, VIRTUAL_SIZE / 2, 100);
            }

            // Lives
            ctx.textAlign = `right`;
            ctx.font = `30px sans-serif`;
            ctx.fillText(`Lives: ${lives}`, VIRTUAL_SIZE - 50, 60);

            ctx.restore();
            animId = requestAnimationFrame(render);
        };

        // Helper to draw lines between IDs
        const drawPath = (ids: number[]) => {
            if (!ctx) return;
            if (ids.length < 2) return;
            ctx.beginPath();
            const start = dots[ids[0]!]!;
            ctx.moveTo(start.x, start.y);
            for (let i = 1; i < ids.length; i++) {
                const p = dots[ids[i]!]!;
                ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        };

        // --- Interaction ---
        const handleDown = (e: MouseEvent | TouchEvent) => {
            if (!isRunning || phase !== `input`) return;
            e.preventDefault();

            const pos = calculatePointerPos(canvas, gameSize, e);
            currentDragPos = pos;

            // Check collision
            checkHit(pos);
        };

        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isRunning || phase !== `input`) return;
            e.preventDefault();

            const pos = calculatePointerPos(canvas, gameSize, e);
            currentDragPos = pos;

            // Only add points if we are dragging
            if (inputSequence.length > 0) {
                checkHit(pos);
            }
        };

        const handleUp = (e: MouseEvent | TouchEvent) => {
            if (!isRunning || phase !== `input`) return;
            e.preventDefault();
            currentDragPos = null;

            // Check Result
            validatePattern();
        };

        const checkHit = (pos: { x: number, y: number }) => {
            for (const dot of dots) {
                if (inputSequence.includes(dot.id)) continue; // Already got this one

                const dist = Math.hypot(pos.x - dot.x, pos.y - dot.y);
                if (dist < HIT_RADIUS) {
                    // Validation: Can we connect to this dot?
                    // (For simple sprint, any connection is valid if it's not already used)
                    inputSequence.push(dot.id);
                    // Visual feedback vibration could go here
                }
            }
        };

        const validatePattern = () => {
            if (inputSequence.length === 0) return; // Ignore empty taps

            const isCorrect =
                inputSequence.length === targetSequence.length &&
                (inputSequence.every((val, index) => val === targetSequence[index])
                    || inputSequence.every((val, index) => val === targetSequence[inputSequence.length - 1 - index]));

            if (isCorrect) {
                feedbackColor = `#00ff88`; // Green
                roundTimes.push(Date.now() - phaseStartTime); // Store time taken
            } else {
                feedbackColor = `#ff4b4b`; // Red
                lives--;
            }

            phase = `feedback`;
            phaseStartTime = Date.now();
        };

        const finish = (kind: `completed` | `stopped`) => {
            if (doneSubject.lastValue) return;

            // Calculate Avg Time
            const totalTime = roundTimes.reduce((a, b) => a + b, 0);
            const avg = roundTimes.length > 0 ? totalTime / roundTimes.length : 0;

            doneSubject.next({
                kind,
                result: {
                    roundsCompleted: Math.max(0, round - (lives <= 0 ? 0 : 1)), // Logic fix for 0-index
                    averageTimePerRoundMs: avg
                }
            });
        };

        return {
            start: (args) => {
                currentDifficulty = args.startingDifficulty;
                lives = 3;
                round = 0;
                roundTimes = [];
                initGrid();
                isRunning = true;

                canvas.addEventListener(`mousedown`, handleDown);
                canvas.addEventListener(`mousemove`, handleMove);
                canvas.addEventListener(`mouseup`, handleUp);

                canvas.addEventListener(`touchstart`, handleDown, { passive: false });
                canvas.addEventListener(`touchmove`, handleMove, { passive: false });
                canvas.addEventListener(`touchend`, handleUp);

                doneSubject.next(undefined);
                nextRound();
                cancelAnimationFrame(animId);
                animId = requestAnimationFrame(render);
            },
            stop: () => {
                finish(`stopped`);
                isRunning = false;
                cancelAnimationFrame(animId);

                canvas.removeEventListener(`mousedown`, handleDown);
                canvas.removeEventListener(`mousemove`, handleMove);
                canvas.removeEventListener(`mouseup`, handleUp);
                canvas.removeEventListener(`touchstart`, handleDown);
                canvas.removeEventListener(`touchmove`, handleMove);
                canvas.removeEventListener(`touchend`, handleUp);
            },
            pause: (p) => {
                cancelAnimationFrame(animId);
                if (p) return;
                animId = requestAnimationFrame(render);
            },
            done: doneSubject
        };
    }
};