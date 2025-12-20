import { WorkoutProgram, WorkoutSession } from '@lofr/workout-parser';
import { useRef, useState } from 'react';
import { WorkoutLoader, WorkoutSelector } from './workout/workout-loader';
import { WorkoutSessionTimer } from './workout/workout-timer';
import { ExpandableView } from './components/expandable-view';
import buildNumber from './build-version.json';
import { createGameStoryRuntime } from './story/game-story-runtime';
import { LoreBuilderView } from './story/lore-builder-view';
import { GameDebugger } from './story/game-debugger';
import { KeepAwake } from './components/wake-lock';
import { DungeonMap } from './story/dungeon-map';
import { StoryHistoryView } from './story/story-history';
import { MiniGame_PocketWatch } from './prep/clock-mini-game/game-view';
import { WorkflowEditorView } from './workflow/workflow-editor/workflow-editor-view';
import { loadLofrWorkflow } from './workflow/lofr-workflow/workflow';

const appVersion = `v1.0.${buildNumber}`;
const isDev = import.meta.env.DEV;

export const App = () => {
    const [mode, setMode] = useState(isDev ? `workflow` : `app`);
    const [rootPath, setRootPath] = useState(
        localStorage.getItem(`lofr-workflow-root-path`) || `workflow/lofr-workflow/workflow00`,
    );
    const changeRootPath = (newPath: string) => {
        localStorage.setItem(`lofr-workflow-root-path`, newPath);
        setRootPath(newPath);
    };
    const [rootPathText, setRootPathText] = useState(rootPath);

    if (mode === `workflow`) {
        return (
            <>
                <div className="flex flex-col w-screen h-screen">
                    <div className="flex flex-row items-center gap-1 p-1 bg-gray-300">
                        <button
                            className={`p-1 text-xs text-white bg-blue-500 rounded hover:opacity-80 active:opacity-70`}
                            onClick={() => setMode(`app`)}
                        >
                            Switch to App
                        </button>
                        <input
                            type="text"
                            className="p-1 text-xs border border-gray-400 rounded w-96"
                            value={rootPathText}
                            onChange={(e) => setRootPathText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === `Enter`) {
                                    changeRootPath(rootPathText);
                                }
                            }}
                        />
                        <button
                            className={`p-1 text-xs text-white bg-blue-500 rounded hover:opacity-80 active:opacity-70`}
                            onClick={() => {
                                changeRootPath(rootPathText);
                            }}
                        >
                            Open
                        </button>
                    </div>
                    <WorkflowEditorView loader={loadLofrWorkflow(rootPath)} />
                </div>
            </>
        );
    }

    return <AppInner />;
};

export const AppInner = () => {
    const [workoutProgram, setWorkoutProgram] = useState(undefined as undefined | WorkoutProgram);
    const [workoutSession, setWorkoutSession] = useState(undefined as undefined | WorkoutSession);
    const storyRuntimeRef = useRef(createGameStoryRuntime());

    // console.log(`App`, {
    //     questContext: storyRuntimeRef.current.questContext,
    //     storyRuntimeRef: storyRuntimeRef.current,
    // });
    return (
        <>
            <div className="flex flex-col gap-2 m-2">
                <div>
                    {workoutSession && (
                        <WorkoutSessionTimer workoutSession={workoutSession} storyRuntime={storyRuntimeRef.current} />
                    )}
                    <div>
                        <ExpandableView mode={`hide`} title="Workout Loader" expanded={!workoutSession}>
                            <>
                                <div className="m-6">
                                    <WorkoutLoader onWorkoutLoaded={setWorkoutProgram} />
                                    {workoutProgram && (
                                        <div className="mt-12">
                                            <WorkoutSelector
                                                workoutProgram={workoutProgram}
                                                onWorkoutSessionSelected={setWorkoutSession}
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        </ExpandableView>
                    </div>
                    {/* <div className="m-2">
                    <QuestEditor
                        value={storyRuntimeRef.current.questContext}
                        onChange={(x) => (storyRuntimeRef.current.questContext = x)}
                    />
                </div> */}
                </div>
                <ExpandableView mode="hide" title="Prep Game" expanded={true}>
                    <MiniGame_PocketWatch />
                </ExpandableView>
                <ExpandableView mode="hide" title="Dungeon Map" expanded={true}>
                    <DungeonMap storyRuntime={storyRuntimeRef.current} />
                </ExpandableView>
                <ExpandableView mode="exclude" title="Story History" expanded={false}>
                    <StoryHistoryView storyRuntime={storyRuntimeRef.current} />
                </ExpandableView>
                <ExpandableView mode="hide" title="Lore Builder" expanded={false}>
                    <LoreBuilderView workoutProgram={workoutProgram} storyRuntime={storyRuntimeRef.current} />
                </ExpandableView>
                <ExpandableView mode="exclude" title="Game Debugger" expanded={false}>
                    <GameDebugger workoutProgram={workoutProgram} storyRuntime={storyRuntimeRef.current} />
                </ExpandableView>
                <ExpandableView mode="hide" title="Keep Awake" expanded={false}>
                    <KeepAwake />
                </ExpandableView>
            </div>
            <div className="absolute pointer-events-none top-1 right-1 opacity-20">{appVersion}</div>
        </>
    );
};
