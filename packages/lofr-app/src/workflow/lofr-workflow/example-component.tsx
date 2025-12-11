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
