import React, { useEffect, useRef, useState } from 'react';
import { createPocketWatchGame, GameControl } from './game-canvas';

export const MiniGame_PocketWatch = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const [targetTime, setTargetTime] = useState({ hour: 6, minute: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsSuccess(false);

        // Initialize the game logic
        const game: GameControl = createPocketWatchGame(canvas, targetTime, (isCorrect: boolean) => {
            setIsSuccess(isCorrect);
            if (!isCorrect) return;

            // Optional: Vibrate phone
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        });

        // Start the game loop and listeners
        game.start();

        // Cleanup function (Critical for React useEffect)
        return () => {
            game.stop();
        };
    }, [targetTime]);

    return (
        <div>
            <div className="flex flex-col items-center gap-2">
                <div>What time is your next workout?</div>
                <div>
                    <label>Time </label>
                    <select
                        value={targetTime.hour}
                        onChange={(e) => setTargetTime({ ...targetTime, hour: Number(e.target.value) })}
                    >
                        {[...Array(12)].map((_, i) => (
                            <option key={i} value={i + 1}>
                                {i + 1}
                            </option>
                        ))}
                    </select>
                    <label> : </label>
                    <select
                        value={targetTime.minute}
                        onChange={(e) => setTargetTime({ ...targetTime, minute: Number(e.target.value) })}
                    >
                        {[...Array(60)].map((_, i) => (
                            <option key={i} value={i}>
                                {i < 10 ? `0${i}` : i}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

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

                {/* Narrative Overlay on Success */}
                {isSuccess && (
                    <div
                        style={{
                            position: `absolute`,
                            top: `20%`,
                            left: `50%`,
                            transform: `translate(-50%, -50%)`,
                            color: `#FFD700`,
                            fontFamily: `monospace`,
                            fontSize: `4rem`,
                            textShadow: `0px 0px 10px rgba(0,0,0,0.8)`,
                            pointerEvents: `none`, // Let clicks pass through if needed
                        }}
                    >
                        Alarm Set
                    </div>
                )}
            </div>
        </div>
    );
};
