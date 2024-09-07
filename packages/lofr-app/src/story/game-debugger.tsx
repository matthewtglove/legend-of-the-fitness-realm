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
    GameSessionPeriod,
} from '@lofr/game';
import { sendOpenRouterAiRequest } from './call-llm';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useStableCallback } from '../components/use-stable-callback';
import { ExpandableView } from '../components/expandable-view';
import { Button } from '../components/buttons';
import { cloneDeep } from '../../../game/dist/src/deep-obj';

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
            context: cloneDeep(props.storyRuntime.gameContext),
            state: cloneDeep(gameRuntime.state),
            delta: {} as unknown,
            period: undefined as undefined | GameSessionPeriod,
            gameEvents: undefined as undefined | GameEventResponse,
        },
    ]);
    const stateHistory = stateHistoryRef.current;

    const [renderId, setRenderId] = useState(0);
    const gameContextRef = useRef(props.storyRuntime.gameContext);

    useEffect(() => {
        const { unsubscribe } = gameRuntime.subscribe((data) => {
            stateHistoryRef.current.push({
                context: cloneDeep(gameContextRef.current),
                state: data.state,
                period: gameContextRef.current.sessionPeriods[gameContextRef.current.currentSessionPeriod.index],
                gameEvents: data.gameEvents,
                delta: data.stateDiff,
            });
            setRenderId((s) => s + 1);
        });
        return unsubscribe;
    }, [gameRuntime]);

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
    };
    const triggerSessionEnd = () => {
        const event = gameRuntime.triggerSessionEnd({
            context: gameContextRef.current,
        });
    };

    const triggerExtraWorkPeriod = () => {
        const event = gameRuntime.triggerWorkPeriod({
            context: gameContextRef.current,
        });
    };
    const triggerExtraRestPeriod = () => {
        const event = gameRuntime.triggerRestPeriod({
            context: gameContextRef.current,
            workResults: [],
        });
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

            <div className="flex flex-row flex-wrap justify-end gap-2 my-2">
                <Button onClick={triggerSessionStart}>Start Workout Session</Button>
                <Button onClick={triggerSessionEnd}>End Workout Session</Button>
            </div>
            <div className="flex flex-row flex-wrap justify-end gap-2 my-2">
                {hasNextPeriod && <Button onClick={triggerNextPeriod}>Trigger Next Period</Button>}
                <Button className="bg-yellow-600" onClick={triggerExtraWorkPeriod}>
                    Trigger Extra Work Period
                </Button>
                <Button className="bg-yellow-600" onClick={triggerExtraRestPeriod}>
                    Trigger Extra Rest Period
                </Button>
            </div>

            <div className="flex flex-col gap-2">
                {stateHistory.map((state, i) => (
                    <ExpandableView key={i} title={`GameState ${i}`} expanded={true} mode={`exclude`}>
                        <ExpandableView
                            title={`GameState ${i} - Event ${
                                !state.period
                                    ? `(no session period)`
                                    : `${state.period.kind === `work` ? `💪` : `🛌`}${state.period.kind} ${
                                          state.period.durationSec
                                      }sec ${state.period.exercises.map((ex) => ex.exerciseName).join(`, `)}`
                            } \n${
                                // events
                                `${state.gameEvents?.events.map((x) => `▪ ${x.kind}`).join(`, `) ?? ``}`
                            } \n${
                                // players
                                `${state.state.players
                                    .map((p) => `${p.pendingActions?.map((a) => `⏱ ${a.kind}`).join(`, `) ?? ``}`)
                                    .filter((x) => x)
                                    .join(`\n`)}`
                            }`}
                            expanded={false}
                            mode={`exclude`}
                        >
                            <pre className="my-2 whitespace-pre-wrap">{summarizeGameEvent(state.gameEvents)}</pre>
                            <pre className="my-2 whitespace-pre-wrap">
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
                        </ExpandableView>
                        <ExpandableView title={`GameState ${i} - Summary`} expanded={false} mode={`exclude`}>
                            <pre className="whitespace-pre-wrap">{summarizeGameState(state.state)}</pre>
                        </ExpandableView>
                        <ExpandableView title={`GameState ${i} - JSON`} expanded={false} mode={`exclude`}>
                            <textarea className="w-full h-[50vh]" readOnly>
                                {JSON.stringify(state, null, 2)}
                            </textarea>
                        </ExpandableView>
                        <ExpandableView title={`GameState Diff ${i} - JSON`} expanded={false} mode={`exclude`}>
                            <textarea className="w-full h-[50vh]" readOnly>
                                {JSON.stringify(state.delta, null, 2)}
                            </textarea>
                        </ExpandableView>
                    </ExpandableView>
                ))}
            </div>

            <div className="flex flex-row flex-wrap justify-end gap-2 my-2">
                <Button onClick={triggerSessionStart}>Start Workout Session</Button>
                <Button onClick={triggerSessionEnd}>End Workout Session</Button>
            </div>
            <div className="flex flex-row flex-wrap justify-end gap-2 my-2">
                {hasNextPeriod && <Button onClick={triggerNextPeriod}>Trigger Next Period</Button>}
                <Button className="bg-yellow-600" onClick={triggerExtraWorkPeriod}>
                    Trigger Extra Work Period
                </Button>
                <Button className="bg-yellow-600" onClick={triggerExtraRestPeriod}>
                    Trigger Extra Rest Period
                </Button>
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
        <>
            <div className="flex flex-col gap-0">
                <h1>Session Periods</h1>
                {value.sessionPeriods.map((sp, i) => (
                    <Fragment key={i}>
                        <div className="">
                            {`Session Period ${i}: ${sp.kind} ${sp.durationSec}sec ${sp.exercises
                                .map((ex) => ex.exerciseName)
                                .join(`, `)}`}
                        </div>
                    </Fragment>
                ))}
            </div>
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
        </>
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
                <div className="flex flex-row justify-end gap-2">
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
