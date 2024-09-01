/* eslint-disable @typescript-eslint/no-unused-vars */
import { WorkoutProgram } from '@lofr/workout-parser';
import { GameStoryRuntime } from './game-story-runtime';
import {
    createLoreBuilder,
    createGameRuntime,
    createEmptyGameState,
    createGameLoreProvider,
    createGameBattleProvider,
    GameRuntimeContext,
    GameState,
} from '@lofr/game';
import { sendOpenRouterAiRequest } from './call-llm';
import { useRef, useState } from 'react';
import { useStableCallback } from '../components/use-stable-callback';
import { ExpandableView } from '../components/expandable-view';
import { Button } from '../components/buttons';

export const GameDebugger = (props: { workoutProgram?: WorkoutProgram; storyRuntime: GameStoryRuntime }) => {
    const loreBuilder = createLoreBuilder({
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
    });

    const gameRuntime = props.storyRuntime.gameRuntime;
    const stateHistoryRef = useRef([{ state: JSON.parse(JSON.stringify(gameRuntime.state)), delta: {} as unknown }]);
    const stateHistory = stateHistoryRef.current;

    const [renderId, setRenderId] = useState(0);
    const gameContextRef = useRef(props.storyRuntime.gameContext);

    gameRuntime.triggerSessionStart;

    const pushGameState = (state: GameState) => {
        const lastState = stateHistory[stateHistory.length - 1];
        if (!lastState) {
            stateHistory.push({ state, delta: state });
            return;
        }

        // Recursively find object deltas
        const findObjectDelta = (obj: unknown, lastObj: unknown): unknown => {
            if (obj === lastObj) {
                return undefined;
            }
            if (typeof obj !== typeof lastObj) {
                return obj ?? undefined;
            }

            if (Array.isArray(obj) && Array.isArray(lastObj)) {
                // itemwise diff
                return obj.map((item, i) => findObjectDelta(item, lastObj[i]));
            }

            if (typeof obj !== `object` || obj == null) {
                return obj ?? undefined;
            }
            if (typeof lastObj !== `object` || lastObj == null) {
                return obj ?? undefined;
            }

            return Object.keys(obj).reduce((acc, k) => {
                const key = k as keyof typeof obj;
                if (obj[key] !== lastObj[key]) {
                    acc[key] = findObjectDelta(obj[key], lastObj[key]);
                }
                return acc;
            }, {} as Record<string, unknown>);
        };

        stateHistory.push({ state: JSON.parse(JSON.stringify(state)), delta: findObjectDelta(state, lastState) });
        setRenderId((s) => s + 1);
    };
    const popGameState = () => {
        stateHistory.pop();
        gameRuntime.state = stateHistory[stateHistory.length - 1]?.state ?? createEmptyGameState();
    };

    const triggerSessionStart = () => {
        gameRuntime.triggerSessionStart({
            context: gameContextRef.current,
        });
        pushGameState(gameRuntime.state);
    };
    const triggerSessionEnd = () => {
        gameRuntime.triggerSessionEnd({
            context: gameContextRef.current,
        });
        pushGameState(gameRuntime.state);
    };
    const triggerWorkPeriod = () => {
        gameRuntime.triggerWorkPeriod({
            context: gameContextRef.current,
        });
        pushGameState(gameRuntime.state);
    };
    const triggerRestPeriod = () => {
        gameRuntime.triggerRestPeriod({
            context: gameContextRef.current,
            // TODO: Add work results
            workResults: [],
        });
        pushGameState(gameRuntime.state);
    };

    return (
        <div>
            <h1>Game Debugger</h1>

            <div className="flex flex-row justify-end flex-wrap gap-2 my-2">
                <Button onClick={triggerSessionStart}>Start Workout Session</Button>
                <Button onClick={triggerSessionEnd}>End Workout Session</Button>
                <Button onClick={triggerWorkPeriod}>Trigger Work Period</Button>
                <Button onClick={triggerRestPeriod}>Trigger Rest Period</Button>
            </div>

            <div className="flex flex-col gap-2">
                {stateHistory.map((state, i) => (
                    <ExpandableView key={i} title={`GameState ${i}`} expanded={false} mode={`exclude`}>
                        <ExpandableView key={i} title={`GameState ${i} - Summary`} expanded={true} mode={`exclude`}>
                            <pre>{summarizeGameState(state.state)}</pre>
                        </ExpandableView>
                        <ExpandableView key={i} title={`GameState ${i} - JSON`} expanded={false} mode={`exclude`}>
                            <pre>{JSON.stringify(state, null, 2)}</pre>
                        </ExpandableView>
                    </ExpandableView>
                ))}
            </div>

            <GameContextEditor
                key={renderId}
                value={gameContextRef.current}
                onChange={(x) => {
                    gameContextRef.current = x;
                }}
                onReload={() => {
                    gameContextRef.current = props.storyRuntime.gameContext;
                    setRenderId((s) => s + 1);
                }}
            />
        </div>
    );
};

