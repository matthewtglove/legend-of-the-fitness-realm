import { WorkflowEditorController } from "../workflow-editor/types";
import { exampleFun } from "./example-fun";

// test 03

const workflowServerUrl = `http://localhost:7601`;

export const loadLofrWorkflow = async (workflowEditorController: WorkflowEditorController) => {
    workflowEditorController.setWorkflowServerUrl(workflowServerUrl);
    await workflowEditorController.setWorkflowMetadataPath(`workflow/lofr-workflow/workflow.metadata.json`);

    let iTitle = 0;
    workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `WorkoutBuilder` });
    workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `WorkoutTimer` });
    workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `WorkoutGame` });
    workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `MiniGame` });
    const a = workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `NarrativeEngine` });
    a.name = `a_narrativeEngine`;
    workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: a.outputs.content });

    workflowEditorController.addTextFileNode({ id: `n-system-types`, path: `systems/lofr-system-types.ts` });

    workflowEditorController.addTextFileNode({ id: `n-workflow`, path: `workflow/lofr-workflow/workflow.ts` });
    workflowEditorController.addTextFileNode({ id: `n-workflow-metadata`, path: `workflow/lofr-workflow/workflow.metadata.json` });

    workflowEditorController.addTextFileNode({ id: `n-todo`, path: `workflow/todo.md` });

    workflowEditorController.addTextFileNode({ id: `n-example-fun`, path: `workflow/lofr-workflow/example-fun.ts` });
    workflowEditorController.addTextNode({ id: `n-example-fun-result`, content: exampleFun() });

    workflowEditorController.addTextFileNode({ id: `n-clock-mini-game-code`, path: `prep/clock-mini-game/game-view.tsx` });
    workflowEditorController.addComponent({
        id: `n-clock-mini-game`,
        path: `../../prep/clock-mini-game/game-view.tsx`,
        exportName: `MiniGame_PocketWatch`
    });

    workflowEditorController.addComponent({
        id: `n-app`,
        path: `../../app.tsx`,
        exportName: `AppInner`
    });
};