import { useCallback, useEffect, useRef, useState } from 'react';
import { WorkflowEditorController, WorkflowNodeType, WorkflowObservable } from './types';
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
} from '@xyflow/react';
import { componentNodeType, registry, textFileNodeType, textNodeType } from './nodes';

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

        const addNode = <
            TArgs extends Record<string, unknown> & { id: string },
            TInputs extends Record<string, WorkflowObservable<unknown>>,
            TOutputs extends Record<string, WorkflowObservable<unknown>>,
        >(
            nodeType: WorkflowNodeType<TArgs, TInputs, TOutputs>,
            args: TArgs,
        ) => {
            console.log(`[addNode] adding ${nodeType.typeName}`, { nodeType, args });

            const m = metadataRef.current[args.id];
            const data = nodeType.load(args);

            setNodes((s) => [
                ...s,
                {
                    type: nodeType.typeName,
                    id: args.id,
                    position: {
                        x: m?.x ?? Math.random() * 400,
                        y: m?.y ?? Math.random() * 400,
                    },
                    width: m?.width ?? undefined,
                    height: m?.height ?? undefined,
                    data,
                },
            ]);

            Object.entries(data.inputs).map(([inputKey, inputValue]) => {
                const { nodeId, handleId } = inputValue.source ?? {};
                if (!nodeId || !handleId) return;
                if (nodeId === args.id) {
                    return;
                }

                setEdges((s) => [
                    ...s,
                    {
                        id: `${nodeId}-${args.id}-${inputKey}`,
                        source: nodeId,
                        sourceHandle: handleId,
                        target: args.id,
                        targetHandle: inputKey,
                        className: `opacity-30 hover:opacity-100`,
                    },
                ]);
            });

            console.log(`[addNode] added ${nodeType.typeName}`, { nodeType, args, data });
            return data.outputs;
        };

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
            addTextFileNode: (args) => addNode(textFileNodeType, { ...args, workflowServerUrl }),
            addTextNode: (args) => addNode(textNodeType, args as Required<typeof args>),
            addComponent: (args) => addNode(componentNodeType, args),
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

const nodeTypes: NodeTypes = {
    ...(Object.fromEntries(Object.entries(registry.nodeTypes).map(([k, x]) => [k, x.Component])) as NodeTypes),
    // text: TextNode,
    // textFile: TextFileNode,
    // component: ComponentNode,
};
