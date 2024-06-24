import { WorkoutProgram, WorkoutSession } from '@lofr/workout-parser';
import { useState } from 'react';
import { WorkoutLoader, WorkoutSelector } from './workout/workout-loader';

export const App = () => {
    const [workoutProgram, setWorkoutProgram] = useState(undefined as undefined | WorkoutProgram);
    const [workoutSession, setWorkoutSession] = useState(undefined as undefined | WorkoutSession);

    return (
        <>
            <WorkoutLoader onWorkoutLoaded={setWorkoutProgram} />
            {workoutProgram && (
                <WorkoutSelector workoutProgram={workoutProgram} onWorkoutSessionSelected={setWorkoutSession} />
            )}
            {workoutSession && (
                <div>
                    <h1 className="m-6 text-2xl">Workout Session</h1>
                    <pre className="m-6">{JSON.stringify(workoutSession, null, 2)}</pre>
                </div>
            )}
        </>
    );
};
