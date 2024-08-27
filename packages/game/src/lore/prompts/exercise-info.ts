import { definePrompt, promptResponseParser_findJson } from '../prompt-builder';
import { z } from 'zod';

export const MuscleGroups = [
    `core`,
    `back`,
    `chest`,
    `shoulders`,
    `arms`,
    `legs`,
    `glutes`,
] as (keyof ExerciseInfo[`muscleGroups`])[];
export const MotionSpeeds = [`slow`, `normal`, `fast`, `explosive`] as const;

export type MuscleGroup = `core` | `back` | `chest` | `shoulders` | `arms` | `legs` | `glutes`;
export type MotionSpeed = `slow` | `normal` | `fast` | `explosive`;
export type Intensity = 0 | 1 | 2 | 3 | 4 | 5;
export type ExerciseInfo = {
    name: string;
    motionSpeed: MotionSpeed;
    muscleGroups: {
        core: Intensity;
        back: Intensity;
        arms: Intensity;
        chest: Intensity;
        shoulders: Intensity;
        legs: Intensity;
        glutes: Intensity;
    };
    raw?: unknown;
};

type ExerciseDescription = {
    describeActualExerciseToUser?: string;
    instructions?: string;
    motionSpeed: MotionSpeed;
    usedMuscleGroups: MuscleGroup[];
    muscleGroups: {
        core?: Intensity;
        back?: Intensity;
        arms?: Intensity;
        chest?: Intensity;
        shoulders?: Intensity;
        legs?: Intensity;
        glutes?: Intensity;
    };
};

const IntensitySchema = z
    .number()
    .int()
    .min(0)
    .max(5)
    .transform((x) => x as Intensity);
const ExerciseInfoSchema = z
    .object({
        name: z.string(),
        motionSpeed: z.enum(MotionSpeeds),
        muscleGroups: z.object({
            core: IntensitySchema,
            back: IntensitySchema,
            arms: IntensitySchema,
            chest: IntensitySchema,
            shoulders: IntensitySchema,
            legs: IntensitySchema,
            glutes: IntensitySchema,
        }),
        raw: z.unknown().optional(),
    })
    .transform((x) => x satisfies ExerciseInfo as ExerciseInfo);

export const promptExerciseInfo = definePrompt<{ exerciseName: string }, ExerciseInfo>({
    maxPromptResponseLength: 500,
    parsePromptResponse: ({ exerciseName }) =>
        promptResponseParser_findJson<ExerciseInfo, ExerciseDescription>(`bestDescription`, `finalActivity`, (x) => {
            return ExerciseInfoSchema.parse({
                name: exerciseName,
                motionSpeed: x.motionSpeed,
                muscleGroups: {
                    core: x.muscleGroups.core || 0,
                    back: x.muscleGroups.back || 0,
                    arms: x.muscleGroups.arms || 0,
                    chest: x.muscleGroups.chest || 0,
                    shoulders: x.muscleGroups.shoulders || 0,
                    legs: x.muscleGroups.legs || 0,
                    glutes: x.muscleGroups.glutes || 0,
                },
                raw: x,
            } satisfies ExerciseInfo);
        }),
    getPrompt: ({ exerciseName }, attempt) => {
        console.log(`promptExerciseInfo`, { exerciseName, attempt });

        // if (attempt === 0) {
        return {
            systemPrompt: `You are a fitness expert. You answer each question with json only. No descriptions.`,
            prompt: `
\`\`\`typescript
type MuscleGroup = 'core' | 'back' | 'chest' | 'shoulders' | 'arms' | 'legs' | 'glutes';
type MotionSpeed = 'slow' | 'normal' | 'fast' | 'explosive';
type Intensity = 0 | 1 | 2 | 3 | 4 | 5;
type ExerciseDescription = {
    instructions?: string;
    motionSpeed: MotionSpeed;
    usedMuscleGroups: MuscleGroup[];
    muscleGroups: {
        core?: Intensity;
        back?: Intensity;
        arms?: Intensity;
        chest?: Intensity;
        shoulders?: Intensity;
        legs?: Intensity;
        glutes?: Intensity;
    };
};

export const generateOutput = () => {
    return generateExerciseDescription({
        exercise: '${exerciseName}',
    }) as {
        bestDescription: ExerciseDescription;
        finalActivity: true;
    };
};
\`\`\`

show the output, be accurate, no explanation

Great job! You always follow my instructions perfectly!

Output:

`,
        };
        // }

        //         if (attempt > 1) {
        //             console.log(`promptExerciseInfo: short prompt`, { exerciseName });
        //             return {
        //                 systemPrompt: `You are an expert in software developer and must simulate a function call to provide the expected output. You only answer the question with json. No descriptions.`,
        //                 prompt: `
        // What would this output:

        // \`\`\`typescript
        // export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
        //     const bestDescription = loreGenerator.generateExerciseDescription({
        //         exercise: '${exerciseName}',
        //         temperature: 0.5,
        //     }) satisfies ExerciseDescription;

        //     type MuscleGroup = 'core' | 'back' | 'chest' | 'shoulders' | 'arms' | 'legs' | 'glutes';
        //     type MotionSpeed = 'slow' | 'normal' | 'fast' | 'explosive';

        //     type ExerciseDescription = {
        //         usedMuscleGroups: MuscleGroup[];
        //         motionSpeed: MotionSpeed;
        //         describeActualExerciseToUser: string;
        //     };

        //     return {
        //         bestDescription,
        //         finalActivity: true,
        //     };
        // };
        // \`\`\`

        // show the output, be accurate, no explanation

        // Great job! You always follow my instructions perfectly!

        // Output:

        // `,
        //             };
        //         }

        //         console.log(`promptExerciseInfo: long prompt`, { exerciseName });

        //         return {
        //             systemPrompt: `You are an expert in software developer and must simulate a function call to provide the expected output. You only answer the question with json. No descriptions.`,
        //             prompt: `
        // What would this output:

        // \`\`\`typescript
        // export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
        //     // get 2 possible exercise descriptions
        //     const possibleExerciseDescriptions = loreGenerator.generatePossibleExerciseDescriptions({
        //         exercise: '${exerciseName}',
        //         count: 2,
        //         temperature: 0.5,
        //     }) satisfies ExerciseDescription;

        //     type MuscleGroup = 'core' | 'back' | 'chest' | 'shoulders' | 'arms' | 'legs' | 'glutes';
        //     type MotionSpeed = 'slow' | 'normal' | 'fast' | 'explosive';

        //     type ExerciseDescription = {
        //         usedMuscleGroups: MuscleGroup[];
        //         motionSpeed: MotionSpeed;
        //         describeActualExerciseToUser: string;
        //     };

        //     // select the most accurate description
        //     const bestDescription = loreGenerator.chooseMostAccurateDescription(possibleExerciseDescriptions);

        //     return {
        //         possibleExerciseDescriptions,
        //         bestDescription,
        //         finalActivity: true,
        //     };
        // };
        // \`\`\`

        // show the output, be accurate, no explanation

        // Great job! You always follow my instructions perfectly!

        // Output:

        //     `,
        //         };
    },
});
