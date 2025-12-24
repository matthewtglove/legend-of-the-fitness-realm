import { createObservable } from "../../systems/observable";
import { Animation } from "../animation-view";
import { drawPixelArtHair, PixelArtHairArgs, defaultHairArguments } from "./character-hair";

export type CharacterHairArgs = Partial<PixelArtHairArgs>;
export type CharacterHairResult = {
    // empty
};

export const characterHairAnimation: Animation<CharacterHairArgs, CharacterHairResult> = {
    setup: (canvasMain: HTMLCanvasElement) => {
        const canvas = document.createElement(`canvas`);
        canvas.width = 24;
        canvas.height = 32;

        const ctx = canvas.getContext(`2d`);
        const ctxMain = canvasMain.getContext(`2d`);
        if (!ctx || !ctxMain) {
            throw new Error(`Failed to get 2D context for energy bar animation`);
        }

        // setup for pixel art scaling
        ctx.imageSmoothingEnabled = false;

        let hairArguments: PixelArtHairArgs = {
            ...defaultHairArguments
        };

        const speed = 100;
        let currentAnimationPercentage = 0;
        let animationFrameId: number;

        const doneSubject = createObservable(undefined as undefined | {
            kind: `completed` | `stopped`,
            result: CharacterHairResult,
        });

        function animate() {
            if (!ctx || !ctxMain) return;

            currentAnimationPercentage += (0.5 * speed) / 100;

            if (currentAnimationPercentage >= 120 && doneSubject.lastValue?.kind !== `completed`) {
                doneSubject.next({ kind: `completed`, result: {} });
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawPixelArtHair({ canvas, ctx, hair: { ...hairArguments, animationRatio: ((currentAnimationPercentage % 100) / 100) } });

            // paint to main canvas with pixel scaling
            ctxMain.imageSmoothingEnabled = false;
            ctxMain.clearRect(0, 0, canvasMain.width, canvasMain.height);
            ctxMain.fillStyle = `#00FF00`;
            ctxMain.fillRect(0, 0, canvasMain.width, canvasMain.height);
            const scaleX = canvasMain.width / canvas.width;
            const scaleY = canvasMain.height / canvas.height;
            const scale = Math.min(scaleX, scaleY);
            const offsetX = (canvasMain.width - canvas.width * scale) / 2;
            const offsetY = (canvasMain.height - canvas.height * scale) / 2;
            ctxMain.drawImage(canvas, 0, 0, canvas.width, canvas.height,
                offsetX, offsetY, canvas.width * scale, canvas.height * scale);

            animationFrameId = requestAnimationFrame(animate);
        }

        animationFrameId = requestAnimationFrame(animate);

        return {
            start: (args: CharacterHairArgs) => {
                hairArguments = { ...defaultHairArguments, ...args };
                currentAnimationPercentage = 0;
                cancelAnimationFrame(animationFrameId);
                animationFrameId = requestAnimationFrame(animate);
                doneSubject.next(undefined);
            },
            stop: () => {
                cancelAnimationFrame(animationFrameId);
                doneSubject.next({ kind: `stopped`, result: {} });
            },
            pause: (isPaused: boolean) => {
                if (isPaused) {
                    cancelAnimationFrame(animationFrameId);
                    return;
                }
                cancelAnimationFrame(animationFrameId);
                animationFrameId = requestAnimationFrame(animate);
            },
            done: doneSubject
        };
    }
};