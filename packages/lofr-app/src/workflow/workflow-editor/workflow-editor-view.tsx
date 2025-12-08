import React, { useCallback, useEffect, useRef, useState } from 'react';
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

    const onNodesChange: OnNodesChange<NodeType> = useCallback((changes) => {
        console.log(`onNodesChange`, changes);

        const posChanges = changes.filter((c) => c.type === `position` || c.type === `dimensions`);
        if (posChanges.length > 0) {
            metadataRef.current = {
                ...metadataRef.current,
                ...Object.fromEntries(
                    posChanges.map((c) => {
                        const n = metadataRef.current[c.id];
                        const cPosDim = c as {
                            position?: {
                                x?: number;
                                y?: number;
                            };
                            dimensions?: {
                                width?: number;
                                height?: number;
                            };
                        };
                        return [
                            c.id,
                            {
                                x: cPosDim.position?.x ?? n?.x ?? undefined,
                                y: cPosDim.position?.y ?? n?.y ?? undefined,
                                width: cPosDim.dimensions?.width ?? n?.width ?? undefined,
                                height: cPosDim.dimensions?.height ?? n?.height ?? undefined,
                            },
                        ];
                    }),
                ),
            };

            console.log(`  Position/Dimension changes:`, { metadataRef: metadataRef.current, posChanges });
            saveNodeMetadata_debounced();
        }

        setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot));
    }, []);
    const onEdgesChange: OnEdgesChange<EdgeType> = useCallback((changes) => {
        console.log(`onEdgesChange`, changes);
        setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot));
    }, []);
    const onConnect: OnConnect = useCallback((params) => {
        console.log(`onConnect`, params);
        setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot));
    }, []);

    const [workflowServerUrl, setWorkflowServerUrl] = useState(`http://localhost:7601`);
    const [workflowMetadataPath, setWorkflowMetadataPath] = useState(`workflow/lofr-workflow/workflow.metadata.json`);
    const metadataRef = useRef(
        {} as {
            [id: string]: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
        },
    );

    const saveNodeMetadata_debounced_ref = useRef(0 as unknown as ReturnType<typeof setTimeout>);
    const saveNodeMetadata_debounced = async () => {
        clearTimeout(saveNodeMetadata_debounced_ref.current);
        saveNodeMetadata_debounced_ref.current = setTimeout(async () => {
            await saveMetadata(workflowServerUrl, workflowMetadataPath, metadataRef.current);
        }, 250);
    };

    useEffect(() => {
        if (!props.loader) return;

        const controller: WorkflowEditorController = {
            setWorkflowServerUrl: (url: string) => {
                console.log(`Setting workflow server URL to: ${url}`);
                setWorkflowServerUrl(url);
            },
            setWorkflowMetadataPath: async (path: string) => {
                console.log(`Setting workflow metadata path to: ${path}`);
                setWorkflowMetadataPath(path);

                const loadedMetadata = await loadMetadata(workflowServerUrl, path);
                if (!loadedMetadata) {
                    console.warn(`No existing metadata found.`);
                    return;
                }

                metadataRef.current = loadedMetadata as typeof metadataRef.current;
                console.log(`Workflow metadata loaded:`, metadataRef.current);
            },
            addTextFileNode: ({ id, path }: { id: string; path: string }) => {
                console.log(`Adding text file node for path: ${path}`);

                const m = metadataRef.current[id];

                setNodes((s) => [
                    ...s,
                    {
                        type: `textFile`,
                        id,
                        position: {
                            x: m?.x ?? Math.random() * 400,
                            y: m?.y ?? Math.random() * 400,
                        },
                        width: m?.width ?? undefined,
                        height: m?.height ?? undefined,
                        data: { workflowServerUrl, path },
                    },
                ]);
            },
            addTextConstantNode: ({ id, content }: { id: string; content: string }) => {
                console.log(`Adding text constant node with content: ${content}`);
                const m = metadataRef.current[id];

                setNodes((s) => [
                    ...s,
                    {
                        id,
                        position: {
                            x: m?.x ?? Math.random() * 400,
                            y: m?.y ?? Math.random() * 400,
                        },
                        width: m?.width ?? undefined,
                        height: m?.height ?? undefined,
                        data: { label: `Constant: ${content.slice(0, 20)}...` },
                    },
                ]);
            },
            addComponent: ({ id, path, exportName }: { id: string; path: string; exportName?: string }) => {
                console.log(`Adding text file node for path: ${path}`);

                const m = metadataRef.current[id];

                setNodes((s) => [
                    ...s,
                    {
                        type: `component`,
                        id,
                        position: {
                            x: m?.x ?? Math.random() * 400,
                            y: m?.y ?? Math.random() * 400,
                        },
                        width: m?.width ?? undefined,
                        height: m?.height ?? undefined,
                        data: { path, exportName },
                    },
                ]);
            },
        };
        setNodes([]);
        setEdges([]);
        void props.loader(controller);
    }, [props.loader, workflowServerUrl]);

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
                minZoom={0.1}
            >
                <MiniMap nodeStrokeWidth={3} />
            </ReactFlow>
        </div>
    );
};

