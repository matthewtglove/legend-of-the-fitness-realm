import { loadWorkflowDocument } from "../workflow-editor/loader";
import { WorkflowEditorController } from "../workflow-editor/types";
import { _includeInHmr } from "./_hmr";
import lofrWorkflowDocument from "./workflow.document.json";

const workflowServerUrl = `http://localhost:7601`;

export const loadLofrWorkflow = async (workflowEditorController: WorkflowEditorController, abortController: AbortController) => {
  _includeInHmr();

  workflowEditorController.setWorkflowServerUrl(workflowServerUrl);
  await workflowEditorController.setWorkflowMetadataPath(`workflow/lofr-workflow/workflow.metadata.json`);
  if (abortController.signal.aborted) return;

  await loadWorkflowDocument(lofrWorkflowDocument, workflowEditorController, abortController);
  if (abortController.signal.aborted) return;

  // let iTitle = 0;
  // workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `WorkoutBuilder` });
  // workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `WorkoutTimer` });
  // workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `WorkoutGame` });
  // workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `MiniGame` });

  // const { content: a_narrativeEngine } = workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: `NarrativeEngine` });
  // a_narrativeEngine.name = `a_narrativeEngine`;
  // workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: a_narrativeEngine });
  // workflowEditorController.addComponent({
  //   id: `n-example-component-02`,
  //   path: `../../workflow/lofr-workflow/example-component.tsx`,
  //   exportName: `ExampleComponent`,
  //   defaults: {
  //     inputs: {
  //       text: ``,
  //     },
  //     outputs: {},
  //   },
  //   text: a_narrativeEngine
  // });

  // let iTitle = 6;
  // const { content: b_systemTypes, onContentChange: b_systemTypesOnChange } = workflowEditorController.addTextFileNode({ id: `n-system-types`, path: `systems/lofr-system-types.ts` });
  // b_systemTypes.name = `b_systemTypes`;
  // workflowEditorController.addTextNode({
  //   id: `n-title-${iTitle++}`,
  //   content: b_systemTypes,
  //   onContentChange: b_systemTypesOnChange,
  //   startAtLine: `export type LofrWorkoutTimer`,
  //   endAtLine: `};`
  // });
  // workflowEditorController.addTextNode({
  //   id: `n-title-${iTitle++}`,
  //   content: b_systemTypes,
  //   onContentChange: b_systemTypesOnChange,
  //   startAtLine: `export type LofrWorkoutBuilder`,
  //   endAtLine: `};`
  // });
  // workflowEditorController.addTextNode({
  //   id: `n-title-${iTitle++}`,
  //   content: b_systemTypes,
  //   onContentChange: b_systemTypesOnChange,
  //   startAtLine: `export type LofrWorkoutGame`,
  //   endAtLine: `};`
  // });
  // workflowEditorController.addTextNode({
  //   id: `n-title-${iTitle++}`,
  //   content: b_systemTypes,
  //   onContentChange: b_systemTypesOnChange,
  //   startAtLine: `export type LofrMiniGame`,
  //   endAtLine: `};`
  // });
  // const { content: c_narrativeEngineTrimmed, onContentChange: c_narrativeEngineTrimmedOnChange } = workflowEditorController.addTextNode({
  //   id: `n-title-${iTitle++}`,
  //   content: b_systemTypes,
  //   onContentChange: b_systemTypesOnChange,
  //   startAtLine: `export type LofrNarrativeEngine`,
  //   endAtLine: `};`
  // });
  // c_narrativeEngineTrimmed.name = `c_narrativeEngineTrimmed`;
  // workflowEditorController.addTextNode({ id: `n-title-${iTitle++}`, content: c_narrativeEngineTrimmed, onContentChange: c_narrativeEngineTrimmedOnChange });
  // workflowEditorController.addTextNode({
  //   id: `n-title-${iTitle++}`,
  //   content: b_systemTypes,
  //   onContentChange: b_systemTypesOnChange,
  //   startAtLine: `/**\n\n# Systems`,
  //   endAtLine: ` */`
  // });

  // workflowEditorController.addComponent({
  //   id: `n-example-component-03`,
  //   path: `../../workflow/lofr-workflow/example-component.tsx`,
  //   exportName: `ExampleComponent`,
  //   defaults: {
  //     inputs: {
  //       text: ``,
  //     },
  //     outputs: {},
  //   },
  //   text: c_narrativeEngineTrimmed
  // });


  /*
  workflowEditorController.addTextFileNode({ id: `n-workflow`, path: `workflow/lofr-workflow/workflow.ts` });
  workflowEditorController.addTextFileNode({ id: `n-workflow-metadata`, path: `workflow/lofr-workflow/workflow.metadata.json` });

  workflowEditorController.addTextFileNode({ id: `n-example-fun`, path: `workflow/lofr-workflow/example-fun.ts` });

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

  workflowEditorController.addComponent({
    id: `n-example-component`,
    path: `../../workflow/lofr-workflow/example-component.tsx`,
    exportName: `ExampleComponent`,
    defaults: {
      inputs: {
        text: ``,
      },
      outputs: {},
    },
    text: `hello!!!\nhello!!!\nhello!!!\nhello!!!\nhello!!!\nhello!!!\n`
  });
  */

  // workflowEditorController.addTextNode({ id: `n-example-fun-result`, content: exampleFun() });
  // workflowEditorController.addNode(
  //   `function`,
  //   {
  //     id: `n-example-fun-node-result`,
  //     path: `../../workflow/lofr-workflow/example-fun.ts`,
  //     exportName: `exampleFun02`,
  //     defaults: {
  //       inputs: {
  //       },
  //       outputs: {
  //         text: ``
  //       },
  //     },
  //   }
  // );

  /*
  const todoNode = workflowEditorController.addTextFileNode({ id: `n-todo`, path: `workflow/todo.md` });
  workflowEditorController.addComponent({
    id: `n-example-component-input-04`,
    path: `../../workflow/lofr-workflow/example-component.tsx`,
    exportName: `ExampleInputComponent`,
    inputs: {
      value: todoNode.content,
      onChange: todoNode.onContentChange,
    },
  });

  const { lines: changedLines } = workflowEditorController.addComponent({
    id: `n-example-component-05-output`,
    path: `../../workflow/lofr-workflow/example-component.tsx`,
    exportName: `ExampleInputNumberComponent`,
    inputs: {
      text: todoNode.content,
      value: 3,
    },
    outputs: {
      value: 0,
      lines: ``,
    },
  });

  workflowEditorController.addTextNode({
    id: `n-example-component-05-output-display`,
    content: changedLines as unknown as string,
  });
  */


  /*
  workflowEditorController.addTextFileNode({ id: `n-energy-bar-code`, path: `prep/clock-mini-game/energy-bar.ts` });

  const n_startEnergy = workflowEditorController.addNumberNode({
    id: `n-startEnergy`,
    label: `Start Energy`,
    value: 0
  });
  const n_endEnergy = workflowEditorController.addNumberNode({
    id: `n-endEnergy`,
    label: `End Energy`,
    value: 50
  });
  const n_speed = workflowEditorController.addNumberNode({
    id: `n-speed`,
    label: `Speed`,
    value: 100
  });

  workflowEditorController.addComponent({
    id: `n-energy-bar-simple`,
    path: `../../prep/clock-mini-game/energy-bar-view.tsx`,
    exportName: `MiniGame_EnergyBar`,
    inputs: {
      startCharge: n_startEnergy.value,
      endCharge: n_endEnergy.value,
      speed: n_speed.value,
    },
  });
  */

  // workflowEditorController.addComponent({
  //   id: `n-energy-bar`,
  //   path: `../../prep/clock-mini-game/canvas-2d-view.tsx`,
  //   exportName: `Canvas2dView`,
  //   inputs: {
  //     createDrawing: (canvas: HTMLCanvasElement) => {
  //       const drawing = animateEnergyBar(canvas);
  //       if (!drawing) throw new Error(`Failed to create energy bar drawing`);

  //       const subs = [] as { unsubscribe: () => void }[];
  //       subs.push(n_startEnergy.value.subscribe(() => {
  //         drawing.start({
  //           startCharge: n_startEnergy.value.lastValue,
  //           endCharge: n_endEnergy.value.lastValue,
  //           speed: n_speed.value.lastValue,
  //         })
  //       }));
  //       subs.push(n_endEnergy.value.subscribe(() => {
  //         drawing.start({
  //           startCharge: n_startEnergy.value.lastValue,
  //           endCharge: n_endEnergy.value.lastValue,
  //           speed: n_speed.value.lastValue,
  //         })
  //       }));
  //       subs.push(n_speed.value.subscribe(() => {
  //         drawing.start({
  //           startCharge: n_startEnergy.value.lastValue,
  //           endCharge: n_endEnergy.value.lastValue,
  //           speed: n_speed.value.lastValue,
  //         })
  //       }));

  //       return {
  //         start: () => {
  //           drawing.start({
  //             startCharge: n_startEnergy.value.lastValue,
  //             endCharge: n_endEnergy.value.lastValue,
  //             speed: n_speed.value.lastValue,
  //           })
  //         },
  //         stop: () => {
  //           drawing.stop()
  //         },
  //         destroy: () => {
  //           subs.forEach(s => s.unsubscribe());
  //         }
  //       };
  //     },
  //   },

  // });
};