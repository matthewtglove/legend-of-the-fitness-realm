import { createObservable } from "../../../systems/observable";
import { Animation } from "../../animation-view";

interface EnergyBarConfig {
  percentage: number; // 0 to 100
  animationPercentage: number; // 0 to 100
  jitterIntensity: number; // 0 = stable, 5 = violent shaking
  width: number;
  height: number;
}

// --- HELPER: Color Interpolation ---
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) as [string, string, string, string] | null;
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : { r: 0, g: 0, b: 0 };
};

const lerpColor = (c1: string, c2: string, factor: number) => {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
  return `rgb(${r}, ${g}, ${b})`;
};

export const renderEnergyScene = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  config: EnergyBarConfig
) => {
  const logicalWidth = config.width;
  const logicalHeight = config.height;

  // Normalize progress (0 to 1 based on percentage, capped at 1 for sky logic)
  // We clamp it so the sun stays up if charge goes > 100%
  // const animationProgress = Math.min(Math.max(config.animationPercentage / 100, 0), 1);
  const slowPercentage = 90;
  const slowSpeedRatio = 0.1;
  const animationProgressRaw = config.animationPercentage < slowPercentage ? (config.animationPercentage / 100) : ((slowPercentage + slowSpeedRatio * (config.animationPercentage - slowPercentage)) / 100);
  const animationProgress = -1 + animationProgressRaw * 2;

  // --- COLORS PALETTE ---
  const C = {
    // Dynamic Sky Colors
    nightSky: `#181438`,
    sunriseSky: `#ff9060`, // Orange/Pink
    daySky: `#60aaff`, // Bright Blue

    // Dynamic Mountain Colors
    mountainNight: `#252152`,
    mountainDay: `#3b4b7a`,

    // Celestial
    moonCore: `#b366ff`,
    moonShadow: `#7a45b8`,
    sunCore: `#fffeb0`,
    sunGlow: `#ffae00`,
    star: `#ffffff`,

    // Bar Colors
    barBorder: `#e63e3e`,
    barBg: `#2a1d3d`,
    fillNeonLight: `#8affff`,
    fillNeonDark: `#4bb8b5`,
    fillRedLight: `#ff6565`,
    fillRedDark: `#b53b3b`,
    fillYellowLight: `#fff770`,
    fillYellowDark: `#b8b33b`,
    fillLight: `#65e665`,
    fillDark: `#3bb53b`,
    bolt: `#70f7ff`,
    text: `#ffffff`,
  };

  // --- HELPER: Draw Rectangle ---
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  };

  // --- HELPER: Draw Pixel Circle ---
  const drawPixelCircle = (
    cx: number,
    cy: number,
    r: number,
    color: string
  ) => {
    ctx.fillStyle = color;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) {
          ctx.fillRect(Math.floor(cx + x), Math.floor(cy + y), 1, 1);
        }
      }
    }
  };


  const sunRiseStartAtRatio = 0.6;
  const sunRiseEndAtRatio = 0.8;
  const hazeEndAtRatio = 1.1;
  const sunRiseMidAtRatio = (sunRiseStartAtRatio + sunRiseEndAtRatio) / 2;

  const ratioNight = animationProgress > sunRiseMidAtRatio ? 0.0 : animationProgress < sunRiseStartAtRatio ? 1.0 : 1.0 - (animationProgress - sunRiseStartAtRatio) * (1 / (sunRiseMidAtRatio - sunRiseStartAtRatio));
  const ratioDay = animationProgress < sunRiseMidAtRatio ? 0.0 : animationProgress > sunRiseEndAtRatio ? 1.0 : (animationProgress - sunRiseMidAtRatio) * (1 / (sunRiseEndAtRatio - sunRiseMidAtRatio));
  const ratioHaze = 1 - (animationProgress < sunRiseEndAtRatio ? 0.0 : animationProgress > hazeEndAtRatio ? 1.0 : (animationProgress - sunRiseEndAtRatio) * (1 / (hazeEndAtRatio - sunRiseEndAtRatio)));
  // const ratioSunrise = 1.0 - ratioNight - ratioDay;

  // 1. DYNAMIC SKY BACKGROUND
  // Interpolate: Night (0.0) -> Sunrise (0.5) -> Day (1.0)
  const skyColor = ratioNight > 0 ? lerpColor(C.sunriseSky, C.nightSky, ratioNight)
    : lerpColor(C.sunriseSky, C.daySky, ratioDay);

  // Create a gradient for the sky to look nicer
  const gradient = ctx.createLinearGradient(0, 0, 0, logicalHeight);
  gradient.addColorStop(0, skyColor);
  gradient.addColorStop(1, lerpColor(skyColor, `#000000`, 0.2)); // Slight fade at bottom
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // 2. CELESTIAL ROTATION
  // We rotate the Moon and Sun around a pivot point deep below the canvas
  const pivotX = logicalWidth / 2;
  const pivotY = logicalHeight + 200; // Pivot point far below screen
  const orbitRadius = 460; // Distance from pivot

  const sunPivotX = logicalWidth / 2 + 100;
  const sunPivotY = logicalHeight + 100;
  const sunOrbitRadius = 260;

  // Angle: Start at PI (180deg, left horizon) go to 0 (0deg, right horizon)
  // Shifted: Start at -135deg (Moon high), Rotate 90deg.
  const rotationOffset = (animationProgress * Math.PI) / 2; // Rotate 90 degrees total

  // --- STARS (Rotate/Translate) ---
  // Stars fade out as it becomes day (progress > 0.4)
  const starOpacity = 1.0 - ratioDay;
  if (starOpacity > 0) {
    ctx.globalAlpha = starOpacity;
    // const starShiftX = animationProgress * 50; // Stars move slowly right
    const stars = ((([
      [10, 20], [50, 15], [90, 30], [150, 10], [180, 40],
      [220, 25], [260, 50], [300, 10]
    ] as const).flatMap(([x, y]) => [
      [x, y] as [number, number],
      [x - 400, y + 110] as [number, number],
      [x - 200, y + 370] as [number, number],
      [x + 200, y + 230] as [number, number],
      [x + 400, y + 170] as [number, number],
    ])))
      .map(([x, y]) => [Math.floor(x * 49 * (1 + Math.sin(x * 1371))), Math.floor(y * 79 * (1 + Math.sin(x * 7371)))] as [number, number])
      .map(([x, y]) => [x % logicalWidth, y % logicalHeight] as [number, number]);

    stars.forEach(([x, y]) => {
      const starAngle = -Math.PI / 1.8 + x + rotationOffset;
      const starX = pivotX + Math.cos(starAngle) * y * 2;
      const starY = pivotY + Math.sin(starAngle) * y * 2;

      // // Wrap around screen
      // const drawX = (x + starShiftX) % logicalWidth;
      rect(starX, starY, 2, 2, C.star);
    });
    ctx.globalAlpha = 1.0;
  }

  // --- MOON (Sets to the right) ---
  // Moon starts at roughly -100deg, rotates to right
  const moonAngle = -Math.PI / 1.8 + rotationOffset;
  const moonX = pivotX + Math.cos(moonAngle) * orbitRadius;
  const moonY = pivotY + Math.sin(moonAngle) * orbitRadius;

  drawPixelCircle(moonX, moonY, 14, C.moonShadow);
  drawPixelCircle(moonX + 2, moonY - 2, 11, C.moonCore);

  // --- SUN (Rises from the left) ---
  // Sun follows the moon (offset by ~180 degrees or adjusted for visual preference)
  // Let's make sun rise as moon sets.
  const sunAngle = -Math.PI - 1.0 + rotationOffset;
  const sunX = sunPivotX + Math.cos(sunAngle) * sunOrbitRadius;
  const sunY = sunPivotY + Math.sin(sunAngle) * sunOrbitRadius;

  // Sun Glow
  ctx.globalAlpha = 0.1 + 0.5 * (ratioHaze);
  drawPixelCircle(sunX, sunY, 15 + 50 * ratioHaze, C.sunGlow);
  ctx.globalAlpha = 1.0;
  // Sun Core
  drawPixelCircle(sunX, sunY, 12, C.sunCore);


  // 4. MOUNTAINS LAYER
  // Interpolate mountain color based on light
  const mountainColor = lerpColor(C.mountainNight, C.mountainDay, ratioDay);
  ctx.fillStyle = mountainColor;
  ctx.beginPath();
  ctx.moveTo(0, logicalHeight);
  for (let x = 0; x <= logicalWidth; x++) {
    // Create jagged peaks
    const noise = Math.sin(x * 0.11) * 5 + Math.sin(x * 0.13) * 7 + Math.cos(x * 0.3) * 3 + Math.sin((x - logicalWidth / 2) * 0.018) * 17 + Math.cos(x * 0.003) * 5;
    ctx.lineTo(x, logicalHeight - 20 + noise);
  }
  ctx.lineTo(logicalWidth, logicalHeight);
  ctx.lineTo(0, logicalHeight);
  ctx.fill();

  // 5. THE ENERGY BAR (The Core Mechanic)
  const barW = 140;
  const barH = 20;
  const barX = (logicalWidth - barW) / 2;
  const barY = 180;

  // Jitter Calculation
  const jX = (Math.random() - 0.5) * config.jitterIntensity;
  const jY = (Math.random() - 0.5) * config.jitterIntensity;

  // Draw Container Background
  rect(barX, barY, barW, barH, C.barBg);

  // Draw Border
  ctx.strokeStyle = C.barBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.floor(barX) + 0.5, Math.floor(barY) + 0.5, barW, barH);

  // 6. THE FILL
  const maxFillW = barW - 2;
  const fillW = Math.max(
    0,
    Math.min(maxFillW, (config.percentage / 100) * maxFillW)
  );

  const [fillLight, fillDark] = (() => {
    if (config.percentage > 110) return [C.fillNeonLight, C.fillNeonDark];
    if (config.percentage > 70) return [C.fillLight, C.fillDark];
    if (config.percentage > 40) return [C.fillYellowLight, C.fillYellowDark];
    return [C.fillRedLight, C.fillRedDark];
  })();

  if (fillW > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(barX + 1 + jX, barY + 1 + jY, fillW, barH - 2);
    ctx.clip();

    rect(barX + 1 + jX, barY + 1 + jY, fillW, barH - 2, fillLight);

    ctx.fillStyle = fillDark;
    const stripeGap = 12;
    const stripeWidth = 4;
    for (let i = -barH; i < fillW + barH; i += stripeGap) {
      ctx.beginPath();
      ctx.moveTo(barX + 1 + jX + i, barY + 1 + jY + barH);
      ctx.lineTo(barX + 1 + jX + i + stripeWidth, barY + 1 + jY + barH);
      ctx.lineTo(barX + 1 + jX + i + barH + stripeWidth, barY + 1 + jY);
      ctx.lineTo(barX + 1 + jX + i + barH, barY + 1 + jY);
      ctx.fill();
    }
    ctx.restore();
  }

  // 7. THE BOLT ICON
  const boltX = barX - 20;
  const boltY = barY + 1;
  const boltScaleX = 2.25;
  const boltScaleY = 1.5;

  ctx.fillStyle = C.bolt;
  ctx.beginPath();
  ctx.moveTo(boltX + 5 * boltScaleX + jX, boltY + 0 * boltScaleY + jY);
  ctx.lineTo(boltX + 2 * boltScaleX + jX, boltY + 7 * boltScaleY + jY);
  ctx.lineTo(boltX + 5 * boltScaleX + jX, boltY + 7 * boltScaleY + jY);
  ctx.lineTo(boltX + 3 * boltScaleX + jX, boltY + 14 * boltScaleY + jY);
  ctx.lineTo(boltX + 8 * boltScaleX + jX, boltY + 6 * boltScaleY + jY);
  ctx.lineTo(boltX + 5 * boltScaleX + jX, boltY + 6 * boltScaleY + jY);
  ctx.lineTo(boltX + 8 * boltScaleX + jX, boltY + 0 * boltScaleY + jY);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = `#1a1a2e`;
  ctx.stroke();

  // 8. TEXT UI
  ctx.fillStyle = C.text;
  ctx.font = `15px monospace`;
  ctx.textBaseline = `top`;

  // Add a slight text shadow for readability against bright day sky
  ctx.shadowColor = `rgba(0,0,0,0.5)`;
  ctx.shadowBlur = 2;

  ctx.fillText(`ENERGY LEVEL`, barX, barY + barH + 4);
  const pctText = `${Math.floor(config.percentage)}%`;
  const pctWidth = ctx.measureText(pctText).width;
  ctx.fillText(pctText, barX + barW - pctWidth, barY + barH + 4);

  // Reset shadow
  ctx.shadowBlur = 0;
};

