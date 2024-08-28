export type LoreBuilderDependencies = {
    aiProvider: {
        sendPrompt: (
            systemPrompt: string,
            prompt: string,
            options?: {
                maxPromptResponseLength?: number;
            },
        ) => Promise<undefined | string>;
    };
    storageProvider: {
        get: (key: string) => undefined | string;
        set: (key: string, value: string) => void;
        remove: (key: string) => void;
    };
};

export const MuscleGroups = [
    `core`,
    `back`,
    `chest`,
    `shoulders`,
    `arms`,
    `legs`,
    `glutes`,
] as (keyof ExerciseInfo[`muscleGroups`])[];
export const MotionSpeeds = [`slow`, `normal`, `fast`, `explosive`] as const satisfies MotionSpeed[];

export type MuscleGroup = `core` | `back` | `chest` | `shoulders` | `arms` | `legs` | `glutes`;

export type MotionSpeed = `slow` | `normal` | `fast` | `explosive`;
export type MuscleIntensity = 0 | 1 | 2 | 3 | 4 | 5;
export type ExerciseInfo = {
    name: string;
    motionSpeed: MotionSpeed;
    muscleGroups: {
        core: MuscleIntensity;
        back: MuscleIntensity;
        arms: MuscleIntensity;
        chest: MuscleIntensity;
        shoulders: MuscleIntensity;
        legs: MuscleIntensity;
        glutes: MuscleIntensity;
    };
    raw?: unknown;
};
