import { useEffect, useRef } from 'react';
import { animateEnergyBar } from './energy-bar';
import { Canvas2dView, Canvas2dViewDrawingController } from './canvas-2d-view';

export const MiniGame_EnergyBar = (props: { startCharge: number; endCharge: number; speed: number }) => {
    const createDrawingRef = useRef({
        value: { ...props },
        update: (args: typeof props) => {
            createDrawingRef.current.value = { ...args };
            createDrawingRef.current.drawingInstance?.start();
        },
        drawingInstance: undefined as undefined | Canvas2dViewDrawingController,
        createDrawing: (canvas: HTMLCanvasElement) => {
            const drawing = animateEnergyBar(canvas);
            if (!drawing) throw new Error(`Failed to create energy bar drawing`);

            return (createDrawingRef.current.drawingInstance = {
                start: () => {
                    drawing.start(createDrawingRef.current.value);
                },
                stop: () => {
                    drawing.stop();
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
    }, [props, props.startCharge, props.endCharge, props.speed]);

    return <Canvas2dView createDrawing={createDrawingRef.current.createDrawing} />;
};
