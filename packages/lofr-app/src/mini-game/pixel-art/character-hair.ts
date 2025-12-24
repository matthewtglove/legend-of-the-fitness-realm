export type PixelPaletteColor = {
    kind: `base` | `outline` | `shadow` | `highlight`;
    /** RGB color components, each in range 0-255 */
    color: [number, number, number];
};

export type PixelArtHairArgs = {
    origin: {
        x: number;
        y: number;
    };
    strands: {
        /** The root pixel position of a section of the hair */
        x: number;
        y: number;

        /** The growing direction of the root of the hair */
        growthAngleRad: number;

        /** Approximate pixel length of the hair */
        hairLength: number;

        /** Pixel Thickness at the root and tip
         * 1=very thin (single hair)
         * 6=very thick (full ponytail)
         */
        thicknessProfile: [number, number];

        /** How wavy is the hair: 
         * 0=straight (the hair mostly follows a bezier curve)
         * 0.5=wavy (the hair follows a wavy curve)
         * 1=curly (the hair follows a spiral curve)
         */
        waviness: number;
    }[],
    /** gravity is a constant force */
    gravity: {
        angleRad: number;
        /** 0=no gravity
         *  1=earth gravity
         *  2=double earth gravity
         *  etc.
         */
        strength: number;
    };
    /** wind is a gusty animated force */
    wind: {
        angleRad: number;
        /** 0=no wind
         *  0.1=light breeze
         *  0.5=normal wind
         *  1=strongest wind
         */
        strength: number;
        /** 0=constant wind
         *  0.5=normal gustiness (2-3 cycles per animation loop)
         *  1=highly fluctuating wind (5-7 cycles per animation loop)
         */
        gustiness: number;
    };
    /** 0-1 progress of the hair animation which should loop */
    animationRatio: number;
    colorPalette: PixelPaletteColor[];
}

export const defaultHairArguments: PixelArtHairArgs = {
    origin: { x: 15, y: 12 }, // Top Center of 24x32 character cell
    // A classic "Spiky Anime" hairstyle with 3 distinct volumes
    strands: [
        // 1. The Main Spike (Top Center) - Large volume sticking up
        {
            x: 0,
            y: -5, // Starts slightly above the "center" of the head
            growthAngleRad: -Math.PI * 0.5, // Pointing straight UP (-90 degrees)
            hairLength: 5,
            thicknessProfile: [3, 1], // Starts very thick, ends in a sharp point
            waviness: 0.1 // Mostly straight/spiky
        },
        {
            x: -2,
            y: -4, // Starts slightly above the "center" of the head
            growthAngleRad: -Math.PI * 0.55, // Pointing straight UP (-90 degrees)
            hairLength: 7,
            thicknessProfile: [4, 1], // Starts very thick, ends in a sharp point
            waviness: 0.1 // Mostly straight/spiky
        },
        {
            x: -4,
            y: -2, // Starts slightly above the "center" of the head
            growthAngleRad: -Math.PI * 0.65, // Pointing straight UP (-90 degrees)
            hairLength: 9,
            thicknessProfile: [5, 1], // Starts very thick, ends in a sharp point
            waviness: 0.1 // Mostly straight/spiky
        },
        // 2. The Bangs (Front/Right) - Falling over the forehead
        {
            x: 0,
            y: -5,
            growthAngleRad: -Math.PI * 0.1, // Pointing Down-Right
            hairLength: 7,
            thicknessProfile: [3, 1], // Thinner, sharper
            waviness: 0.2 // Slight curve
        },
        // 3. The Flow (Back/Left) - Long hair caught in the wind

        {
            x: -3,
            y: -3,
            growthAngleRad: -Math.PI * 1.25, // Pointing Left
            hairLength: 11,
            thicknessProfile: [5, 2], // Remans somewhat thick at the end
            waviness: 0.5 // Wavy/Flowing look
        },
        {
            x: -3,
            y: -3,
            growthAngleRad: -Math.PI * 1.0, // Pointing Left
            hairLength: 11,
            thicknessProfile: [4, 2], // Remans somewhat thick at the end
            waviness: 0.5 // Wavy/Flowing look
        },

    ],

    // Standard Earth Gravity (Pulling down)
    gravity: {
        angleRad: Math.PI / 2, // 90 degrees (Straight Down)
        strength: 0.8 // Enough to pull the long hair down, but lets the spike stay up
    },

    // A gentle breeze blowing Left -> Right
    wind: {
        angleRad: -Math.PI * 1.1,
        // angleRad: 0, // 0 degrees (Right)
        // angleRad: Math.PI, // 180 degrees (Left)
        strength: 0.75, // Visible movement, but not a storm
        gustiness: 0.5 // Occasional flutters
    },

    animationRatio: 0, // Should be incremented by delta time in your loop

    // "Mana Red" Palette - High contrast for readability on small screens
    colorPalette: [
        {
            kind: `outline`,
            color: [25, 15, 10] // Very dark, warm brown (almost black)
        },
        {
            kind: `shadow`,
            color: [117, 30, 25] // Deep Maroon/Burgundy
        },
        {
            kind: `base`,
            color: [212, 78, 40] // Vibrant Rusty Orange
        },
        {
            kind: `highlight`,
            color: [245, 180, 100] // Bright Peach/Gold
        }
    ]
};

