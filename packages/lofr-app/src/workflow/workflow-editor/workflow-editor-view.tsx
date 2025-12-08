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
    NodeTypes,
    NodeResizer,
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

type NodeType = Node;
type EdgeType = Edge;

const initialNodes = [
    // { id: `n1`, position: { x: 0, y: 0 }, data: { label: `Node 1` } },
    // { id: `n2`, position: { x: 0, y: 100 }, data: { label: `Node 2` } },
] as Node[];
const initialEdges = [
    // { id: `n1-n2`, source: `n1`, target: `n2` }
] as Edge[];

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

                setNodes((s) => [
                    ...s,
                    {
                        type: `textFile`,
                        id: `node-${s.length}-${Math.random().toString(16).slice(2)}`,
                        position: { x: Math.random() * 400, y: Math.random() * 400 },
                        data: { path },
                    },
                ]);
            },
        };
        setNodes([]);
        setEdges([]);
        void props.loader(controller);
    }, [props.loader]);

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodeTypes={nodeTypes}
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

const TextFileNode = (props: { data: { path: string } }) => {
    const serverUrl = `http://localhost:7601`;

    const [fileContent, setFileContent] = useState(``);

    const loadFile = async () => {
        const response = await fetch(`${serverUrl}/load?path=${encodeURIComponent(props.data.path)}`);
        if (!response.ok) {
            console.error(`Failed to load file: ${response.status} ${response.statusText}`);
            return;
        }
        const fileContent = await response.text();
        console.log(`Loaded file content: ${fileContent}`);
        setFileContent(fileContent);
    };
    const saveFile = async () => {
        const response = await fetch(`${serverUrl}/save?path=${encodeURIComponent(props.data.path)}`, {
            method: `POST`,
            headers: {
                'Content-Type': `text/plain`,
            },
            body: fileContent,
        });
        if (!response.ok) {
            console.error(`Failed to save file: ${response.status} ${response.statusText}`);
        }
        console.log(`Saved file content.`);
    };

    useEffect(() => {
        void loadFile();
    }, [props.data.path]);

    return (
        <>
            <NodeResizer minWidth={100} minHeight={30} />
            <div className="w-full h-full p-2 bg-white border border-gray-400 rounded shadow-md">
                <div className="flex flex-row">
                    <div className="font-mono text-sm">{props.data.path}</div>
                    <button
                        className="px-2 py-1 ml-2 text-xs text-white bg-blue-500 rounded hover:opacity-80 active:opacity-70"
                        onClick={() => {
                            void saveFile();
                        }}
                    >
                        Save
                    </button>
                    <button
                        className="px-2 py-1 ml-2 text-xs text-white bg-green-500 rounded hover:opacity-80 active:opacity-70"
                        onClick={() => {
                            void loadFile();
                        }}
                    >
                        Reload
                    </button>
                </div>
                <div className="w-full h-full pb-8">
                    <textarea
                        className="w-full h-full resize-none nodrag nopan nowheel"
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        rows={10}
                    ></textarea>
                </div>
            </div>
        </>
    );
};

const nodeTypes: NodeTypes = {
    textFile: TextFileNode,
};
