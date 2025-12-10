import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRegistry, WorkflowEditorController, WorkflowNodeType, WorkflowObservable } from './types';
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
    Handle,
    Position,
} from '@xyflow/react';
import { useObservable } from './use-observable';

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

const registry = createRegistry();

// const textFileNodeType = registry.registerNodeType({
//     typeName: `textFile`,
//     load: (args: { workflowServerUrl: WorkflowObservableLike<string>; path: WorkflowObservableLike<string> }) => {
//         return {
//             inputs: {
//                 workflowServerUrl: toObservable(args.workflowServerUrl),
//                 path: toObservable(args.path),
//             },
//             outputs: {},
//         };
//     },
//     Component: (props) => {
//         const workflowServerUrl = useObservable(props.data.inputs.workflowServerUrl);
//         const path = useObservable(props.data.inputs.path);

//         return (
//             <TextFileNode
//                 {...props}
//                 data={{
//                     workflowServerUrl,
//                     path,
//                 }}
//             />
//         );
//     },
// });

const textFileNodeType = registry.registerSimpleNodeType({
    typeName: `textFile`,
    defaults: {
        inputs: {
            workflowServerUrl: ``,
            path: ``,
        },
        outputs: {
            content: ``,
        },
    },
    execute: async (inputs: { workflowServerUrl: string; path: string }) => {
        const content = await loadFileText(inputs);
        return { content: content ?? `` };
    },
    Component: (props) => {
        const workflowServerUrl = useObservable(props.data.inputs.workflowServerUrl);
        const path = useObservable(props.data.inputs.path);
        return (
            <NodeWrapper {...props}>
                <TextFileNode
                    {...props}
                    data={{
                        workflowServerUrl,
                        path,
                    }}
                />
            </NodeWrapper>
        );
    },
});

