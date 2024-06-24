import { useState } from 'react';

export const ExpandableView = ({ title, children }: { title: string; children: React.ReactNode }) => {
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
