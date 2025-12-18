export type WorkflowObservable<T> = {
    id: string;
    name?: string;
    source?: {
        nodeId?: string;
        handleId?: string;
    };
    hasSubscribers: boolean;
    lastValue: T;
    subscribe: (callback: (data: T) => void) => { unsubscribe: () => void };
};
export type WorkflowSubject<T> = WorkflowObservable<T> & {
    next: (data: T) => void;
};

export type WorkflowObservableLike<T> = T | WorkflowObservable<T>;
export const toObservable = <T>(value: WorkflowObservableLike<T>, options?: { source?: { nodeId?: string; handleId?: string } }): WorkflowObservable<T> => {
    if (typeof value === `object` && value !== null && `subscribe` in value && typeof value.subscribe === `function`) {
        return value as WorkflowObservable<T>;
        // const obs = createObservable(value.lastValue as T, options);
        // value.subscribe((data: T) => {
        //     obs.next(data);
        // });
        // return obs;
    }
    return createObservable(value as T, options);
}

let nextObservableId = 0;
export const createObservable = <T>(initialValue: T, options?: { source?: { nodeId?: string; handleId?: string } }): WorkflowSubject<T> => {
    let lastValue = initialValue;
    const subscribers = [] as (undefined | ((data: T) => void))[];
    return {
        ...createObservableName(),
        id: `${nextObservableId++}`,
        source: options?.source,
        get lastValue() { return lastValue; },
        get hasSubscribers() { return subscribers.some(s => !!s); },
        subscribe: (callback: (data: T) => void) => {
            const iCallback = subscribers.length;
            subscribers.push(callback);
            callback(lastValue);
            return {
                unsubscribe: () => {
                    subscribers[iCallback] = undefined;
                }
            };
        },
        next: (data: T) => {
            lastValue = data;
            for (const callback of subscribers) {
                callback?.(data);
            }
        },
    };
};

let uniqueIdCounter = 0;
export const createObservableName = (defaultValue?: string) => {
    let name = defaultValue ?? `o_${uniqueIdCounter++}`;
    return {
        get name() { return name; },
        set name(n: string) { name = n; },
    };
}

export type WorkflowEditorController = {
    setWorkflowServerUrl: (url: string) => void;
    setWorkflowMetadataPath: (path: string) => Promise<void>;
    addNode: (typeName: string, args: { id: string } & Record<string, WorkflowObservableLike<unknown>>) => WorkflowNodeAddResult<Record<string, WorkflowObservable<unknown>>>;
    addTextNode: (args: {
        id: string,
        content: WorkflowObservableLike<string>,
        onContentChange?: undefined | WorkflowObservableLike<undefined | ((value: string) => void)>,
        startAtLine?: undefined | WorkflowObservableLike<undefined | string>,
        endAtLine?: undefined | WorkflowObservableLike<undefined | string>
    }) => WorkflowNodeAddResult<{
        content: WorkflowObservable<string>;
        onContentChange: WorkflowObservable<undefined | ((value: string) => void)>;
    }>;
    addNumberNode: (args: {
        id: string,
        value: WorkflowObservableLike<number>,
        label: WorkflowObservableLike<string>,
    }) => WorkflowNodeAddResult<{
        value: WorkflowObservable<number>,
    }>;
    addTextFileNode: (args: { id: string, path: string }) => WorkflowNodeAddResult<{
        content: WorkflowObservable<string>;
        onContentChange: WorkflowObservable<undefined | ((value: string) => void)>;
    }>
    addComponent: (args: {
        id: string,
        path: string,
        exportName: string,
        defaults?: {
            inputs: Record<string, unknown>,
            outputs: Record<string, unknown>,
        }
    } & Record<string, unknown>) => WorkflowNodeAddResult<Record<string, WorkflowObservable<unknown>>>;
};

export type WorkflowNodeTypeLoadResult<
    TInputs extends Record<string, WorkflowObservable<unknown>>,
    TOutputs extends Record<string, WorkflowObservable<unknown>>,
> = {
    inputs: TInputs,
    outputs: TOutputs,
};

