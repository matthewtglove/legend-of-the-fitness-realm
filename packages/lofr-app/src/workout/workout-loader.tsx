import { parseWorkoutDocument, WorkoutProgram, WorkoutSession } from '@lofr/workout-parser';
import { useState } from 'react';
import { ExpandableView } from '../components/expandable-view';
import { exampleWorkout00 } from './example-workout-00';

export const WorkoutLoader = ({ onWorkoutLoaded }: { onWorkoutLoaded: (workoutProgram: WorkoutProgram) => void }) => {
    const [workoutText, setWorkoutText] = useState(``);
    const [workoutProgram, setWorkoutProgram] = useState(undefined as undefined | WorkoutProgram);
    const loadWorkout = () => {
        const result = parseWorkoutDocument(workoutText);
        setWorkoutProgram(result);
        onWorkoutLoaded(result);
    };
    const loadExampleWorkout = () => {
        const t = exampleWorkout00;
        setWorkoutText(t);
    };
    return (
        <div>
            <h1 className="m-6 text-2xl">Workout Loader</h1>
            <div className="p-6">
                <textarea
                    className="w-full p-2 border-2 h-96"
                    placeholder="Paste your workout program here"
                    value={workoutText}
                    onChange={(e) => setWorkoutText(e.target.value)}
                />
            </div>
            <div className="flex flex-row">
                <button
                    className="p-2 ml-6 text-white bg-blue-500 rounded hover:opacity-90 active:opacity-80"
                    onClick={loadWorkout}
                >
                    Load Workout Program
                </button>
                <div className="flex-1" />
                <button
                    className="p-2 mr-6 text-white bg-green-500 rounded hover:opacity-90 active:opacity-80"
                    onClick={loadExampleWorkout}
                >
                    Example Program
                </button>
            </div>

            <ExpandableView title="Workout Program Preview">
                <pre className="m-6">{JSON.stringify(workoutProgram, null, 2)}</pre>
            </ExpandableView>
        </div>
    );
};

export const WorkoutSelector = ({
    workoutProgram,
    onWorkoutSessionSelected,
}: {
    workoutProgram: WorkoutProgram;
    onWorkoutSessionSelected: (workoutSession: WorkoutSession) => void;
}) => {
    const [segmentNumber, setSegmentNumber] = useState(1);
    const [sessionNumber, setSessionNumber] = useState(1);
    const workoutSegment = workoutProgram.segments[segmentNumber - 1];
    const workoutSession = workoutSegment?.sessions[sessionNumber - 1];

    const loadSession = () => {
        if (!workoutSession) {
            return;
        }
        onWorkoutSessionSelected(workoutSession);
    };

    return (
        <>
            <h1 className="m-6 text-2xl">Session Selector</h1>
            <div className="flex flex-col">
                <div className="flex items-center">
                    <label className="ml-6 min-w-20">Segment</label>
                    <select
                        className="p-1 m-2 border-2 rounded min-w-40"
                        value={segmentNumber}
                        onChange={(e) => setSegmentNumber(Number(e.target.value))}
                    >
                        {workoutProgram.segments.map((segment, i) => (
                            <option key={i} value={i + 1}>
                                {segment.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center">
                    <label className="ml-6 min-w-20">Session</label>
                    <select
                        className="p-1 m-2 border-2 rounded min-w-40"
                        value={sessionNumber}
                        onChange={(e) => setSessionNumber(Number(e.target.value))}
                    >
                        {workoutSegment?.sessions.map((session, i) => (
                            <option key={i} value={i + 1}>
                                {session.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <button
                className="p-2 mt-6 ml-6 text-white bg-blue-500 rounded hover:opacity-90 active:opacity-80"
                onClick={loadSession}
            >
                Load Session
            </button>
            <ExpandableView title="Session Preview">
                <pre className="m-6">{JSON.stringify(workoutSession, null, 2)}</pre>
            </ExpandableView>
        </>
    );
};
