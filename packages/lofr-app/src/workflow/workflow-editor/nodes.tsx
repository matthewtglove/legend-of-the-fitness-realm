import React, { useEffect, useRef, useState } from 'react';
import {
    createRegistry,
    WorkflowNodeTypeUnknown,
    WorkflowObservable,
    WorkflowRegistry,
    WorkflowSubject,
} from './types';
import '@xyflow/react/dist/style.css';
import { NodeResizer, Handle, Position } from '@xyflow/react';
import { useObservable, useObservableRecord } from './use-observable';
import { TextCodeEditorComponent } from './code-editor/text-code-editor-main';
import { WorkflowDocumentFormat } from './document';

const debug = false;

export const registry = createRegistry();

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
        typeName: string;
        refresh: () => void;
        inputs: Record<string, WorkflowObservable<unknown>>;
        outputs: Record<string, WorkflowObservable<unknown>>;
    };
}) => {
    console.log(`[NodeWrapper] rendering node ${id}`, { data });

    const handleDisplayNameChange = (value: string) => {
        console.log(`[NodeWrapper] handleDisplayNameChange`, { value });
    };

    const handleDeleteNode = () => {
        console.log(`[NodeWrapper] handleDeleteNode`, { id });
    };

    const displayName = id;

    const [expandInfo, setExpandInfo] = useState(false as false | `data` | `document`);

    return (
        <>
            <NodeResizer minWidth={100} minHeight={30} />
            <div className="absolute top-0 left-0 right-0 z-10 h-0">
                <div className="absolute bottom-0 left-0 right-0 ">
                    {expandInfo && (
                        <div className="absolute top-0 left-0 right-0 h-0 scale-50">
                            <div
                                className="absolute bottom-10 flex min-h-[600px] flex-col justify-end gap-1"
                                style={{ width: `200%`, marginLeft: `-50%` }}
                            >
                                <div className="flex flex-col flex-1 p-1 text-xs bg-blue-200 border border-blue-800 rounded nowheel nodrag nopan">
                                    <div className="flex flex-row items-center justify-between gap-1 p-0.5">
                                        <div>{id}</div>
                                        <div>{data.typeName}</div>
                                        <div
                                            className={`flex h-4 w-4 cursor-pointer flex-row items-center justify-center ${
                                                `` //`rounded border border-white p-1 text-white`
                                            } ${
                                                `` //expandInfo ? `bg-blue-800` : `bg-blue-400`
                                            }`}
                                            onClick={() => {
                                                setExpandInfo(false);
                                            }}
                                        >
                                            ✖
                                        </div>
                                    </div>
                                    <textarea
                                        className="min-h-[200px] flex-1 resize-none bg-white p-1"
                                        value={JSON.stringify(
                                            expandInfo === `data`
                                                ? data
                                                : WorkflowDocumentFormat.nodeToDocument(registry, {
                                                      id,
                                                      typeName: data.typeName,
                                                      data,
                                                  }),
                                            null,
                                            2,
                                        )}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-row items-center gap-1 p-1 rounded-t opacity-0 hover:opacity-100 bg-slate-500/25">
                        <div className="">{`🔷`}</div>
                        <div className="flex flex-row items-center flex-1 min-w-0 gap-1 nowheel nodrag nopan ">
                            <input
                                type="text"
                                className={`min-w-0 flex-1 font-bold`}
                                // className={`mb-1 flex-1 overflow-hidden border-none font-bold bg-transparent overflow-ellipsis focus:outline-none`}
                                title={`${displayName}: ${data.typeName}`}
                                value={displayName}
                                onChange={(x) => handleDisplayNameChange(x.target.value)}
                            />
                            {data.refresh && (
                                <div
                                    className={`flex h-4 w-4 cursor-pointer flex-row items-center justify-center rounded border border-white p-1 text-white`}
                                    onClick={() => data.refresh()}
                                >
                                    {`▶️`}
                                </div>
                            )}
                            <div
                                className={`flex h-4 w-4 cursor-help flex-row items-center justify-center rounded border border-white p-1 text-white`}
                                onClick={() => {
                                    setExpandInfo((s) => (s === `data` ? false : `data`));
                                    console.log(`nodeData ${id}`, data);
                                }}
                            >
                                {`🔎`}
                            </div>
                            <div
                                className={`flex h-4 w-4 cursor-help flex-row items-center justify-center rounded border border-white p-1 text-white ${
                                    expandInfo ? `bg-blue-800` : `bg-blue-400`
                                }`}
                                onClick={() => setExpandInfo((s) => (s === `document` ? false : `document`))}
                            >
                                {`ℹ`}
                            </div>
                            <div
                                className={`flex h-4 w-4 cursor-pointer flex-row items-center justify-center rounded border border-white bg-red-400 p-1 text-white`}
                                onClick={handleDeleteNode}
                            >
                                {`🗑️`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {children}
            {Object.entries(data.inputs).map(([key, value], index) => (
                <React.Fragment key={key}>
                    {debug && (
                        <div
                            className="absolute top-0 left-0 p-1 text-xs text-white bg-black rounded opacity-90"
                            style={{
                                top: `${BASE_HANDLE_TOP_OFFSET_PX + index * HANDLE_VERTICAL_SPACING_PX}px`,
                                left: `-${BASE_HANDLE_SIDE_OFFSET_PX + 40}px`,
                            }}
                        >
                            in {key} {value.id}: {JSON.stringify(value.lastValue)?.substring(0, 100)}
                        </div>
                    )}
                    <Handle
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
                        // className="hover:top-0"
                    >
                        <div className="absolute right-0 opacity-0 hover:opacity-100">
                            <div className="relative p-1 text-xs border rounded pointer-events-none bg-slate-100 border-slate-400 bottom-2 right-4">
                                {key}
                            </div>
                        </div>
                    </Handle>
                </React.Fragment>
            ))}
            {Object.entries(data.outputs).map(([key, value], index) => (
                <React.Fragment key={key}>
                    {debug && (
                        <div
                            className="absolute left-0 p-1 text-xs text-white bg-black rounded top-16 opacity-90"
                            style={{
                                top: `${BASE_HANDLE_TOP_OFFSET_PX + index * HANDLE_VERTICAL_SPACING_PX}px`,
                                left: `-${BASE_HANDLE_SIDE_OFFSET_PX + 40}px`,
                            }}
                        >
                            out {key} {value.id}: {JSON.stringify(value.lastValue)?.substring(0, 100)}
                        </div>
                    )}
                    <Handle
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
                </React.Fragment>
            ))}
        </>
    );
};

registry.registerSimpleNodeType({
    typeName: `registerNodeType`,
    defaults: {
        inputs: {
            __registry: undefined as undefined | WorkflowRegistry,
            typeName: ``,
            componentPath: undefined as undefined | string,
            componentExportName: undefined as undefined | string,
            functionPath: undefined as undefined | string,
            functionExportName: undefined as undefined | string,
            inputTypeDefinition: `{}`,
            outputTypeDefinition: `{}`,
        },
        outputs: {
            nodeType: undefined as undefined | WorkflowNodeTypeUnknown,
        },
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    execute: async (
        inputs: {
            __registry: undefined | WorkflowRegistry;
            typeName: string;
            componentPath?: string;
            componentExportName?: string;
            functionPath?: string;
            functionExportName?: string;
            inputTypeDefinition: string;
            outputTypeDefinition: string;
        },
        { id },
    ) => {
        console.log(`[registerNodeType:execute] START`, { inputs, id });

        if (!inputs.__registry) {
            throw new Error(`registry input is required`);
        }
        // only register once
        if (inputs.__registry.nodeTypes[inputs.typeName]) {
            return {
                nodeType: inputs.__registry.nodeTypes[inputs.typeName],
            };
        }

        const nodeType = inputs.__registry.registerSimpleNodeType({
            typeName: inputs.typeName,
            requires: [id],
            defaults: {
                inputs: inputs.inputTypeDefinition
                    ? (JSON.parse(inputs.inputTypeDefinition) as Record<string, unknown>)
                    : {},
                outputs: inputs.outputTypeDefinition
                    ? (JSON.parse(inputs.outputTypeDefinition) as Record<string, unknown>)
                    : {},
            },
            execute: async () => {
                if (!inputs.functionPath) {
                    return {};
                }

                console.log(`[registerNodeType:functionNodeType:execute] START`, { inputs });

                const path = inputs.functionPath + (import.meta.env.DEV ? `?t=${Date.now()}` : ``);
                const module = await import(path);
                console.log(`[registerNodeType:functionNodeType:execute] imported module '${path}'`, {
                    module,
                    inputs,
                });

                const fun = (module[inputs.functionExportName ?? `default`] ?? module.default) as (
                    args: unknown,
                ) => unknown;
                console.log(`[registerNodeType:functionNodeType:execute] loaded function '${path}'`, { fun, inputs });
                const result = await fun(inputs);

                console.log(`[registerNodeType:functionNodeType:execute] DONE '${path}'`, { result, fun, inputs });
                return result as unknown as Record<string, unknown>;
            },
            Component: (props) => {
                const inputsInner = useObservableRecord(props.data.inputs);
                const outputsInner = useObservableRecord(props.data.outputs);
                // console.log(`[registerComponentNodeType:componentNodeType:Component] rendering '${props.id}'`, {
                //     inputsComp,
                //     inputs: props.data.inputs,
                //     outputs: props.data.outputs,
                //     props,
                // });

                const callbacks = !inputs.componentPath
                    ? undefined
                    : (Object.fromEntries(
                          Object.entries(props.data.outputs)
                              .map(([key, value]) => {
                                  console.log(`[componentNodeType:Component] output`, { key, value });
                                  if (!value || typeof value !== `object`) {
                                      return [key, undefined];
                                  }
                                  if (!(`next` in value)) {
                                      return [key, undefined];
                                  }

                                  const onChangeKey = `on${key === `value` ? `` : key.charAt(0).toUpperCase() + key.slice(1)}Change`;
                                  console.log(`[componentNodeType:Component] created onChange callback`, {
                                      onChangeKey,
                                      key,
                                      value,
                                  });
                                  return [onChangeKey, (val: unknown) => (value as WorkflowSubject<unknown>).next(val)];
                              })
                              .filter(([, v]) => v),
                      ) as Record<string, (val: unknown) => void>);
                return (
                    <NodeWrapper {...props}>
                        {inputs.functionPath && (
                            <FunctionNode
                                {...props}
                                data={{
                                    inputs: inputsInner,
                                    outputs: outputsInner,
                                    path: inputs.functionPath,
                                    exportName: inputs.functionExportName,
                                }}
                                onRerun={() => {
                                    props.data.refresh();
                                }}
                            />
                        )}
                        {inputs.componentPath && (
                            <ComponentNode
                                {...props}
                                data={{
                                    ...callbacks,
                                    ...inputsInner,
                                    path: inputs.componentPath,
                                    exportName: inputs.componentExportName,
                                }}
                            />
                        )}
                    </NodeWrapper>
                );
            },
        });

        return {
            nodeType,
        };
    },
    Component: (props) => {
        const inputs = useObservableRecord(props.data.inputs);
        return (
            <NodeWrapper {...props}>
                <RegisterComponentNodeTypeEditor
                    {...props}
                    data={{
                        ...inputs,
                        onTypeNameChange: (x) => {
                            (props.data.inputs.typeName as WorkflowSubject<string>).next(x);
                        },
                        onComponentPathChange: (x) => {
                            (props.data.inputs.componentPath as WorkflowSubject<string>).next(x);
                        },
                        onComponentExportNameChange: (x) => {
                            (props.data.inputs.componentExportName as WorkflowSubject<string>).next(x);
                        },
                        onFunctionPathChange: (x) => {
                            (props.data.inputs.functionPath as WorkflowSubject<string>).next(x);
                        },
                        onFunctionExportNameChange: (x) => {
                            (props.data.inputs.functionExportName as WorkflowSubject<string>).next(x);
                        },
                        onInputTypeDefinitionChange: (x) => {
                            (props.data.inputs.inputTypeDefinition as WorkflowSubject<string>).next(x);
                        },
                        onOutputTypeDefinitionChange: (x) => {
                            (props.data.inputs.outputTypeDefinition as WorkflowSubject<string>).next(x);
                        },
                    }}
                />
            </NodeWrapper>
        );
    },
});

const RegisterComponentNodeTypeEditor = ({
    data,
}: {
    data: {
        typeName: string;
        componentPath?: string;
        componentExportName?: string;
        functionPath?: string;
        functionExportName?: string;
        inputTypeDefinition: string;
        outputTypeDefinition: string;
        onTypeNameChange: (newTypeName: string) => void;
        onComponentPathChange: (newPath: string) => void;
        onComponentExportNameChange: (newExportName: string) => void;
        onFunctionPathChange: (newPath: string) => void;
        onFunctionExportNameChange: (newExportName: string) => void;
        onInputTypeDefinitionChange: (newInputTypeDefinition: string) => void;
        onOutputTypeDefinitionChange: (newOutputTypeDefinition: string) => void;
    };
}) => {
    return (
        <>
            <div className="flex flex-col w-full h-full border rounded shadow-md bg-slate-200 ">
                <div className="flex flex-col nowheel nodrag nopan">
                    <div className="flex flex-row items-center gap-1 p-1 ">
                        <label>typeName</label>
                        <input
                            type="text"
                            className="flex-1"
                            value={data.typeName}
                            onChange={(e) => data.onTypeNameChange(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-row items-center gap-1 p-1 ">
                        <label>componentPath</label>
                        <input
                            type="text"
                            className="flex-1"
                            value={data.componentPath}
                            onChange={(e) => data.onComponentPathChange(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-row items-center gap-1 p-1 ">
                        <label>componentExportName</label>
                        <input
                            type="text"
                            className="flex-1"
                            value={data.componentExportName}
                            onChange={(e) => data.onComponentExportNameChange(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-row items-center gap-1 p-1 ">
                        <label>functionPath</label>
                        <input
                            type="text"
                            className="flex-1"
                            value={data.functionPath}
                            onChange={(e) => data.onFunctionPathChange(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-row items-center gap-1 p-1 ">
                        <label>functionExportName</label>
                        <input
                            type="text"
                            className="flex-1"
                            value={data.functionExportName}
                            onChange={(e) => data.onFunctionExportNameChange(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-row items-center gap-1 p-1 ">
                        <label>inputTypeDefinition</label>
                        <input
                            type="text"
                            className="flex-1"
                            value={data.inputTypeDefinition}
                            onChange={(e) => data.onInputTypeDefinitionChange(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-row items-center gap-1 p-1 ">
                        <label>outputTypeDefinition</label>
                        <input
                            type="text"
                            className="flex-1"
                            value={data.outputTypeDefinition}
                            onChange={(e) => data.onOutputTypeDefinitionChange(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export const componentNodeType = registry.registerSimpleNodeType({
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
        const inputsRaw = useObservableRecord(props.data.inputs);
        console.log(`[componentNodeType:Component] rendering '${props.id}'`, {
            inputsRaw,
            inputs: props.data.inputs,
            outputs: props.data.outputs,
            props,
        });

        const callbacks = Object.fromEntries(
            Object.entries(props.data.outputs)
                .map(([key, value]) => {
                    console.log(`[componentNodeType:Component] output`, { key, value });
                    if (!value || typeof value !== `object`) {
                        return [key, undefined];
                    }
                    if (!(`next` in value)) {
                        return [key, undefined];
                    }

                    const onChangeKey = `on${key === `value` ? `` : key.charAt(0).toUpperCase() + key.slice(1)}Change`;
                    console.log(`[componentNodeType:Component] created onChange callback`, { onChangeKey, key, value });
                    return [onChangeKey, (val: unknown) => (value as WorkflowSubject<unknown>).next(val)];
                })
                .filter(([, v]) => v),
        );
        return (
            <NodeWrapper {...props}>
                <ComponentNode
                    {...props}
                    data={{
                        ...callbacks,
                        ...inputsRaw,
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
    const [component, setComponent] = useState({ Component: (() => null) as React.ComponentType<typeof data> });
    useEffect(() => {
        setComponent({
            Component: React.lazy(() =>
                import(data.path).then((mod) => ({
                    default: mod[data.exportName ?? `default`] ?? mod.default,
                })),
            ),
        });
    }, [data.path, data.exportName, reloadId]);

    console.log(`[ComponentNode] rendering component node`, { data });
    return (
        <>
            <div className="flex flex-col w-full h-full bg-white border border-gray-400 rounded shadow-md">
                <div className="flex flex-row items-center gap-1 bg-gray-200 border-b border-gray-800">
                    <div className="font-mono text-sm">
                        {data.path} {data.exportName ?? ``}
                    </div>
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
                <div className="flex-1 min-h-0 nodrag nopan nowheel">
                    <React.Suspense fallback={<div>Loading...</div>}>
                        <component.Component {...data} />
                    </React.Suspense>
                </div>
            </div>
        </>
    );
};

export const functionNodeType = registry.registerSimpleNodeType({
    typeName: `function`,
    defaults: {
        inputs: {
            path: ``,
            exportName: undefined as undefined | string,
        },
        outputs: {},
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    execute: async (inputs: { path: string; exportName?: string }, { refresh }) => {
        console.log(`[functionNodeType:execute] START`, { inputs });

        const path = inputs.path + (import.meta.env.DEV ? `?t=${Date.now()}` : ``);
        const module = await import(path);
        console.log(`[functionNodeType:execute] imported module '${path}'`, { module, inputs });

        const fun = (module[inputs.exportName ?? `default`] ?? module.default) as (args: unknown) => unknown;
        console.log(`[functionNodeType:execute] loaded function '${path}'`, { fun, inputs });
        const result = await fun(inputs);

        console.log(`[functionNodeType:execute] DONE '${path}'`, { result, fun, inputs });

        // if (import.meta.hot) {
        //     const onUpdate = (payload: UpdatePayload) => {
        //         console.log(`[functionNodeType:execute] onUpdate '${path}'`, {
        //             paths: payload.updates.map((x) => x.path).join(`, `),
        //             payload,
        //             inputs,
        //         });

        //         if (payload.type === `update`) {
        //             for (const update of payload.updates) {
        //                 // Vite paths are usually root-relative (e.g., /src/functions/foo.ts)
        //                 // Ensure we match your inputs.path logic
        //                 if (update.path.includes(inputs.path.replace(/^\./, ``))) {
        //                     console.log(
        //                         `[functionNodeType:execute] '${inputs.path}' Detected change in ${update.path}, refreshing node...`,
        //                         { inputs, update, payload },
        //                     );
        //                     refresh();

        //                     import.meta.hot!.dispose(() => {
        //                         import.meta.hot!.off(`vite:afterUpdate`, onUpdate);
        //                     });
        //                 }
        //             }
        //         }
        //     };

        //     import.meta.hot.on(`vite:afterUpdate`, onUpdate);
        // }

        return result as unknown as Record<string, unknown>;
    },
    Component: (props) => {
        const path = useObservable(props.data.inputs.path);
        const exportName = useObservable(props.data.inputs.exportName);
        const inputs = useObservableRecord(props.data.inputs);
        const outputs = useObservableRecord(props.data.outputs);
        return (
            <NodeWrapper {...props}>
                <FunctionNode
                    {...props}
                    data={{
                        path,
                        exportName,
                        inputs,
                        outputs,
                    }}
                    onRerun={() => {
                        props.data.refresh();
                    }}
                />
            </NodeWrapper>
        );
    },
});

const FunctionNode = ({
    data,
    onRerun,
}: {
    data: {
        path: string;
        exportName?: string;
        inputs?: Record<string, unknown>;
        outputs?: Record<string, unknown>;
    };
    onRerun: () => void;
}) => {
    return (
        <>
            <div className="flex flex-col w-full h-full bg-white border border-gray-400 rounded shadow-md">
                <div className="flex flex-row items-center gap-1 bg-gray-200 border-b border-gray-800">
                    <div className="font-mono text-sm">
                        {data.path} {data.exportName ?? ``}
                    </div>
                    <div className="flex-grow" />
                    <button
                        className="self-stretch px-2 py-1 text-xs text-white bg-blue-500 hover:opacity-80 active:opacity-70"
                        onClick={onRerun}
                    >
                        Rerun
                    </button>
                </div>
                <div className="flex-1 min-h-0 nodrag nopan nowheel">
                    <textarea
                        className="w-full h-full p-2 bg-[#1e1e1e] font-mono text-[14px] leading-[19px] tracking-[0px] text-[#d4d4d4] outline-none resize-none nodrag nopan nowheel"
                        readOnly
                        value={JSON.stringify({ inputs: data.inputs, outputs: data.outputs }, null, 2)}
                    ></textarea>
                </div>
            </div>
        </>
    );
};

export const textFileNodeType = registry.registerSimpleNodeType({
    typeName: `textFile`,
    defaults: {
        inputs: {
            workflowServerUrl: ``,
            path: ``,
        },
        outputs: {
            content: ``,
            onContentChange: undefined as undefined | ((value: string) => void),
        },
    },
    execute: async (inputs: { workflowServerUrl: string; path: string }, { refresh }) => {
        const content = (await loadFileText(inputs)) ?? ``;
        return {
            content: content,
            onContentChange: async (value: string) => {
                // if (value === content) return;
                await saveFileText(inputs, value);
                refresh();
            },
        };
    },
    Component: (props) => {
        const workflowServerUrl = useObservable(props.data.inputs.workflowServerUrl);
        const path = useObservable(props.data.inputs.path);
        const content = useObservable(props.data.outputs.content);
        const onContentChange = useObservable(props.data.outputs.onContentChange);
        return (
            <NodeWrapper {...props}>
                <TextFileNode
                    {...props}
                    data={{
                        workflowServerUrl,
                        path,
                        content,
                        onContentChange,
                        onReload: () => {
                            props.data.refresh();
                        },
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
    const fileContent = (await response.text()).replace(/\r\n/g, `\n`);
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

const TextFileNode = ({
    data,
    selected,
}: {
    data: {
        workflowServerUrl: string;
        path: string;
        content: string;
        onContentChange: undefined | ((value: string) => void);
        onReload: () => void;
    };
    selected: boolean;
}) => {
    const [fileContent, setFileContent] = useState(data.content);
    const [reloadId, setReloadId] = useState(0);

    const loadFile = async () => {
        // const content = await loadFileText(data);
        // if (!content) return;
        // setFileContent(content);
        data.onReload();
        setReloadId((id) => id + 1);
    };

    const saveFile = async (value?: string) => {
        // await saveFileText(data, value ?? fileContent);
        data.onContentChange?.(value ?? fileContent);
    };

    useEffect(() => {
        if (data.content) {
            setFileContent(data.content);
            return;
        }
        void loadFile();
    }, [data.workflowServerUrl, data.path, data.content]);

    return (
        <>
            <div className="w-full h-full p-2 bg-white border border-gray-400 rounded shadow-md">
                <div className="flex flex-row">
                    <div className="font-mono text-sm">{data.path}</div>
                    {data.onContentChange && (
                        <button
                            className="px-2 py-1 ml-2 text-xs text-white bg-blue-500 rounded hover:opacity-80 active:opacity-70"
                            onClick={() => {
                                void saveFile();
                            }}
                        >
                            Save
                        </button>
                    )}
                    <button
                        className="px-2 py-1 ml-2 text-xs text-white bg-green-500 rounded hover:opacity-80 active:opacity-70"
                        onClick={() => {
                            void loadFile();
                        }}
                    >
                        Reload
                    </button>
                </div>
                {/* <div className="w-full h-full pb-8">
                    <textarea
                        className="w-full h-full resize-none nodrag nopan nowheel"
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        rows={10}
                    ></textarea>
                </div> */}
                <div className="w-full h-full pb-8 nodrag nopan nowheel">
                    <TextCodeEditorComponent
                        key={reloadId}
                        value={fileContent}
                        onChange={setFileContent}
                        onSave={(x) => saveFile(x)}
                        isSelected={selected}
                    />
                </div>
            </div>
        </>
    );
};

export const textNodeType = registry.registerSimpleNodeType({
    typeName: `textSimple`,
    defaults: {
        inputs: {
            content: ``,
            onContentChange: undefined as undefined | ((value: string) => void),
            startAtLine: undefined as undefined | string,
            endAtLine: undefined as undefined | string,
            language: undefined as undefined | string,
        },
        outputs: {
            content: ``,
            onContentChange: undefined as undefined | ((value: string) => void),
        },
    },
    execute: async (
        inputs: {
            content: string;
            onContentChange: undefined | ((value: string) => void);
            startAtLine: undefined | string;
            endAtLine: undefined | string;
            language: undefined | string;
        },
        { refresh },
    ) => {
        console.log(`[textNodeType:execute] START`, { inputs });
        const [beforeStartText, afterStartText] = !inputs.startAtLine
            ? [``, inputs.content]
            : (() => {
                  const text = inputs.content;
                  const iStart = text.indexOf(`\n` + inputs.startAtLine);
                  if (iStart < 0) {
                      return [``, inputs.content];
                  }
                  return [text.substring(0, iStart + 1), text.substring(iStart + 1)];
              })();
        const [middleText, afterEndText] = !inputs.endAtLine
            ? [afterStartText, ``]
            : (() => {
                  const iEndLine = afterStartText.indexOf(`\n` + inputs.endAtLine);
                  if (iEndLine < 0) {
                      return [afterStartText, ``];
                  }
                  const iEndLineNewLine = afterStartText.indexOf(`\n`, iEndLine + inputs.endAtLine.length);
                  if (iEndLineNewLine < 0) {
                      return [afterStartText, ``];
                  }
                  return [afterStartText.substring(0, iEndLineNewLine), afterStartText.substring(iEndLineNewLine)];
              })();

        console.log(`[textNodeType:execute] DONE`, {
            inputs,
            beforeStartText,
            afterStartText,
            middleText,
            afterEndText,
            doesMatch: inputs.content === beforeStartText + middleText + afterEndText,
        });
        return {
            content: middleText,
            onContentChange: !inputs.onContentChange
                ? undefined
                : (value: string) => {
                      const replaced = beforeStartText + value + afterEndText;

                      console.log(`[textNodeType:execute:onChange]`, {
                          value,
                          replaced,
                          beforeStartText,
                          middleText,
                          afterEndText,
                          doesMatch: inputs.content === beforeStartText + middleText + afterEndText,
                      });
                      inputs.onContentChange!(replaced);
                      refresh();
                  },
        };
    },
    Component: (props) => {
        const inputContent = useObservable(props.data.inputs.content);
        const startAtLine = useObservable(props.data.inputs.startAtLine);
        const endAtLine = useObservable(props.data.inputs.endAtLine);
        const language = useObservable(props.data.inputs.language);
        const outputContent = useObservable(props.data.outputs.content);
        const onContentChange = useObservable(props.data.outputs.onContentChange);

        return (
            <NodeWrapper {...props}>
                <TextNode
                    {...props}
                    data={{
                        startAtLine,
                        endAtLine,
                        content: outputContent ?? inputContent,
                        onContentChange:
                            onContentChange ??
                            ((x) => {
                                (props.data.inputs.content as WorkflowSubject<string>).next(x);
                            }),
                        language,
                        onLanguageChange: (x) => {
                            (props.data.inputs.language as WorkflowSubject<undefined | string>).next(x);
                        },
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

const TextNode = ({
    selected,
    data,
}: {
    selected: boolean;
    data: {
        content: string;
        onContentChange: undefined | ((value: string) => void);
        before?: string;
        after?: string;
        startAtLine?: string;
        endAtLine?: string;
        language?: string;
        onLanguageChange?: (newLanguage: undefined | string) => void;
    };
}) => {
    const isCodeEditor =
        data.startAtLine ||
        data.endAtLine ||
        data.onContentChange ||
        data.content.split(`\n`).length > 2 ||
        data.language;

    useEffect(() => {
        if (!scrollTargerRef.current) return;
        scrollTargerRef.current.scrollIntoView({ behavior: `instant` });
    }, [data.content]);
    const scrollTargerRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <div className="flex flex-col w-full h-full p-1 whitespace-pre-wrap border border-gray-400 rounded shadow-md bg-slate-100">
                {isCodeEditor && (
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

                        {!data.onContentChange && (
                            <>
                                <div className="flex-1 overflow-auto nowheel">
                                    <div className="scrollbar-thin scrollbar-thumb-[#555555] scrollbar-track-[#2a2a2a] hover:scrollbar-thumb-[#6a6a6a] p-1 h-full w-full resize-none overflow-auto bg-[#1e1e1e] font-mono text-[14px] leading-[19px] tracking-[0px] text-[#d4d4d4] outline-none">
                                        {data.before && <div className="text-gray-400">{data.before}</div>}
                                        <div ref={scrollTargerRef} className="">
                                            {data.content}
                                        </div>
                                        {data.after && <div className="text-gray-400">{data.after}</div>}
                                    </div>
                                </div>
                            </>
                        )}
                        {!!data.onContentChange && (
                            <div className="flex-1">
                                <div className="w-full h-full nodrag nopan nowheel">
                                    <TextCodeEditorComponent
                                        value={data.content}
                                        onChange={(x) => {
                                            // ignore until saved
                                            console.log(`[TextNode:TextCodeEditorComponent:onChange]`, { x });
                                            // data.onContentChange?.(x)
                                        }}
                                        language={data.language as `typescript`}
                                        onLanguageChange={(x) => data.onLanguageChange?.(x)}
                                        onSave={(x) => data.onContentChange?.(x)}
                                        isSelected={selected}
                                    />
                                </div>
                            </div>
                        )}
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
                {!isCodeEditor && (
                    <>
                        <div className="flex flex-col items-center justify-center">{data.content}</div>
                    </>
                )}
            </div>
        </>
    );
};

export const numberNodeType = registry.registerSimpleNodeType({
    typeName: `number`,
    defaults: {
        inputs: {
            label: `number`,
            value: 0,
        },
        outputs: {
            value: 0,
        },
    },
    execute: async (inputs: { value: number; label: string }) => {
        return {
            value: inputs.value,
        };
    },
    Component: (props) => {
        const value = useObservable(props.data.inputs.value);
        const label = useObservable(props.data.inputs.label);

        return (
            <NodeWrapper {...props}>
                <div className="flex flex-row items-center gap-1 p-1 bg-slate-300">
                    <div className="mb-1 text-sm font-bold text-center">{label}</div>
                    <input
                        type="number"
                        value={value}
                        className="w-full p-1 text-center border border-gray-400 rounded shadow-md nodrag nopan nowheel"
                        onChange={(e) => {
                            const v = Number(e.target.value);
                            (props.data.inputs.value as WorkflowSubject<number>).next(v);
                        }}
                    />
                </div>
            </NodeWrapper>
        );
    },
});
