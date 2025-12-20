import { WorkflowDocument, WorkflowEditorController, WorkflowNodeInstance, WorkflowObservable } from "./types";

export const loadWorkflowDocument = async ({
    document,
    workflowEditorController,
    abortController,
    onSaveInputLiteral
}: {
    document: WorkflowDocument;
    workflowEditorController: WorkflowEditorController;
    abortController: AbortController;
    onSaveInputLiteral: (args: { nodeId: string; inputName: string; value: string | number | Record<string, unknown>; }) => void;
}) => {

    // TODO: handle imports

    // TODO: handle existing nodes (addOrUpdateNode?)

    // Load nodes
    const nodeInstances = {} as Record<string, WorkflowNodeInstance<Record<string, WorkflowObservable<unknown>>, Record<string, WorkflowObservable<unknown>>>>;

    for (const node of document.nodes) {
        if (abortController.signal.aborted) return;

        const getInputEdge = (x: NonNullable<typeof node.inputEdges>[number]) => {
            const nodeInstance = nodeInstances[x.fromNodeId];
            if (!nodeInstance) {
                throw new Error(`Input edge references unknown node id: ${x.fromNodeId}`);
            }
            const output = nodeInstance.outputs?.[x.fromOutputName];
            if (!output) {
                throw new Error(`Input edge references unknown output name: ${x.fromOutputName} on node id: ${x.fromNodeId}`);
            }
            return output;
        }

        const inputs = {
            ...Object.fromEntries(node.inputLiterals?.map(x => [x.inputName, x.value]) ?? []),
            ...Object.fromEntries(node.inputEdges?.map((x) => [x.inputName, getInputEdge(x)]) ?? [])
        }

        const outputs = {
            ...Object.fromEntries(node.outputs?.map(x => [x.outputName, x.defaultValue]) ?? []),
        }

        const result = workflowEditorController.addNode(node.typeName, {
            id: node.id,
            inputs: inputs,
            outputs: outputs,
        });
        nodeInstances[node.id] = result;


    }

    // setup input literal saving
    const setupInputLiteralSaving = () => {
        for (const node of document.nodes) {
            const result = nodeInstances[node.id];
            if (!result) continue;

            // Handle input saving (for any value not an edge)
            for (const [inputName, inputObs] of Object.entries(result.inputs ?? [])) {
                const inputEdge = node.inputEdges?.find(x => x.inputName === inputName);
                if (inputEdge) continue;

                inputObs.subscribe((newValue) => {
                    onSaveInputLiteral({
                        nodeId: node.id,
                        inputName: inputName,
                        value: newValue as string | number | Record<string, unknown>,
                    });
                }, {
                    skipCurrentValue: true
                });
            }
        }
    }
    setTimeout(() => {
        setupInputLiteralSaving();
    }, 10);

}