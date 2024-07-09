import { WorkoutProgram, WorkoutSession } from '@lofr/workout-parser';
import { useRef, useState } from 'react';
import { WorkoutLoader, WorkoutSelector } from './workout/workout-loader';
import { WorkoutSessionTimer } from './workout/workout-timer';
import { QuestEditor } from './story/quest-editor';
import { QuestContext } from './story/story-types';
import { createEmptyStoryRuntime, createStoryRuntime } from './story/story-runtime';
import { ExpandableView } from './components/expandable-view';

const appVersion = `v1.0.4`;

export const App = () => {
    const [workoutProgram, setWorkoutProgram] = useState(undefined as undefined | WorkoutProgram);
    const [workoutSession, setWorkoutSession] = useState(undefined as undefined | WorkoutSession);
    const storyRuntimeRef = useRef(createEmptyStoryRuntime());

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
                <ExpandableView mode={'hide'} title="Workout Loader" expanded={!workoutSession}>
                    <>
                        <WorkoutLoader onWorkoutLoaded={setWorkoutProgram} />
                        {workoutProgram && (
                            <WorkoutSelector
                                workoutProgram={workoutProgram}
                                onWorkoutSessionSelected={setWorkoutSession}
                            />
                        )}
                    </>
                </ExpandableView>
                <QuestEditor
                    value={storyRuntimeRef.current.questContext}
                    onChange={(x) => (storyRuntimeRef.current.questContext = x)}
                />
            </div>
            <div className="absolute pointer-events-none top-1 right-1 opacity-20">{appVersion}</div>
        </>
    );
};
