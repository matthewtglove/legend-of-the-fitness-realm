import { useEffect, useRef } from 'react';
import { Canvas2dView, Canvas2dViewDrawingController } from './canvas-2d-view';

export const AnimationView = <
    TAnimationArgs extends Record<string, unknown>,
    TAnimation extends {
        setup: (canvas: HTMLCanvasElement) => {
            start: (args: TAnimationArgs) => void;
            stop: () => void;
            pause: (isPaused: boolean) => void;
        };
    },
>(props: {
    animation: TAnimation;
    animationArgs: TAnimationArgs;
    isPaused: boolean;
}) => {
    const createDrawingRef = useRef({
        value: { ...props },
        update: (args: typeof props) => {
            createDrawingRef.current.value = { ...args };
            createDrawingRef.current.drawingInstance?.start();
            createDrawingRef.current.drawingInstance?.pause(args.isPaused);
            // console.log(`[AnimationView:update]`, { ...args });
        },
        updateIsPaused: (args: typeof props) => {
            createDrawingRef.current.value = { ...args };
            createDrawingRef.current.drawingInstance?.pause(args.isPaused);
            // console.log(`[AnimationView:updateIsPaused`, { ...args });
        },
        drawingInstance: undefined as undefined | Canvas2dViewDrawingController,
        createDrawing: (canvas: HTMLCanvasElement) => {
            const drawing = props.animation.setup(canvas);
            if (!drawing) throw new Error(`Failed to create energy bar drawing`);

            return (createDrawingRef.current.drawingInstance = {
                start: () => {
                    drawing.start(createDrawingRef.current.value.animationArgs);
                },
                stop: () => {
                    drawing.stop();
                },
                pause: (isPaused: boolean) => {
                    drawing.pause(isPaused);
                },
                destroy: () => {
                    drawing.stop();
                    createDrawingRef.current.drawingInstance = undefined;
                },
            });
        },
    });

    useEffect(() => {
        createDrawingRef.current.update({ ...props });
    }, [props.animationArgs]);

    useEffect(() => {
        createDrawingRef.current.updateIsPaused({ ...props });
    }, [props.isPaused]);

    return <Canvas2dView createDrawing={createDrawingRef.current.createDrawing} />;
};
