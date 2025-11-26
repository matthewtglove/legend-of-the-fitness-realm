import React, { useEffect, useRef, useState } from 'react';
import { createPocketWatchGame, GameControl } from './game-canvas';

export const MiniGame_PocketWatch = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const HOUR_DEFAULT = 6;
    const MINUTE_DEFAULT = 0;
    const [targetTime, setTargetTime] = useState(undefined as undefined | { hour: number; minute: number });

    const gameRef = useRef<GameControl | null>(null);

    useEffect(() => {
        if (!targetTime) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsSuccess(false);

        // Initialize the game logic
        const game = (gameRef.current = createPocketWatchGame(canvas, targetTime, (isCorrect: boolean) => {
            setIsSuccess(isCorrect);
            if (!isCorrect) return;

            // Optional: Vibrate phone
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        }));

        // Start the game loop and listeners
        game.start();

        // Cleanup function (Critical for React useEffect)
        return () => {
            game.stop();
        };
    }, [targetTime]);

    return (
        <div className="flex flex-col flex-1">
            <div className="flex flex-col items-center gap-2">
                <div>What time is your next workout?</div>
                <div>
                    <label>Time </label>
                    <select
                        value={targetTime?.hour ?? HOUR_DEFAULT}
                        onChange={(e) =>
                            setTargetTime({
                                ...(targetTime ?? { minute: MINUTE_DEFAULT }),
                                hour: Number(e.target.value),
                            })
                        }
                    >
                        {[...Array(12)].map((_, i) => (
                            <option key={i} value={i + 1}>
                                {i + 1}
                            </option>
                        ))}
                    </select>
                    <label> : </label>
                    <select
                        value={targetTime?.minute ?? MINUTE_DEFAULT}
                        onChange={(e) =>
                            setTargetTime({ ...(targetTime ?? { hour: HOUR_DEFAULT }), minute: Number(e.target.value) })
                        }
                    >
                        {[...Array(60)].map((_, i) => (
                            <option key={i} value={i}>
                                {i < 10 ? `0${i}` : i}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <button
                        className="bg-blue-200 text-blue-600 p-2 border-blue-600"
                        onClick={() => gameRef.current?.toggleMode()}
                    >
                        Wake Up!
                    </button>
                </div>
            </div>

            <div>
                {targetTime && (
                    <div className="text-center mt-4">
                        <div className="font-bold">Now set the pocketwatch to:</div>
                        <div className="text-2xl font-bold">{`${targetTime.hour}:${targetTime.minute
                            .toFixed(0)
                            .padStart(2, `0`)}`}</div>
                    </div>
                )}

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
                                textAlign: `center`,
                                color: `#FFD700`,
                                backgroundColor: `rgba(0, 0, 0, 0.5)`,
                                padding: `4px`,
                                fontFamily: `monospace`,
                                fontSize: `2rem`,
                                textShadow: `0px 0px 10px rgba(0,0,0,0.8)`,
                                pointerEvents: `none`,
                            }}
                        >
                            Alarm Set
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
