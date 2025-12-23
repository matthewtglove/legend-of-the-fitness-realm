import React, { useEffect, useRef } from 'react';
import { Observable } from '../systems/lofr-system-types';

export type Canvas2dViewDrawingController = {
    start: () => void;
    stop: () => void;
    pause: (isPaused: boolean) => void;
    destroy: () => void;
    done?: Observable<undefined | { kind: `completed` | `stopped`; result: Record<string, unknown> }>;
};
export const Canvas2dView = (props: {
    createDrawing: (canvas: HTMLCanvasElement) => Canvas2dViewDrawingController;
    debug?: boolean;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(undefined as undefined | Canvas2dViewDrawingController);
    const [isPaused, setIsPaused] = React.useState(false);
    const [doneState, setDoneState] = React.useState(
        undefined as undefined | { kind: `completed` | `stopped`; result: Record<string, unknown> },
    );

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container) return;
        if (!canvas) return;
        canvas.width = container.clientWidth * devicePixelRatio;
        canvas.height = container.clientHeight * devicePixelRatio;

        const drawing = (drawingRef.current = props.createDrawing(canvas));
        drawing.start();

        drawing.done?.subscribe((x) => {
            console.log(`[Canvas2dView] Drawing done`);
            setDoneState(x);
        });

        return () => {
            drawing.stop();
            drawing.destroy();
            drawingRef.current = undefined;
        };
    }, [props.createDrawing]);

    const resize = () => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container) return;
        if (!canvas) return;
        canvas.width = container.clientWidth * devicePixelRatio;
        canvas.height = container.clientHeight * devicePixelRatio;
    };

    return (
        <div className="flex flex-col flex-1 w-full h-full">
            <div className="flex-1 bg-black">
                <div ref={containerRef} className="relative w-full h-full bg-gray-800" onResize={resize}>
                    <canvas ref={canvasRef} className="w-full h-full" />
                </div>
            </div>
            {props.debug && (
                <>
                    {doneState && (
                        <div className="relative z-10 h-0">
                            <div className="absolute bottom-0 text-white bg-black/50">
                                Game Done: {doneState.kind} - {JSON.stringify(doneState.result)}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-row items-center justify-center gap-1 bg-gray-800">
                        <button
                            className="p-2 m-2 text-white bg-blue-600 rounded"
                            onClick={() => {
                                drawingRef.current?.start();
                                drawingRef.current?.pause(isPaused);
                            }}
                        >
                            Start
                        </button>
                        <button
                            className="p-2 m-2 text-white bg-yellow-600 rounded"
                            onClick={() => {
                                drawingRef.current?.pause(!isPaused);
                                setIsPaused((s) => !s);
                            }}
                        >
                            {isPaused ? `Resume` : `Pause`}
                        </button>

                        <button
                            className="p-2 m-2 text-white bg-red-600 rounded"
                            onClick={() => {
                                drawingRef.current?.stop();
                            }}
                        >
                            Stop
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
