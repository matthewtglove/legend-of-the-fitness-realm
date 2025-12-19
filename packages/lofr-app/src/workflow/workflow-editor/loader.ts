import { WorkflowDocument, WorkflowEditorController, WorkflowObservable } from "./types";

export const loadWorkflowDocument = async (document: WorkflowDocument, workflowEditorController: WorkflowEditorController, abortController: AbortController) => {

    // TODO: handle imports

    // TODO: handle existing nodes (addOrUpdateNode?)

    // Load nodes
    const nodeResults = {} as Record<string, Record<string, WorkflowObservable<unknown>>>;

    for (const node of document.nodes) {
        if (abortController.signal.aborted) return;

        const getInputEdge = (x: NonNullable<typeof node.inputEdges>[number]) => {
            const nodeResult = nodeResults[x.fromNodeId];
            if (!nodeResult) {
                throw new Error(`Input edge references unknown node id: ${x.fromNodeId}`);
            }
            const output = nodeResult[x.fromOutputName];
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
        nodeResults[node.id] = result;
    }

}