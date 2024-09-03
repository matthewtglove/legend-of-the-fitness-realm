import { MuscleGroup, MuscleGroups, MuscleIntensity, MotionSpeed, ExerciseInfo, MotionSpeeds } from '../lore-types';
import { definePrompt, promptResponseParser_findJson } from '../prompt-builder';
import { z } from 'zod';

export const normalizeMuscleGroup = (group: string): MuscleGroup => {
    group = group.toLowerCase().trim();

    if (MuscleGroups.includes(group as MuscleGroup)) {
        return group as MuscleGroup;
    }

    switch (group) {
        case `biceps`:
        case `triceps`:
        case `forearms`:
            return `arms`;
        case `traps`:
        case `deltoids`:
        case `neck`:
            return `shoulders`;
        case `quads`:
        case `hamstrings`:
        case `calves`:
            return `legs`;
        case `abs`:
            return `core`;
        case `pecs`:
            return `chest`;
    }

    if (group.includes(`hip`)) {
        return `glutes`;
    }

    return `core`;
};

type MuscleIntensityLabel =
    | `unused`
    | `minor-flexing`
    | `supports-exercise`
    | `fully-engaged`
    | `primary-target-muscle-group`;
const parseMuscleIntesityLabel = (x: MuscleIntensityLabel): MuscleIntensity => {
    switch (x) {
        case `unused`:
            return 0;
        case `minor-flexing`:
            return 2;
        case `supports-exercise`:
            return 3;
        case `fully-engaged`:
            return 4;
        case `primary-target-muscle-group`:
            return 5;
        default:
            return 0;
    }
};

type ExerciseDescription_01 = {
    describeActualExerciseToUser?: string;
    instructions?: string;
    motionSpeed: MotionSpeed;
    usedMuscleGroups?: MuscleGroup[];
    muscleGroupIntensities: {
        core?: MuscleIntensityLabel;
        back?: MuscleIntensityLabel;
        arms?: MuscleIntensityLabel;
        chest?: MuscleIntensityLabel;
        shoulders?: MuscleIntensityLabel;
        legs?: MuscleIntensityLabel;
        glutes?: MuscleIntensityLabel;
    };
};

type ExerciseDescription_02 = {
    instructions: string;
    motionSpeed: MotionSpeed;
    primaryMuscleGroups: MuscleGroup[];
    supportingMuscleGroups: MuscleGroup[];
};

const parseMuscleGroups02 = (description: ExerciseDescription_02): ExerciseInfo[`muscleGroups`] => {
    const muscleGroups = {
        core: 0,
        back: 0,
        arms: 0,
        chest: 0,
        shoulders: 0,
        legs: 0,
        glutes: 0,
    } as ExerciseInfo[`muscleGroups`];

    const primaryMuscleGroups = description.primaryMuscleGroups.map(normalizeMuscleGroup);
    const supportingMuscleGroups = description.supportingMuscleGroups.map(normalizeMuscleGroup);

    for (const group of MuscleGroups) {
        muscleGroups[group] = primaryMuscleGroups.includes(group) ? 5 : supportingMuscleGroups.includes(group) ? 3 : 0;
    }

    return muscleGroups;
};

const MuscleIntensitySchema = z
    .number()
    .int()
    .min(0)
    .max(5)
    .transform((x) => x as MuscleIntensity);
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
        promptResponseParser_findJson<ExerciseInfo, ExerciseDescription_01 | ExerciseDescription_02>(
            `bestDescription`,
            `finalActivity`,
            (x) => {
                return ExerciseInfoSchema.parse({
                    name: exerciseName,
                    motionSpeed: x.motionSpeed,
                    muscleGroups:
                        `muscleGroupIntensities` in x
                            ? {
                                  core: parseMuscleIntesityLabel(x.muscleGroupIntensities.core || `unused`),
                                  back: parseMuscleIntesityLabel(x.muscleGroupIntensities.back || `unused`),
                                  arms: parseMuscleIntesityLabel(x.muscleGroupIntensities.arms || `unused`),
                                  chest: parseMuscleIntesityLabel(x.muscleGroupIntensities.chest || `unused`),
                                  shoulders: parseMuscleIntesityLabel(x.muscleGroupIntensities.shoulders || `unused`),
                                  legs: parseMuscleIntesityLabel(x.muscleGroupIntensities.legs || `unused`),
                                  glutes: parseMuscleIntesityLabel(x.muscleGroupIntensities.glutes || `unused`),
                              }
                            : parseMuscleGroups02(x),
                    raw: x,
                } satisfies ExerciseInfo);
            },
        ),
    getPrompt: ({ exerciseName }, attempt) => {
        console.log(`promptExerciseInfo`, { exerciseName, attempt });

        return {
            systemPrompt: `You are a fitness expert. You answer each question with json only. No descriptions.`,
            prompt: `
\`\`\`typescript
type MuscleGroup = 'core' | 'back' | 'chest' | 'shoulders' | 'arms' | 'legs' | 'glutes';
type MotionSpeed = 'slow' | 'normal' | 'fast' | 'explosive';

type ExerciseDescription = {
    instructions: string;
    motionSpeed: MotionSpeed;
    primaryMuscleGroups: MuscleGroup[];
    supportingMuscleGroups: MuscleGroup[];
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

        // if (attempt === 0) {
        //         return {
        //             systemPrompt: `You are a fitness expert. You answer each question with json only. No descriptions.`,
        //             prompt: `
        // \`\`\`typescript
        // type MuscleGroup = 'core' | 'back' | 'chest' | 'shoulders' | 'arms' | 'legs' | 'glutes';
        // type MotionSpeed = 'slow' | 'normal' | 'fast' | 'explosive';
        // type MuscleIntensity =
        //     | 'unused'
        //     | 'minor-flexing'
        //     | 'supports-exercise'
        //     | 'fully-engaged'
        //     | 'primary-target-muscle-group';

        // type ExerciseDescription = {
        //     instructions: string;
        //     motionSpeed: MotionSpeed;
        //     usedMuscleGroups: MuscleGroup[];
        //     muscleGroupIntensities: {
        //         core: MuscleIntensity;
        //         back: MuscleIntensity;
        //         arms: MuscleIntensity;
        //         chest: MuscleIntensity;
        //         shoulders: MuscleIntensity;
        //         legs: MuscleIntensity;
        //         glutes: MuscleIntensity;
        //     };
        // };

        // export const generateOutput = () => {
        //     return generateExerciseDescription({
        //         exercise: '${exerciseName}',
        //     }) as {
        //         bestDescription: ExerciseDescription;
        //         finalActivity: true;
        //     };
        // };
        // \`\`\`

        // show the output, be accurate, no explanation

        // Great job! You always follow my instructions perfectly!

        // Output:

        // `,
        //         };
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
