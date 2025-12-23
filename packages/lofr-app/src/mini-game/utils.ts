export const calculateLayout = (canvas: HTMLCanvasElement, gameSize: { width: number, height: number }, size = undefined as undefined | { width: number, height: number }) => {
    size = size || { width: canvas.width, height: canvas.height };
    const scale = Math.min(size.width / gameSize.width, size.height / gameSize.height);
    const width = gameSize.width * scale;
    const height = gameSize.height * scale;
    const x = (size.width - width) / 2;
    const y = (size.height - height) / 2;
    return { x, y, width, height, scale };
};

export const calculatePointerPos = (canvas: HTMLCanvasElement, gameSize: { width: number, height: number }, e: MouseEvent | TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // 1. Get raw client coordinates
    const clientX = `touches` in e ? e.touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
    const clientY = `touches` in e ? e.touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY;

    // 2. Convert to Physical Canvas Coordinates (accounting for DPR)
    const physicalX = (clientX - rect.left) * dpr;
    const physicalY = (clientY - rect.top) * dpr;

    // 3. Map Physical Coords to Buffer Coords using the Aspect Ratio Layout
    const layout = calculateLayout(canvas, gameSize, rect);

    // (Physical Mouse - Offset) / Scale = Buffer Coordinate
    const bufferX = (physicalX - layout.x) / layout.scale;
    const bufferY = (physicalY - layout.y) / layout.scale;

    return {
        x: bufferX,
        y: bufferY,
    };
};