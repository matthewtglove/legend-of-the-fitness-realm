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
    value,
    onChange,
}: {
    text: string;
    value: number;
    onChange: (value: number) => void;
}) => {
    return (
        <>
            <div className="flex flex-col flex-1 w-full h-full gap-1">
                <input className="p-1" type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
                <div className="overflow-hidden whitespace-pre bg-gray-200">{text}</div>
            </div>
        </>
    );
};
