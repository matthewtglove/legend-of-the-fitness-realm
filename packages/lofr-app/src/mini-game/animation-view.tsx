import { useEffect, useRef } from 'react';
import { Canvas2dView, Canvas2dViewDrawingController } from './canvas-2d-view';
import { Observable } from '../systems/lofr-system-types';

export type Animation<
    TArgs extends Record<string, unknown>,
    TResult extends Record<string, unknown> = Record<string, never>,
> = {
    setup: (canvas: HTMLCanvasElement) => {
        start: (args: TArgs) => void;
        stop: () => void;
        pause: (isPaused: boolean) => void;
        done: Observable<undefined | { kind: `completed` | `stopped`; result: TResult }>;
    };
};

export const AnimationView = <
    TAnimationArgs extends Record<string, unknown>,
    TAnimationResult extends Record<string, unknown> = Record<string, never>,
>(props: {
    animation: Animation<TAnimationArgs, TAnimationResult>;
    animationArgs: TAnimationArgs;
    isPaused: boolean;
    debug?: boolean;
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
                done: drawing.done,
            });
        },
    });

    useEffect(() => {
        createDrawingRef.current.update({ ...props });
    }, [props.animationArgs]);

    useEffect(() => {
        createDrawingRef.current.updateIsPaused({ ...props });
    }, [props.isPaused]);

    return <Canvas2dView createDrawing={createDrawingRef.current.createDrawing} debug={props.debug} />;
};
