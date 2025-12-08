import { WorkflowEditorController } from "../workflow-editor/types";

// test 03


export const loadLofrWorkflow = async (workflowEditorController: WorkflowEditorController) => {
    workflowEditorController.addTextFileNode(`workflow/lofr-workflow/workflow.ts`);
    workflowEditorController.addTextFileNode(`workflow/todo.md`);
};