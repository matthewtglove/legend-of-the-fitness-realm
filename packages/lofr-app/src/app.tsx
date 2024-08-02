import { WorkoutProgram, WorkoutSession } from '@lofr/workout-parser';
import { useRef, useState } from 'react';
import { WorkoutLoader, WorkoutSelector } from './workout/workout-loader';
import { WorkoutSessionTimer } from './workout/workout-timer';
import { ExpandableView } from './components/expandable-view';
import buildNumber from './build-version.json';
import { createGameStoryRuntime } from './story/game-story-runtime';

const appVersion = `v1.0.${buildNumber}`;

export const App = () => {
    const [workoutProgram, setWorkoutProgram] = useState(undefined as undefined | WorkoutProgram);
    const [workoutSession, setWorkoutSession] = useState(undefined as undefined | WorkoutSession);
    const storyRuntimeRef = useRef(createGameStoryRuntime());

    // console.log(`App`, {
    //     questContext: storyRuntimeRef.current.questContext,
    //     storyRuntimeRef: storyRuntimeRef.current,
    // });
    return (
        <>
            <div className="">
                {workoutSession && (
                    <WorkoutSessionTimer workoutSession={workoutSession} storyRuntime={storyRuntimeRef.current} />
                )}
                <div className="m-2">
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
            <div className="absolute pointer-events-none top-1 right-1 opacity-20">{appVersion}</div>
        </>
    );
};
