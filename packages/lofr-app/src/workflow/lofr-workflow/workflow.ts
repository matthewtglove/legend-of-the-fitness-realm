import { WorkflowEditorController } from "../workflow-editor/types";
import { _includeInHmr } from "./_hmr";
import { exampleFun } from "./example-fun";

const workflowServerUrl = `http://localhost:7601`;

export const loadLofrWorkflow = async (workflowEditorController: WorkflowEditorController, abortController: AbortController) => {
  _includeInHmr();

  workflowEditorController.setWorkflowServerUrl(workflowServerUrl);
  await workflowEditorController.setWorkflowMetadataPath(`workflow/lofr-workflow/workflow.metadata.json`);
  if (abortController.signal.aborted) return;

  let iTitle = 0;
  workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `WorkoutBuilder` });
  workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `WorkoutTimer` });
  workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `WorkoutGame` });
  workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `MiniGame` });
  const { content: a_narrativeEngine } = workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `NarrativeEngine` });
  a_narrativeEngine.name = `a_narrativeEngine`;
  workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: a_narrativeEngine });

  const { content: b_systemTypes, onContentChange: b_systemTypesOnChange } = workflowEditorController.addTextFileNode({ id: `n-system-types`, path: `systems/lofr-system-types.ts` });
  b_systemTypes.name = `b_systemTypes`;
  workflowEditorController.addTextNode({
    id: `n-title-${iTitle++}`,
    content: b_systemTypes,
    onContentChange: b_systemTypesOnChange,
    startAtLine: `export type LofrWorkoutTimer`,
    endAtLine: `};`
  });
  workflowEditorController.addTextNode({
    id: `n-title-${iTitle++}`,
    content: b_systemTypes,
    onContentChange: b_systemTypesOnChange,
    startAtLine: `export type LofrWorkoutBuilder`,
    endAtLine: `};`
  });
  workflowEditorController.addTextNode({
    id: `n-title-${iTitle++}`,
    content: b_systemTypes,
    onContentChange: b_systemTypesOnChange,
    startAtLine: `export type LofrWorkoutGame`,
    endAtLine: `};`
  });
  workflowEditorController.addTextNode({
    id: `n-title-${iTitle++}`,
    content: b_systemTypes,
    onContentChange: b_systemTypesOnChange,
    startAtLine: `export type LofrMiniGame`,
    endAtLine: `};`
  });
  const { content: c_narrativeEngineTrimmed, onContentChange: c_narrativeEngineTrimmedOnChange } = workflowEditorController.addTextNode({
    id: `n-title-${iTitle++}`,
    content: b_systemTypes,
    onContentChange: b_systemTypesOnChange,
    startAtLine: `export type LofrNarrativeEngine`,
    endAtLine: `};`
  });
  c_narrativeEngineTrimmed.name = `c_narrativeEngineTrimmed`;
  workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: c_narrativeEngineTrimmed, onContentChange: c_narrativeEngineTrimmedOnChange });
  workflowEditorController.addTextNode({
    id: `n-title-${iTitle++}`,
    content: b_systemTypes,
    onContentChange: b_systemTypesOnChange,
    startAtLine: `/**

# Systems`,
    endAtLine: ` */`
  });

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