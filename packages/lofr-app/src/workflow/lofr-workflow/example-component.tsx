import { useEffect, useState } from 'react';

export const ExampleComponent = (props: { text: string }) => {
    return (
        <>
            <div className="whitespace-pre">{props.text}</div>
        </>
    );
};

export const ExampleInputComponent = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    return (
        <>
            <div className="flex flex-col flex-1 w-full h-full">
                <textarea className="flex-1 resize-none" value={value} onChange={(e) => onChange(e.target.value)} />
            </div>
        </>
    );
};

export const ExampleInputNumberComponent = ({
    text,
    value: initialValue,
    onChange,
    onLinesChange,
}: {
    text: string;
    value: number;
    onChange: (value: number) => void;
    onLinesChange: (value: string) => void;
}) => {
    const [value, setValue] = useState(initialValue || 1);
    const [lines, setLines] = useState(text.split(`\n`).slice(0, value).join(`\n`));

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const _lines = text.split(`\n`).slice(0, value).join(`\n`);
        onChange?.(value);
        onLinesChange?.(_lines);
        setLines(_lines);
        console.log(`[ExampleInputNumberComponent:useEffect] changed`, { lines: _lines, onChange, onLinesChange });
    }, [text, value, onChange, onLinesChange]);

    return (
        <>
            <div className="flex flex-col flex-1 w-full h-full gap-1">
                <input className="p-1" type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
                <div className="overflow-hidden whitespace-pre bg-gray-200">{lines}</div>
            </div>
        </>
    );
};
