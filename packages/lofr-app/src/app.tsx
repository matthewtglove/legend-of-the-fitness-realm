import { WorkoutProgram, WorkoutSession } from '@lofr/workout-parser';
import { useRef, useState } from 'react';
import { WorkoutLoader, WorkoutSelector } from './workout/workout-loader';
import { WorkoutSessionTimer } from './workout/workout-timer';
import { QuestEditor } from './story/quest-editor';
import { QuestContext } from './story/story-types';
import { createEmptyStoryRuntime, createStoryRuntime } from './story/story-runtime';

const appVersion = `v1.0.1`;

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
                <QuestEditor
                    value={storyRuntimeRef.current.questContext}
                    onChange={(x) => (storyRuntimeRef.current.questContext = x)}
                />
                <WorkoutLoader onWorkoutLoaded={setWorkoutProgram} />
                {workoutProgram && (
                    <WorkoutSelector workoutProgram={workoutProgram} onWorkoutSessionSelected={setWorkoutSession} />
                )}
                {workoutSession && (
                    <WorkoutSessionTimer workoutSession={workoutSession} storyRuntime={storyRuntimeRef.current} />
                )}
            </div>
            <div className="absolute bottom-1 right-1">{appVersion}</div>
        </>
    );
};
