import { useEffect, useState } from 'react';
import { cn } from './tailwind-utils';

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
            <div
                className={cn(`flex flex-row items-center`, expanded && `pb-2 border-b border-b-slate-200`)}
                onClick={() => setExpanded(!expanded)}
            >
                <button className="text-left whitespace-pre-wrap" onClick={() => setExpanded(!expanded)}>
                    {expanded ? `⬇️` : `➡️`} {title}
                </button>
                <div className="flex-grow" />
                {titleRight && (
                    <div title={tooltipRight} className="text-right">
                        {titleRight}
                    </div>
                )}
            </div>
            {mode === `exclude` && expanded && children}
            {mode === `hide` && <div className={expanded ? `` : `hidden`}>{children}</div>}
        </div>
    );
};
