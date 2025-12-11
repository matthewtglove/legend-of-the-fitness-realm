import React, { useEffect, useRef, useState } from 'react';
import { createRegistry, WorkflowObservable } from './types';
import '@xyflow/react/dist/style.css';
import { NodeResizer, Handle, Position } from '@xyflow/react';
import { useObservable } from './use-observable';
import { TextCodeEditorComponent } from './code-editor/text-code-editor-main';

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
                    // className="hover:top-0"
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
    execute: async (inputs: { workflowServerUrl: string; path: string }) => {
        const content = await loadFileText(inputs);
        return {
            content: content ?? ``,
            onContentChange: (value: string) => {
                void saveFileText(inputs, value);
            },
        };
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

const TextFileNode = ({ data, selected }: { data: { workflowServerUrl: string; path: string }; selected: boolean }) => {
    const [fileContent, setFileContent] = useState(``);

    const loadFile = async () => {
        const content = await loadFileText(data);
        if (!content) return;
        setFileContent(content);
    };

    const saveFile = async (value?: string) => {
        await saveFileText(data, value ?? fileContent);
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
        },
        outputs: {
            content: ``,
            onContentChange: undefined as undefined | ((value: string) => void),
        },
    },
    execute: async (inputs: {
        content: string;
        onContentChange: undefined | ((value: string) => void);
        startAtLine: undefined | string;
        endAtLine: undefined | string;
    }) => {
        console.log(`[textNodeType:execute] START`, { inputs });
        const afterStartText = !inputs.startAtLine
            ? inputs.content
            : (() => {
                  const text = inputs.content;
                  const iStart = text.indexOf(`\n` + inputs.startAtLine);
                  if (iStart === -1) {
                      return text;
                  }
                  return text.substring(iStart);
              })();
        const trimmedText = !inputs.endAtLine
            ? afterStartText
            : (() => {
                  const iEndLine = afterStartText.indexOf(`\n` + inputs.endAtLine);
                  if (iEndLine === -1) {
                      return afterStartText;
                  }
                  const iEndLineNewLine = afterStartText.indexOf(`\n`, iEndLine + inputs.endAtLine.length);
                  if (iEndLineNewLine === -1) {
                      return afterStartText.substring(0, afterStartText.length);
                  }
                  return afterStartText.substring(0, iEndLineNewLine);
              })();

        console.log(`[textNodeType:execute] DONE`, { inputs, trimmedText });
        return {
            content: trimmedText,
            onContentChange: !inputs.onContentChange
                ? undefined
                : (value: string) => {
                      const beforeStartText = !inputs.startAtLine
                          ? ``
                          : inputs.content.substring(0, inputs.content.length - afterStartText.length);
                      const afterEndText = !inputs.endAtLine
                          ? ``
                          : inputs.content.substring(beforeStartText.length + trimmedText.length);
                      const replaced = beforeStartText + value + afterEndText;

                      console.log(`[textNodeType:execute:onChange]`, {
                          value,
                          replaced,
                          beforeStartText,
                          trimmedText,
                          afterEndText,
                      });
                      inputs.onContentChange!(replaced);
                  },
        };
    },
    Component: (props) => {
        const inputContent = useObservable(props.data.inputs.content);
        const onContentChange = useObservable(props.data.inputs.onContentChange);
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
                        onContentChange,
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
    };
}) => {
    const isLong = data.content.split(`\n`).length > 2;

    useEffect(() => {
        if (!scrollTargerRef.current) return;
        scrollTargerRef.current.scrollIntoView({ behavior: `instant` });
    }, [data.content]);
    const scrollTargerRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <div className="flex flex-col w-full h-full p-1 whitespace-pre-wrap border border-gray-400 rounded shadow-md bg-slate-100">
                {!!data.onContentChange && data.content && (
                    <div className="w-full h-full pb-8 nodrag nopan nowheel">
                        <TextCodeEditorComponent
                            value={data.content}
                            onChange={(x) => data.onContentChange?.(x)}
                            onSave={(x) => data.onContentChange?.(x)}
                            isSelected={selected}
                        />
                    </div>
                )}
                {!data.onContentChange && isLong && (
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

                        <div className="flex-1 overflow-auto nowheel">
                            <div className="scrollbar-thin scrollbar-thumb-[#555555] scrollbar-track-[#2a2a2a] hover:scrollbar-thumb-[#6a6a6a] p-1 h-full w-full resize-none overflow-auto bg-[#1e1e1e] font-mono text-[14px] leading-[19px] tracking-[0px] text-[#d4d4d4] outline-none">
                                {data.before && <div className="text-gray-400">{data.before}</div>}
                                <div ref={scrollTargerRef} className="">
                                    {data.content}
                                </div>
                                {data.after && <div className="text-gray-400">{data.after}</div>}
                            </div>
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
                {!data.onContentChange && !isLong && (
                    <>
                        <div className="flex flex-col items-center justify-center">{data.content}</div>
                    </>
                )}
            </div>
        </>
    );
};
