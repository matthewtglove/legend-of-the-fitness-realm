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
export const MotionSpeeds = [`slow`, `normal`, `fast`, `explosive`] as const satisfies MotionSpeed[];
export const MuscleIntensities = [
    `unused`,
    `minor-flexing`,
    `supports-exercise`,
    `fully-engaged`,
    `primary-target-muscle-group`,
] as const satisfies MuscleIntensity[];

export type MuscleGroup = `core` | `back` | `chest` | `shoulders` | `arms` | `legs` | `glutes`;
export type MotionSpeed = `slow` | `normal` | `fast` | `explosive`;
export type MuscleIntensity =
    | `unused`
    | `minor-flexing`
    | `supports-exercise`
    | `fully-engaged`
    | `primary-target-muscle-group`;
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

type ExerciseDescription = {
    describeActualExerciseToUser?: string;
    instructions?: string;
    motionSpeed: MotionSpeed;
    usedMuscleGroups?: MuscleGroup[];
    muscleGroupIntensities: {
        core?: MuscleIntensity;
        back?: MuscleIntensity;
        arms?: MuscleIntensity;
        chest?: MuscleIntensity;
        shoulders?: MuscleIntensity;
        legs?: MuscleIntensity;
        glutes?: MuscleIntensity;
    };
};

const MuscleIntensitySchema = z.enum(MuscleIntensities);
const ExerciseInfoSchema = z
    .object({
        name: z.string(),
        motionSpeed: z.enum(MotionSpeeds),
        muscleGroups: z.object({
            core: MuscleIntensitySchema,
            back: MuscleIntensitySchema,
            arms: MuscleIntensitySchema,
            chest: MuscleIntensitySchema,
            shoulders: MuscleIntensitySchema,
            legs: MuscleIntensitySchema,
            glutes: MuscleIntensitySchema,
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
                    core: x.muscleGroupIntensities.core || `unused`,
                    back: x.muscleGroupIntensities.back || `unused`,
                    arms: x.muscleGroupIntensities.arms || `unused`,
                    chest: x.muscleGroupIntensities.chest || `unused`,
                    shoulders: x.muscleGroupIntensities.shoulders || `unused`,
                    legs: x.muscleGroupIntensities.legs || `unused`,
                    glutes: x.muscleGroupIntensities.glutes || `unused`,
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
type MuscleIntensity =
    | 'unused'
    | 'minor-flexing'
    | 'supports-exercise'
    | 'fully-engaged'
    | 'primary-target-muscle-group';

type ExerciseDescription = {
    instructions: string;
    motionSpeed: MotionSpeed;
    usedMuscleGroups: MuscleGroup[];
    muscleGroupIntensities: {
        core: MuscleIntensity;
        back: MuscleIntensity;
        arms: MuscleIntensity;
        chest: MuscleIntensity;
        shoulders: MuscleIntensity;
        legs: MuscleIntensity;
        glutes: MuscleIntensity;
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