const loadFileText = async (data: { workflowServerUrl: string; path: string }) => {
    const response = await fetch(`${data.workflowServerUrl}/load?path=${encodeURIComponent(data.path)}`);
    if (!response.ok) {
        console.error(`Failed to load file: ${response.status} ${response.statusText}`);
        return;
    }
    const fileContent = await response.text();
    console.log(`Loaded file content: ${fileContent}`);
    return fileContent;
};
const saveFileText = async (data: { workflowServerUrl: string; path: string }, fileContent: string) => {
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

const TextFileNode = ({ data }: { data: { workflowServerUrl: string; path: string } }) => {
    const [fileContent, setFileContent] = useState(``);

    const loadFile = async () => {
        const content = await loadFileText(data);
        if (!content) return;
        setFileContent(content);
    };

    const saveFile = async () => {
        await saveFileText(data, fileContent);
    };

    useEffect(() => {
        void loadFile();
    }, [data.workflowServerUrl, data.path]);

    return (
        <>
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

// const componentNodeType = registry.registerNodeType({
//     typeName: `component`,
//     load: (args: { path: WorkflowObservableLike<string>; exportName?: WorkflowObservableLike<string> }) => {
//         return {
//             inputs: {
//                 path: toObservable(args.path),
//                 exportName: toObservable(args.exportName),
//             },
//             outputs: {},
//         };
//     },
//     Component: (props) => {
//         const path = useObservable(props.data.inputs.path);
//         const exportName = useObservable(props.data.inputs.exportName);

//         return (
//             <ComponentNode
//                 {...props}
//                 data={{
//                     path,
//                     exportName,
//                 }}
//             />
//         );
//     },
// });

const componentNodeType = registry.registerSimpleNodeType({
    typeName: `component`,
    defaults: {
        inputs: {
            path: ``,
            exportName: undefined as undefined | string,
        },
        outputs: {},
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    execute: async (inputs: { path: string; exportName?: string }) => {
        return {};
    },
    Component: (props) => {
        const path = useObservable(props.data.inputs.path);
        const exportName = useObservable(props.data.inputs.exportName);
        return (
            <NodeWrapper {...props}>
                <ComponentNode
                    {...props}
                    data={{
                        path,
                        exportName,
                    }}
                />
            </NodeWrapper>
        );
    },
});

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
            <div className="w-full h-full bg-white border border-gray-400 rounded shadow-md">
                <div className="flex flex-row items-center bg-gray-200 border-b border-gray-800">
                    <div className="font-mono text-sm">{data.path}</div>
                    <div className="flex-grow" />
                    <button
                        className="self-stretch px-2 py-1 text-xs text-white bg-blue-500 hover:opacity-80 active:opacity-70"
                        onClick={() => {
                            reload();
                        }}
                    >
                        Reload
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

// const textNodeType = registry.registerNodeType({
//     typeName: `text`,
//     load: (args: {
//         content: WorkflowObservableLike<string>;
//         startAtLine?: WorkflowObservable<string>;
//         endAtLine?: WorkflowObservable<string>;
//     }) => {
//         // TODO: implement line range extraction
//         // const result = createObservable(args.value);

//         return {
//             inputs: {
//                 content: toObservable(args.content),
//             },
//             outputs: {
//                 content: toObservable(args.content),
//             },
//         };
//     },
//     Component: (props) => {
//         const content = useObservable(props.data.inputs.content);

//         return (
//             <TextNode
//                 {...props}
//                 data={{
//                     content,
//                 }}
//             />
//         );
//     },
// });

const textNodeType = registry.registerSimpleNodeType({
    typeName: `textSimple`,
    defaults: {
        inputs: {
            content: ``,
            startAtLine: undefined as undefined | string,
            endAtLine: undefined as undefined | string,
        },
        outputs: {
            content: ``,
        },
    },
    execute: async (inputs: { content: string; startAtLine: undefined | string; endAtLine: undefined | string }) => {
        console.log(`[textNodeType:execute] START`, { inputs });
        const startText = !inputs.startAtLine
            ? inputs.content
            : (() => {
                  const text = inputs.content;
                  const iStart = text.indexOf(`\n` + inputs.startAtLine);
                  if (iStart === -1) {
                      return text;
                  }
                  return text.substring(iStart);
              })();
        const result = !inputs.endAtLine
            ? startText
            : (() => {
                  const iEndLine = startText.indexOf(`\n` + inputs.endAtLine);
                  if (iEndLine === -1) {
                      return startText;
                  }
                  const iEndLineNewLine = startText.indexOf(`\n`, iEndLine + inputs.endAtLine.length);
                  if (iEndLineNewLine === -1) {
                      return startText.substring(0, startText.length);
                  }
                  return startText.substring(0, iEndLineNewLine);
              })();

        console.log(`[textNodeType:execute] DONE`, { inputs, result });
        return {
            content: result,
        };
    },
    Component: (props) => {
        const inputContent = useObservable(props.data.inputs.content);
        const startAtLine = useObservable(props.data.inputs.startAtLine);
        const endAtLine = useObservable(props.data.inputs.endAtLine);
        const outputContent = useObservable(props.data.outputs.content);

        return (
            <NodeWrapper {...props}>
                <TextNode
                    {...props}
                    data={{
                        startAtLine,
                        endAtLine,
                        content: outputContent ?? inputContent,
                        before: outputContent
                            ? inputContent.substring(0, inputContent.indexOf(outputContent))
                            : undefined,
                        after: outputContent
                            ? inputContent.substring(inputContent.indexOf(outputContent) + outputContent.length)
                            : undefined,
                    }}
                />
            </NodeWrapper>
        );
    },
});

const BASE_HANDLE_TOP_OFFSET_PX = 20;
const BASE_HANDLE_SIDE_OFFSET_PX = 6;
const HANDLE_VERTICAL_SPACING_PX = 25;

const NodeWrapper = ({
    children,
    id,
    data,
}: {
    children: React.ReactNode;
    id: string;
    data: {
        inputs: Record<string, WorkflowObservable<unknown>>;
        outputs: Record<string, WorkflowObservable<unknown>>;
    };
}) => {
    console.log(`[NodeWrapper] rendering node ${id}`, { data });
    return (
        <>
            <NodeResizer minWidth={100} minHeight={30} />
            {children}
            {Object.entries(data.inputs).map(([key, value], index) => (
                <Handle
                    key={key}
                    type="target"
                    position={Position.Left}
                    id={key}
                    style={{
                        width: `12px`,
                        height: `12px`,
                        ...(value.source?.nodeId && value.source.nodeId !== id
                            ? { background: `#44aa44`, borderColor: `#44aa44` }
                            : { background: `#777777`, borderColor: `#777777` }),
                        top: `${BASE_HANDLE_TOP_OFFSET_PX + index * HANDLE_VERTICAL_SPACING_PX}px`,
                        left: `-${BASE_HANDLE_SIDE_OFFSET_PX}px`,
                        borderTopRightRadius: `0px`,
                        borderBottomRightRadius: `0px`,
                    }}
                >
                    <div className="absolute right-0 opacity-0 hover:opacity-100">
                        <div className="relative p-1 text-xs border rounded pointer-events-none bg-slate-100 border-slate-400 bottom-2 right-4">
                            {key}
                        </div>
                    </div>
                </Handle>
            ))}
            {Object.entries(data.outputs).map(([key, value], index) => (
                <Handle
                    key={key}
                    type="source"
                    position={Position.Right}
                    id={key}
                    style={{
                        width: `12px`,
                        height: `12px`,
                        ...(value.hasSubscribers
                            ? { background: `#44aa44`, borderColor: `#44aa44` }
                            : { background: `#777777`, borderColor: `#777777` }),
                        top: `${BASE_HANDLE_TOP_OFFSET_PX + index * HANDLE_VERTICAL_SPACING_PX}px`,
                        right: `-${BASE_HANDLE_SIDE_OFFSET_PX}px`,
                        borderTopLeftRadius: `0px`,
                        borderBottomLeftRadius: `0px`,
                    }}
                >
                    <div className="absolute left-0 opacity-0 hover:opacity-100">
                        <div className="relative p-1 text-xs border rounded pointer-events-none bg-slate-100 border-slate-400 bottom-2 left-4">
                            {key}
                        </div>
                    </div>
                </Handle>
            ))}
        </>
    );
};

const TextNode = ({
    data,
}: {
    data: { content: string; before?: string; after?: string; startAtLine?: string; endAtLine?: string };
}) => {
    const isLong = data.content.split(`\n`).length > 2;

    useEffect(() => {
        if (!isLong) return;
        if (!scrollTargerRef.current) return;
        scrollTargerRef.current.scrollIntoView({ behavior: `instant` });
    }, [isLong, data.content]);
    const scrollTargerRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <div className="flex flex-col w-full h-full p-1 whitespace-pre-wrap bg-white border border-gray-400 rounded shadow-md">
                {isLong && (
                    <>
                        {data.startAtLine && (
                            <div className="flex flex-row items-center gap-1">
                                <input
                                    type="text"
                                    placeholder="Start At Line"
                                    value={data.startAtLine}
                                    readOnly
                                    className="flex-1 px-1 font-mono text-xs bg-gray-100 border border-gray-300 rounded nopan nodrag nowheel"
                                />
                            </div>
                        )}

                        <div className="overflow-auto nowheel">
                            {data.before && <div className="text-gray-400">{data.before}</div>}
                            <div ref={scrollTargerRef} className="">
                                {data.content}
                            </div>
                            {data.after && <div className="text-gray-400">{data.after}</div>}
                        </div>
                        {data.endAtLine && (
                            <div className="flex flex-row items-center gap-1">
                                <input
                                    type="text"
                                    placeholder="End At Line"
                                    value={data.endAtLine}
                                    readOnly
                                    className="flex-1 px-1 font-mono text-xs bg-gray-100 border border-gray-300 rounded nopan nodrag nowheel"
                                />
                            </div>
                        )}
                    </>
                )}
                {!isLong && (
                    <>
                        <div className="flex flex-col items-center justify-center">{data.content}</div>
                    </>
                )}
            </div>
        </>
    );
};

const nodeTypes: NodeTypes = {
    ...(Object.fromEntries(Object.entries(registry.nodeTypes).map(([k, x]) => [k, x.Component])) as NodeTypes),
    // text: TextNode,
    // textFile: TextFileNode,
    // component: ComponentNode,
};
