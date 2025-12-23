import { useEffect, useRef } from 'react';
import { animateEnergyBar } from './energy-bar';
import { Canvas2dView, Canvas2dViewDrawingController } from '../../canvas-2d-view';

export const EnergyBarView = (props: { startCharge: number; endCharge: number; speed: number; isPaused: boolean }) => {
    const createDrawingRef = useRef({
        value: { ...props },
        update: (args: typeof props) => {
            createDrawingRef.current.value = { ...args };
            createDrawingRef.current.drawingInstance?.start();
            createDrawingRef.current.drawingInstance?.pause(args.isPaused);
            // console.log(`[EnergyBarView:update]`, { ...args });
        },
        updateIsPaused: (args: typeof props) => {
            createDrawingRef.current.value = { ...args };
            createDrawingRef.current.drawingInstance?.pause(args.isPaused);
            // console.log(`[EnergyBarView:updateIsPaused`, { ...args });
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
    }, [props.startCharge, props.endCharge, props.speed]);

    useEffect(() => {
        createDrawingRef.current.updateIsPaused({ ...props });
    }, [props.isPaused]);

    return <Canvas2dView createDrawing={createDrawingRef.current.createDrawing} />;
};
