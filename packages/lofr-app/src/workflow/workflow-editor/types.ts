export type WorkflowEditorController = {
    setWorkflowServerUrl: (url: string) => void;
    setWorkflowMetadataPath: (path: string) => Promise<void>;
    addTextConstantNode: (args: { id: string, content: string }) => void;
    addTextFileNode: (args: { id: string, path: string }) => void;
    addComponent: (args: { id: string, path: string }) => void;
};