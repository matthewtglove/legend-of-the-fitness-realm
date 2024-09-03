import { Fragment, useRef, useState } from 'react';
import { MuscleGroups } from '@lofr/game';
import { ExpandableView } from '../components/expandable-view';
import { WorkoutProgram } from '@lofr/workout-parser';
import { GameStoryRuntime } from './game-story-runtime';
import { AsyncButton, Button } from '../components/buttons';

export const LoreBuilderView = (props: { workoutProgram?: WorkoutProgram; storyRuntime: GameStoryRuntime }) => {
    const loreBuilder = useRef(props.storyRuntime.loreBuilder);

    const [builderCallResult, setBuilderCallResult] = useState(undefined as undefined | Record<string, unknown>);
    const [execiseName, setExerciseName] = useState(``);

    const exercises = loreBuilder.current.exercises.sort((a, b) => a.name.localeCompare(b.name));
    console.log(`LoreBuilderView RENDER`, { loreBuilder: loreBuilder.current, exercises });

    const addAllWorkoutExercises = async () => {
        const workoutExercises =
            props.workoutProgram?.segments.flatMap((x) =>
                x.sessions.flatMap((s) =>
                    s.steps.flatMap((step) => {
                        if (`exercises` in step) {
                            return step.exercises.map((e) => e.exerciseName);
                        }
                        if (`exercise` in step) {
                            return [step.exercise.exerciseName];
                        }
                        return [];
                    }),
                ),
            ) ?? [];

        const infos = [] as Awaited<ReturnType<typeof loreBuilder.current.getExerciseInfo>>[];
        for (const exercise of workoutExercises) {
            infos.push(await loreBuilder.current.getExerciseInfo(exercise, false));
        }
        return { infos };
    };

    return (
        <div className="flex flex-col gap-2 py-2">
            <ExpandableView title="Exercises">
                <div className="flex flex-col gap-2">
                    {props.workoutProgram && (
                        <AsyncButton
                            text={`Add All Workout Exercises`}
                            className="self-end"
                            action={addAllWorkoutExercises}
                            onDone={setBuilderCallResult}
                        />
                    )}

                    <div className="mt-2">
                        <input
                            className="w-full p-2 border-2"
                            type="text"
                            placeholder='Exercise Name (e.g. "Push Ups")'
                            value={execiseName}
                            onChange={(e) => setExerciseName(e.target.value)}
                        />
                    </div>

                    <AsyncButton
                        text={`Add Exercise`}
                        className="self-end"
                        action={() => loreBuilder.current.getExerciseInfo(execiseName, true)}
                        onDone={setBuilderCallResult}
                    />

                    {builderCallResult && (
                        <ExpandableView title="Result">
                            <div className="whitespace-pre-wrap text-sm text-gray-600">
                                {JSON.stringify(builderCallResult, null, 2)}
                            </div>
                        </ExpandableView>
                    )}

                    {exercises.map((x) => (
                        <Fragment key={x.name}>
                            <ExpandableView
                                title={`${x.name}`}
                                titleRight={`${x.motionSpeed} ${MuscleGroups.map((m) => `${x.muscleGroups[m]}`).join(
                                    `:`,
                                )}`}
                                tooltipRight={`(Speed) ${x.motionSpeed} - (Intensity) ${MuscleGroups.map(
                                    (m) => `${m}: ${x.muscleGroups[m]}`,
                                ).join(`, `)}`}
                            >
                                <h4>{x.name}</h4>
                                <div className="whitespace-pre-wrap text-sm text-gray-600">
                                    {JSON.stringify(x, null, 2)}
                                </div>
                                <div className="flex flex-row justify-end gap-2">
                                    <Button
                                        text={`Delete`}
                                        className="bg-red-500"
                                        onClick={() =>
                                            (loreBuilder.current.exercises = loreBuilder.current.exercises.filter(
                                                (y) => y.name !== x.name,
                                            ))
                                        }
                                    />
                                    <AsyncButton
                                        text={`Rebuild`}
                                        action={() => loreBuilder.current.getExerciseInfo(x.name, true)}
                                        onDone={setBuilderCallResult}
                                    />
                                </div>
                            </ExpandableView>
                        </Fragment>
                    ))}
                </div>
            </ExpandableView>
        </div>
    );
};
