import { WorkflowEditorController } from "../workflow-editor/types";
import { exampleFun } from "./example-fun";

// test 03

const workflowServerUrl = `http://localhost:7601`;

export const loadLofrWorkflow = async (workflowEditorController: WorkflowEditorController) => {
    workflowEditorController.setWorkflowServerUrl(workflowServerUrl);
    await workflowEditorController.setWorkflowMetadataPath(`workflow/lofr-workflow/workflow.metadata.json`);
    workflowEditorController.addTextFileNode({ id: `n-workflow`, path: `workflow/lofr-workflow/workflow.ts` });
    workflowEditorController.addTextFileNode({ id: `n-workflow-metadata`, path: `workflow/lofr-workflow/workflow.metadata.json` });
    workflowEditorController.addTextFileNode({ id: `n-todo`, path: `workflow/todo.md` });
    workflowEditorController.addTextFileNode({ id: `n-example-fun`, path: `workflow/lofr-workflow/example-fun.ts` });
    workflowEditorController.addTextFileNode({ id: `n-clock-mini-game-code`, path: `prep/clock-mini-game/game-view.tsx` });
    workflowEditorController.addComponent({ id: `n-clock-mini-game`, path: `../../prep/clock-mini-game/game-view.tsx`, exportName: `MiniGame_PocketWatch` });
    workflowEditorController.addTextConstantNode({ id: `n-constant`, content: exampleFun() });
};