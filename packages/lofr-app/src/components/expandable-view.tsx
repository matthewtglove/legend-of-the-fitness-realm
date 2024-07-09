import { useEffect, useLayoutEffect, useState } from 'react';

export const ExpandableView = ({
    title,
    children,
    expanded: expandedDefault = false,
    mode = `exclude`,
}: {
    title: string;
    children: React.ReactNode;
    expanded?: boolean;
    mode?: `exclude` | `hide`;
}) => {
    const [expanded, setExpanded] = useState(expandedDefault);
    useEffect(() => {
        console.log(`ExpandableView useEffect`, { expandedDefault });
        setExpanded(expandedDefault);
    }, [expandedDefault]);

    return (
        <div className="p-2 m-2 border-2 rounded border-slate-200">
            <button onClick={() => setExpanded(!expanded)}>
                {expanded ? `⬇️` : `➡️`} {title}
            </button>
            {mode === `exclude` && expanded && children}
            {mode === `hide` && <div className={expanded ? `` : `hidden`}>{children}</div>}
        </div>
    );
};
