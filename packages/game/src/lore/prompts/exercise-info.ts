import { definePrompt, promptResponseParser_findJson } from '../prompt-builder';

export const MuscleGroups = [`core`, `back`, `chest`, `shoulders`, `arms`, `legs`, `glutes`] as const;
export type MuscleGroup = (typeof MuscleGroups)[number];
export const MotionSpeeds = [`slow`, `normal`, `fast`, `explosive`] as const;
export type MotionSpeed = (typeof MotionSpeeds)[number];

export type ExerciseInfo = {
    name: string;
    usedMuscleGroups: MuscleGroup[];
    motionSpeed: MotionSpeed;
    describeActualExerciseToUser: string;
};

export const promptExerciseInfo = definePrompt<{ exerciseName: string }, ExerciseInfo>({
    maxPromptResponseLength: 500,
    parsePromptResponse: ({ exerciseName }) =>
        promptResponseParser_findJson<ExerciseInfo, Omit<ExerciseInfo, `name`>>(
            `bestDescription`,
            `finalActivity`,
            (x) =>
                Array.isArray(x.usedMuscleGroups) &&
                x.usedMuscleGroups.every((y) => MuscleGroups.includes(y)) &&
                MotionSpeeds.includes(x.motionSpeed)
                    ? ({
                          name: exerciseName,
                          usedMuscleGroups: x.usedMuscleGroups,
                          motionSpeed: x.motionSpeed,
                          describeActualExerciseToUser: x.describeActualExerciseToUser,
                      } satisfies ExerciseInfo)
                    : undefined,
        ),
    getPrompt: ({ exerciseName }, attempt) => {
        if (attempt > 1) {
            console.log(`promptExerciseInfo: short prompt`, { exerciseName });
            return {
                systemPrompt: `You are an expert in software developer and must simulate a function call to provide the expected output. You only answer the question with json. No descriptions.`,
                prompt: `
What would this output:

\`\`\`typescript
export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
    const bestDescription = loreGenerator.generateExerciseDescription({
        exercise: '${exerciseName}',
        temperature: 0.5,
    }) satisfies ExerciseDescription;

    type MuscleGroup = 'core' | 'back' | 'chest' | 'shoulders' | 'arms' | 'legs' | 'glutes';
    type MotionSpeed = 'slow' | 'normal' | 'fast' | 'explosive';

    type ExerciseDescription = {
        usedMuscleGroups: MuscleGroup[];
        motionSpeed: MotionSpeed;
        describeActualExerciseToUser: string;
    };

    return {
        bestDescription,
        finalActivity: true,
    };
};
\`\`\`

show the output, be accurate, no explanation

Great job! You always follow my instructions perfectly!

Output:

`,
            };
        }

        console.log(`promptExerciseInfo: long prompt`, { exerciseName });

        return {
            systemPrompt: `You are an expert in software developer and must simulate a function call to provide the expected output. You only answer the question with json. No descriptions.`,
            prompt: `
What would this output:

\`\`\`typescript
export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
    // get 2 possible exercise descriptions
    const possibleExerciseDescriptions = loreGenerator.generatePossibleExerciseDescriptions({
        exercise: '${exerciseName}',
        count: 2,
        temperature: 0.5,
    }) satisfies ExerciseDescription;

    type MuscleGroup = 'core' | 'back' | 'chest' | 'shoulders' | 'arms' | 'legs' | 'glutes';
    type MotionSpeed = 'slow' | 'normal' | 'fast' | 'explosive';

    type ExerciseDescription = {
        usedMuscleGroups: MuscleGroup[];
        motionSpeed: MotionSpeed;
        describeActualExerciseToUser: string;
    };

    // select the most accurate description
    const bestDescription = loreGenerator.chooseMostAccurateDescription(possibleExerciseDescriptions);

    return {
        possibleExerciseDescriptions,
        bestDescription,
        finalActivity: true,
    };
};
\`\`\`

show the output, be accurate, no explanation

Great job! You always follow my instructions perfectly!

Output:
    
    `,
        };
    },
});
