import { useEffect, useState } from 'react';

export const ExpandableView = ({
    title,
    titleRight,
    tooltipRight,
    children,
    expanded: expandedDefault = false,
    mode = `exclude`,
}: {
    title: string;
    titleRight?: string;
    tooltipRight?: string;
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
        <div className="p-2 border-2 rounded border-slate-200">
            <div className="flex flex-row items-center justify-between">
                <button onClick={() => setExpanded(!expanded)}>
                    {expanded ? `⬇️` : `➡️`} {title}
                </button>
                {titleRight && <div title={tooltipRight}>{titleRight}</div>}
            </div>
            {mode === `exclude` && expanded && children}
            {mode === `hide` && <div className={expanded ? `` : `hidden`}>{children}</div>}
        </div>
    );
};
