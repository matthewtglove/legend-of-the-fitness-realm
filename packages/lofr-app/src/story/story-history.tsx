import { useState } from 'react';
import { GameStoryRuntime } from './game-story-runtime';
import { summarizeGameEventResponse } from './summarize';

export const StoryHistoryView = ({ storyRuntime }: { storyRuntime: GameStoryRuntime }) => {
    const [renderId, setRenderId] = useState(0);
    const refresh = () => {
        setRenderId((s) => s + 1);
    };

    return (
        <div className="flex flex-col gap-2">
            <h1>Story History</h1>
            <div className="flex flex-col gap-2" key={renderId}>
                {storyRuntime.storyHistory.map((x, i) => (
                    <div key={i} className={`flex flex-col gap-2 p-1 border border-slate-200`}>
                        <div className="text-green-600 whitespace-pre-wrap">
                            {x.id}: {x.eventFormatted}
                        </div>
                        <div className="text-xs text-green-600 whitespace-pre-wrap">
                            {summarizeGameEventResponse(x.gameEvents)}
                        </div>
                        <div className="text-slate-800">{x.message}</div>
                    </div>
                ))}
            </div>
            <button className="self-end p-2 text-white bg-blue-400" onClick={refresh}>
                Refresh
            </button>
        </div>
    );
};