export type WorkflowNodeAddResult<
    TOutputs extends Record<string, WorkflowObservable<unknown>>,
> = TOutputs;

export type WorkflowNodeTypeArgs<
    TArgs extends Record<string, unknown> & { id: string },
    TInputs extends Record<string, WorkflowObservable<unknown>>,
    TOutputs extends Record<string, WorkflowObservable<unknown>>,
> = {
    typeName: string,
    load: (args: TArgs) => WorkflowNodeTypeLoadResult<TInputs, TOutputs>,
    Component: React.ComponentType<{
        id: string;
        selected: boolean;
        data: {
            inputs: TInputs,
            outputs: TOutputs,
            refresh: () => void;
        }
    }>;
};

type ObservableOf<T> = {
    [K in keyof T]: T[K] extends WorkflowObservable<infer U> ? WorkflowObservable<U> : T[K] extends PromiseLike<infer U> ? WorkflowObservable<U> : WorkflowObservable<T[K]>;
};
type ObservableLikeOf<T> = {
    [K in keyof T]: T[K] extends WorkflowObservable<infer U> ? WorkflowObservable<U> : T[K] extends PromiseLike<infer U> ? WorkflowObservable<U> : WorkflowObservableLike<T[K]>;
};
type SubjectsOf<T> = {
    [K in keyof T]: T[K] extends WorkflowObservable<infer U> ? WorkflowSubject<U> : T[K] extends PromiseLike<infer U> ? WorkflowSubject<U> : WorkflowSubject<T[K]>;
};

export type WorkflowNodeTypeSimpleArgs<
    TInputs extends Record<string, unknown>,
    TOutputs extends Record<string, unknown>,
> = {
    typeName: string,
    defaults: {
        inputs: TInputs,
        outputs: TOutputs,
    },
    execute: (inputs: TInputs, { refresh }: { refresh: () => void }) => PromiseLike<TOutputs>,
    Component: React.ComponentType<{
        id: string;
        selected: boolean;
        data: {
            inputs: ObservableOf<TInputs>,
            outputs: ObservableOf<TOutputs>,
            refresh: () => void;
        }
    }>;
}

export type WorkflowNodeType<
    TArgs extends Record<string, unknown> & { id: string },
    TInputs extends Record<string, WorkflowObservable<unknown>>,
    TOutputs extends Record<string, WorkflowObservable<unknown>>,
