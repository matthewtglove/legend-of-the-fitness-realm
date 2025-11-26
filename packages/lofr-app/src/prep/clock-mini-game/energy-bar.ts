interface EnergyBarConfig {
    percentage: number;       // 0 to 100
    jitterIntensity: number;  // 0 = stable, 5 = violent shaking
    width: number;
    height: number;
}

export const renderEnergyScene = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    config: EnergyBarConfig
) => {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const c = canvas;

    const logicalWidth = config.width;
    const logicalHeight = config.height;


    // --- COLORS PALETTE ---
    const C = {
        sky: `#181438`,
        mountain: `#252152`,
        moonCore: `#b366ff`,
        moonShadow: `#7a45b8`,
        barBorder: `#e63e3e`,
        barBg: `#2a1d3d`, // Dark background inside empty bar
        fillNeonLight: `#8affff`,
        fillNeonDark: `#4bb8b5`,
        fillRedLight: `#ff6565`,
        fillRedDark: `#b53b3b`,
        fillYellowLight: `#fff770`,
        fillYellowDark: `#b8b33b`,
        fillLight: `#65e665`, // Bright green
        fillDark: `#3bb53b`,  // Darker green stripe
        bolt: `#70f7ff`,
        text: `#ffffff`,
        star: `#ffffff`
    };

    // --- HELPER: Draw Rectangle ---
    const rect = (x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    // 2. BACKGROUND LAYER
    rect(0, 0, logicalWidth, logicalHeight, C.sky);

    // Draw Stars (Randomly placed, simplified for demo)
    const stars = [[10, 20], [50, 15], [90, 30], [150, 10], [180, 40]] as const;
    stars.forEach(([x, y]) => rect(x, y, 1, 1, C.star));

    // 3. MOON LAYER
    // Draw pixel circle algorithm (simplified)
    const drawPixelCircle = (cx: number, cy: number, r: number, color: string) => {
        ctx.fillStyle = color;
        for (let y = -r; y <= r; y++) {
            for (let x = -r; x <= r; x++) {
                if (x * x + y * y <= r * r) {
                    ctx.fillRect(cx + x, cy + y, 1, 1);
                }
            }
        }
    };
    drawPixelCircle(150, 60, 14, C.moonShadow); // Outer/Shadow
    drawPixelCircle(150, 62, 11, C.moonCore);   // Inner/Light

    // 4. MOUNTAINS LAYER
    // Simple procedural terrain
    ctx.fillStyle = C.mountain;
    ctx.beginPath();
    ctx.moveTo(0, logicalHeight);
    for (let x = 0; x <= logicalWidth; x++) {
        // Create jagged peaks
        const noise = Math.sin(x * 0.1) * 5 + Math.cos(x * 0.3) * 3;
        ctx.lineTo(x, logicalHeight - 20 + noise);
    }
    ctx.lineTo(logicalWidth, logicalHeight);
    ctx.lineTo(0, logicalHeight);
    ctx.fill();

    // 5. THE ENERGY BAR (The Core Mechanic)

    // Bar Dimensions
    const barW = 140;
    const barH = 20;
    const barX = (logicalWidth - barW) / 2;
    const barY = 180;

    // Calculate Jitter (The "Volatile" effect)
    // Only jitter the filled part, or the whole bar if extremely unstable
    const jX = (Math.random() - 0.5) * config.jitterIntensity;
    const jY = (Math.random() - 0.5) * config.jitterIntensity;

    // Draw Container Background (Empty Slot)
    rect(barX, barY, barW, barH, C.barBg);

    // Draw Border (Red)
    ctx.strokeStyle = C.barBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.floor(barX) + 0.5, Math.floor(barY) + 0.5, barW, barH);

    // 6. THE FILL (Striped Animation)

    // Calculate width based on percentage
    // Clamp between 0 and max width
    const maxFillW = barW - 2; // -2 for border padding
    const fillW = Math.max(0, Math.min(maxFillW, (config.percentage / 100) * maxFillW));

    const [fillLight, fillDark] = (() => {
        if (config.percentage > 110) {
            return [C.fillNeonLight, C.fillNeonDark];
        }
        if (config.percentage > 70) {
            return [C.fillLight, C.fillDark];
        }
        if (config.percentage > 40) {
            return [C.fillYellowLight, C.fillYellowDark];
        }
        return [C.fillRedLight, C.fillRedDark];
    })();

    if (fillW > 0) {
        ctx.save();

        // Create clipping region for the fill so stripes don't bleed
        ctx.beginPath();
        ctx.rect(barX + 1 + jX, barY + 1 + jY, fillW, barH - 2);
        ctx.clip();

        // Draw Solid Light Green Base
        rect(barX + 1 + jX, barY + 1 + jY, fillW, barH - 2, fillLight);

        // Draw Dark Green Diagonal Stripes
        ctx.fillStyle = fillDark;
        const stripeGap = 12;
        const stripeWidth = 4;
        // Loop through x axis to draw diagonal lines
        for (let i = -barH; i < fillW + barH; i += stripeGap) {
            // Draw a pseudo-line using a polygon
            ctx.beginPath();
            ctx.moveTo(barX + 1 + jX + i, barY + 1 + jY + barH); // Bottom-left
            ctx.lineTo(barX + 1 + jX + i + stripeWidth, barY + 1 + jY + barH); // Bottom-right
            ctx.lineTo(barX + 1 + jX + i + barH + stripeWidth, barY + 1 + jY); // Top-right
            ctx.lineTo(barX + 1 + jX + i + barH, barY + 1 + jY); // Top-left
            ctx.fill();
        }

        ctx.restore();
    }

    // 7. THE BOLT ICON
    // Draw this *outside* the jitter so the UI frame feels grounded, 
    // or inside if you want the icon to shake too.
    const boltX = barX - 20;
    const boltY = barY + 1;
    const boltScaleX = 2.25;
    const boltScaleY = 1.5;

    ctx.fillStyle = C.bolt;
    ctx.beginPath();
    // Simple lightning shape
    ctx.moveTo(boltX + 5 * boltScaleX + jX, boltY + 0 * boltScaleY + jY);
    ctx.lineTo(boltX + 2 * boltScaleX + jX, boltY + 7 * boltScaleY + jY);
    ctx.lineTo(boltX + 5 * boltScaleX + jX, boltY + 7 * boltScaleY + jY);
    ctx.lineTo(boltX + 3 * boltScaleX + jX, boltY + 14 * boltScaleY + jY);
    ctx.lineTo(boltX + 8 * boltScaleX + jX, boltY + 6 * boltScaleY + jY);
    ctx.lineTo(boltX + 5 * boltScaleX + jX, boltY + 6 * boltScaleY + jY);
    ctx.lineTo(boltX + 8 * boltScaleX + jX, boltY + 0 * boltScaleY + jY);
    ctx.fill();
    // Bolt Border (Dark Blue)
    ctx.lineWidth = 1;
    ctx.strokeStyle = `#1a1a2e`;
    ctx.stroke();

    // 8. TEXT UI
    // Using a standard monospace font to simulate pixel text
    ctx.fillStyle = C.text;
    ctx.font = `15px monospace`;
    ctx.textBaseline = `top`;

    // "ENERGY LEVEL"
    ctx.fillText(`ENERGY LEVEL`, barX, barY + barH + 4);

    // PERCENTAGE
    const pctText = `${Math.floor(config.percentage)}%`;
    const pctWidth = ctx.measureText(pctText).width;
    ctx.fillText(pctText, barX + barW - pctWidth, barY + barH + 4);
};

export const animateEnergyBar = (
    canvas: HTMLCanvasElement,
) => {
    const ctx = canvas.getContext(`2d`);
    if (!ctx) return;

    let currentCharge = 0; // Starts at 0
    let maxCharge = 75;    // Derived from sleep tracking (5 cycles = 75%)

    function animate() {
        if (!ctx) return;

        // 1. Increment charge (simulate filling up)
        if (currentCharge < maxCharge) {
            currentCharge += 0.5;
        }

        // 2. Calculate Jitter
        // No jitter when empty, high jitter when full
        const volatility = (currentCharge / 100) * 3;

        // 3. Draw Frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        renderEnergyScene(canvas, ctx, {
            width: canvas.width,
            height: canvas.height,
            percentage: currentCharge,
            jitterIntensity: volatility
        });

        animationFrameId = requestAnimationFrame(animate);
    }
    let animationFrameId = requestAnimationFrame(animate);

    return {
        start: (args: {
            startCharge: number,
            endCharge: number
        }) => { currentCharge = args.startCharge; maxCharge = args.endCharge; },
        stop: () => { cancelAnimationFrame(animationFrameId); }
    };
}