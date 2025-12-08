import { useCallback, useEffect, useState } from 'react';
import { WorkflowEditorController } from './types';
import '@xyflow/react/dist/style.css';
import {
    ReactFlow,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    MiniMap,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    Node,
    Edge,
} from '@xyflow/react';

export const WorkflowEditorView = (props: {
    loader: undefined | ((controller: WorkflowEditorController) => Promise<void>);
}) => {
    return (
        <div className="w-full h-full bg-lime-300">
            <ReactFlowView loader={props.loader} />
        </div>
    );
};

type NodeType = (typeof initialNodes)[number];
type EdgeType = (typeof initialEdges)[number];

const initialNodes = [
    { id: `n1`, position: { x: 0, y: 0 }, data: { label: `Node 1` } },
    { id: `n2`, position: { x: 0, y: 100 }, data: { label: `Node 2` } },
] satisfies Node[];
const initialEdges = [{ id: `n1-n2`, source: `n1`, target: `n2` }] satisfies Edge[];

const ReactFlowView = (props: { loader: undefined | ((controller: WorkflowEditorController) => Promise<void>) }) => {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

    const onNodesChange: OnNodesChange<NodeType> = useCallback(
        (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
        [],
    );
    const onEdgesChange: OnEdgesChange<EdgeType> = useCallback(
        (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
        [],
    );
    const onConnect: OnConnect = useCallback(
        (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
        [],
    );

    useEffect(() => {
        if (!props.loader) return;

        const controller: WorkflowEditorController = {
            addTextFileNode: (path: string) => {
                console.log(`Adding text file node for path: ${path}`);
                // TODO: Implement the logic to add a text file node to the workflow editor
            },
        };
        void props.loader(controller);
    }, [props.loader]);

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            >
                <MiniMap nodeStrokeWidth={3} />
            </ReactFlow>
        </div>
    );
};