> = WorkflowNodeTypeArgs<TArgs, TInputs, TOutputs>;
export type WorkflowNodeTypes = Record<string, WorkflowNodeType<Record<string, unknown> & { id: string }, Record<string, WorkflowObservable<unknown>>, Record<string, WorkflowObservable<unknown>>>>;
export type WorkflowRegistry = {
    nodeTypes: WorkflowNodeTypes;
    // registerNodeType: <
    //     TArgs extends Record<string, unknown>,
    //     TInputs extends Record<string, WorkflowObservable<unknown>>,
    //     TOutputs extends Record<string, WorkflowObservable<unknown>>,
    // >(args: WorkflowNodeTypeArgs<TArgs, TInputs, TOutputs>) => WorkflowNodeType<TArgs, TInputs, TOutputs>;
    registerSimpleNodeType: <
        TInputs extends Record<string, unknown>,
        TOutputs extends Record<string, unknown>,
    >(args: WorkflowNodeTypeSimpleArgs<TInputs, TOutputs>) => WorkflowNodeType<ObservableLikeOf<TInputs> & { id: string }, ObservableOf<TInputs>, ObservableOf<TOutputs>>;
};
export const createRegistry = (): WorkflowRegistry => {
    const nodeTypes = {} as WorkflowNodeTypes;

    return {
        get nodeTypes() {
            return nodeTypes;
        },
        // registerNodeType: (args) => {
        //     console.log(`Registered node type: ${args.typeName}`, args);
        //     const nodeType = args;
        //     nodeTypes[args.typeName] = args as unknown as WorkflowNodeTypes[string];
        //     return nodeType;
        // },
        registerSimpleNodeType: <
            TInputs extends Record<string, unknown>,
            TOutputs extends Record<string, unknown>,
        >(nodeTypeArgs: WorkflowNodeTypeSimpleArgs<TInputs, TOutputs>) => {
            console.log(`[registerSimpleNodeType] Registering simple node type: ${nodeTypeArgs.typeName}`, { nodeTypeArgs });
            const nodeType: WorkflowNodeType<Record<string, unknown> & { id: string }, ObservableOf<TInputs>, ObservableOf<TOutputs>> = {
                typeName: nodeTypeArgs.typeName,
                // execute: nodeTypeArgs.execute,
                load: (loadArgs: Record<string, unknown> & {
                    id: string,
                    defaults?: { inputs?: Record<string, unknown>, outputs?: Record<string, unknown> },
                    inputs?: Record<string, unknown>,
                    outputs?: Record<string, unknown>
                }) => {
                    console.log(`[registerSimpleNodeType:load] loading called with args:`, { loadArgs, nodeTypeArgs });

                    const getSourceOptions = (handleId: string) => ({ source: { nodeId: loadArgs.id, handleId } });

                    const inputs = Object.fromEntries(
                        Object.entries({
                            ...nodeTypeArgs.defaults.inputs,
                            ...loadArgs.defaults?.inputs ?? {},
                            ...loadArgs.inputs ?? {},
                        })
                            .map(([key, value]) => [
                                key,
                                loadArgs[key] ? toObservable(loadArgs[key], getSourceOptions(key)) : toObservable(value, getSourceOptions(key))])) as ObservableOf<TInputs>;
                    const outputs = Object.fromEntries(Object.entries({
                        ...nodeTypeArgs.defaults.outputs,
                        ...loadArgs.defaults?.outputs ?? {},
                        ...loadArgs.outputs ?? {},
                    }).map(([key, value]) => [
                        key,
                        createObservable(value, getSourceOptions(key))
                    ])) as SubjectsOf<TOutputs>;

                    const update = async () => {
                        try {
                            const inputValues = Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, value.lastValue])) as TInputs;
                            const outputValues = await nodeTypeArgs.execute(inputValues, {
                                refresh: () => updateDebounced(),
                            });
                            for (const key in outputValues) {
                                if (outputs[key]) {
                                    outputs[key].next(outputValues[key]);
                                    continue;
                                }
                                outputs[key] = createObservable(outputValues[key]) as typeof outputs[typeof key];
                            }

                        } catch (e) {
                            console.error(`[registerSimpleNodeType] Error getting input values`, e);
                        }
                    };
                    let updateTimeout = 0 as unknown as ReturnType<typeof setTimeout>;
                    const updateDebounced = () => {
                        clearTimeout(updateTimeout);
                        updateTimeout = setTimeout(update, 0);
                    };
                    let loading = true;
                    for (const key in inputs) {
                        inputs[key].subscribe(() => {
                            if (loading) { return }
                            updateDebounced();
                        });
                    }

                    // initialize outputs
                    loading = false;
                    updateDebounced();

                    console.log(`[registerSimpleNodeType:load] loaded called with args:`, { inputs, outputs, loadArgs, nodeTypeArgs });
                    return {
                        inputs,
                        outputs,
                        refresh: () => { updateDebounced(); },
                    };
                },
                Component: nodeTypeArgs.Component,
            };
            nodeTypes[nodeTypeArgs.typeName] = nodeType as unknown as WorkflowNodeTypes[string];

            console.log(`[registerSimpleNodeType] Registered simple node type: ${nodeTypeArgs.typeName}`, { nodeTypeArgs, nodeType, nodeTypes });
            return nodeType;
        },
    };
}

export type WorkflowDocument = {
    imports: {
        path: string;
        name: string;
    }[];
    nodes: {
        id: string;
        typeName: string;
        inputEdges?: { inputName: string; fromNodeId: string; fromOutputName: string }[];
        inputLiterals?: { inputName: string; value: string | number | Record<string, unknown> }[];
        outputs?: { outputName: string; defaultValue: string | number | Record<string, unknown> }[];
        position?: { x: number; y: number; width?: number; height?: number };
    }[];
}