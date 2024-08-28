import { ExerciseInfo, LoreBuilderDependencies } from './lore-types';
import { promptExerciseInfo } from './prompts/exercise-info';

export const createLoreBuilder = (dependencies: LoreBuilderDependencies) => {
    // const getExerciseInfo = async (exerciseName: string): ExcersiceInfo => {}
    // return {
    //     generateEnemyAbilities: (params: {
    //         world: {
    //             title: string;
    //             genre: string;
    //         };
    //         location: {
    //             title: string;
    //             biome: string;
    //         };
    //         campaign: {
    //             title: string;
    //         };
    //         enemy

    const storageAccess = {
        get: <T>(key: string) => {
            const v = dependencies.storageProvider.get(key);
            if (!v) {
                return undefined;
            }
            return JSON.parse(v) as T;
        },
        set: <T>(key: string, value: T) => {
            dependencies.storageProvider.set(key, JSON.stringify(value));
        },
    };

    const normalizeName = (key: string) => key.toLocaleLowerCase().replace(/[^a-zA-Z0-9]/g, ``);

    const builder = {
        get exercises() {
            return storageAccess.get<ExerciseInfo[]>(`exercises`) || [];
        },
        set exercises(value: ExerciseInfo[]) {
            storageAccess.set(`exercises`, value);
        },
        getExerciseInfo_cached: (exerciseName: string) => {
            return builder.exercises.find((e) => normalizeName(e.name) === normalizeName(exerciseName));
        },
        getExerciseInfo: async (exerciseName: string, shouldReplace = false) => {
            if (!exerciseName) {
                return;
            }

            const v = builder.exercises.find((e) => normalizeName(e.name) === normalizeName(exerciseName));
            if (v && !shouldReplace) {
                return v;
            }

            const exercise = await promptExerciseInfo.run(dependencies, builder.getExerciseInfo.name)({ exerciseName });
            if (!exercise) {
                return;
            }

            builder.exercises = [
                ...builder.exercises.filter((x) => normalizeName(x.name) !== normalizeName(exercise.name)),
                exercise,
            ];

            return exercise;
        },
    };

    return builder;
};

export type LoreBuilder = ReturnType<typeof createLoreBuilder>;
