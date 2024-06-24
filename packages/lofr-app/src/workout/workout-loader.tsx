import { parseWorkoutDocument, WorkoutProgram } from '@lofr/workout-parser';
import { useState } from 'react';

export const WorkoutLoader = () => {
    const [workoutText, setWorkoutText] = useState(``);
    const [workoutProgram, setWorkoutProgram] = useState(undefined as undefined | WorkoutProgram);
    const loadWorkout = () => {
        const result = parseWorkoutDocument(workoutText);
        setWorkoutProgram(result);
    };
    return (
        <div>
            <h1 className="m-6 text-2xl">Workout Loader</h1>
            <textarea
                className="p-2 m-6 w-full h-96 border-2"
                placeholder="Paste your workout here"
                value={workoutText}
                onChange={(e) => setWorkoutText(e.target.value)}
            />
            <button className="p-2 ml-6 bg-blue-500 text-white" onClick={loadWorkout}>
                Load Workout
            </button>
            <div>
                <pre className="m-6">{JSON.stringify(workoutProgram, null, 2)}</pre>
            </div>
        </div>
    );
};
