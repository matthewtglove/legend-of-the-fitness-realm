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
    let name = undefined as undefined | string;
    return {
        set name(n: undefined | string) { name = n; },
        get name() { return name; },
        lastValue: value as T,
        subscribe: (callback: (data: T) => void) => {
            callback(value as T);
            return { unsubscribe: () => { } };
        },
    };
}

export type WorkflowEditorController = {
    setWorkflowServerUrl: (url: string) => void;
    setWorkflowMetadataPath: (path: string) => Promise<void>;
    addTextConstantNode: (args: { id: string, content: string }) => void;
    addTextFileNode: (args: { id: string, path: string }) => void;
    addComponent: (args: { id: string, path: string, exportName: string }) => void;
};

export type WorkflowNodeTypeArgs<
    TArgs extends Record<string, unknown>,
    TInputs extends Record<string, WorkflowObservable<unknown>>,
    TOutputs extends Record<string, WorkflowObservable<unknown>>,
> = {
    load: (args: TArgs) => {
        inputs: TInputs,
        outputs: TOutputs,
    },
    Component: React.ComponentType<{
        data: {
            inputs: TInputs,
            outputs: TOutputs,
        }
    }>;
};

export type WorkflowNodeTypes = Record<string, WorkflowNodeTypeArgs<Record<string, unknown>, Record<string, WorkflowObservable<unknown>>, Record<string, WorkflowObservable<unknown>>>>;

export type WorkflowRegistry = {
    nodeTypes: WorkflowNodeTypes;
    registerNodeType: <
        TArgs extends Record<string, unknown>,
        TInputs extends Record<string, WorkflowObservable<unknown>>,
        TOutputs extends Record<string, WorkflowObservable<unknown>>,
    >(type: string, args: WorkflowNodeTypeArgs<TArgs, TInputs, TOutputs>) => void;
};