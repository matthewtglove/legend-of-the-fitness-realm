import React, { useEffect, useRef } from 'react';

export type Canvas2dViewDrawingController = {
    start: () => void;
    stop: () => void;
    destroy: () => void;
};
export const Canvas2dView = (props: {
    createDrawing: (canvas: HTMLCanvasElement) => Canvas2dViewDrawingController;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(undefined as undefined | Canvas2dViewDrawingController);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;

        const drawing = (drawingRef.current = props.createDrawing(canvas));
        drawing.start();

        return () => {
            drawing.stop();
            drawing.destroy();
            drawingRef.current = undefined;
        };
    }, [props.createDrawing]);

    return (
        <div className="flex flex-col flex-1 w-full h-full">
            <div className="flex flex-1 bg-black">
                <div style={{ position: `relative`, width: `100%`, height: `400px`, background: `#111` }}>
                    <canvas
                        ref={canvasRef}
                        style={{
                            width: `100%`,
                            height: `100%`,
                            display: `block`,
                            cursor: `pointer`,
                        }}
                    />
                </div>
            </div>
            <div className="flex flex-row items-center justify-center gap-1 bg-gray-800">
                <button
                    className="p-2 m-2 text-white bg-blue-600 rounded"
                    onClick={() => {
                        drawingRef.current?.start();
                    }}
                >
                    Start
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
        </div>
    );
};
