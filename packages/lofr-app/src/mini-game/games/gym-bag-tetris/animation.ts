import { createObservable } from "../../../systems/observable";
import { Animation } from "../../animation-view";
import { calculateLayout, calculatePointerPos } from "../../utils";

type GymTetrisArgs = {
    difficulty: number; // 3 to 8 items
};

type GymTetrisResult = {
    timeTakenMs: number;
    efficiency: number;
};

// --- Grid & Shape Types ---

type GridMatrix = number[][]; // 1 = filled, 0 = empty

type ShapeType = `roller` | `towel` | `shoe` | `bottle` | `kettlebell` | `mat`;

type GridItem = {
    id: number;
    type: ShapeType;
    matrix: GridMatrix; // Current rotation matrix

    // Virtual Pixel Position (for smooth dragging)
    x: number;
    y: number;

    // Grid Position (if placed)
    gridX: number | null;
    gridY: number | null;

    rotationIndex: number; // 0-3
    isDragging: boolean;
};

// --- Shape Definitions ---
// Note: We define shapes in their "upright" (rotation 0) state.
const SHAPES: Record<ShapeType, GridMatrix> = {
    roller: [[1], [1], [1], [1]],         // 1x4 Vertical
    bottle: [[1], [1]],                   // 1x2 Vertical
    towel: [[1, 1], [1, 1]],              // 2x2 Square
    shoe: [[1, 0], [1, 0], [1, 1]],       // 2x3 L-Shape (Heel at bottom right)
    kettlebell: [[0, 1, 0], [1, 1, 1]],   // 3x2 T-Shape
    mat: [[1, 1, 0], [0, 1, 1]]           // 3x2 S-Shape (rolled mat stack?)
};

// Base colors for fallback or accents
// const COLORS: Record<ShapeType, string> = {
//     roller: `#3498db`,
//     towel: `#f1c40f`,
//     shoe: `#e74c3c`,
//     bottle: `#2ecc71`,
//     kettlebell: `#9b59b6`,
//     mat: `#e67e22`
// };

