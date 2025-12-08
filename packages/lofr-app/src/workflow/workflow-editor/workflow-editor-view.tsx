import { useEffect } from 'react';
import { WorkflowEditorController } from './types';

export const WorkflowEditorView = (props: {
    loader: undefined | ((controller: WorkflowEditorController) => Promise<void>);
}) => {
    useEffect(() => {
        if (!props.loader) return;

        const controller: WorkflowEditorController = {
            addTextFileNode: (path: string) => {
                console.log(`Adding text file node for path: ${path}`);
                // TODO: Implement the logic to add a text file node to the workflow editor
            },
        };
        void props.loader(controller);
    }, [props.loader]);

    return <div>workflow editor {props.loader ? ` with loader!` : ``}</div>;
};
