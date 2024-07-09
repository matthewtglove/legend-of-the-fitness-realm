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
            <h1 className="mb-2 text-2xl">Workout Program Loader</h1>
            <div>
                <textarea
                    className="w-full p-2 border-2 h-96"
                    placeholder="Paste your workout program here"
                    value={workoutText}
                    onChange={(e) => setWorkoutText(e.target.value)}
                />
                <div className="flex flex-row mt-2">
                    <button
                        className="p-2 text-white bg-blue-500 rounded hover:opacity-80 active:opacity-70"
                        onClick={loadWorkout}
                    >
                        Load Workout Program
                    </button>
                    <div className="flex-1" />
                    <button
                        className="p-2 text-white bg-green-500 rounded hover:opacity-80 active:opacity-70"
                        onClick={loadExampleWorkout}
                    >
                        Example Program
                    </button>
                </div>
            </div>

            {workoutProgram && (
                <div className="mt-4">
                    <ExpandableView title="Workout Program Preview">
                        <pre className="m-6">{JSON.stringify(workoutProgram, null, 2)}</pre>
                    </ExpandableView>
                </div>
            )}
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
            <h1 className="text-2xl">Session Selector</h1>
            <div className="flex flex-col">
                <div className="flex items-center mt-2 mb-2">
                    <label className="min-w-20">Segment</label>
                    <select
                        className="w-full p-1 ml-2 border-2 rounded max-w-80"
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
                <div className="flex items-center mt-2 mb-2">
                    <label className="min-w-20">Session</label>
                    <select
                        className="w-full p-1 ml-2 border-2 rounded max-w-80"
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
            <div className="mt-2">
                <ExpandableView title="Session Preview">
                    <pre className="m-6">{JSON.stringify(workoutSession, null, 2)}</pre>
                </ExpandableView>
            </div>
            <button
                className="w-full p-2 mt-16 text-white bg-blue-500 rounded animate-minorPulse hover:opacity-80 active:opacity-70"
                onClick={loadSession}
            >
                Load Workout Session
            </button>
        </>
    );
};
