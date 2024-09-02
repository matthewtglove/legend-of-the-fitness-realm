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
    GameEventResponse,
    formatGameEventMessage,
    GamePendingActionEvent,
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
    const stateHistoryRef = useRef([
        {
            context: JSON.parse(
                JSON.stringify(props.storyRuntime.gameContext),
            ) as typeof props.storyRuntime.gameContext,
            state: JSON.parse(JSON.stringify(gameRuntime.state)) as typeof gameRuntime.state,
            delta: {} as unknown,
            periodKind: undefined as undefined | `work` | `rest`,
            event: undefined as undefined | GameEventResponse,
        },
    ]);
    const stateHistory = stateHistoryRef.current;

    const [renderId, setRenderId] = useState(0);
    const gameContextRef = useRef(props.storyRuntime.gameContext);

    gameRuntime.triggerSessionStart;

    const pushGameState = (state: GameState, event: GameEventResponse, periodKind?: `work` | `rest`) => {
        const lastState = stateHistory[stateHistory.length - 1];
        if (!lastState) {
            stateHistory.push({
                context: JSON.parse(JSON.stringify(gameContextRef.current)),
                state,
                delta: state,
                periodKind,
                event,
            });
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

        stateHistory.push({
            context: JSON.parse(JSON.stringify(gameContextRef.current)),
            state: JSON.parse(JSON.stringify(state)),
            delta: findObjectDelta(state, lastState),
            periodKind,
            event,
        });
        setRenderId((s) => s + 1);
    };
    const popGameState = () => {
        stateHistory.pop();
        gameRuntime.state = stateHistory[stateHistory.length - 1]?.state ?? createEmptyGameState();
    };

    const triggerSessionStart = () => {
        if (!props.workoutProgram) {
            console.error(`No workout program found`);
            return;
        }

        const workoutSession = props.workoutProgram.segments[0]?.sessions[0];
        if (!workoutSession) {
            console.error(`No workout session found`);
            return;
        }

        props.storyRuntime.startWorkout(workoutSession);
        gameContextRef.current = props.storyRuntime.gameContext;

        const event = gameRuntime.triggerSessionStart({
            context: gameContextRef.current,
        });
        pushGameState(gameRuntime.state, event);
    };
    const triggerSessionEnd = () => {
        const event = gameRuntime.triggerSessionEnd({
            context: gameContextRef.current,
        });
        pushGameState(gameRuntime.state, event);
    };
    const triggerNextPeriod = () => {
        const currentPeriod = gameContextRef.current.sessionPeriods[gameContextRef.current.currentSessionPeriod.index];
        if (!currentPeriod) {
            console.error(`No current period found`);
            return;
        }

        const event =
            currentPeriod.kind === `work`
                ? gameRuntime.triggerWorkPeriod({
                      context: gameContextRef.current,
                  })
                : gameRuntime.triggerRestPeriod({
                      context: gameContextRef.current,
                      workResults: [],
                  });
        pushGameState(gameRuntime.state, event, currentPeriod.kind);

        // go to next period
        gameContextRef.current.currentSessionPeriod = {
            index: gameContextRef.current.currentSessionPeriod.index + 1,
            remainingSec: currentPeriod.durationSec,
        };
    };

    const hasNextPeriod =
        gameContextRef.current.currentSessionPeriod.index < gameContextRef.current.sessionPeriods.length + 1;

    return (
        <div>
            <h1>Game Debugger</h1>

            <div className="flex flex-row justify-end flex-wrap gap-2 my-2">
                <Button onClick={triggerSessionStart}>Start Workout Session</Button>
                <Button onClick={triggerSessionEnd}>End Workout Session</Button>
                {hasNextPeriod && <Button onClick={triggerNextPeriod}>Trigger Next Period</Button>}
                {/* <Button onClick={triggerWorkPeriod}>Trigger Work Period</Button>
                <Button onClick={triggerRestPeriod}>Trigger Rest Period</Button> */}
            </div>

            <div className="flex flex-col gap-2">
                {stateHistory.map((state, i) => (
                    <ExpandableView key={i} title={`GameState ${i}`} expanded={true} mode={`exclude`}>
                        <ExpandableView
                            title={`GameState ${i} - Event ${state.periodKind}`}
                            expanded={true}
                            mode={`exclude`}
                        >
                            <pre className="whitespace-pre-wrap my-2">{summarizeGameEvent(state.event)}</pre>
                            <pre className="whitespace-pre-wrap my-2">
                                {state.state.players
                                    .map(
                                        (p) =>
                                            `🕒 ${p.name}: ${p.pendingActions
                                                ?.map(summarizePendingAction)
                                                .map((x) => `\n  - ${x}`)
                                                .join(``)}`,
                                    )
                                    .join(`\n`)}
                            </pre>
                            {state.periodKind && (
                                <div>
                                    Current Session:
                                    <pre className="whitespace-pre-wrap my-2">
                                        {JSON.stringify(
                                            state.context.sessionPeriods[state.context.currentSessionPeriod.index],
                                            null,
                                            2,
                                        )}
                                    </pre>
                                </div>
                            )}
                        </ExpandableView>
                        <ExpandableView title={`GameState ${i} - Summary`} expanded={false} mode={`exclude`}>
                            <pre className="whitespace-pre-wrap">{summarizeGameState(state.state)}</pre>
                        </ExpandableView>
                        <ExpandableView title={`GameState ${i} - JSON`} expanded={false} mode={`exclude`}>
                            <textarea className="w-full h-[50vh]" readOnly>
                                {JSON.stringify(state, null, 2)}
                            </textarea>
                        </ExpandableView>
                    </ExpandableView>
                ))}
            </div>

            <div className="flex flex-row justify-end flex-wrap gap-2 my-2">
                <Button onClick={triggerSessionStart}>Start Workout Session</Button>
                <Button onClick={triggerSessionEnd}>End Workout Session</Button>
                {hasNextPeriod && <Button onClick={triggerNextPeriod}>Trigger Next Period</Button>}
                {/* <Button onClick={triggerWorkPeriod}>Trigger Work Period</Button>
                <Button onClick={triggerRestPeriod}>Trigger Rest Period</Button> */}
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

const summarizeGameEvent = (event: GameEventResponse | undefined) => {
    if (!event) {
        return `No event`;
    }

    if (!event.events.length) {
        return `⭕ No events`;
    }

    return `Events:\n${event.events.map((e) => `\n- ${e.kind} \n\n    ${formatGameEventMessage(e)}\n`).join(``)}`;
};

export const summarizePendingAction = (a: GamePendingActionEvent) => {
    return a.kind === `move-location`
        ? `🚗${a.kind} ➡ '${a.locationId}'`
        : a.kind === `attack-enemy`
        ? `⚔${a.kind} ➡ ${a.enemies.map((e) => `'${e.id}'`).join(`,`)}`
        : ``;
};

export const summarizeGameState = (state: GameState) => {
    const summarizeLocation = (locationId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${` `.repeat(indent * 2)}`;

        if (visited.has(locationId)) {
            return `${nl}- 🔙Location '${locationId}'`;
        }
        visited.add(locationId);

        const l = state.locations.find((l) => l.id === locationId);
        if (!l) {
            return `${nl}- ! Location '${locationId}' not found`;
        }

        return `${nl}- [${!l.isDiscovered ? `` : `👁`}] Location: '${l.id}'${state.characters
            .filter((c) => c.location === l.id)
            .map((c) => summarizeCharacter(c.id, indent + 1, visited))
            .join(``)}${state.keyItems
            .filter((c) => l.keyItem === c.id)
            .map((c) => summarizeKeyItem(c.id, indent + 1, visited))
            .join(``)}${l.connections
            .map((c) =>
                visited.has(c.location)
                    ? // ? `${nl}  - ~Connection => '${c.location}' ${!c.isDiscovered ? `` : `👁`}`
                      ``
                    : `${nl}  - [${!c.isDiscovered ? `` : `👁`}${
                          c.requiredKeyItem ? `🔒'${c.requiredKeyItem}'` : ``
                      }] Connection => '${c.location}'${summarizeLocation(c.location, indent + 2, visited)}`,
            )
            .join(``)}`;
    };

    const summarizeCharacter = (characterId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${` `.repeat(indent * 2)}`;

        if (visited.has(characterId)) {
            return `${nl}- 🔙Character '${characterId}'`;
        }
        visited.add(characterId);

        const c = state.characters.find((c) => c.id === characterId);
        if (!c) {
            return `${nl}- ! Character '${characterId}' not found`;
        }

        return `${nl}- [${!c.isDiscovered ? `` : `👁`}${c.isDefeated ? `💀` : ``}] Character: '${c.id}' ${
            c.role.enemyDifficulty ?? ``
        } ${c.stats.health}/${c.stats.healthMax}hp ${
            c.keyItem ? `${summarizeKeyItem(c.keyItem, indent + 1, visited)}` : ``
        }`;
    };

    const summarizePlayer = (playerId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${` `.repeat(indent * 2)}`;

        if (visited.has(playerId)) {
            return `${nl}- 🔙Player '${playerId}'`;
        }
        visited.add(playerId);

        const p = state.players.find((p) => p.id === playerId);
        if (!p) {
            return `${nl}- ! Player '${playerId}' not found`;
        }

        return `${nl}- [] Player: '${p.name}'${
            p.pendingActions ? `🕒${p.pendingActions.map((a) => `${nl}  - ${summarizePendingAction(a)}`)}` : ``
        }${summarizeLocation(p.location, indent + 1, visited)}`;
    };

    const summarizeKeyItem = (keyItemId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${` `.repeat(indent * 2)}`;

        if (visited.has(keyItemId)) {
            return `${nl}- 🔙🔑KeyItem '${keyItemId}'`;
        }
        visited.add(keyItemId);

        const k = state.keyItems.find((k) => k.id === keyItemId);
        if (!k) {
            return `${nl}- ! KeyItem '${keyItemId}' not found`;
        }

        return `${nl}- [${k.isObtained ? `👁` : ``}${k.isVisible ? `` : ``}] 🔑KeyItem: '${k.id}'`;
    };

    const summarizeCampaign = (campaignId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${` `.repeat(indent * 2)}`;

        if (visited.has(campaignId)) {
            return `${nl}- 🔙Campaign '${campaignId}'`;
        }
        visited.add(campaignId);

        const c = state.campaigns.find((c) => c.id === campaignId);
        if (!c) {
            return `${nl}- ! Campaign '${campaignId}' not found`;
        }

        const currentCampaign = state.campaigns.findLast((x) => !x.isComplete);
        const isCurrent = currentCampaign?.id === c.id;

        return `${nl}- [${c.isComplete ? `🏁` : ``}${isCurrent ? `🟢` : ``}] Campaign: '${c.id}'${c.quests
            .map((q) => summarizeQuest(q, indent + 1, visited))
            .join(``)}`;
    };

    const summarizeQuest = (questId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${` `.repeat(indent * 2)}`;

        if (visited.has(questId)) {
            return `${nl}- 🔙Quest '${questId}'`;
        }
        visited.add(questId);

        const q = state.quests.find((q) => q.id === questId);
        if (!q) {
            return `${nl}- ! Quest '${questId}' not found`;
        }

        const currentQuest = state.quests.findLast((x) => !x.isComplete);
        const currentObjective = currentQuest?.objectives.find(
            (x) => !state.keyItems.find((k) => k.id === x.completionKeyItem)?.isObtained,
        );

        return `${nl}- [${q.isComplete ? `🏁` : ``}${currentQuest?.id === q.id ? `🟢` : ``}] Quest: '${
            q.id
        }'${q.objectives
            .map(
                (o) =>
                    `${nl}  - [${state.keyItems.find((k) => k.id === o.completionKeyItem)?.isObtained ? `🏁` : ``}${
                        currentObjective === o ? `🟢` : ``
                    }] ${o.name} ${summarizeKeyItem(o.completionKeyItem, indent + 2, visited)}`,
            )
            .join(``)}`;
    };

    const visited = new Set<string>();
    return `
${state.locations.map((l) => summarizeLocation(l.id, 0, visited)).join(``)}
${state.players.map((l) => summarizePlayer(l.id, 0, visited)).join(``)}
${state.characters.map((l) => summarizeCharacter(l.id, 0, visited)).join(``)}
${state.keyItems.map((l) => summarizeKeyItem(l.id, 0, visited)).join(``)}
${state.campaigns.map((l) => summarizeCampaign(l.id, 0, visited)).join(``)}
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