export const GymBagTetrisGame: Animation<GymTetrisArgs, GymTetrisResult> = {
    setup: (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext(`2d`);
        const doneSubject = createObservable<undefined | { kind: `completed` | `stopped`, result: GymTetrisResult }>(undefined);

        // --- Constants ---
        const VIRTUAL_SIZE = 1000;
        const gameSize = { width: VIRTUAL_SIZE, height: VIRTUAL_SIZE };
        const CELL_SIZE = 60; // Size of one grid square

        // --- State ---
        let items: GridItem[] = [];
        let isRunning = false;
        let animId = 0;
        let startTime = 0;

        // The "Bag"
        let bagWidth = 0;
        let bagHeight = 0;
        let bagPixelX = 0;
        let bagPixelY = 0;

        // Input
        let dragTarget: GridItem | null = null;
        let dragOffset = { x: 0, y: 0 };
        let startDragPos = { x: 0, y: 0 };
        let tapStartTime = 0;

        // --- Helpers ---

        const rotateMatrix = (matrix: GridMatrix): GridMatrix => {
            const rows = matrix.length;
            const cols = matrix[0]!.length;
            const newMatrix: number[][] = [];
            for (let x = 0; x < cols; x++) {
                newMatrix[x] = [];
                for (let y = 0; y < rows; y++) {
                    newMatrix[x]![y] = matrix[rows - 1 - y]![x]!;
                }
            }
            return newMatrix;
        };

        const getMatrixWidth = (m: GridMatrix) => m[0]!.length;
        const getMatrixHeight = (m: GridMatrix) => m.length;

        // --- Puzzle Generator ---
        const generatePuzzle = (itemCount: number) => {
            const keys = Object.keys(SHAPES) as ShapeType[];
            const selectedTypes: ShapeType[] = [];
            for (let i = 0; i < itemCount; i++) {
                selectedTypes.push(keys[Math.floor(Math.random() * keys.length)]!);
            }

            // Monte Carlo Packing
            // Goal: Find the smallest bounding box that fits all selected items.
            let bestArea = Infinity;
            let bestSolution: { w: number, h: number } | null = null;

            // We can lower attempts because the heuristic is smarter now
            const ATTEMPTS = 50;

            for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
                // 1. Sort items by Size (Desc) - Standard bin packing heuristic
                // We add a little randomness to the sort so we don't always get the same shape for same items
                const shuffled = [...selectedTypes].sort((a, b) => {
                    const areaA = getMatrixWidth(SHAPES[a]) * getMatrixHeight(SHAPES[a]);
                    const areaB = getMatrixWidth(SHAPES[b]) * getMatrixHeight(SHAPES[b]);
                    return (areaB - areaA) + (Math.random() - 0.5);
                });

                const placement: { x: number, y: number, m: GridMatrix }[] = [];
                let currentMaxX = 0;
                let currentMaxY = 0;
                let isValidAttempt = true;

                for (const type of shuffled) {
                    const baseMatrix = SHAPES[type];

                    // Optimization: Pre-calculate unique rotations to test
                    // (Avoids testing a square 4 times)
                    const rotations: GridMatrix[] = [baseMatrix];
                    let curr = baseMatrix;
                    for (let r = 0; r < 3; r++) {
                        curr = rotateMatrix(curr);
                        // Simple check to avoid duplicates (string comparison of flat array)
                        const isDup = rotations.some(m => JSON.stringify(m) === JSON.stringify(curr));
                        if (!isDup) rotations.push(curr);
                    }

                    let bestMove: { x: number, y: number, m: GridMatrix, score: number } | null = null;

                    // Scan grid for the "Best Fit"
                    // We scan a bit beyond current bounds to allow growth
                    // but we prioritize spots closer to 0,0 via scoring.
                    const limitX = currentMaxX + 4;
                    const limitY = currentMaxY + 4;

                    for (let y = 0; y <= limitY; y++) {
                        for (let x = 0; x <= limitX; x++) {

                            // Try every rotation at this spot
                            for (const mat of rotations) {
                                const w = getMatrixWidth(mat);
                                const h = getMatrixHeight(mat);

                                // Check overlap
                                let overlap = false;
                                for (const p of placement) {
                                    if (matricesOverlap(mat, x, y, p.m, p.x, p.y)) {
                                        overlap = true;
                                        break;
                                    }
                                }

                                if (!overlap) {
                                    // Calculate Score (Lower is better)
                                    // 1. Penalty for expanding the bounding box (Heavy weight)
                                    const newMaxX = Math.max(currentMaxX, x + w);
                                    const newMaxY = Math.max(currentMaxY, y + h);
                                    const newArea = newMaxX * newMaxY;

                                    // 2. Penalty for distance from origin (Light weight - keeps it packed top-left)
                                    const dist = x + y;

                                    const score = (newArea * 10) + dist;

                                    if (!bestMove || score < bestMove.score) {
                                        bestMove = { x, y, m: mat, score };
                                    }
                                }
                            }
                        }
                    }

                    if (bestMove) {
                        placement.push(bestMove);
                        currentMaxX = Math.max(currentMaxX, bestMove.x + getMatrixWidth(bestMove.m));
                        currentMaxY = Math.max(currentMaxY, bestMove.y + getMatrixHeight(bestMove.m));
                    } else {
                        isValidAttempt = false;
                        break;
                    }
                }

                if (isValidAttempt) {
                    const area = currentMaxX * currentMaxY;
                    // Bias towards square-ish shapes (aspect ratio closest to 1)
                    const ratio = Math.max(currentMaxX, currentMaxY) / Math.min(currentMaxX, currentMaxY);

                    // Final Score for this attempt
                    const score = area * (ratio * 0.2 + 0.8); // slight penalty for long strips

                    if (score < bestArea) {
                        bestArea = score;
                        bestSolution = { w: currentMaxX, h: currentMaxY };
                    }
                }
            }

            if (!bestSolution) bestSolution = { w: 6, h: 6 };

            bagWidth = bestSolution.w;
            bagHeight = bestSolution.h;
            bagPixelX = (VIRTUAL_SIZE - (bagWidth * CELL_SIZE)) / 2;
            bagPixelY = (VIRTUAL_SIZE - (bagHeight * CELL_SIZE)) / 2;

            // Initialize Items (Scattered)
            items = selectedTypes.map((type, i) => {
                const matrix = SHAPES[type];
                const angle = (i / selectedTypes.length) * Math.PI * 2;
                const dist = VIRTUAL_SIZE * 0.4;
                const spawnX = VIRTUAL_SIZE / 2 + Math.cos(angle) * dist;
                const spawnY = VIRTUAL_SIZE / 2 + Math.sin(angle) * dist;

                return {
                    id: i,
                    type,
                    matrix: [...matrix.map(row => [...row])],
                    x: spawnX,
                    y: spawnY,
                    gridX: null,
                    gridY: null,
                    rotationIndex: 0,
                    isDragging: false
                };
            });
        };

        const matricesOverlap = (m1: GridMatrix, x1: number, y1: number, m2: GridMatrix, x2: number, y2: number) => {
            for (let r1 = 0; r1 < m1.length; r1++) {
                for (let c1 = 0; c1 < m1[0]!.length; c1++) {
                    if (m1[r1]![c1] === 1) {
                        const globalX = x1 + c1;
                        const globalY = y1 + r1;
                        const localC2 = globalX - x2;
                        const localR2 = globalY - y2;
                        if (localR2 >= 0 && localR2 < m2.length && localC2 >= 0 && localC2 < m2[0]!.length) {
                            if (m2[localR2]![localC2] === 1) return true;
                        }
                    }
                }
            }
            return false;
        };

        // --- Custom Drawing Functions ---
        // Helper to draw the actual graphics inside the grid shapes
        const drawGraphic = (ctx: CanvasRenderingContext2D, type: ShapeType) => {
            const P = CELL_SIZE;

            // NOTE: These drawings assume rotation 0.
            // We use canvas transformations to handle rotation.

            switch (type) {
                case `roller`: // 1x4 Vertical
                    // Foam Roller Texture
                    ctx.fillStyle = `#3498db`;
                    ctx.beginPath();
                    ctx.roundRect(5, 5, P - 10, (P * 4) - 10, 15);
                    ctx.fill();
                    // Detail lines (foam ridges)
                    ctx.fillStyle = `rgba(0,0,0,0.1)`;
                    for (let i = 1; i < 8; i++) {
                        ctx.fillRect(5, i * (P * 4) / 8, P - 10, 5);
                    }
                    break;

                case `bottle`: // 1x2 Vertical
                    ctx.fillStyle = `#2ecc71`;
                    // Body
                    ctx.beginPath();
                    ctx.roundRect(10, 20, P - 20, (P * 2) - 30, 10);
                    ctx.fill();
                    // Cap
                    ctx.fillStyle = `#27ae60`;
                    ctx.fillRect(15, 5, P - 30, 15);
                    // Grip indentation
                    ctx.fillStyle = `rgba(0,0,0,0.1)`;
                    ctx.fillRect(10, P, P - 20, 20);
                    break;

                case `towel`: // 2x2 Square (Rolled up)
                    // Spiral view from top
                    ctx.fillStyle = `#f1c40f`;
                    ctx.beginPath();
                    ctx.arc(P, P, P - 5, 0, Math.PI * 2);
                    ctx.fill();
                    // Spiral line
                    ctx.strokeStyle = `#f39c12`;
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    for (let i = 0; i < P - 10; i += 5) {
                        const angle = i * 0.5;
                        const r = i;
                        ctx.lineTo(P + Math.cos(angle) * r, P + Math.sin(angle) * r);
                    }
                    ctx.stroke();
                    break;

                case `kettlebell`: // 3x2 T-Shape (Top center, Bottom full)
                    // Handle is at (1, 0), Ball is at (0, 1) to (2, 1)
                    // Matrix: [[0, 1, 0], [1, 1, 1]]

                    // Ball
                    ctx.fillStyle = `#9b59b6`;
                    ctx.beginPath();
                    ctx.arc(P * 1.5, P * 1.5, P - 5, 0, Math.PI * 2); // Center of bottom row
                    ctx.fill();

                    // Handle
                    ctx.strokeStyle = `#8e44ad`;
                    ctx.lineWidth = 15;
                    ctx.beginPath();
                    ctx.moveTo(P * 0.8, P * 1.0);
                    ctx.quadraticCurveTo(P * 0.8, P * 0.2, P * 1.5, P * 0.2); // Up and over
                    ctx.quadraticCurveTo(P * 2.2, P * 0.2, P * 2.2, P * 1.0);
                    ctx.stroke();

                    // Text Weight
                    ctx.fillStyle = `white`;
                    ctx.font = `bold 24px sans-serif`;
                    ctx.textAlign = `center`;
                    ctx.fillText(`16kg`, P * 1.5, P * 1.6);
                    break;

                case `shoe`: // 2x3 L-Shape
                    // Matrix: [[1, 0], [1, 0], [1, 1]]
                    // Vertical leg is left column (0,0 to 0,2). Toe is at (1,2)

                    ctx.fillStyle = `#e74c3c`;
                    ctx.beginPath();
                    // Sole shape roughly following the L
                    // Top of ankle
                    ctx.moveTo(10, 10);
                    ctx.lineTo(P - 10, 10);
                    ctx.lineTo(P - 10, P * 2); // Down leg

                    // Curve to toe
                    ctx.quadraticCurveTo(P - 10, P * 3 - 10, P * 2 - 10, P * 3 - 10); // Toe tip
                    ctx.lineTo(P * 2 - 10, P * 3 - 30); // Toe thickness
                    ctx.lineTo(10, P * 3 - 30); // Heel bottom
                    ctx.lineTo(10, 10); // Back up to ankle

                    ctx.fill();

                    // Laces
                    ctx.strokeStyle = `white`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(15, P);
                    ctx.lineTo(P - 15, P + 20);
                    ctx.moveTo(15, P + 20);
                    ctx.lineTo(P - 15, P + 40);
                    ctx.stroke();
                    break;

                case `mat`: // 3x2 S-Shape [[1, 1, 0], [0, 1, 1]]
                    // Top row: 0,1. Bottom row: 1,2.
                    // Rolled Mat visual
                    ctx.fillStyle = `#e67e22`;

                    // Cylinder 1 (Top Left)
                    ctx.beginPath();
                    ctx.roundRect(5, 5, P * 2 - 10, P - 10, 20);
                    ctx.fill();

                    // Cylinder 2 (Bottom Right)
                    ctx.beginPath();
                    ctx.roundRect(P + 5, P + 5, P * 2 - 10, P - 10, 20);
                    ctx.fill();

                    // Straps
                    ctx.fillStyle = `#333`;
                    ctx.fillRect(P - 5, 5, 10, P * 2 - 10);
                    break;
            }
        };

        const render = () => {
            if (!isRunning) return;
            if (!ctx) return;

            // 1. Layout
            const layout = calculateLayout(canvas, gameSize);
            ctx.fillStyle = `#1e272e`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(layout.x, layout.y);
            ctx.scale(layout.scale, layout.scale);

            // 2. Draw Bag Area
            ctx.fillStyle = `#2c3e50`;
            ctx.fillRect(bagPixelX, bagPixelY, bagWidth * CELL_SIZE, bagHeight * CELL_SIZE);

            // Bag Grid Lines (Subtle)
            ctx.strokeStyle = `rgba(255,255,255,0.05)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i <= bagWidth; i++) {
                const x = bagPixelX + i * CELL_SIZE;
                ctx.moveTo(x, bagPixelY);
                ctx.lineTo(x, bagPixelY + bagHeight * CELL_SIZE);
            }
            for (let i = 0; i <= bagHeight; i++) {
                const y = bagPixelY + i * CELL_SIZE;
                ctx.moveTo(bagPixelX, y);
                ctx.lineTo(bagPixelX + bagWidth * CELL_SIZE, y);
            }
            ctx.stroke();

            // Bag Zipper Outline
            ctx.strokeStyle = `#95a5a6`;
            ctx.lineWidth = 4;
            ctx.strokeRect(bagPixelX - 5, bagPixelY - 5, bagWidth * CELL_SIZE + 10, bagHeight * CELL_SIZE + 10);

            // 3. Draw Items
            const sorted = [...items].sort((a, b) => {
                if (a.isDragging) return 1;
                if (b.isDragging) return -1;
                if (a.gridX !== null && b.gridX === null) return -1;
                if (b.gridX !== null && a.gridX === null) return 1;
                return 0;
            });

            for (const item of sorted) {
                drawItem(ctx, item);
            }

            ctx.restore();
            animId = requestAnimationFrame(render);
        };
        const drawItem = (context: CanvasRenderingContext2D, item: GridItem) => {
            context.save();

            // 1. Calculate Position
            let drawX = item.x;
            let drawY = item.y;

            // "Placed" means it has a grid coordinate and we aren't currently holding it
            const isPlaced = item.gridX !== null && item.gridY !== null && !item.isDragging;

            if (isPlaced) {
                drawX = bagPixelX + item.gridX! * CELL_SIZE;
                drawY = bagPixelY + item.gridY! * CELL_SIZE;
            }

            // 2. Validity Checks (for dragging feedback)
            const snap = getSnapCoords(item);
            const isInvalid = item.isDragging && !isValidPlacement(item, snap);
            const isRoughlyInside = snap.gx >= 0 && snap.gx < bagWidth && snap.gy >= 0 && snap.gy < bagHeight;

            // 3. Transform
            const w = getMatrixWidth(item.matrix) * CELL_SIZE;
            const h = getMatrixHeight(item.matrix) * CELL_SIZE;

            context.translate(drawX + w / 2, drawY + h / 2);
            context.rotate(item.rotationIndex * (Math.PI / 2));

            const baseMatrix = SHAPES[item.type];
            const baseW = getMatrixWidth(baseMatrix) * CELL_SIZE;
            const baseH = getMatrixHeight(baseMatrix) * CELL_SIZE;

            context.translate(-baseW / 2, -baseH / 2);

            // --- BACKGROUND: Only draw the dark grid shape if the item is PLACED ---
            if (isPlaced) {
                context.fillStyle = `rgba(0, 0, 0, 0.3)`;

                for (let r = 0; r < baseMatrix.length; r++) {
                    for (let c = 0; c < baseMatrix[0]!.length; c++) {
                        if (baseMatrix[r]![c]) {
                            context.fillRect(c * CELL_SIZE + 2, r * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                            context.strokeStyle = `rgba(255,255,255,0.1)`;
                            context.lineWidth = 1;
                            context.strokeRect(c * CELL_SIZE + 2, r * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                        }
                    }
                }
            }

            // 4. Draw Graphic
            drawGraphic(context, item.type);

            // 5. Drag Feedback Overlay
            // (Green if Valid, Red if Invalid)
            if (item.isDragging) {
                context.fillStyle = (isInvalid || !isRoughlyInside)
                    ? `rgba(231, 76, 60, 0.5)` // Red
                    : `rgba(46, 204, 113, 0.5)`; // Green

                for (let r = 0; r < baseMatrix.length; r++) {
                    for (let c = 0; c < baseMatrix[0]!.length; c++) {
                        if (baseMatrix[r]![c]) {
                            context.fillRect(c * CELL_SIZE + 2, r * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                        }
                    }
                }
            }

            context.restore();
        };

        // --- Logic: Geometry & Collision ---

        const getSnapCoords = (item: GridItem) => {
            const relativeX = item.x - bagPixelX;
            const relativeY = item.y - bagPixelY;
            const gx = Math.round(relativeX / CELL_SIZE);
            const gy = Math.round(relativeY / CELL_SIZE);
            return { gx, gy };
        };

        const isValidPlacement = (item: GridItem, pos: { gx: number, gy: number }) => {
            const m = item.matrix;
            const h = m.length;
            const w = m[0]!.length;

            if (pos.gx < 0 || pos.gy < 0) return false;
            if (pos.gx + w > bagWidth || pos.gy + h > bagHeight) return false;

            for (const other of items) {
                if (other.id === item.id) continue;
                if (other.gridX === null || other.gridY === null) continue;
                if (matricesOverlap(m, pos.gx, pos.gy, other.matrix, other.gridX, other.gridY)) {
                    return false;
                }
            }
            return true;
        };

        // --- Input Handling ---

        const handleDown = (e: MouseEvent | TouchEvent) => {
            if (!isRunning) return;
            e.preventDefault();
            const pos = calculatePointerPos(canvas, gameSize, e);
            startDragPos = pos;
            tapStartTime = Date.now();

            // Hit Detection
            const reversed = [...items].reverse();
            for (const item of reversed) {
                const w = getMatrixWidth(item.matrix) * CELL_SIZE;
                const h = getMatrixHeight(item.matrix) * CELL_SIZE;

                let ix = item.x;
                let iy = item.y;
                if (item.gridX !== null && item.gridY !== null && !item.isDragging) {
                    ix = bagPixelX + item.gridX * CELL_SIZE;
                    iy = bagPixelY + item.gridY * CELL_SIZE;
                }

                if (pos.x >= ix && pos.x <= ix + w && pos.y >= iy && pos.y <= iy + h) {
                    dragTarget = item;
                    dragTarget.isDragging = true;
                    dragTarget.gridX = null;
                    dragTarget.gridY = null;
                    dragTarget.x = ix;
                    dragTarget.y = iy;
                    dragOffset = { x: pos.x - ix, y: pos.y - iy };

                    items = items.filter(i => i.id !== item.id);
                    items.push(item);
                    return;
                }
            }
        };

        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isRunning || !dragTarget) return;
            e.preventDefault();
            const pos = calculatePointerPos(canvas, gameSize, e);

            dragTarget.x = pos.x - dragOffset.x;
            dragTarget.y = pos.y - dragOffset.y;
        };

        const handleUp = (e: MouseEvent | TouchEvent) => {
            if (!isRunning || !dragTarget) return;
            e.preventDefault();

            const pos = calculatePointerPos(canvas, gameSize, e);
            const dist = Math.hypot(pos.x - startDragPos.x, pos.y - startDragPos.y);
            const time = Date.now() - tapStartTime;

            // Tap -> Rotate
            if (time < 200 && dist < 10) {
                dragTarget.matrix = rotateMatrix(dragTarget.matrix);
                dragTarget.rotationIndex = (dragTarget.rotationIndex + 1) % 4;
            }

            // Drop
            const snap = getSnapCoords(dragTarget);

            if (isValidPlacement(dragTarget, snap)) {
                dragTarget.gridX = snap.gx;
                dragTarget.gridY = snap.gy;
            } else {
                dragTarget.gridX = null;
                dragTarget.gridY = null;
            }

            dragTarget.isDragging = false;
            dragTarget = null;
            checkWin();
        };

        const checkWin = () => {
            const allPlaced = items.every(i => i.gridX !== null);
            if (allPlaced) {
                finish(`completed`);
            }
        };

        const finish = (kind: `completed` | `stopped`) => {
            if (doneSubject.lastValue) return;
            doneSubject.next({
                kind,
                result: {
                    timeTakenMs: Date.now() - startTime,
                    efficiency: 100
                }
            });
        };

        return {
            start: (args) => {
                generatePuzzle(args.difficulty);
                startTime = Date.now();
                isRunning = true;

                canvas.addEventListener(`mousedown`, handleDown);
                canvas.addEventListener(`mousemove`, handleMove);
                canvas.addEventListener(`mouseup`, handleUp);
                canvas.addEventListener(`touchstart`, handleDown, { passive: false });
                canvas.addEventListener(`touchmove`, handleMove, { passive: false });
                canvas.addEventListener(`touchend`, handleUp);

                doneSubject.next(undefined);
                cancelAnimationFrame(animId);
                animId = requestAnimationFrame(render);
            },
            stop: () => {
                finish(`stopped`);
                isRunning = false;
                cancelAnimationFrame(animId);
                canvas.removeEventListener(`mousedown`, handleDown);
                canvas.removeEventListener(`mousemove`, handleMove);
                canvas.removeEventListener(`mouseup`, handleUp);
                canvas.removeEventListener(`touchstart`, handleDown);
                canvas.removeEventListener(`touchmove`, handleMove);
                canvas.removeEventListener(`touchend`, handleUp);
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