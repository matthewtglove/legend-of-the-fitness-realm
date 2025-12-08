import { WorkflowEditorController } from "../workflow-editor/types";

export const loadLofrWorkflow = async (workflowEditorController: WorkflowEditorController) => {
    workflowEditorController.addTextFileNode(`workflow/lofr-workflow/workflow.ts`);
};