export const drawPixelArtHair = (args: {
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    hair: PixelArtHairArgs
}) => {
    const { ctx } = args;
    const { origin, strands, gravity, wind, animationRatio, colorPalette } = args.hair;

    // --- 1. PRE-CALCULATE COLORS ---
    // Convert [r,g,b] to CSS strings for performance
    const getColor = (kind: PixelPaletteColor[`kind`]): string => {
        const c = colorPalette.find(p => p.kind === kind);
        if (!c) return `rgba(255,0,255,1)`; // Error pink
        return `rgb(${Math.floor(c.color[0])}, ${Math.floor(c.color[1])}, ${Math.floor(c.color[2])})`;
    };

    const cBase = getColor(`base`);
    const cOutline = getColor(`outline`);
    const cShadow = getColor(`shadow`);
    const cHighlight = getColor(`highlight`);

    // --- 2. CONFIGURATION ---
    // Map the normalized thickness (0-1) to actual SNES pixel widths
    const MIN_PIXELS = 1;
    const MAX_PIXELS = 6; // A thick ponytail in SNES style is rarely wider than 6px

    const mapThickness = (t: number) => Math.max(MIN_PIXELS, Math.min(MAX_PIXELS, t));

    // --- 3. RENDERING LOOP ---
    strands.forEach((root, rootIndex) => {
        let currentX = root.x + origin.x;
        let currentY = root.y + origin.y;
        let currentAngle = root.growthAngleRad;

        // We step 1 pixel at a time along the length to prevent gaps
        // This is "Forward Kinematics"
        const SUB_STEPS = 3;
        const steps = Math.ceil(root.hairLength * SUB_STEPS);

        // Desynchronize wind per strand so they don't move like a solid block
        const phaseOffset = rootIndex * 0.5;

        for (let iStep = 0; iStep < steps; iStep++) {
            const lenRatioPos = iStep / steps; // 0.0 to 1.0

            // --- A. PHYSICS CALCULATION ---

            // 1. Gravity Influence
            // Pull the angle slowly towards gravity direction
            const gravityDiff = gravity.angleRad - currentAngle;
            // Normalize angle diff to -PI to +PI
            const normalizedGravityDiff = Math.atan2(Math.sin(gravityDiff), Math.cos(gravityDiff));
            currentAngle += normalizedGravityDiff * (gravity.strength * 0.05 * lenRatioPos) / SUB_STEPS;

            // 2. Wind Influence (Sine Wave)
            // Main cycle
            const loopTheta = animationRatio * Math.PI * 2;
            const windCycle = Math.sin(loopTheta + phaseOffset);

            // Gustiness (High frequency noise added to the cycle)
            const gustCycle = Math.cos(loopTheta * 3 + phaseOffset) * wind.gustiness;

            // Calculate wind vector influence relative to hair angle
            const windForce = (windCycle + gustCycle) * wind.strength * 0.1 * lenRatioPos;

            // Apply wind (simply adding to angle creates a waving motion)
            currentAngle += windForce / SUB_STEPS;

            // 3. Waviness (Static Shape)
            // If hair is curly, add a permanent sine wave to the angle
            if (root.waviness > 0) {
                const waveFreq = 0.2 + (root.waviness * 0.5); // How tight the curls are
                currentAngle += Math.cos(lenRatioPos * Math.PI * 2 * 1.5 * waveFreq) * (root.waviness * 0.2) / SUB_STEPS;
            }

            // Move the spine position forward based on the new angle
            currentX += Math.cos(currentAngle) / SUB_STEPS;
            currentY += Math.sin(currentAngle) / SUB_STEPS;

            // --- B. RASTERIZATION (The "Ribbon") ---

            // Calculate current thickness in pixels
            const startThick = mapThickness(root.thicknessProfile[0]);
            const endThick = mapThickness(root.thicknessProfile[1]);
            const currentThickness = startThick + (endThick - startThick) * lenRatioPos;

            // const radius = currentThickness / 2;

            // Calculate Normal Vector (Perpendicular to hair direction)
            // If hair moves at angle A, Normal is A + 90deg
            const normalAngle = currentAngle + (Math.PI / 2);
            const nx = Math.cos(normalAngle);
            const ny = Math.sin(normalAngle);

            // Draw the "Scanline" of pixels across the width
            // We iterate from -radius to +radius
            const scanSteps = Math.ceil(currentThickness * 3);

            for (let w = 0; w <= scanSteps; w++) {
                // Offset from center (-0.5 to 0.5)
                const offsetFactor = (w / scanSteps) - 0.5;

                // Actual world pixel position
                // We round to snap to grid (Pixel Art look)
                const pixelX = Math.round(currentX + (nx * offsetFactor * currentThickness));
                const pixelY = Math.round(currentY + (ny * offsetFactor * currentThickness));

                // --- C. SEMANTIC PAINTING ---

                let pixelColor = cBase;

                // 1. Outline Rule
                // If we are at the extreme edges of the scan, draw outline
                const isEdge = Math.abs(offsetFactor) > 0.4; // Top 10% and Bottom 10% are edges
                if (isEdge && currentThickness > 1) {
                    pixelColor = cOutline;
                } else {
                    // 2. Lighting / Volume Rule
                    // "Tube" lighting: Center is bright, edges are dark.
                    // But we also check Verticality for shadows.

                    // Simple Light Direction: Top-Left (-1, -1)
                    // We simulate light by checking the offset. 
                    // -0.5 is one side, +0.5 is the other.

                    // Let's assume the "Top" of the hair strand (relative to world) should be lit.
                    // We check the Y-component of the normal offset.
                    const pixelIsHigh = (ny * offsetFactor) < 0; // If offset moves us UP, we are on top

                    if (pixelIsHigh && Math.abs(offsetFactor) < 0.3) {
                        pixelColor = cHighlight;
                    } else if (!pixelIsHigh && Math.abs(offsetFactor) > 0.1) {
                        pixelColor = cShadow;
                    }

                    // 3. The "Mana" Dither Banding
                    // In SNES games, hair often has horizontal bands of shadow 
                    // to break up the color and make it look textured.
                    const screenY = Math.round(pixelY);

                    // Every 4th pixel row is a "Shadow Band"
                    // But we offset it by X so the bands follow the hair flow slightly
                    const bandPattern = (screenY + Math.round(pixelX / 2)) % 4 === 0;

                    if (bandPattern) {
                        // If it's highlight, degrade to base. If base, degrade to shadow.
                        if (pixelColor === cHighlight) pixelColor = cBase;
                        else if (pixelColor === cBase) pixelColor = cShadow;
                    }
                }

                // Draw 1x1 pixel
                ctx.fillStyle = pixelColor;
                ctx.fillRect(pixelX, pixelY, 1, 1);
            }
        }
    });
};

