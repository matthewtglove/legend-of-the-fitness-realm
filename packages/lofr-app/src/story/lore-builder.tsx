import { Fragment, useRef, useState } from 'react';
import { createLoreBuilder, type LoreBuilder } from '@lofr/game';
import { sendOpenRouterAiRequest } from './call-llm';
import { useStableCallback } from '../components/use-stable-callback';
import { useAsyncWorker } from '../components/use-async-worker';

export const LoreBuilderView = () => {
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

    type CallNames = keyof Omit<LoreBuilder, `exercises`>;
    const loreBuilderCalls = Object.keys(loreBuilder.current) as CallNames[];

    const [builderCall, setBuilderCall] = useState(`getExerciseInfo` as CallNames);
    const [builderCallResult, setBuilderCallResult] = useState(undefined as undefined | Record<string, unknown>);
    const [execiseName, setExerciseName] = useState(``);

    const runBuilderCall = useStableCallback(() => loreBuilder.current[builderCall](execiseName, true));

    const exercises = loreBuilder.current.exercises;
    console.log(`LoreBuilderView RENDER`, { loreBuilder: loreBuilder.current, exercises });

    return (
        <div className="flex flex-col justify-start items-start gap-2">
            {exercises.map((x) => (
                <Fragment key={x.name}>
                    <h4>{x.name}</h4>
                    <div>{JSON.stringify(x)}</div>
                </Fragment>
            ))}

            <select
                onSelect={(e) =>
                    setBuilderCall(loreBuilderCalls[e.currentTarget.selectedIndex] ?? loreBuilderCalls[0]!)
                }
            >
                {loreBuilderCalls.map((call) => (
                    <option key={call}>{call}</option>
                ))}
            </select>
            <input
                className="w-full p-2 border-2"
                type="text"
                value={execiseName}
                onChange={(e) => setExerciseName(e.target.value)}
            />

            <AsyncButton text={`Run`} action={runBuilderCall} onDone={setBuilderCallResult} />

            <h4>Result</h4>
            <div>{builderCallResult && <pre>{JSON.stringify(builderCallResult, null, 2)}</pre>}</div>
        </div>
    );
};

export const AsyncButton = <TValue,>(props: {
    text: string;
    action: () => Promise<TValue>;
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
            <button
                className="p-2 text-white bg-blue-500 rounded hover:opacity-80 active:opacity-70"
                onClick={doAction}
                disabled={loading}
            >
                <div className="flex flex-row gap-1 items-center">
                    {props.text}
                    {loading ? <div className="animate-spin">⌛️</div> : undefined}
                </div>
            </button>
            {error && <div className="text-red-500">{error.message}</div>}
        </>
    );
};
