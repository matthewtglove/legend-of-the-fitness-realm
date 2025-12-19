import { useCallback, useEffect, useRef, useState } from 'react';
import {
    WorkflowDocument,
    WorkflowEditorController,
    WorkflowNodeInstance,
    WorkflowNodeType,
    WorkflowObservable,
} from './types';
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
    OnConnectStartParams,
    useReactFlow,
    XYPosition,
    ReactFlowProvider,
} from '@xyflow/react';
import { registry } from './nodes';
import { loadWorkflowDocument } from './loader';
import { NodeSelectionMenu } from './node-selection-menu';

export const WorkflowEditorView = (props: {
    loader: undefined | ((controller: WorkflowEditorController, abortController: AbortController) => Promise<void>);
}) => {
    return (
        <div className="w-full h-full bg-lime-300">
            <ReactFlowProvider>
                <ReactFlowView loader={props.loader} />
            </ReactFlowProvider>
        </div>
    );
};

type NodeType = Node;
type EdgeType = Edge;

const initialNodes = [
    // { id: `n1`, position: { x: 0, y: 0 }, data: { label: `Node 1` } },
    // { id: `n2`, position: { x: 0, y: 100 }, data: { label: `Node 2` } },
] as (Node & { _stale?: boolean })[];
const initialEdges = [
    // { id: `n1-n2`, source: `n1`, target: `n2` }
] as (Edge & { _stale?: boolean })[];

