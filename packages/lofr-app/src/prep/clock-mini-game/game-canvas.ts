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
    onSuccess?: () => void
): GameControl => {
    const ctx = canvas.getContext(`2d`);

    if (!ctx) {
        throw new Error(`Could not get 2D context`);
    }

    const bgImage = new Image();
    bgImage.src = watchImage;

    // --- Configuration ---
    const bgWatchCenterX = 508;
    const bgWatchCenterY = 618;
    const bgWatchRatioX = bgWatchCenterX / 1024;
    const bgWatchRatioY = bgWatchCenterY / 1024;
    const watchRadiusRatio = 0.4;

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

    // SINGLE SOURCE OF TRUTH:
    // timeMin represents the current time in minutes (0 to 720)
    // 0 = 12:00, 360 = 6:00, 720 = 12:00
    let timeMin = Math.random() * 720;

    // Interaction State
    let isDragging = false;
    let draggingHand: `hour` | `minute` | null = null;
    let lastDragAngle = 0;

    // Target Calculation (Converted to 0-720 scale)
    const tH = targetTime.hour % 12;
    const tM = targetTime.minute;
    const targetTotalMinutes = (tH * 60) + tM;

    // Tolerance: +/- 3 minutes to win
    const WIN_TOLERANCE_MINUTES = 3;

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

    const drawHandShape = (length: number, width: number, type: `hour` | `minute`) => {
        if (type === `minute`) {
            // Long Sword Style
            ctx.fillRect(0, -width / 2, length - 10, width);
            ctx.fillRect(length - 10, -width / 2 + 2, 10, width - 4);
            ctx.fillRect(-15, -width / 2 - 2, 15, width + 4);
        } else {
            // Stout Diamond Style
            ctx.fillRect(0, -width / 2, length - 15, width);
            ctx.fillRect(length - 15, -width, 15, width * 2);
            ctx.fillRect(length, -width / 2, 4, width);
        }
    };

    const drawPixelHand = (
        x: number,
        y: number,
        angle: number,
        length: number,
        width: number,
        color: string,
        type: `hour` | `minute`
    ) => {
        ctx.save();
        ctx.translate(x + SHADOW_OFFSET_X, y + SHADOW_OFFSET_Y);
        ctx.rotate(angle);
        ctx.fillStyle = `rgba(0, 0, 0, 0.4)`;
        drawHandShape(length, width, type);
        ctx.restore();

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        drawHandShape(length, width, type);
        ctx.restore();
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

        // Win Condition: Check if current timeMin is close to targetTotalMinutes
        const diff = getMinuteDiff(timeMin, targetTotalMinutes);

        if (diff < WIN_TOLERANCE_MINUTES) {
            if (onSuccess) onSuccess();
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
        const drawSize = minDim * 0.9;

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
        drawTargetTick(targetMinuteAngle, 20, 6, `#4caf50`, radius);
        drawTargetTick(targetHourAngle, 15, 8, `#81c784`, radius * 0.6);

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
            12,
            `#cb9c63`,
            `hour`
        );

        drawPixelHand(
            targetCenterX,
            targetCenterY,
            currentMinuteAngle,
            radius,
            8,
            `#384847`,
            `minute`
        );

        // 4. Center Pin
        ctx.save();
        ctx.translate(targetCenterX, targetCenterY);
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