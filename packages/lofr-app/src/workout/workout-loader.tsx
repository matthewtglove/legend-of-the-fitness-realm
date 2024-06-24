import { parseWorkoutDocument, WorkoutProgram, WorkoutSession } from '@lofr/workout-parser';
import { useState } from 'react';

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
            <button className="p-2 m-6 text-white bg-blue-500" onClick={loadWorkout}>
                Load Workout Program
            </button>
            {/* <div>
                <pre className="m-6">{JSON.stringify(workoutProgram, null, 2)}</pre>
            </div> */}
            <div>{workoutProgram?.name ?? ``}</div>
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
        onWorkoutSessionSelected(workoutSession);
    };

    return (
        <>
            <h1 className="m-6 text-2xl">Workout Selector</h1>
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
            <button className="p-2 m-6 text-white bg-blue-500" onClick={loadSession}>
                Load Session
            </button>
            <ExpandableView title="Workout Session">
                <pre className="m-6">{JSON.stringify(workoutSession, null, 2)}</pre>
            </ExpandableView>
        </>
    );
};

const ExpandableView = ({ title, children }: { title: string; children: React.ReactNode }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="p-2 m-6 rounded bg-slate-200">
            <button onClick={() => setExpanded(!expanded)}>
                {expanded ? `⬇️` : `➡️`} {title}
            </button>
            {expanded && children}
        </div>
    );
};