const ReactFlowView = (props: {
    loader: undefined | ((controller: WorkflowEditorController, abortController: AbortController) => Promise<void>);
}) => {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const nodesRef = useRef(nodes);
    nodesRef.current = nodes;
    const edgesRef = useRef(edges);
    edgesRef.current = edges;

    const onNodesChange: OnNodesChange<NodeType> = useCallback((changes) => {
        console.log(`onNodesChange`, changes);

        const removeChanges = changes.filter((c) => c.type === `remove`);
        for (const change of removeChanges) {
            const nodeId = change.id;
            const doc = workflowDocumentRef.current;
            const nodeToRemove = nodesRef.current.find((n) => n.id === nodeId);
            if (!nodeToRemove) {
                console.warn(`[onNodesChange]  Node to remove not found: ${nodeId}`);
                continue;
            }

            doc.nodes = doc.nodes.filter((n) => n.id !== nodeId);

            // also remove edges that use this node
            doc.nodes.forEach((n) => {
                const brokenEdges = (n.inputEdges ?? []).filter((ie) => ie.fromNodeId === nodeId);
                if (!brokenEdges.length) return;

                n.inputEdges = (n.inputEdges ?? []).filter((ie) => ie.fromNodeId !== nodeId);
                n.inputLiterals = [
                    ...(n.inputLiterals ?? []),
                    ...brokenEdges.map((be) => ({
                        inputName: be.inputName,
                        value: (nodeToRemove.data as { outputs: Record<string, WorkflowObservable<unknown>> })
                            .outputs?.[be.fromOutputName]?.lastValue as string,
                    })),
                ];
            });

            saveWorkflowDocumentFile_debounced();

            const allNodeIds = new Set(doc.nodes.map((n) => n.id));
            metadataRef.current = Object.fromEntries(
                Object.entries(metadataRef.current).filter(([k]) => allNodeIds.has(k)),
            );
            saveNodeMetadata_debounced();
        }

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

        for (const change of changes) {
            if (change.type === `remove`) {
                // update node input's WorkflowObservable source
                const doc = workflowDocumentRef.current;
                const [fromNodeId, fromOutputName, toNodeId, toInputName] = change.id.split(`::`);
                if (!fromNodeId || !fromOutputName || !toNodeId || !toInputName) {
                    console.warn(`[onEdgesChange]  Invalid edge id format: ${change.id}`);
                    continue;
                }

                const targetNode = doc.nodes.find((n) => n.id === toNodeId);
                if (!targetNode) {
                    console.warn(`[onEdgesChange]  Target node not found: ${toNodeId}`);
                    continue;
                }
                const originalInputEdges = [...(targetNode.inputEdges ?? [])];
                targetNode.inputEdges = (targetNode.inputEdges ?? []).filter((x) => !(x.inputName === toInputName));
                const lastValueObj = (
                    nodes.find((n) => n.id === toNodeId)?.data as { inputs: Record<string, { lastValue: unknown }> }
                )?.inputs?.[toInputName] ?? { lastValue: undefined };

                targetNode.inputLiterals = [
                    ...(targetNode.inputLiterals ?? []),
                    {
                        inputName: toInputName,
                        value: lastValueObj.lastValue as string,
                    },
                ];
                console.log(`[onEdgesChange]  Updated workflow document:`, {
                    doc: workflowDocumentRef.current,
                    originalInputEdges,
                });
                saveWorkflowDocumentFile_debounced();
                setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot));
                continue;
            }
        }

        setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot));
    }, []);
    const onConnect: OnConnect = useCallback((params) => {
        console.log(`[onConnect]`, params);

        // update node input's WorkflowObservable source
        const doc = workflowDocumentRef.current;
        const targetNode = doc.nodes.find((n) => n.id === params.target);
        if (!targetNode) {
            console.warn(`[onConnect]  Target node not found: ${params.target}`);
            return;
        }

        const { sourceHandle: fromOutputName, source: fromNodeId, targetHandle: inputName } = params;
        if (!fromOutputName || !fromNodeId || !inputName) {
            console.warn(`[onConnect]  Missing connection parameters:`, { fromOutputName, fromNodeId, inputName });
            return;
        }

        const originalInputEdges = [...(targetNode.inputEdges ?? [])];
        targetNode.inputEdges = [
            ...(targetNode.inputEdges ?? []).filter((x) => x.inputName !== inputName),
            {
                inputName,
                fromNodeId,
                fromOutputName,
            },
        ];

        // solve node dependency order
        const solveNodeOrders = () => {
            const nodeOrders = doc.nodes.map((x, i) => ({
                node: x,
                order: i * 1000000,
                originalOrder: i,
                dependencies: undefined as
                    | undefined
                    | {
                          node: (typeof doc.nodes)[0];
                          order: number;
                      }[],
            }));
            nodeOrders.forEach((nOrder) => {
                const inputEdges = nOrder.node.inputEdges;
                if (!inputEdges?.length) {
                    return;
                }
                nOrder.dependencies = inputEdges.map((ie) => {
                    const depNode = nodeOrders.find((x) => x.node.id === ie.fromNodeId);
                    if (!depNode) {
                        throw new Error(
                            `[onConnect:solveNodeOrders] Input edge references unknown node id: ${ie.fromNodeId}`,
                        );
                    }
                    return depNode;
                });
            });

            const calculateOrderBelowDependencies = (
                nOrder: (typeof nodeOrders)[0],
                visited: Set<(typeof nodeOrders)[0]>,
            ): number => {
                if (visited.has(nOrder)) {
                    return nOrder.order;
                }
                visited.add(nOrder);
                if (!nOrder.dependencies?.length) {
                    return nOrder.order;
                }

                const childOrders = nOrder.dependencies.map((dep) => {
                    return calculateOrderBelowDependencies(nodeOrders.find((x) => x.node.id === dep.node.id)!, visited);
                });
                const maxDepOrder = childOrders.length > 0 ? Math.max(...childOrders) : 0;
                nOrder.order = maxDepOrder + 1;
                return nOrder.order;
            };
            for (const no of nodeOrders) {
                calculateOrderBelowDependencies(no, new Set());
            }

            const areDependenciesValid = nodeOrders.every((nOrder) => {
                if (!nOrder.dependencies?.length) {
                    return true;
                }
                return nOrder.dependencies.every((dep) => {
                    const depNodeOrder = nodeOrders.find((x) => x.node.id === dep.node.id);
                    if (!depNodeOrder) {
                        throw new Error(`[onConnect:solveNodeOrders] Dependency node not found: ${dep.node.id}`);
                    }
                    return depNodeOrder.order < nOrder.order;
                });
            });
            if (!areDependenciesValid) {
                console.warn(`[onConnect:solveNodeOrders]  Circular dependency detected in node orders:`, {
                    nodeOrders,
                });
                return false;
            }

            const nodesSorted = [...nodeOrders].sort((a, b) => {
                if (a.order === b.order) {
                    return a.originalOrder - b.originalOrder;
                }
                return a.order - b.order;
            });

            console.log(`[onConnect:solveNodeOrders]  Node order after calculation:`, {
                nodesSorted,
                nodesBefore: doc.nodes,
            });
            doc.nodes = nodesSorted.map((x) => x.node);

            return true;
        };
        if (!solveNodeOrders()) {
            // revert on failure
            targetNode.inputEdges = originalInputEdges;
            console.log(`[onConnect]  Reverted workflow document changes:`, { doc: workflowDocumentRef.current });
            return;
        }

        targetNode.inputLiterals = targetNode.inputLiterals?.filter((x) => x.inputName !== inputName);
        console.log(`[onConnect]  Updated workflow document:`, { doc: workflowDocumentRef.current });

        saveWorkflowDocumentFile_debounced();
        setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot));
    }, []);

    const [workflowServerUrl, setWorkflowServerUrl] = useState(`http://localhost:7601`);
    const [workflowMetadataPath, setWorkflowMetadataPath] = useState(`workflow/lofr-workflow/workflow.metadata.json`);
    const [workflowDocumentPath, setWorkflowDocumentPath] = useState(`workflow/lofr-workflow/workflow.document.json`);
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
    const workflowDocumentRef = useRef({} as WorkflowDocument);

    const saveNodeMetadata_debounced_ref = useRef(0 as unknown as ReturnType<typeof setTimeout>);
    const saveNodeMetadata_debounced = async () => {
        clearTimeout(saveNodeMetadata_debounced_ref.current);
        saveNodeMetadata_debounced_ref.current = setTimeout(async () => {
            await saveMetadata(workflowServerUrl, workflowMetadataPath, metadataRef.current);
        }, 250);
    };

    const [reloadDocumentId, setReloadDocumentId] = useState(0);
    const saveWorkflowDocumentFile_debounced_ref = useRef(0 as unknown as ReturnType<typeof setTimeout>);
    const saveWorkflowDocumentFile_debounced = async () => {
        clearTimeout(saveWorkflowDocumentFile_debounced_ref.current);
        saveWorkflowDocumentFile_debounced_ref.current = setTimeout(async () => {
            await saveWorkflowDocumentFile(workflowServerUrl, workflowDocumentPath, workflowDocumentRef.current);
            setReloadDocumentId((s) => s + 1);
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
            argsRaw: TArgs,
        ) => {
            const args = { ...argsRaw, workflowServerUrl };
            console.log(`[addNode] adding ${args.id}: ${nodeType.typeName}`, { nodeType, args });

            const m = metadataRef.current[args.id];

            const existingNode = nodesRef.current.find((x) => x.id === args.id) as
                | undefined
                | (Node & {
                      data: WorkflowNodeInstance<TInputs, TOutputs>;
                      _stale?: boolean;
                  });
            const existingNodeInstance = existingNode?.data as undefined | WorkflowNodeInstance<TInputs, TOutputs>;
            // if (existingNode && existingNodeInstance) {
            //     console.log(`[addNode] node already exists: ${args.id}`, { existingNode: existingNodeInstance });
            //     const result = existingNodeInstance.update(args);

            //     // existingNode._stale = false;

            //     // // update inputs

            //     // // edgesRef.current.filter(x=>x.source===)

            //     // return existingNodeInstance.outputs;
            // }

            const data = existingNodeInstance ? existingNodeInstance.update(args) : nodeType.load(args);
            // const data = {
            //     inputs: { ...dataRaw.inputs, ...((args as { defaults?: typeof dataRaw }).defaults?.inputs ?? {}) },
            //     outputs: { ...dataRaw.outputs, ...((args as { defaults?: typeof dataRaw }).defaults?.outputs ?? {}) },
            // };

            setNodes((s) => {
                const old = s.find((x) => x.id === args.id);

                const newValue = {
                    type: nodeType.typeName,
                    id: args.id,
                    position: {
                        x: m?.x ?? Math.random() * 400,
                        y: m?.y ?? Math.random() * 400,
                    },
                    width: m?.width ?? undefined,
                    height: m?.height ?? undefined,
                    data,
                    // reset stale marker
                    _stale: false,
                };

                if (old) {
                    return s.map((x) => {
                        if (x.id === old.id) {
                            return {
                                ...x,
                                ...newValue,
                            };
                        }
                        return x;
                    });
                }

                return [...s, newValue];
            });

            Object.entries(data.inputs).map(([inputKey, inputValue]) => {
                const { nodeId, handleId } = inputValue.source ?? {};
                if (!nodeId || !handleId) return;
                if (nodeId === args.id) {
                    return;
                }

                const edgeId = `${nodeId}::${handleId}::${args.id}::${inputKey}`;
                setEdges((s) => {
                    const old = s.find((x) => x.id === edgeId);

                    const newValue = {
                        id: edgeId,
                        source: nodeId,
                        sourceHandle: handleId,
                        target: args.id,
                        targetHandle: inputKey,
                        className: `opacity-50 hover:opacity-100`,
                        // reset stale marker
                        _stale: false,
                    };

                    if (old) {
                        return s.map((x) => {
                            if (x.id === old.id) {
                                return {
                                    ...x,
                                    ...newValue,
                                };
                            }
                            return x;
                        });
                    }

                    return [...s, newValue];
                });
            });

            console.log(`[addNode] added ${nodeType.typeName}`, { nodeType, args, data });
            return data;
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
            setWorkflowDocumentPath: async (path: string) => {
                console.log(`Setting workflow document path to: ${path}`);
                setWorkflowDocumentPath(path);

                const loadedDocument = await loadWorkflowDocumentFile(workflowServerUrl, path);
                if (!loadedDocument) {
                    console.warn(`No existing metadata found.`);
                    return;
                }

                workflowDocumentRef.current = loadedDocument;
                console.log(`Workflow document loaded:`, workflowDocumentRef.current);

                await loadWorkflowDocument({
                    document: workflowDocumentRef.current,
                    workflowEditorController: controller,
                    abortController: new AbortController(),
                    onSaveInputLiteral: ({ nodeId, inputName, value }) => {
                        const doc = workflowDocumentRef.current;
                        const targetNode = doc.nodes.find((n) => n.id === nodeId);
                        if (!targetNode) {
                            console.warn(`[onSaveInputLiteral]  Target node not found: ${nodeId}`);
                            return;
                        }
                        targetNode.inputLiterals = [
                            ...(targetNode.inputLiterals ?? []).filter((x) => x.inputName !== inputName),
                            {
                                inputName,
                                value,
                            },
                        ];
                        saveWorkflowDocumentFile_debounced();
                    },
                });
            },
            addNode: (typeName, args) => {
                const nodeType = registry.nodeTypes[typeName];
                if (!nodeType) {
                    throw new Error(`Unknown node type: ${typeName}`);
                }
                return addNode(nodeType, args);
            },
            // addTextFileNode: (args) => addNode(textFileNodeType, { ...args, workflowServerUrl }),
            // addTextNode: (args) => addNode(textNodeType, args as Required<typeof args>),
            // addNumberNode: (args) => addNode(numberNodeType, args as Required<typeof args>),
            // addComponent: (args) => addNode(componentNodeType, args as Required<typeof args>),
        };
        // setNodes([]);
        // setEdges([]);
        const abortController = new AbortController();
        const reload = async () => {
            if (!props.loader) return;

            setNodes((s) => s.map((x) => ({ ...x, _stale: true })));
            setEdges((s) => s.map((x) => ({ ...x, _stale: true })));

            await props.loader(controller, abortController);
            if (abortController.signal.aborted) return;

            setNodes((s) => s.filter((x) => !x._stale).map((x) => ({ ...x, _stale: undefined })));
            setEdges((s) => s.filter((x) => !x._stale).map((x) => ({ ...x, _stale: undefined })));
        };

        reload();
        return () => {
            abortController.abort();
        };
    }, [props.loader, workflowServerUrl, reloadDocumentId]);

    type MenuContext = { type: `pane` } | { type: `connection`; params: OnConnectStartParams };
    const [menu, setMenu] = useState<{ x: number; y: number; context: MenuContext; timestamp: number } | null>(null);
    const lastClickRef = useRef<{ time: number; x: number; y: number } | null>(null);
    const { screenToFlowPosition } = useReactFlow();
    const addNodeToWorkflow = useCallback(
        async (typeName: string, position: XYPosition, connectionParams?: OnConnectStartParams) => {
            const nodeType = registry.nodeTypes[typeName];
            if (!nodeType) {
                throw new Error(`Unknown node type: ${typeName}`);
            }
            const doc = workflowDocumentRef.current;
            const newId = `n-${typeName}-${Date.now()}`;

            const inputEdge = (() => {
                const { nodeId, handleId } = connectionParams ?? {};
                if (!nodeId || !handleId) return;

                const targetInputName =
                    Object.entries(nodeType.defaults.inputs).find(([k]) => k === connectionParams?.handleId)?.[0] ??
                    Object.keys(nodeType.defaults.inputs)[0];

                if (!targetInputName) {
                    console.warn(`[addNode]  Target input not found: ${handleId} on node type: ${typeName}`);
                    return;
                }

                return {
                    inputName: targetInputName,
                    fromNodeId: nodeId,
                    fromOutputName: handleId,
                };
            })();

            doc.nodes.push({
                id: newId,
                typeName: typeName,
                inputEdges: !inputEdge ? undefined : [inputEdge],
            });
            metadataRef.current[newId] = {
                x: position.x,
                y: position.y,
            };

            await saveMetadata(workflowServerUrl, workflowMetadataPath, metadataRef.current);
            await saveWorkflowDocumentFile(workflowServerUrl, workflowDocumentPath, workflowDocumentRef.current);
            setReloadDocumentId((s) => s + 1);
        },
        [],
    );

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
                deleteKeyCode={[`Delete`]}
                onConnectStart={(_e, params) => {
                    console.log(`onConnectStart`, params);
                }}
                onConnectEnd={(e, connectionState) => {
                    const { fromNode, fromHandle, toNode, toHandle } = connectionState;
                    const { x, y } = e as MouseEvent;

                    console.log(`onConnectEnd`, {
                        x,
                        y,
                        fromNode,
                        fromHandle,
                        toNode,
                        toHandle,
                        connectionState,
                        e,
                    });

                    if (!toNode && fromHandle?.nodeId && fromHandle?.id) {
                        const { x, y } = e as MouseEvent;
                        console.log(`  Opening node selection menu at connection end point`, {
                            x,
                            y,
                            fromNode,
                            fromHandle,
                        });
                        setMenu({
                            timestamp: Date.now(),
                            x,
                            y,
                            context: {
                                type: `connection`,
                                params: {
                                    nodeId: fromHandle.nodeId,
                                    handleId: fromHandle.id,
                                    handleType: fromHandle.type,
                                },
                            },
                        });
                    }
                }}
                zoomOnDoubleClick={false}
                onPaneClick={(e) => {
                    console.log(`onPaneClick`, { e });
                    if (menu && Date.now() > menu.timestamp + 500) {
                        setMenu(null);
                        return;
                    }

                    const now = Date.now();

                    if (lastClickRef.current && now - lastClickRef.current.time < 300) {
                        console.log(`Double click detected, opening node selection menu`, {
                            x: e.clientX,
                            y: e.clientY,
                        });
                        setMenu({
                            timestamp: Date.now(),
                            x: e.clientX,
                            y: e.clientY,
                            context: { type: `pane` },
                        });
                        lastClickRef.current = null;
                    } else {
                        lastClickRef.current = { time: now, x: e.clientX, y: e.clientY };
                    }
                }}
            >
                <MiniMap nodeStrokeWidth={3} />
            </ReactFlow>
            {menu && (
                <NodeSelectionMenu
                    registry={registry}
                    position={menu}
                    onSelect={(def) => {
                        const position = screenToFlowPosition({ x: menu.x, y: menu.y });

                        if (menu.context.type === `connection`) {
                            addNodeToWorkflow(def.typeName, position, menu.context.params);
                        } else {
                            addNodeToWorkflow(def.typeName, position);
                        }

                        setMenu(null);
                    }}
                    onClose={() => setMenu(null)}
                />
            )}
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

const loadWorkflowDocumentFile = async (workflowServerUrl: string, workflowDocumentPath: string) => {
    const response = await fetch(`${workflowServerUrl}/load?path=${encodeURIComponent(workflowDocumentPath)}`);
    if (!response.ok) {
        console.error(`Failed to load workflow metadata: ${response.status} ${response.statusText}`);
        return undefined;
    }
    const doc = await response.json();
    console.log(`Loaded workflow metadata:`, doc);
    return doc as WorkflowDocument;
};
const saveWorkflowDocumentFile = async (
    workflowServerUrl: string,
    workflowDocumentPath: string,
    doc: WorkflowDocument,
) => {
    const response = await fetch(`${workflowServerUrl}/save?path=${encodeURIComponent(workflowDocumentPath)}`, {
        method: `POST`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify(doc, null, 2),
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
