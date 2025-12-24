import { createObservable } from "../../../systems/observable";
import { Animation } from "../../animation-view";
import { calculateLayout, calculatePointerPos } from "../../utils";

type PatternArgs = {
    startingDifficulty: number; // Sequence length
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
        // Change these to adjust grid size
        const GRID_WIDTH = 4;
        const GRID_HEIGHT = 6;

        // Visual Constants
        const GRID_SPACING = 150;
        const DOT_RADIUS = 25;
        const HIT_RADIUS = 30;
        const MEMORIZE_STEP_DURATION = 600; // ms per dot reveal

        // Dynamic Game Size: Calculate required canvas size to fit the grid + padding
        // (Width - 1) * Spacing gives the distance from first to last dot center
        const MARGIN = 150;
        const GAME_WIDTH = ((GRID_WIDTH - 1) * GRID_SPACING) + (MARGIN * 2);
        const GAME_HEIGHT = ((GRID_HEIGHT - 1) * GRID_SPACING) + (MARGIN * 2);

        const gameSize = { width: GAME_WIDTH, height: GAME_HEIGHT };

        // --- State ---
        let isRunning = false;
        let animId = 0;

        let dots: Dot[] = [];
        let targetSequence: number[] = [];
        let inputSequence: number[] = [];
        let phase: GamePhase = `memorize`;

        let round = 0;
        let lives = 3;
        let currentDifficulty = 3;

        let phaseStartTime = 0;
        let roundTimes: number[] = [];
        let feedbackColor = ``;

        let currentDragPos: { x: number, y: number } | null = null;

        // Initialize Grid
        const initGrid = () => {
            dots = [];
            // Center the grid within the calculated gameSize
            const totalGridWidth = (GRID_WIDTH - 1) * GRID_SPACING;
            const totalGridHeight = (GRID_HEIGHT - 1) * GRID_SPACING;

            const offsetX = (GAME_WIDTH - totalGridWidth) / 2;
            const offsetY = (GAME_HEIGHT - totalGridHeight) / 2;

            const totalDots = GRID_WIDTH * GRID_HEIGHT;

            for (let i = 0; i < totalDots; i++) {
                const row = Math.floor(i / GRID_WIDTH);
                const col = i % GRID_WIDTH;
                dots.push({
                    id: i,
                    x: offsetX + (col * GRID_SPACING),
                    y: offsetY + (row * GRID_SPACING)
                });
            }
        };

        const nextRound = () => {
            if (round >= 3) {
                finish(`completed`);
                return;
            }

            round++;
            inputSequence = [];
            currentDragPos = null;

            // Generate Pattern
            const length = currentDifficulty;
            const seq: number[] = [];

            const totalDots = GRID_WIDTH * GRID_HEIGHT;
            const available = new Set(Array.from({ length: totalDots }, (_, k) => k));

            // Start at random dot
            const current = Math.floor(Math.random() * totalDots);
            seq.push(current);
            available.delete(current);

            // Random walk (non-repeating)
            while (seq.length < length) {
                const remaining = Array.from(available);
                if (remaining.length === 0) break;

                const nextIndex = Math.floor(Math.random() * remaining.length);
                const next = remaining[nextIndex]!;

                seq.push(next);
                available.delete(next);
            }
            targetSequence = seq;

            phase = `memorize`;
            phaseStartTime = Date.now();
        };

        const render = () => {
            if (!isRunning) return;
            if (!ctx) return;

            // 1. Layout - fits the calculated gameSize into the canvas
            const layout = calculateLayout(canvas, gameSize);
            ctx.fillStyle = `#1a1a2e`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(layout.x, layout.y);
            ctx.scale(layout.scale, layout.scale);

            // 2. Logic for Progressive Display & Input
            let visibleSequence: number[] = [];

            ctx.lineWidth = 15;
            ctx.lineCap = `round`;
            ctx.lineJoin = `round`;

            if (phase === `memorize`) {
                const timeInPhase = Date.now() - phaseStartTime;

                // Show 1 dot, then 2, then 3...
                const currentStepIndex = Math.floor(timeInPhase / MEMORIZE_STEP_DURATION);

                // (+1 allows a moment of full visibility before switching)
                if (currentStepIndex > targetSequence.length) {
                    phase = `input`;
                    phaseStartTime = Date.now();
                    visibleSequence = [];
                } else {
                    visibleSequence = targetSequence.slice(0, currentStepIndex + 1);
                    ctx.strokeStyle = `rgba(255, 165, 0, 1)`; // Orange
                    drawPath(visibleSequence);
                }

            } else if (phase === `input`) {
                visibleSequence = inputSequence;
                ctx.strokeStyle = `#4facfe`; // Blue
                drawPath(inputSequence);

                if (inputSequence.length > 0 && currentDragPos) {
                    const lastId = inputSequence[inputSequence.length - 1]!;
                    const lastDot = dots[lastId]!;
                    ctx.beginPath();
                    ctx.moveTo(lastDot.x, lastDot.y);
                    ctx.lineTo(currentDragPos.x, currentDragPos.y);
                    ctx.stroke();
                }

            } else if (phase === `feedback`) {
                visibleSequence = inputSequence.length > 0 ? inputSequence : targetSequence;
                ctx.strokeStyle = feedbackColor;
                drawPath(visibleSequence);

                if (!wasCorrect) {
                    ctx.strokeStyle = `#4facfe`;
                    drawPath(inputSequence);
                }

                if (Date.now() - phaseStartTime > 800) {
                    if (feedbackColor === `#ff4b4b`) {
                        if (lives <= 0) finish(`completed`);
                        else {
                            currentDifficulty = Math.max(3, currentDifficulty - 1);
                            nextRound();
                        }
                    } else {
                        currentDifficulty++;
                        nextRound();
                    }
                }
            }

            // 3. Draw Dots
            for (const dot of dots) {
                const isInData = visibleSequence.includes(dot.id);

                // Base dot
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = `#ffffff33`;
                ctx.fill();

                // Active overlay
                if (isInData) {
                    ctx.beginPath();
                    ctx.arc(dot.x, dot.y, DOT_RADIUS - 5, 0, Math.PI * 2);
                    ctx.fillStyle = `#ffffff`;
                    ctx.fill();
                }
            }

            // 4. UI
            ctx.fillStyle = `white`;
            ctx.font = `40px sans-serif`;
            ctx.textAlign = `center`;
            if (phase === `memorize`) {
                ctx.fillText(`Watch...`, GAME_WIDTH / 2, MARGIN / 2);
            } else if (phase === `input`) {
                ctx.fillText(`Repeat!`, GAME_WIDTH / 2, MARGIN / 2);
            }

            ctx.textAlign = `right`;
            ctx.font = `30px sans-serif`;
            ctx.fillText(`Lives: ${lives}`, GAME_WIDTH - 50, 60);

            ctx.restore();
            animId = requestAnimationFrame(render);
        };

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
            wasTouchingDot = false;
            checkHit(pos);
        };

        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isRunning || phase !== `input`) return;
            e.preventDefault();
            const pos = calculatePointerPos(canvas, gameSize, e);
            currentDragPos = pos;
            if (inputSequence.length > 0) checkHit(pos);
        };

        const handleUp = (e: MouseEvent | TouchEvent) => {
            if (!isRunning || phase !== `input`) return;
            e.preventDefault();
            currentDragPos = null;
            validatePattern();
        };

        let wasTouchingDot = false;
        const checkHit = (pos: { x: number, y: number }) => {
            let hasTouchedDot = false;
            for (const dot of dots) {

                const dist = Math.hypot(pos.x - dot.x, pos.y - dot.y);
                if (dist < HIT_RADIUS) {
                    hasTouchedDot = true;
                    if (wasTouchingDot) {
                        continue;
                    }

                    if (inputSequence.length > 1 && inputSequence[inputSequence.length - 1] === dot.id) {
                        // remove dot
                        wasTouchingDot = true;
                        inputSequence.pop();
                        continue;
                    }
                    if (inputSequence.includes(dot.id)) {
                        continue;
                    }

                    wasTouchingDot = true;
                    inputSequence.push(dot.id);
                }
            }

            if (!hasTouchedDot) {
                wasTouchingDot = false;
            }
        };

        let wasCorrect = true;
        const validatePattern = () => {
            if (inputSequence.length === 0) return;

            // Check correctness (normal or reverse)
            const isCorrect =
                inputSequence.length === targetSequence.length &&
                (inputSequence.every((val, index) => val === targetSequence[index])
                    || inputSequence.every((val, index) => val === targetSequence[inputSequence.length - 1 - index]));

            wasCorrect = isCorrect;
            if (isCorrect) {
                feedbackColor = `#00ff88`;
                roundTimes.push(Date.now() - phaseStartTime);
            } else {
                feedbackColor = `#ff4b4b`;
                lives--;
            }

            phase = `feedback`;
            phaseStartTime = Date.now();
        };

        const finish = (kind: `completed` | `stopped`) => {
            if (doneSubject.lastValue) return;
            const totalTime = roundTimes.reduce((a, b) => a + b, 0);
            const avg = roundTimes.length > 0 ? totalTime / roundTimes.length : 0;

            doneSubject.next({
                kind,
                result: {
                    roundsCompleted: Math.max(0, round - (lives <= 0 ? 0 : 1)),
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