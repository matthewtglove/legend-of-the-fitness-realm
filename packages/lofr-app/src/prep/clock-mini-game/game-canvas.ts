// pocketWatchGame.ts

import watchImage from './assets/watch.png';
import { renderEnergyScene } from '../../mini-game/games/energy-bar/energy-bar';

export type GameControl = ReturnType<typeof createPocketWatchGame>;

export interface TimeTarget {
    hour: number;   // 1-12 or 0-23
    minute: number; // 0-59
}

export const createPocketWatchGame = (
    canvas: HTMLCanvasElement,
    targetTime: TimeTarget,
    onSetTime?: (isCorrect: boolean) => void
) => {
    const ctx = canvas.getContext(`2d`);

    if (!ctx) {
        throw new Error(`Could not get 2D context`);
    }

    // --- Buffer Setup (Pixel Perfect) ---
    const GAME_SIZE = 256;
    const bufferCanvas = document.createElement(`canvas`);
    bufferCanvas.width = GAME_SIZE;
    bufferCanvas.height = GAME_SIZE;
    const bufferCtx = bufferCanvas.getContext(`2d`);

    if (!bufferCtx) {
        throw new Error(`Could not get Buffer 2D context`);
    }

    let attempts = 0;

    const bgImage = new Image();
    bgImage.src = watchImage;

    // --- Configuration ---
    // Ratios based on the original 1024px source image
    const bgWatchCenterX = 500;
    const bgWatchCenterY = 612;
    const bgWatchRatioX = bgWatchCenterX / 1024;
    const bgWatchRatioY = bgWatchCenterY / 1024;
    const watchRadiusRatio = 0.4; // 40% of the game size

    // Shadow offset in Buffer Pixels
    const SHADOW_OFFSET_X = 2;
    const SHADOW_OFFSET_Y = 3;

    // --- Math Constants ---
    const TWO_PI = Math.PI * 2;
    const OFFSET = -Math.PI / 2; // -90deg to make 0rad = 12 o'clock

    // --- Game State ---
    let animationId: number;

    // Buffer Coordinates
    let targetCenterX = 0;
    let targetCenterY = 0;

    // Interaction State
    let isDragging = false;
    let draggingHand: `hour` | `minute` | null = null;
    let lastDragAngle = 0;
    let lastPointerPos = { x: 0, y: 0 };

    // Target Calculation (Converted to 0-720 scale)
    const tH = targetTime.hour % 12;
    const tM = targetTime.minute;
    const targetTotalMinutes = (tH * 60) + tM;

    // SINGLE SOURCE OF TRUTH:
    // timeMin represents the current time in minutes (0 to 720)
    let timeMin = (targetTotalMinutes + Math.random() * 660 + 60) % 720;

    let alarmTimeMin = 0;

    let mode = `clock` as `clock` | `energy` | `energy-done`;
    // let mode = `energy` as `clock` | `energy`;
    let energyLevel = 0;

    // Tolerance: +/- 3 minutes to win
    const WIN_TOLERANCE_MINUTES = 3;

    // --- Helpers ---
    const normalizeMinutes = (m: number) => {
        return ((m % 720) + 720) % 720;
    };

    const getMinuteDiff = (m1: number, m2: number) => {
        const diff = Math.abs(normalizeMinutes(m1) - normalizeMinutes(m2));
        return Math.min(diff, 720 - diff);
    };

    const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Ensure Main Canvas keeps sharp edges when scaling up the buffer
        ctx.imageSmoothingEnabled = false;
    };

    // Helper to get the visual layout on the screen
    // We need this for both Drawing and Input mapping
    const getLayout = (size = undefined as undefined | { width: number, height: number }) => {
        size = size || { width: canvas.width, height: canvas.height };
        const scale = Math.min(size.width / GAME_SIZE, size.height / GAME_SIZE);
        const width = GAME_SIZE * scale;
        const height = GAME_SIZE * scale;
        const x = (size.width - width) / 2;
        const y = (size.height - height) / 2;
        return { x, y, width, height, scale };
    };

    const getPointerPos = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // 1. Get raw client coordinates
        const clientX = `touches` in e ? e.touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
        const clientY = `touches` in e ? e.touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY;

        // 2. Convert to Physical Canvas Coordinates (accounting for DPR)
        const physicalX = (clientX - rect.left) * dpr;
        const physicalY = (clientY - rect.top) * dpr;

        // 3. Map Physical Coords to Buffer Coords using the Aspect Ratio Layout
        const layout = getLayout(rect);

        // (Physical Mouse - Offset) / Scale = Buffer Coordinate
        const bufferX = (physicalX - layout.x) / layout.scale;
        const bufferY = (physicalY - layout.y) / layout.scale;

        return {
            x: bufferX,
            y: bufferY,
        };
    };

    // --- Rendering Helpers (Targeting Buffer) ---
    const drawTargetTick = (angle: number, length: number, thickness: number, color: string, radius: number) => {
        bufferCtx.save();
        bufferCtx.translate(targetCenterX, targetCenterY);
        bufferCtx.rotate(angle);
        bufferCtx.fillStyle = color;
        bufferCtx.fillRect(radius, -thickness / 2, length, thickness);
        bufferCtx.restore();
    };

    // --- PIXEL ART DRAWING HELPERS ---

    // Bresenham's Line Algorithm for integers
    const markPixelLine = (
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        thickness: number
    ) => {
        // Round to align with buffer grid
        let x = Math.round(x0);
        let y = Math.round(y0);
        const endX = Math.round(x1);
        const endY = Math.round(y1);

        const dx = Math.abs(endX - x);
        const dy = Math.abs(endY - y);
        const sx = (x < endX) ? 1 : -1;
        const sy = (y < endY) ? 1 : -1;
        let err = dx - dy;

        const pixelsToDraw = new Set<string>();
        let loops = 0;

        while (loops < 1000) {
            // Add thickness
            for (let tx = 0; tx < thickness; tx++) {
                for (let ty = 0; ty < thickness; ty++) {
                    pixelsToDraw.add(`${x + tx},${y + ty}`);
                }
            }

            if (x === endX && y === endY) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
            loops++;
        }

        return pixelsToDraw;
    };

    const drawPixels = (pixelsToDraw: Set<string>, color: string, offset: [number, number]) => {
        bufferCtx.fillStyle = color;
        pixelsToDraw.forEach(key => {
            const [gx, gy] = key.split(`,`).map(Number) as [number, number];
            // Draw 1x1 pixel on the buffer
            bufferCtx.fillRect(gx + offset[0], gy + offset[1], 1, 1);
        });
    };

    const drawPixelHand = (
        centerX: number,
        centerY: number,
        angle: number,
        length: number,
        width: number,
        color: string,
        type: `hour` | `minute`
    ) => {
        const startX = centerX - Math.cos(angle) * length * 0.15;
        const startY = centerY - Math.sin(angle) * length * 0.15;

        const endX = centerX + Math.cos(angle) * length;
        const endY = centerY + Math.sin(angle) * length;

        const pixelsToDraw = (() => {
            const spread = type === `minute` ? 0.25 : 0.5;
            const radOffset = 0.05 * Math.PI;

            const halfXA = centerX + Math.cos(angle + radOffset) * length * spread;
            const halfXB = centerX + Math.cos(angle - radOffset) * length * spread;
            const halfYA = centerY + Math.sin(angle + radOffset) * length * spread;
            const halfYB = centerY + Math.sin(angle - radOffset) * length * spread;

            const p1 = markPixelLine(startX, startY, halfXA, halfYA, width);
            const p2 = markPixelLine(halfXA, halfYA, endX, endY, width);
            const p3 = markPixelLine(startX, startY, halfXB, halfYB, width);
            const p4 = markPixelLine(halfXB, halfYB, endX, endY, width);

            return new Set<string>([...p1, ...p2, ...p3, ...p4]);
        })();

        // 1. Draw Shadow
        drawPixels(pixelsToDraw, `rgba(0,0,0,0.4)`, [SHADOW_OFFSET_X, SHADOW_OFFSET_Y]);

        // 2. Draw Actual Hand
        drawPixels(pixelsToDraw, color, [0, 0]);
    };

    // --- Interaction Handlers ---
    const handleStart = (e: MouseEvent | TouchEvent) => {
        const { x, y } = lastPointerPos = getPointerPos(e); // returns Buffer Coordinates
        const dx = x - targetCenterX;
        const dy = y - targetCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // switch to energy mode if already turned back from alarm mode
        const actualTimeMin = normalizeMinutes(new Date().getHours() * 60 + new Date().getMinutes());
        if (mode === `energy-done`) {
            timeMin = 0;
            mode = `clock`;
            return;
        }

        if (Math.abs(timeMin - actualTimeMin) <= 2) {
            energyLevel = 0;
            mode = `energy`;
            return;
        }

        // Touch radius relative to Buffer Size
        const touchRadius = 0.5 * GAME_SIZE * watchRadiusRatio;

        isDragging = true;
        lastDragAngle = Math.atan2(dy, dx);

        if (dist < touchRadius * 0.5) {
            draggingHand = `hour`;
        } else {
            draggingHand = `minute`;
        }
    };

    const handleEnd = () => {
        isDragging = false;
        draggingHand = null;

        attempts++;
        alarmTimeMin = 0;

        const diff = getMinuteDiff(timeMin, targetTotalMinutes);
        const isCorrect = diff < WIN_TOLERANCE_MINUTES;
        onSetTime?.(isCorrect);
        if (isCorrect) {
            timeMin = targetTotalMinutes;
            alarmTimeMin = targetTotalMinutes;
            attempts = 0;
        }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging || !draggingHand) return;
        if (e.type === `touchmove`) e.preventDefault();

        const { x, y } = lastPointerPos = getPointerPos(e);
        const currentDragAngle = Math.atan2(y - targetCenterY, x - targetCenterX);

        let deltaRads = currentDragAngle - lastDragAngle;

        while (deltaRads > Math.PI) deltaRads -= TWO_PI;
        while (deltaRads < -Math.PI) deltaRads += TWO_PI;

        let deltaMinutes = 0;

        if (draggingHand === `minute`) {
            deltaMinutes = (deltaRads / TWO_PI) * 60;
        } else {
            deltaMinutes = (deltaRads / TWO_PI) * 720;
        }

        timeMin += deltaMinutes;
        timeMin = normalizeMinutes(timeMin);

        lastDragAngle = currentDragAngle;
    };

    // --- Main Draw Loop ---
    const draw = () => {
        // 1. CLEAR BUFFER
        bufferCtx.clearRect(0, 0, GAME_SIZE, GAME_SIZE);

        // Calculate Layout on Buffer
        targetCenterX = GAME_SIZE * bgWatchRatioX;
        targetCenterY = GAME_SIZE * bgWatchRatioY;
        const drawSize = GAME_SIZE;

        // 2. DRAW BACKGROUND TO BUFFER
        if (bgImage.complete && bgImage.naturalWidth > 0) {
            bufferCtx.save();
            bufferCtx.translate(GAME_SIZE / 2, GAME_SIZE / 2);
            bufferCtx.drawImage(bgImage, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
            bufferCtx.restore();
        } else {
            bufferCtx.beginPath();
            bufferCtx.arc(targetCenterX, targetCenterY, drawSize * 0.4, 0, TWO_PI);
            bufferCtx.fillStyle = `#222`;
            bufferCtx.fill();
        }

        // 3. Render Targets
        const targetMinuteAngle = ((targetTotalMinutes % 60) / 60) * TWO_PI + OFFSET;
        const targetHourAngle = (targetTotalMinutes / 720) * TWO_PI + OFFSET;
        const radius = drawSize * 0.5 * watchRadiusRatio;

        if (attempts > 3) {
            drawTargetTick(targetMinuteAngle, 8, 2, `#4caf50`, radius);
            drawTargetTick(targetHourAngle, 6, 3, `#81c784`, radius * 0.6);
        }

        if (alarmTimeMin) {
            const targetHourAngle = (alarmTimeMin / 720) * TWO_PI + OFFSET;
            drawTargetTick(targetHourAngle, 12, 4, `#af4c50`, radius * 0.6);

            // slowly move timeMin to actual time
            const actualTimeMin = normalizeMinutes(new Date().getHours() * 60 + new Date().getMinutes());
            // console.log({ actualTimeMin, timeMin });
            if (Math.abs(timeMin - actualTimeMin) <= 2) {
                timeMin = actualTimeMin;
            }

            if (timeMin !== actualTimeMin) {
                timeMin--;
                timeMin = normalizeMinutes(timeMin);
            }


            // draw sleep cycle indicator (every 90 minutes backwards from alarmTimeMin)
            for (let cycle = 1; cycle <= 6; cycle++) {
                const sleepCycleTime = normalizeMinutes(alarmTimeMin - cycle * 90);
                if (normalizeMinutes(sleepCycleTime - alarmTimeMin) < normalizeMinutes(timeMin - alarmTimeMin)) break;

                const sleepCycleAngle = (sleepCycleTime / 720) * TWO_PI + OFFSET;
                drawTargetTick(sleepCycleAngle, 8, 2, `#4c4c4c`, radius * 0.5);
            }

        }

        // 4. Render Current Hands
        const currentMinuteAngle = ((timeMin % 60) / 60) * TWO_PI + OFFSET;
        const currentHourAngle = (timeMin / 720) * TWO_PI + OFFSET;

        drawPixelHand(
            targetCenterX,
            targetCenterY,
            currentHourAngle,
            radius * 0.6,
            2,
            `#182827`,
            `hour`
        );

        drawPixelHand(
            targetCenterX,
            targetCenterY,
            currentMinuteAngle,
            radius,
            2,
            `#182827`,
            `minute`
        );

        // 5. Center Pin
        bufferCtx.save();
        bufferCtx.translate(targetCenterX + 2, targetCenterY + 2);
        bufferCtx.fillStyle = `#111`;
        bufferCtx.beginPath();
        bufferCtx.arc(0, 0, 3, 0, TWO_PI);
        bufferCtx.fill();
        bufferCtx.fillStyle = `#555`;
        bufferCtx.beginPath();
        bufferCtx.arc(-1, -1, 1, 0, TWO_PI);
        bufferCtx.fill();
        bufferCtx.restore();

        const drawEnergyBar = mode === `energy` || mode === `energy-done`;
        if (drawEnergyBar) {
            const maxEnergyLevel = 100;

            if (energyLevel < maxEnergyLevel) {
                energyLevel += 0.5;
            } else {
                mode = `energy-done`;
            }


            bufferCtx.save();
            bufferCtx.globalAlpha = 0.2 + 0.8 * (energyLevel / maxEnergyLevel);
            renderEnergyScene(bufferCanvas, bufferCtx, {
                width: bufferCanvas.width,
                height: bufferCanvas.height,
                percentage: energyLevel,
                jitterIntensity: 3 * (energyLevel / 100),
            });
            bufferCtx.restore();
        }

        // draw cursor
        if (isDragging) {
            bufferCtx.save();
            const { x, y } = lastPointerPos;
            bufferCtx.translate(x, y);
            bufferCtx.fillStyle = `#555555`;
            bufferCtx.beginPath();
            bufferCtx.arc(0, 0, 3, 0, TWO_PI);
            bufferCtx.fill();
            bufferCtx.restore();
        }

        // --- FINAL STEP: BLIT TO SCREEN ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate aspect-ratio fit
        const layout = getLayout();

        // Draw the buffer centered and scaled
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            bufferCanvas,
            layout.x,
            layout.y,
            layout.width,
            layout.height
        );
    };

    const loop = () => {
        draw();
        animationId = requestAnimationFrame(loop);
    };

    return {
        start: () => {
            window.addEventListener(`resize`, resize);
            canvas.addEventListener(`mousedown`, handleStart);
            window.addEventListener(`mousemove`, handleMove);
            window.addEventListener(`mouseup`, handleEnd);
            canvas.addEventListener(`touchstart`, handleStart);
            canvas.addEventListener(`touchmove`, handleMove, { passive: false });
            window.addEventListener(`touchend`, handleEnd);
            resize();
            loop();
        },
        stop: () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener(`resize`, resize);
            canvas.removeEventListener(`mousedown`, handleStart);
            window.removeEventListener(`mousemove`, handleMove);
            window.removeEventListener(`mouseup`, handleEnd);
            canvas.removeEventListener(`touchstart`, handleStart);
            canvas.removeEventListener(`touchmove`, handleMove);
            window.removeEventListener(`touchend`, handleEnd);
        },
        toggleMode: () => {
            mode = mode === `energy` || mode === `energy-done` ? `clock` : `energy`;
            energyLevel = 0;
        }
    };
};