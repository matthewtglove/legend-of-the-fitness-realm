import { createObservable } from "../../../systems/observable";
import { Animation } from "../../animation-view";
import { calculateLayout } from "../../utils";

type RhythmRunArgs = {
    difficulty: `normal` | `hard`;
};

type RhythmRunResult = {
    distanceRan: number;
    energyCollected: number;
    snoozesHit: number;
    finalSpeed: number;
};

type EntityType = `snooze` | `energy`;

type Entity = {
    id: number;
    type: EntityType;
    x: number;
    y: number;
    w: number;
    h: number;
    collected: boolean;
};

type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
};

export const RhythmRunGame: Animation<RhythmRunArgs, RhythmRunResult> = {
    setup: (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext(`2d`);
        const doneSubject = createObservable<undefined | { kind: `completed` | `stopped`, result: RhythmRunResult }>(undefined);

        // --- Constants ---
        const VIRTUAL_WIDTH = 1000;
        const VIRTUAL_HEIGHT = 600;
        const gameSize = { width: VIRTUAL_WIDTH, height: VIRTUAL_HEIGHT };

        const GRAVITY = 1.5;
        const JUMP_FORCE = -22;
        const GROUND_Y = 450;
        const GAME_DURATION_MS = 15000; // 15 seconds run

        // --- State ---
        let isRunning = false;
        let isVictoryLap = false; // New state for "Cool Down"
        let animId = 0;

        // Player
        const player = {
            y: GROUND_Y,
            vy: 0,
            w: 50,
            h: 80,
            isGrounded: true,
            jumpCount: 0
        };

        // World
        let entities: Entity[] = [];
        let particles: Particle[] = [];
        let gameSpeed = 10;
        let distance = 0;
        let energy = 0;
        let snoozes = 0;
        let startTime = 0;
        let lastSpawnX = 0;

        // Visuals
        let shake = 0;
        const bgLayers = [0, 0, 0];

        const render = () => {
            if (!isRunning) return;
            if (!ctx) return;

            // 1. Logic Update
            const now = Date.now();
            const elapsed = now - startTime;

            // Cap progress visually at 1.0
            const progress = Math.min(1, elapsed / GAME_DURATION_MS);

            // Check Win Condition
            if (!isVictoryLap && elapsed >= GAME_DURATION_MS) {
                isVictoryLap = true;
                // Emit success ONCE, but keep running
                finish(`completed`);
            }

            // Speed Logic
            if (!isVictoryLap) {
                // Ramp speed up to 25
                gameSpeed = 10 + (progress * 15);
            }
            // Else: Keep speed constant (don't ramp infinitely)

            distance += gameSpeed;
            // GROUND_Y = 450 + 20 * Math.sin(distance * 0.0007);


            // Physics
            player.vy += GRAVITY;
            player.y += player.vy;

            // Ground Collision
            if (player.y >= GROUND_Y) {
                player.y = GROUND_Y;
                player.vy = 0;
                player.isGrounded = true;
                player.jumpCount = 0;
            }

            // Spawning Logic -- ONLY if not in victory lap
            if (!isVictoryLap) {
                if (distance - lastSpawnX > 400 + Math.random() * 500) {
                    spawnEntity();
                    lastSpawnX = distance;
                }
            }

            // Update Entities
            for (let i = entities.length - 1; i >= 0; i--) {
                const e = entities[i]!;
                e.x -= gameSpeed;

                // Collision Box
                const hitX = 150 < e.x + e.w && 150 + player.w > e.x;
                const hitY = player.y < e.y + e.h && player.y + player.h > e.y;

                if (!e.collected && hitX && hitY) {
                    if (e.type === `energy`) {
                        energy++;
                        e.collected = true;
                        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, `#ffd700`, 10);
                    } else if (e.type === `snooze`) {
                        if (!isVictoryLap) { // Don't penalize during victory lap (rare edge case)
                            snoozes++;
                            gameSpeed *= 0.5;
                        }
                        e.collected = true;
                        shake = 20;
                        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, `#ff4b4b`, 15);
                    }
                }

                if (e.x < -100) {
                    entities.splice(i, 1);
                }
            }

            // Update Particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i]!;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5;
                p.life -= 0.05;
                if (p.life <= 0) particles.splice(i, 1);
            }

            // Update Backgrounds
            bgLayers[0] = (bgLayers[0]! - gameSpeed * 0.1) % VIRTUAL_WIDTH;
            bgLayers[1] = (bgLayers[1]! - gameSpeed * 0.3) % VIRTUAL_WIDTH;
            bgLayers[2] = (bgLayers[2]! - gameSpeed * 0.8) % VIRTUAL_WIDTH;

            if (shake > 0) shake *= 0.9;
            if (shake < 0.5) shake = 0;

            // 2. Rendering
            const layout = calculateLayout(canvas, gameSize);
            ctx.fillStyle = `#1a1a1a`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(layout.x, layout.y);
            ctx.scale(layout.scale, layout.scale);

            if (shake > 0) {
                const dx = (Math.random() - 0.5) * shake;
                const dy = (Math.random() - 0.5) * shake;
                ctx.translate(dx, dy);
            }

            // Draw Background
            const grad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
            grad.addColorStop(0, `#0f2027`);
            grad.addColorStop(0.5, `#203a43`);
            grad.addColorStop(1, `#2c5364`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

            ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
            ctx.beginPath();
            ctx.arc(800, 100, 60, 0, Math.PI * 2);
            ctx.fill();

            drawParallaxLayer(ctx, bgLayers[2]!, VIRTUAL_HEIGHT - 100, `#333`, 100);
            drawParallaxLayer(ctx, bgLayers[1]!, VIRTUAL_HEIGHT - 150, `#222`, 50);

            // Draw Ground
            const stageUpDown = 30 * Math.sin(distance * 0.00047);
            ctx.translate(0, stageUpDown);

            ctx.fillStyle = `#111`;
            ctx.fillRect(0, GROUND_Y + player.h, VIRTUAL_WIDTH, 200);
            ctx.fillStyle = isVictoryLap ? `#ffd700` : `#4facfe`; // Gold line on victory
            ctx.fillRect(0, GROUND_Y + player.h, VIRTUAL_WIDTH, 5);

            // Draw Runner
            ctx.save();
            ctx.translate(150, player.y);

            const lean = Math.min(0.3, gameSpeed * 0.01);
            ctx.transform(1, 0, lean, 1, 0, 0);

            ctx.fillStyle = `#00f260`;
            ctx.shadowColor = `#00f260`;
            ctx.shadowBlur = 20;
            ctx.fillRect(0, 0, player.w, player.h);

            ctx.fillStyle = `white`;
            ctx.fillRect(5, 5, 40, 15);
            ctx.restore();

            // Draw Entities
            for (const e of entities) {
                if (e.collected) continue;
                if (e.type === `snooze`) {
                    ctx.fillStyle = `#ff4b4b`;
                    ctx.shadowColor = `red`;
                    ctx.shadowBlur = 10;
                    ctx.fillRect(e.x, e.y, e.w, e.h);
                    ctx.fillStyle = `white`;
                    ctx.font = `bold 20px sans-serif`;
                    ctx.fillText(`ZZZ`, e.x + 5, e.y + 30);
                } else {
                    ctx.fillStyle = `#ffd700`;
                    ctx.shadowColor = `yellow`;
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.moveTo(e.x + e.w / 2, e.y);
                    ctx.lineTo(e.x + e.w, e.y + e.h / 2);
                    ctx.lineTo(e.x + e.w / 2, e.y + e.h);
                    ctx.lineTo(e.x, e.y + e.h / 2);
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
            }

            // Draw Particles
            for (const p of particles) {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            ctx.translate(0, -stageUpDown);

            // UI: Progress Bar
            if (!isVictoryLap) {
                ctx.fillStyle = `rgba(255,255,255,0.2)`;
                ctx.fillRect(200, 50, 600, 10);
                ctx.fillStyle = `#00f260`;
                ctx.fillRect(200, 50, 600 * progress, 10);
            } else {
                // Victory Text
                ctx.fillStyle = `#ffd700`;
                ctx.font = `bold 40px sans-serif`;
                ctx.textAlign = `center`;
                ctx.fillText(`RUN COMPLETE!`, VIRTUAL_WIDTH / 2, 80);

                // Pulsing instruction
                ctx.fillStyle = `rgba(255,255,255, ${0.5 + Math.sin(Date.now() / 200) * 0.5})`;
                ctx.font = `32px sans-serif`;
                ctx.fillText(`Nice job! Stay strong!`, VIRTUAL_WIDTH / 2, 110);
            }

            // UI: Score
            ctx.fillStyle = `white`;
            ctx.font = `bold 30px sans-serif`;
            ctx.textAlign = `left`;
            ctx.fillText(`⚡ ${energy}`, 50, 60);

            ctx.restore();

            animId = requestAnimationFrame(render);
        };

        const drawParallaxLayer = (c: CanvasRenderingContext2D, offsetX: number, groundY: number, color: string, buildingW: number) => {
            c.fillStyle = color;
            for (let k = 0; k < 2; k++) {
                const startX = offsetX + (k * VIRTUAL_WIDTH);
                for (let i = 0; i < VIRTUAL_WIDTH / buildingW; i++) {
                    const h = 50 + Math.abs(Math.sin(i * 132.1)) * 150;
                    c.fillRect(startX + i * buildingW, groundY - h, buildingW + 2, h + 200);
                }
            }
        };

        const spawnEntity = () => {
            const type: EntityType = Math.random() > 0.6 ? `snooze` : `energy`;
            const isAir = Math.random() > 0.7;
            const w = 50;
            const h = 50;
            const bottomLine = GROUND_Y + 80;

            entities.push({
                id: Math.random(),
                type,
                x: VIRTUAL_WIDTH + 100,
                y: bottomLine - h - (isAir ? 120 : 0),
                w,
                h,
                collected: false
            });
        };

        const spawnParticles = (x: number, y: number, color: string, count: number) => {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 1.0,
                    color
                });
            }
        };

        const jump = (e: MouseEvent | TouchEvent) => {
            if (!isRunning) return;
            e.preventDefault();

            if (player.isGrounded || player.jumpCount < 2) {
                player.vy = JUMP_FORCE;
                player.isGrounded = false;
                player.jumpCount++;
                spawnParticles(150 + player.w / 2, player.y + player.h, `white`, 5);
            }
        };

        const finish = (kind: `completed` | `stopped`) => {
            if (doneSubject.lastValue) return; // Prevent double emit

            doneSubject.next({
                kind,
                result: {
                    distanceRan: Math.floor(distance),
                    energyCollected: energy,
                    snoozesHit: snoozes,
                    finalSpeed: Math.floor(gameSpeed)
                }
            });
        };

        return {
            start: (args) => {
                // Reset
                player.y = GROUND_Y;
                player.vy = 0;
                player.jumpCount = 0;
                player.isGrounded = true;

                entities = [];
                particles = [];
                distance = 0;
                energy = 0;
                snoozes = 0;
                gameSpeed = 10;
                startTime = Date.now();
                lastSpawnX = 0;
                isRunning = true;
                isVictoryLap = false; // Reset status

                if (args.difficulty === `hard`) {
                    gameSpeed = 15;
                }

                canvas.addEventListener(`mousedown`, jump);
                canvas.addEventListener(`touchstart`, jump, { passive: false });

                doneSubject.next(undefined);
                cancelAnimationFrame(animId);
                animId = requestAnimationFrame(render);
            },
            stop: () => {
                finish(`stopped`);
                isRunning = false;
                cancelAnimationFrame(animId);
                canvas.removeEventListener(`mousedown`, jump);
                canvas.removeEventListener(`touchstart`, jump);
            },
            pause: (p) => {
                cancelAnimationFrame(animId);
                if (p) return;
                animId = requestAnimationFrame(render);
            },
            done: doneSubject
        };
    }
};