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
    // Adjust these based on your specific PNG asset to center the rotation point
    const bgWatchCenterX = 508;
    const bgWatchCenterY = 618;
    const bgWatchRatioX = bgWatchCenterX / 1024;
    const bgWatchRatioY = bgWatchCenterY / 1024;
    const watchRadiusRatio = 0.4;

    // --- Game State ---
    let animationId: number;
    let canvasCenterX = 0;
    let canvasCenterY = 0;
    let targetCenterX = 0;
    let targetCenterY = 0;

    // Hand State
    let currentHourAngle = Math.random() * Math.PI * 2; // Start random
    let currentMinuteAngle = Math.random() * Math.PI * 2;

    // Interaction State
    let isDragging = false;
    let draggingHand: `hour` | `minute` | null = null;

    // Calculate Target Angles (Correcting for Canvas 0-angle being 3 o'clock)
    // 0 rad = 3 o'clock. 
    // -PI/2 = 12 o'clock.
    const RAD_PER_HOUR = (Math.PI * 2) / 12;
    const RAD_PER_MIN = (Math.PI * 2) / 60;
    const OFFSET = -Math.PI / 2; // Rotate so 0 is at 12 o'clock for calculation, then apply

    // Target Math
    const tH = targetTime.hour % 12;
    const tM = targetTime.minute;

    // Important: Hour hand includes minute offset (e.g. at 6:30, hour hand is halfway between 6 and 7)
    const targetHourAngle = (tH * RAD_PER_HOUR) + (tM / 60) * RAD_PER_HOUR + OFFSET;
    const targetMinuteAngle = (tM * RAD_PER_MIN) + OFFSET;

    const MARGIN_ERROR = 0.15; // Radians (~8 degrees)

    // --- Helpers ---

    // Normalize angle to -PI to PI for easier comparison
    const normalizeAngle = (a: number) => {
        let angle = a % (Math.PI * 2);
        if (angle > Math.PI) angle -= Math.PI * 2;
        if (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    };

    const getAngleDiff = (a1: number, a2: number) => {
        const diff = Math.abs(normalizeAngle(a1) - normalizeAngle(a2));
        return Math.min(diff, Math.PI * 2 - diff); // Handle wrap-around
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
        ctx.rotate(angle);
        ctx.fillStyle = color;
        // Draw a marker at the edge of the radius
        ctx.fillRect(radius, -thickness / 2, length, thickness);
        ctx.restore();
    };

    const drawPixelHand = (
        angle: number,
        length: number,
        width: number,
        color: string,
        type: `hour` | `minute`
    ) => {
        ctx.save();
        ctx.rotate(angle);

        ctx.fillStyle = `rgba(0,0,0,0.5)`; // Shadow
        ctx.fillRect(4, 4, length, width);

        ctx.fillStyle = color;

        if (type === `minute`) {
            // Long Sword Style
            ctx.fillRect(0, -width / 2, length - 10, width); // Shaft
            ctx.fillRect(length - 10, -width / 2 + 2, 10, width - 4); // Tip
            ctx.fillRect(-15, -width / 2 - 2, 15, width + 4); // Counterweight
        } else {
            // Stout Diamond Style
            ctx.fillRect(0, -width / 2, length - 15, width); // Shaft
            // Diamond Tip
            ctx.fillRect(length - 15, -width, 15, width * 2);
            ctx.fillRect(length, -width / 2, 4, width);
        }

        ctx.restore();
    };

    // --- Interaction Handlers ---
    const handleStart = (e: MouseEvent | TouchEvent) => {
        const { x, y } = getPointerPos(e);
        const dx = x - targetCenterX;
        const dy = y - targetCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Logic: Distance determines which hand you grab
        // Scale distance based on canvas size for responsiveness
        const minDim = Math.min(canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
        const touchRadius = 0.5 * minDim * watchRadiusRatio;

        // If touching near center -> Hour Hand
        // If touching near edge -> Minute Hand
        if (dist < touchRadius * 0.5) {
            draggingHand = `hour`;
        } else {
            draggingHand = `minute`;
        }

        isDragging = true;
        handleMove(e); // Snap immediately to touch
    };

    const handleEnd = () => {
        isDragging = false;
        draggingHand = null;

        // Win Condition: Both hands must be close to target
        const hDiff = getAngleDiff(currentHourAngle, targetHourAngle);
        const mDiff = getAngleDiff(currentMinuteAngle, targetMinuteAngle);

        if (hDiff < MARGIN_ERROR && mDiff < MARGIN_ERROR) {
            if (onSuccess) onSuccess();
        }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging || !draggingHand) return;
        if (e.type === `touchmove`) e.preventDefault();

        const { x, y } = getPointerPos(e);
        const angle = Math.atan2(y - targetCenterY, x - targetCenterX);

        if (draggingHand === `minute`) {
            currentMinuteAngle = angle;
        } else {
            currentHourAngle = angle;
        }
    };

    // --- Main Draw Loop ---
    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Responsive Calculation
        const minDim = Math.min(canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
        const drawSize = minDim * 0.9; // 90% of screen

        // Calculate the visual center where hands should attach
        targetCenterX = canvasCenterX + (bgWatchRatioX - 0.5) * drawSize;
        targetCenterY = canvasCenterY + (bgWatchRatioY - 0.5) * drawSize;

        // 1. Draw Background
        if (bgImage.complete && bgImage.naturalWidth > 0) {
            ctx.save();
            ctx.translate(canvasCenterX, canvasCenterY);
            ctx.drawImage(bgImage, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
            ctx.restore();
        } else {
            // Fallback
            ctx.beginPath();
            ctx.arc(targetCenterX, targetCenterY, drawSize / 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `#222`;
            ctx.fill();
        }

        ctx.save();
        ctx.translate(targetCenterX, targetCenterY);

        // 2. Draw Target Ticks (Underlay)
        // Minute Tick (Long, Outer)
        const radius = drawSize * 0.5 * watchRadiusRatio;
        drawTargetTick(targetMinuteAngle, 20, 6, `#4caf50`, radius);

        // Hour Tick (Short, Inner)
        drawTargetTick(targetHourAngle, 15, 8, `#81c784`, radius * 0.6);

        // 3. Draw Hands
        // Hour Hand (Short, Thick)
        drawPixelHand(currentHourAngle, radius * 0.6, 12, `#FFD700`, `hour`);

        // Minute Hand (Long, Thin)
        drawPixelHand(currentMinuteAngle, radius, 8, `#FFF`, `minute`);

        // 4. Center Pin
        ctx.fillStyle = `#111`;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `#555`; // Highlight
        ctx.beginPath();
        ctx.arc(-2, -2, 2, 0, Math.PI * 2);
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