const summarizeGameState = (state: GameState) => {
    const summarizeLocation = (locationId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${`  `.repeat(indent * 2)}`;

        if (visited.has(locationId)) {
            return `${nl}- 🔙Location '${locationId}'`;
        }
        visited.add(locationId);

        const l = state.locations.find((l) => l.id === locationId);
        if (!l) {
            return `${nl}- ! Location '${locationId}' not found`;
        }

        return `${nl}- [${!l.isDiscovered ? `` : `👁`}] Location: '${l.id}'${l.connections
            .map((c) =>
                visited.has(c.location)
                    ? // ? `${nl}  - ~Connection => '${c.location}' ${!c.isDiscovered ? `` : `👁`}`
                      ``
                    : `${nl}  - [${!c.isDiscovered ? `` : `👁`}${
                          c.requiredKeyItem ? `🔒'${c.requiredKeyItem}'` : ``
                      }] Connection => '${c.location}'${summarizeLocation(c.location, indent + 1, visited)}`,
            )
            .join(``)}${state.characters
            .filter((c) => c.location === l.id)
            .map(
                (c) =>
                    `${nl}  - [${!c.isDiscovered ? `` : `👁`}${c.isDefeated ? `💀` : ``}] Character '${c.name}' ${
                        c.keyItem ? `🔑'${c.keyItem}'` : ``
                    }`,
            )
            .join(``)}${state.keyItems
            .filter((c) => l.keyItem === c.id)
            .map((c) => `${nl}  - KeyItem '${c.name}'`)
            .join(``)}`;
    };

    const visited = new Set<string>();
    return `
${state.locations.map((l) => summarizeLocation(l.id, 0, visited)).join(``)}    
    
`;
};

export const GameContextEditor = ({
    value,
    onChange,
    onReload,
}: {
    value: GameRuntimeContext;
    onChange: (value: GameRuntimeContext) => void;
    onReload: () => void;
}) => {
    return (
        <JsonEditor
            label="Game Context"
            value={value}
            onChange={onChange}
            onReload={onReload}
            parseJson={(x) => {
                const obj = JSON.parse(x) as GameRuntimeContext;
                return obj;
                // return {
                //     sessionPeriods: obj.sessionPeriods.map((sp) => ({
                //         kind: sp.kind,
                //         exercises: sp.exercises.map((ex) => ({ exercisename: ex.exerciseName })),
                //         durationSec: sp.durationSec,
                //     })),
                // } satisfies GameRuntimeContext;
            }}
        />
    );
};

export const JsonEditor = <T,>({
    label,
    value,
    onChange,
    onReload,
    parseJson,
}: {
    label: string;
    value: T;
    onChange: (value: T) => void;
    onReload?: () => void;
    parseJson: (value: string) => T;
}) => {
    const [valueJson, setValueJson] = useState(JSON.stringify(value, null, 2));

    const changeValue = useStableCallback(() => {
        try {
            onChange(parseJson(valueJson));
        } catch (e) {
            console.error(`Failed to parse JSON`, e);
        }
    });

    return (
        <ExpandableView mode="hide" title={label} expanded={true}>
            <div className="flex flex-col">
                <textarea
                    className="whitespace-pre-wrap h-[50vh] bg-slate-300 rounded p-1 my-2"
                    value={valueJson}
                    onChange={(e) => setValueJson(e.target.value)}
                />
                <div className="flex flex-row gap-2 justify-end">
                    {onReload && (
                        <Button className="bg-red-400" onClick={onReload}>
                            Reload
                        </Button>
                    )}
                    <Button onClick={changeValue}>Apply</Button>
                </div>
            </div>
        </ExpandableView>
    );
};
