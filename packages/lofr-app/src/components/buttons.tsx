import { ReactNode } from 'react';
import { cn } from './tailwind-utils';
import { useAsyncWorker } from './use-async-worker';

export const AsyncButton = <TValue,>(props: {
    text: string;
    className?: string;
    action: () => PromiseLike<TValue>;
    onDone: (value: TValue) => void;
}) => {
    const { doWork, loading, error } = useAsyncWorker();
    const doAction = () => {
        doWork(async (stopIfObsolete) => {
            const result = await props.action();
            console.log(`AsyncButton: action done`, { result });
            stopIfObsolete();
            console.log(`AsyncButton: stopIfObsolete called`, { result });
            props.onDone(result);
            console.log(`AsyncButton: action onDone called`, { result });
        });
    };

    console.log(`AsyncButton RENDER`, { loading, error });
    return (
        <>
            <Button className={props.className} onClick={doAction} disabled={loading}>
                <div className="flex flex-row gap-1 items-center">
                    {props.text}
                    {loading ? <div className="animate-spin">⌛️</div> : undefined}
                </div>
            </Button>
            {error && <div className="text-red-500">{error.message}</div>}
        </>
    );
};

export const Button = ({
    text,
    children,
    className,
    onClick,
    disabled,
}: {
    text?: string;
    children?: ReactNode;
    className?: string;
    onClick: () => void;
    disabled?: boolean;
}) => {
    return (
        <button
            className={cn(`p-2 text-white bg-blue-500 rounded hover:opacity-80 active:opacity-70`, className)}
            onClick={onClick}
            disabled={disabled}
        >
            {children ?? text}
        </button>
    );
};
