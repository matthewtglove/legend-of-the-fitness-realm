import { parseWorkoutDocument, WorkoutProgram, WorkoutSession } from '@lofr/workout-parser';
import { useState } from 'react';
import { ExpandableView } from '../components/expandable-view';

export const WorkoutLoader = ({ onWorkoutLoaded }: { onWorkoutLoaded: (workoutProgram: WorkoutProgram) => void }) => {
    const [workoutText, setWorkoutText] = useState(``);
    const [workoutProgram, setWorkoutProgram] = useState(undefined as undefined | WorkoutProgram);
    const loadWorkout = () => {
        const result = parseWorkoutDocument(workoutText);
        setWorkoutProgram(result);
        onWorkoutLoaded(result);
    };
    return (
        <div>
            <h1 className="m-6 text-2xl">Workout Loader</h1>
            <textarea
                className="w-full p-2 m-6 border-2 h-96"
                placeholder="Paste your workout program here"
                value={workoutText}
                onChange={(e) => setWorkoutText(e.target.value)}
            />
            <button className="p-2 ml-6 text-white bg-blue-500" onClick={loadWorkout}>
                Load Workout Program
            </button>
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
            <div>
                <label className="m-6">Segment</label>
                <input
                    type="number"
                    className="p-1 m-2 border-2"
                    value={segmentNumber}
                    onChange={(e) => setSegmentNumber(e.target.valueAsNumber)}
                />
                {workoutSegment?.name}
            </div>
            <div>
                <label className="m-6">Session</label>
                <input
                    type="number"
                    className="p-1 m-2 border-2"
                    value={sessionNumber}
                    onChange={(e) => setSessionNumber(e.target.valueAsNumber)}
                />
                {workoutSession?.name}
            </div>
            <button className="p-2 ml-6 text-white bg-blue-500" onClick={loadSession}>
                Load Session
            </button>
            <ExpandableView title="Session Preview">
                <pre className="m-6">{JSON.stringify(workoutSession, null, 2)}</pre>
            </ExpandableView>
        </>
    );
};
