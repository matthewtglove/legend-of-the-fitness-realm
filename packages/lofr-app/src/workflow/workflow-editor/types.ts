export type WorkflowObservable<T> = {
    id: string;
    name?: string;
    source?: {
        nodeId?: string;
        handleId?: string;
    };
    hasSubscribers: boolean;
    lastValue: T;
    subscribe: (callback: (data: T) => void, options?: { skipCurrentValue?: boolean }) => { unsubscribe: () => void };
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
        subscribe: (callback: (data: T) => void, options?: { skipCurrentValue?: boolean }) => {
            const iCallback = subscribers.length;
            subscribers.push(callback);
            if (!options?.skipCurrentValue) {
                callback(lastValue);
            }
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
    setWorkflowDocumentPath: (path: string) => Promise<void>;
    registerSimpleNodeType: WorkflowRegistry[`registerSimpleNodeType`];
    addNode: (typeName: string, args: { id: string } & Record<string, WorkflowObservableLike<unknown>>) => WorkflowNodeInstance<Record<string, WorkflowObservable<unknown>>, Record<string, WorkflowObservable<unknown>>>;
    // addTextNode: (args: {
    //     id: string,
    //     content: WorkflowObservableLike<string>,
    //     onContentChange?: undefined | WorkflowObservableLike<undefined | ((value: string) => void)>,
    //     startAtLine?: undefined | WorkflowObservableLike<undefined | string>,
    //     endAtLine?: undefined | WorkflowObservableLike<undefined | string>
    // }) => WorkflowNodeAddResult<{
    //     content: WorkflowObservable<string>;
    //     onContentChange: WorkflowObservable<undefined | ((value: string) => void)>;
    // }>;
    // addNumberNode: (args: {
    //     id: string,
    //     value: WorkflowObservableLike<number>,
    //     label: WorkflowObservableLike<string>,
    // }) => WorkflowNodeAddResult<{
    //     value: WorkflowObservable<number>,
    // }>;
    // addTextFileNode: (args: { id: string, path: string }) => WorkflowNodeAddResult<{
    //     content: WorkflowObservable<string>;
    //     onContentChange: WorkflowObservable<undefined | ((value: string) => void)>;
    // }>
    // addComponent: (args: {
    //     id: string,
    //     path: string,
    //     exportName: string,
    //     defaults?: {
    //         inputs: Record<string, unknown>,
    //         outputs: Record<string, unknown>,
    //     }
    // } & Record<string, unknown>) => WorkflowNodeAddResult<Record<string, WorkflowObservable<unknown>>>;
};

export type WorkflowNodeInstance<
    TInputs extends Record<string, WorkflowObservable<unknown>>,
    TOutputs extends Record<string, WorkflowObservable<unknown>>,
> = {
    typeName: string;
    inputs: TInputs,
    outputs: TOutputs,
    refresh: () => void,
    update: (args: Record<string, unknown> & { id: string }) => { hasChanged: boolean, instance: WorkflowNodeInstance<TInputs, TOutputs> };
};

export type WorkflowNodeTypeArgs<
    TArgs extends Record<string, unknown> & { id: string },
    TInputs extends Record<string, WorkflowObservable<unknown>>,
    TOutputs extends Record<string, WorkflowObservable<unknown>>,
> = {
    typeName: string,
    requires?: string[],
    defaults: {
        inputs: Record<string, unknown>,
        outputs: Record<string, unknown>,
    },
    load: (args: TArgs) => WorkflowNodeInstance<TInputs, TOutputs>,
    Component: React.ComponentType<{
        id: string;
        selected: boolean;
        data: {
            typeName: string;
            inputs: TInputs,
            outputs: TOutputs,
            refresh: () => void;
        }
    }>;
};

export type ObservableOf<T> = {
    [K in keyof T]: T[K] extends WorkflowObservable<infer U> ? WorkflowObservable<U> : T[K] extends PromiseLike<infer U> ? WorkflowObservable<U> : WorkflowObservable<T[K]>;
};
export type ObservableLikeOf<T> = {
    [K in keyof T]: T[K] extends WorkflowObservable<infer U> ? WorkflowObservable<U> : T[K] extends PromiseLike<infer U> ? WorkflowObservable<U> : WorkflowObservableLike<T[K]>;
};
export type SubjectsOf<T> = {
    [K in keyof T]: T[K] extends WorkflowObservable<infer U> ? WorkflowSubject<U> : T[K] extends PromiseLike<infer U> ? WorkflowSubject<U> : WorkflowSubject<T[K]>;
};

export type WorkflowNodeTypeSimpleArgs<
    TInputs extends Record<string, unknown>,
    TOutputs extends Record<string, unknown>,
> = {
    typeName: string,
    requires?: string[],
    defaults: {
        inputs: TInputs,
        outputs: TOutputs,
    },
    execute: (inputs: TInputs, { id, refresh }: { id: string, refresh: () => void }) => PromiseLike<TOutputs>,
    Component: React.ComponentType<{
        id: string;
        selected: boolean;
        data: {
            typeName: string;
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
export type WorkflowNodeTypeUnknown = WorkflowNodeTypes[string];
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

export type WorkflowDocument = {
    imports: {
        path: string;
        name: string;
    }[];
    nodes: {
        id: string;
        typeName: string;
        requires?: string[];
        inputEdges?: { inputName: string; fromNodeId: string; fromOutputName: string }[];
        inputLiterals?: { inputName: string; value: string | number | Record<string, unknown> }[];
        outputs?: { outputName: string; defaultValue: string | number | Record<string, unknown> }[];
        position?: { x: number; y: number; width?: number; height?: number };
    }[];
}