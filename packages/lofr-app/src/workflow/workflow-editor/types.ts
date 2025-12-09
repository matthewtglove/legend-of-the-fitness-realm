export type WorkflowObservable<T> = {
    name?: string;
    lastValue: T;
    subscribe: (callback: (data: T) => void) => { unsubscribe: () => void };
};

export type WorkflowObservableLike<T> = T | WorkflowObservable<T>;
export const toObservable = <T>(value: WorkflowObservableLike<T>): WorkflowObservable<T> => {
    if (typeof value === `object` && value !== null && `subscribe` in value && typeof value.subscribe === `function`) {
        return value as WorkflowObservable<T>;
    }
    return {
        ...createNamedObject(),
        lastValue: value as T,
        subscribe: (callback: (data: T) => void) => {
            callback(value as T);
            return { unsubscribe: () => { } };
        },
    };
}

let uniqueIdCounter = 0;
export const createNamedObject = (defaultValue?: string) => {
    let name = defaultValue ?? `n_${uniqueIdCounter++}`;
    return {
        get name() { return name; },
        set name(n: string) { name = n; },
    };
}

export type WorkflowEditorController = {
    setWorkflowServerUrl: (url: string) => void;
    setWorkflowMetadataPath: (path: string) => Promise<void>;
    addTextNode: (args: { id: string, content: WorkflowObservableLike<string> }) => WorkflowNodeAddResult<{
        content: WorkflowObservable<string>;
    }>;
    addTextFileNode: (args: { id: string, path: string }) => void;
    addComponent: (args: { id: string, path: string, exportName: string }) => void;
};

export type WorkflowNodeTypeLoadResult<
    TInputs extends Record<string, WorkflowObservable<unknown>>,
    TOutputs extends Record<string, WorkflowObservable<unknown>>,
> = {
    get name(): string;
    set name(value: string);
    inputs: TInputs,
    outputs: TOutputs,
};

export type WorkflowNodeAddResult<
    TOutputs extends Record<string, WorkflowObservable<unknown>>,
> = TOutputs;

export type WorkflowNodeTypeArgs<
    TArgs extends Record<string, unknown>,
    TInputs extends Record<string, WorkflowObservable<unknown>>,
    TOutputs extends Record<string, WorkflowObservable<unknown>>,
> = {
    typeName: string,
    load: (args: TArgs) => WorkflowNodeTypeLoadResult<TInputs, TOutputs>,
    Component: React.ComponentType<{
        data: {
            inputs: TInputs,
            outputs: TOutputs,
        }
    }>;
};

export type WorkflowNodeType<
    TArgs extends Record<string, unknown>,
    TInputs extends Record<string, WorkflowObservable<unknown>>,
    TOutputs extends Record<string, WorkflowObservable<unknown>>,
> = WorkflowNodeTypeArgs<TArgs, TInputs, TOutputs>;
export type WorkflowNodeTypes = Record<string, WorkflowNodeType<Record<string, unknown>, Record<string, WorkflowObservable<unknown>>, Record<string, WorkflowObservable<unknown>>>>;

export type WorkflowRegistry = {
    nodeTypes: WorkflowNodeTypes;
    registerNodeType: <
        TArgs extends Record<string, unknown>,
        TInputs extends Record<string, WorkflowObservable<unknown>>,
        TOutputs extends Record<string, WorkflowObservable<unknown>>,
    >(args: WorkflowNodeTypeArgs<TArgs, TInputs, TOutputs>) => WorkflowNodeType<TArgs, TInputs, TOutputs>;
};
export const createRegistry = (): WorkflowRegistry => {
    const nodeTypes = {} as WorkflowNodeTypes;

    return {
        get nodeTypes() {
            return nodeTypes;
        },
        registerNodeType: (args) => {
            console.log(`Registered node type: ${args.typeName}`, args);
            const nodeType = args;
            nodeTypes[args.typeName] = args as unknown as WorkflowNodeTypes[string];
            return nodeType;
        },
    };
};