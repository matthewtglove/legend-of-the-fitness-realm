import { WorkflowObservable, WorkflowRegistry } from "./types";

export const WorkflowDocumentFormat = {
    nodeToDocument: (
        registry: WorkflowRegistry,
        node: {
            id: string;
            typeName: string;
            data: {
                requires?: string[];
                inputs: Record<string, WorkflowObservable<unknown>>;
                outputs: Record<string, WorkflowObservable<unknown>>;
            }
        }) => {

        const type = registry.nodeTypes[node.typeName];
        if (!type) {
            throw new Error(`Unknown node type: ${node.typeName}`);
        }

        const reservedNames = new Set([`workflowServerUrl`, `id`, `typeName`]);

        const inputLiterals = Object.entries(node.data.inputs).map(([inputName, value]) => ({
            inputName,
            value,
        })).filter(x => (x.value.source?.nodeId ?? node.id) === node.id).map(x => ({
            inputName: x.inputName,
            value: x.value.lastValue
        })).filter(x => !reservedNames.has(x.inputName));

        const inputEdges = Object.entries(node.data.inputs).map(([inputName, value]) => ({
            inputName,
            value,
        })).filter(x => x.value.source?.nodeId && x.value.source.nodeId !== node.id).map(x => ({
            inputName: x.inputName,
            fromNodeId: x.value.source!.nodeId,
            fromOutputName: x.value.source!.handleId,
        })).filter(x => !reservedNames.has(x.inputName));

        const outputs = Object.entries(node.data.outputs).map(([outputName, value]) => ({
            outputName,
            defaultValue: value.lastValue,
        })).filter(x => !(x.outputName in type.defaults.outputs))
            .filter(x => !reservedNames.has(x.outputName));

        const result = {
            id: node.id,
            typeName: node.typeName,
            requires: node.data.requires,
            inputLiterals: Object.keys(inputLiterals).length > 0 ? inputLiterals : undefined,
            inputEdges: Object.keys(inputEdges).length > 0 ? inputEdges : undefined,
            outputs: Object.keys(outputs).length > 0 ? outputs : undefined,
        };

        console.log(`[WorkflowDocumentFormat.nodeToDocument]`, { result, node, type });
        return result;
    },
};