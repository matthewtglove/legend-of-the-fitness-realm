export type WorkflowEditorController = {
    addTextConstantNode: (content: string) => void;
    addTextFileNode: (path: string) => void;
};