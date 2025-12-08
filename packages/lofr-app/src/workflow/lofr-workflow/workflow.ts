import { WorkflowEditorController } from "../workflow-editor/types";
import { exampleFun } from "./example-fun";

// test 03


export const loadLofrWorkflow = async (workflowEditorController: WorkflowEditorController) => {
    workflowEditorController.addTextFileNode(`workflow/lofr-workflow/workflow.ts`);
    workflowEditorController.addTextFileNode(`workflow/todo.md`);
    workflowEditorController.addTextFileNode(`workflow/lofr-workflow/example-fun.ts`);
    workflowEditorController.addTextConstantNode(exampleFun());
};