export type EnergyBarArgs = {
  startCharge: number;
  endCharge: number;
  speed: number;
};
export type EneryBarResult = {
  finalCharge: number;
};

export const energyBarAnimation: Animation<EnergyBarArgs, EneryBarResult> = {
  setup: (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext(`2d`);
    if (!ctx) {
      throw new Error(`Failed to get 2D context for energy bar animation`);
    }

    let currentCharge = 0;
    let maxCharge = 0;
    let speed = 100;
    let currentAnimationPercentage = 0;
    let animationFrameId: number;

    const doneSubject = createObservable(undefined as undefined | {
      kind: `completed` | `stopped`,
      result: EneryBarResult,
    });

    function animate() {
      if (!ctx) return;

      currentAnimationPercentage += (0.5 * speed) / 100;

      if (currentCharge < maxCharge) {
        currentCharge += (0.5 * speed) / 100;
      }

      if (currentCharge > maxCharge) {
        currentCharge = maxCharge;
      }

      if (currentAnimationPercentage >= 120 && doneSubject.lastValue?.kind !== `completed`) {
        doneSubject.next({ kind: `completed`, result: { finalCharge: currentCharge } });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderEnergyScene(canvas, ctx, {
        width: canvas.width,
        height: canvas.height,
        percentage: currentCharge,
        animationPercentage: currentAnimationPercentage,
        jitterIntensity: (currentCharge / 100) * 3,
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);

    return {
      start: (args: EnergyBarArgs) => {
        currentAnimationPercentage = 0;
        currentCharge = args.startCharge;
        maxCharge = args.endCharge;
        speed = args.speed;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(animate);
        doneSubject.next(undefined);
      },
      stop: () => {
        cancelAnimationFrame(animationFrameId);
        doneSubject.next({ kind: `stopped`, result: { finalCharge: currentCharge } });
      },
      pause: (isPaused: boolean) => {
        if (isPaused) {
          cancelAnimationFrame(animationFrameId);
          return;
        }
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(animate);
      },
      done: doneSubject
    };
  }
};