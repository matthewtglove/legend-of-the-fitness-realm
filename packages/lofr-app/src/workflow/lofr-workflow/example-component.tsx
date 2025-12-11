export const ExampleComponent = (props: { text: string }) => {
    return (
        <>
            <div className="whitespace-pre">{props.text}</div>
        </>
    );
};
