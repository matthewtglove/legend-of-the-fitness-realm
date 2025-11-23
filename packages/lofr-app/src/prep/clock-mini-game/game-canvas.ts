// pocketWatchGame.ts

import watchImage from './assets/watch.png';

export interface GameControl {
    start: () => void;
    stop: () => void;
}

export interface TimeTarget {
    hour: number;   // 1-12 or 0-23
    minute: number; // 0-59
}

export const createPocketWatchGame = (
    canvas: HTMLCanvasElement,
    targetTime: TimeTarget,
    onSetTime?: (isCorrect: boolean) => void
): GameControl => {
    const ctx = canvas.getContext(`2d`);

    if (!ctx) {
        throw new Error(`Could not get 2D context`);
    }

    let attempts = 0

    const bgImage = new Image();
    bgImage.src = watchImage;

    // --- Configuration ---
    const bgWatchCenterX = 506;
    const bgWatchCenterY = 614;
    const bgWatchRatioX = bgWatchCenterX / 1024;
    const bgWatchRatioY = bgWatchCenterY / 1024;
    const watchRadiusRatio = 0.4;
    const WATCH_IMAGE_SIZE_RATIO = 1.0;
    let backgroundImageScale = 1;
    const backgroundImagePixelSize = 4;

    const SHADOW_OFFSET_X = 6;
    const SHADOW_OFFSET_Y = 6;

    // --- Math Constants ---
    const TWO_PI = Math.PI * 2;
    const OFFSET = -Math.PI / 2; // -90deg to make 0rad = 12 o'clock

    // --- Game State ---
    let animationId: number;
    let canvasCenterX = 0;
    let canvasCenterY = 0;
    let targetCenterX = 0;
    let targetCenterY = 0;



    // Interaction State
    let isDragging = false;
    let draggingHand: `hour` | `minute` | null = null;
    let lastDragAngle = 0;

    // Target Calculation (Converted to 0-720 scale)
    const tH = targetTime.hour % 12;
    const tM = targetTime.minute;
    const targetTotalMinutes = (tH * 60) + tM;

    // SINGLE SOURCE OF TRUTH:
    // timeMin represents the current time in minutes (0 to 720)
    // 0 = 12:00, 360 = 6:00, 720 = 12:00
    let timeMin = (targetTotalMinutes + Math.random() * 660 + 60) % 720; // Start 1-6 hours away from target

    // Tolerance: +/- 3 minutes to win
    const WIN_TOLERANCE_MINUTES = 1;

    // --- Helpers ---
    const normalizeMinutes = (m: number) => {
        return ((m % 720) + 720) % 720;
    };

    // Calculate shortest distance between two times on a 12h clock
    const getMinuteDiff = (m1: number, m2: number) => {
        const diff = Math.abs(normalizeMinutes(m1) - normalizeMinutes(m2));
        return Math.min(diff, 720 - diff);
    };

    const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = false;
        canvasCenterX = rect.width / 2;
        canvasCenterY = rect.height / 2;
    };

    const getPointerPos = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = `touches` in e ? e.touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
        const clientY = `touches` in e ? e.touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    // --- Rendering Helpers ---
    const drawTargetTick = (angle: number, length: number, thickness: number, color: string, radius: number) => {
        ctx.save();
        ctx.translate(targetCenterX, targetCenterY);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.fillRect(radius, -thickness / 2, length, thickness);
        ctx.restore();
    };


    // --- PIXEL ART DRAWING HELPERS ---

    const markPixelLine = (
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        pixelSize: number,
        thickness: number
    ) => {
        // 1. Convert raw canvas coordinates to "Logical Grid" coordinates
        let x = Math.round(x0 / pixelSize);
        let y = Math.round(y0 / pixelSize);
        const endX = Math.round(x1 / pixelSize);
        const endY = Math.round(y1 / pixelSize);

        // 2. Bresenham's Line Algorithm Setup
        const dx = Math.abs(endX - x);
        const dy = Math.abs(endY - y);
        const sx = (x < endX) ? 1 : -1;
        const sy = (y < endY) ? 1 : -1;
        let err = dx - dy;

        // 3. Use a Set to store unique grid coordinates
        // This solves the "Darker Shadow" overlap issue perfectly.
        const pixelsToDraw = new Set<string>();

        // eslint-disable-next-line no-constant-condition
        let attempts = 0

        while (attempts < 10000) {
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

            attempts++;
        }

        return pixelsToDraw;
    };

    const drawPixels = (pixelsToDraw: Set<string>, color: string, pixelSize: number, offset: [number, number]) => {
        // 4. Render with "Snap-to-Neighbor" Logic
        ctx.fillStyle = color;

        pixelsToDraw.forEach(key => {
            const [gxRaw, gyRaw] = key.split(`,`).map(Number) as [number, number];
            const gx = gxRaw + offset[0];
            const gy = gyRaw + offset[1];

            // THE FIX FOR GRAY LINES:
            // Instead of: ctx.fillRect(gx * size, gy * size, size, size)
            // We calculate the exact Integer start and the exact Integer end.
            // This forces the browser to fill every pixel between them with no gaps.

            const xStart = Math.floor(gx * pixelSize);
            const yStart = Math.floor(gy * pixelSize);

            // Calculate where the NEXT pixel would start, and subtract current start
            // This handles cases where pixelSize is a float (e.g. 3.333)
            const width = Math.floor((gx + 1) * pixelSize) - xStart;
            const height = Math.floor((gy + 1) * pixelSize) - yStart;

            ctx.fillRect(xStart, yStart, width, height);
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
        const endX = centerX + Math.cos(angle) * length;
        const endY = centerY + Math.sin(angle) * length;

        const thickness = width;

        // Ensure these match your external scope variables
        const pixelSize = backgroundImagePixelSize * backgroundImageScale;

        const pixelsToDraw = type === `minute` ? (() => {
            // diamond shape for hour hand
            const halfXA = centerX + Math.cos(angle + Math.PI * 0.05) * length * 0.25;
            const halfXB = centerX + Math.cos(angle - Math.PI * 0.05) * length * 0.25;
            const halfYA = centerY + Math.sin(angle + Math.PI * 0.05) * length * 0.25;
            const halfYB = centerY + Math.sin(angle - Math.PI * 0.05) * length * 0.25;

            const p1 = markPixelLine(
                centerX,
                centerY,
                halfXA,
                halfYA,
                pixelSize,
                thickness);
            const p2 = markPixelLine(
                halfXA,
                halfYA,
                endX,
                endY,
                pixelSize,
                thickness);
            const p3 = markPixelLine(
                centerX,
                centerY,
                halfXB,
                halfYB,
                pixelSize,
                thickness);
            const p4 = markPixelLine(
                halfXB,
                halfYB,
                endX,
                endY,
                pixelSize,
                thickness);

            const combined = new Set<string>([...p1, ...p2, ...p3, ...p4]);
            return combined;
        })() : (() => {
            // diamond shape for hour hand
            const halfXA = centerX + Math.cos(angle + Math.PI * 0.05) * length * 0.5;
            const halfXB = centerX + Math.cos(angle - Math.PI * 0.05) * length * 0.5;
            const halfYA = centerY + Math.sin(angle + Math.PI * 0.05) * length * 0.5;
            const halfYB = centerY + Math.sin(angle - Math.PI * 0.05) * length * 0.5;

            const p1 = markPixelLine(
                centerX,
                centerY,
                halfXA,
                halfYA,
                pixelSize,
                thickness);
            const p2 = markPixelLine(
                halfXA,
                halfYA,
                endX,
                endY,
                pixelSize,
                thickness);
            const p3 = markPixelLine(
                centerX,
                centerY,
                halfXB,
                halfYB,
                pixelSize,
                thickness);
            const p4 = markPixelLine(
                halfXB,
                halfYB,
                endX,
                endY,
                pixelSize,
                thickness);

            const combined = new Set<string>([...p1, ...p2, ...p3, ...p4]);
            return combined;
        })();

        // 1. Draw Shadow
        drawPixels(pixelsToDraw, `rgba(0,0,0,0.4)`, pixelSize, [SHADOW_OFFSET_X / pixelSize, SHADOW_OFFSET_Y / pixelSize]);

        // 2. Draw Actual Hand
        drawPixels(pixelsToDraw, color, pixelSize, [0, 0]);
    };

    // --- Interaction Handlers ---
    const handleStart = (e: MouseEvent | TouchEvent) => {
        const { x, y } = getPointerPos(e);
        const dx = x - targetCenterX;
        const dy = y - targetCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const minDim = Math.min(canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
        const touchRadius = 0.5 * minDim * watchRadiusRatio;

        isDragging = true;
        lastDragAngle = Math.atan2(dy, dx);

        // Logic: Grab Hour hand if close to center, Minute hand if further out
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

        const diff = getMinuteDiff(timeMin, targetTotalMinutes);
        const isCorrect = diff < WIN_TOLERANCE_MINUTES;
        onSetTime?.(isCorrect)
        if (isCorrect) {
            timeMin = targetTotalMinutes;
            attempts = 0;
        }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging || !draggingHand) return;
        if (e.type === `touchmove`) e.preventDefault();

        const { x, y } = getPointerPos(e);
        const currentDragAngle = Math.atan2(y - targetCenterY, x - targetCenterX);

        // 1. Calculate how much the FINGER moved in Radians
        let deltaRads = currentDragAngle - lastDragAngle;

        // Handle logical wrap-around (e.g., crossing from PI to -PI)
        while (deltaRads > Math.PI) deltaRads -= TWO_PI;
        while (deltaRads < -Math.PI) deltaRads += TWO_PI;

        // 2. Convert Radians to Minutes
        // If we drag the minute hand: 2PI (360deg) = 60 minutes
        // If we drag the hour hand:   2PI (360deg) = 720 minutes (12 hours)
        let deltaMinutes = 0;

        if (draggingHand === `minute`) {
            deltaMinutes = (deltaRads / TWO_PI) * 60;
        } else {
            deltaMinutes = (deltaRads / TWO_PI) * 720;
        }

        // 3. Update State
        timeMin += deltaMinutes;
        timeMin = normalizeMinutes(timeMin); // Keep it 0-720

        lastDragAngle = currentDragAngle;
    };

    // --- Main Draw Loop ---
    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const minDim = Math.min(canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
        backgroundImageScale = Math.min(bgImage.width / canvas.width, bgImage.height / canvas.height);
        const drawSize = minDim * WATCH_IMAGE_SIZE_RATIO;

        targetCenterX = canvasCenterX + (bgWatchRatioX - 0.5) * drawSize;
        targetCenterY = canvasCenterY + (bgWatchRatioY - 0.5) * drawSize;

        // 1. Background
        if (bgImage.complete && bgImage.naturalWidth > 0) {
            ctx.save();
            ctx.translate(canvasCenterX, canvasCenterY);
            ctx.drawImage(bgImage, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.arc(targetCenterX, targetCenterY, drawSize / 2.5, 0, TWO_PI);
            ctx.fillStyle = `#222`;
            ctx.fill();
        }

        // 2. Render Targets
        // Convert Target Minutes -> Radians
        const targetMinuteAngle = ((targetTotalMinutes % 60) / 60) * TWO_PI + OFFSET;
        const targetHourAngle = (targetTotalMinutes / 720) * TWO_PI + OFFSET;

        const radius = drawSize * 0.5 * watchRadiusRatio;

        if (attempts > 3) {
            drawTargetTick(targetMinuteAngle, 20, 6, `#4caf50`, radius);
            drawTargetTick(targetHourAngle, 15, 8, `#81c784`, radius * 0.6);
        }

        // 3. Render Current Hands from timeMin

        // Minute Hand Angle: (Minutes component only / 60) * 360deg
        const currentMinuteAngle = ((timeMin % 60) / 60) * TWO_PI + OFFSET;

        // Hour Hand Angle: (Total Minutes / 720) * 360deg
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

        // 4. Center Pin
        ctx.save();
        ctx.translate(targetCenterX + 2, targetCenterY + 2);
        ctx.fillStyle = `#111`;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, TWO_PI);
        ctx.fill();
        ctx.fillStyle = `#555`;
        ctx.beginPath();
        ctx.arc(-2, -2, 2, 0, TWO_PI);
        ctx.fill();
        ctx.restore();
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
    };
};