const loadMetadata = async (workflowServerUrl: string, workflowMetadataPath: string) => {
    const response = await fetch(`${workflowServerUrl}/load?path=${encodeURIComponent(workflowMetadataPath)}`);
    if (!response.ok) {
        console.error(`Failed to load workflow metadata: ${response.status} ${response.statusText}`);
        return undefined;
    }
    const metadata = await response.json();
    console.log(`Loaded workflow metadata:`, metadata);
    return metadata as Record<string, unknown>;
};
const saveMetadata = async (
    workflowServerUrl: string,
    workflowMetadataPath: string,
    metadata: Record<string, unknown>,
) => {
    const response = await fetch(`${workflowServerUrl}/save?path=${encodeURIComponent(workflowMetadataPath)}`, {
        method: `POST`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify(metadata, null, 2),
    });
    if (!response.ok) {
        console.error(`Failed to save workflow metadata: ${response.status} ${response.statusText}`);
        return;
    }
    console.log(`Saved workflow metadata.`);
};

const TextFileNode = ({ data }: { data: { workflowServerUrl: string; path: string } }) => {
    const [fileContent, setFileContent] = useState(``);

    const loadFile = async () => {
        const response = await fetch(`${data.workflowServerUrl}/load?path=${encodeURIComponent(data.path)}`);
        if (!response.ok) {
            console.error(`Failed to load file: ${response.status} ${response.statusText}`);
            return;
        }
        const fileContent = await response.text();
        console.log(`Loaded file content: ${fileContent}`);
        setFileContent(fileContent);
    };
    const saveFile = async () => {
        const response = await fetch(`${data.workflowServerUrl}/save?path=${encodeURIComponent(data.path)}`, {
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
    }, [data.workflowServerUrl, data.path]);

    return (
        <>
            <NodeResizer minWidth={100} minHeight={30} />
            <div className="w-full h-full p-2 bg-white border border-gray-400 rounded shadow-md">
                <div className="flex flex-row">
                    <div className="font-mono text-sm">{data.path}</div>
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

const ComponentNode = ({ data }: { data: { path: string; exportName?: string } }) => {
    const [reloadId, setReloadId] = useState(0);
    const reload = () => {
        setReloadId((id) => id + 1);
    };

    // lazy load react component from path
    const [component, setComponent] = useState({ Component: (() => null) as React.ComponentType });
    useEffect(() => {
        setComponent({
            Component: React.lazy(() =>
                import(data.path).then((mod) => ({
                    default: mod[data.exportName ?? `default`] ?? mod.default,
                })),
            ),
        });
    }, [data.path, reloadId]);

    return (
        <>
            <NodeResizer minWidth={100} minHeight={30} />
            <div className="w-full h-full bg-white border border-gray-400 rounded shadow-md">
                <div className="flex flex-row p-1 bg-gray-200 border-b border-gray-800">
                    <div className="font-mono text-sm">{data.path}</div>
                    <button
                        className="px-2 py-1 mt-2 text-xs text-white bg-blue-500 rounded hover:opacity-80 active:opacity-70"
                        onClick={() => {
                            reload();
                        }}
                    >
                        Reload Component
                    </button>
                </div>
                <div className="nodrag nopan nowheel">
                    <React.Suspense fallback={<div>Loading...</div>}>
                        <component.Component />
                    </React.Suspense>
                </div>
            </div>
        </>
    );
};

const nodeTypes: NodeTypes = {
    textFile: TextFileNode,
    component: ComponentNode,
};
