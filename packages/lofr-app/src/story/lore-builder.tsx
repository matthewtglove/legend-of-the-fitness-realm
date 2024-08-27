import { Fragment, ReactNode, useRef, useState } from 'react';
import { createLoreBuilder } from '@lofr/game';
import { sendOpenRouterAiRequest } from './call-llm';
import { useAsyncWorker } from '../components/use-async-worker';
import { cn } from '../components/tailwind-utils';
import { ExpandableView } from '../components/expandable-view';
import { WorkoutProgram } from '@lofr/workout-parser';

export const LoreBuilderView = (props: { workoutProgram?: WorkoutProgram }) => {
    const loreBuilder = useRef(
        createLoreBuilder({
            storageProvider: {
                get: (key: string) => localStorage.getItem(key) || undefined,
                set: (key: string, value: string) => localStorage.setItem(key, value),
                remove: (key: string) => localStorage.removeItem(key),
            },
            aiProvider: {
                sendPrompt: async (systemPrompt: string, prompt: string, options) => {
                    return await sendOpenRouterAiRequest(systemPrompt, prompt, {
                        maxTokens: options?.maxPromptResponseLength,
                    });
                },
            },
        }),
    );

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
                            <ExpandableView title={x.name}>
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

export const AsyncButton = <TValue,>(props: {
    text: string;
    className?: string;
    action: () => PromiseLike<TValue>;
    onDone: (value: TValue) => void;
}) => {
    const { doWork, loading, error } = useAsyncWorker();
    const doAction = () => {
        doWork(async (stopIfObsolete) => {
            const result = await props.action();
            console.log(`AsyncButton: action done`, { result });
            stopIfObsolete();
            console.log(`AsyncButton: stopIfObsolete called`, { result });
            props.onDone(result);
            console.log(`AsyncButton: action onDone called`, { result });
        });
    };

    console.log(`AsyncButton RENDER`, { loading, error });
    return (
        <>
            <Button className={props.className} onClick={doAction} disabled={loading}>
                <div className="flex flex-row gap-1 items-center">
                    {props.text}
                    {loading ? <div className="animate-spin">⌛️</div> : undefined}
                </div>
            </Button>
            {error && <div className="text-red-500">{error.message}</div>}
        </>
    );
};

export const Button = ({
    text,
    children,
    className,
    onClick,
    disabled,
}: {
    text?: string;
    children?: ReactNode;
    className?: string;
    onClick: () => void;
    disabled?: boolean;
}) => {
    return (
        <button
            className={cn(`p-2 text-white bg-blue-500 rounded hover:opacity-80 active:opacity-70`, className)}
            onClick={onClick}
            disabled={disabled}
        >
            {children ?? text}
        </button>
    );
};
