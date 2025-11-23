import React, { useEffect, useRef, useState } from 'react';
import { createPocketWatchGame, GameControl } from './game-canvas';

export const MiniGame_PocketWatch = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Initialize the game logic
        const game: GameControl = createPocketWatchGame(
            canvas,
            {
                hour: 6,
                minute: 25,
            },
            () => {
                // Callback when user wins (sets alarm correctly)
                setIsSuccess(true);
                // Optional: Vibrate phone
                if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
            },
        );

        // Start the game loop and listeners
        game.start();

        // Cleanup function (Critical for React useEffect)
        return () => {
            game.stop();
        };
    }, []);

    return (
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
    );
};
