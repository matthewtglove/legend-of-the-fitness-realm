import { workflowInstrumentationContext, workflowInstrumentationGlobalState } from './instrumentation';
import {
    createObservable,
    ObservableOf,
    SubjectsOf,
    toObservable,
    WorkflowNodeType,
    WorkflowNodeTypes,
    WorkflowNodeTypeSimpleArgs,
    WorkflowObservable,
    WorkflowRegistry,
} from './types';

export const createRegistry = (): WorkflowRegistry => {
    const nodeTypes = {} as WorkflowNodeTypes;

    let nextInstanceId = 1;

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
        registerSimpleNodeType: <TInputs extends Record<string, unknown>, TOutputs extends Record<string, unknown>>(
            nodeTypeArgs: WorkflowNodeTypeSimpleArgs<TInputs, TOutputs>,
        ) => {
            console.log(`[registerSimpleNodeType] Registering simple node type: ${nodeTypeArgs.typeName}`, {
                nodeTypeArgs,
            });
            const nodeType: WorkflowNodeType<
                Record<string, unknown> & { id: string },
                ObservableOf<TInputs>,
                ObservableOf<TOutputs>
            > = {
                typeName: nodeTypeArgs.typeName,
                requires: nodeTypeArgs.requires,
                defaults: nodeTypeArgs.defaults,
                // execute: nodeTypeArgs.execute,
                load: (
                    loadArgs: Record<string, unknown> & {
                        id: string;
                        defaults?: { inputs?: Record<string, unknown>; outputs?: Record<string, unknown> };
                        inputs?: Record<string, unknown>;
                        outputs?: Record<string, unknown>;
                    },
                ) => {
                    console.log(`[registerSimpleNodeType:load] '${loadArgs.id}' loading called with args:`, {
                        loadArgs,
                        nodeTypeArgs,
                    });

                    const getSourceOptions = (handleId: string) => ({ source: { nodeId: loadArgs.id, handleId } });

                    const inputs = Object.fromEntries(
                        Object.entries({
                            ...nodeTypeArgs.defaults.inputs,
                            ...(loadArgs.defaults?.inputs ?? {}),
                            ...(loadArgs.inputs ?? {}),
                        }).map(([key, value]) => [
                            key,
                            loadArgs[key]
                                ? toObservable(loadArgs[key], getSourceOptions(key))
                                : toObservable(value, getSourceOptions(key)),
                        ]),
                    ) as ObservableOf<TInputs>;
                    const outputs = Object.fromEntries(
                        Object.entries({
                            ...nodeTypeArgs.defaults.outputs,
                            ...(loadArgs.defaults?.outputs ?? {}),
                            ...(loadArgs.outputs ?? {}),
                        }).map(([key, value]) => [key, createObservable(value, getSourceOptions(key))]),
                    ) as SubjectsOf<TOutputs>;

                    const update = async () => {
                        try {
                            const inputValues = Object.fromEntries(
                                Object.entries(inputs).map(([key, value]) => [key, value.lastValue]),
                            ) as TInputs;

                            const lengthInstrumentedBefore = workflowInstrumentationGlobalState.length;
                            const executePromise = nodeTypeArgs.execute(inputValues, {
                                id: loadArgs.id,
                                refresh: () => updateDebounced(`refresh`),
                            });
                            const instrumentedResult =
                                workflowInstrumentationGlobalState.length !== lengthInstrumentedBefore
                                    ? workflowInstrumentationGlobalState[workflowInstrumentationGlobalState.length - 1]
                                    : undefined;
                            const outputValues = await executePromise;

                            console.log(`[registerSimpleNodeType:update] '${loadArgs.id}'`, {
                                inputValues,
                                outputValues,
                                instrumentedResult,
                            });

                            for (const key in outputValues) {
                                if (outputs[key]) {
                                    outputs[key].next(outputValues[key]);
                                    continue;
                                }
                                outputs[key] = createObservable(outputValues[key]) as (typeof outputs)[typeof key];
                            }

                            if (instrumentedResult) {
                                console.log(`[registerSimpleNodeType:update] '${loadArgs.id}' Instrumented State:`, {
                                    instrumentedResult,
                                });

                                const instrumentedOutputValues = instrumentedResult.state as TOutputs;
                                for (const key in instrumentedOutputValues) {
                                    console.log(
                                        `[registerSimpleNodeType:update] '${loadArgs.id}' Setting instrumented output '${key}' to:`,
                                        {
                                            instrumentedResult,
                                            key,
                                            value: instrumentedOutputValues[key],
                                        },
                                    );
                                    const val = instrumentedOutputValues[key];
                                    if (outputs[key]) {
                                        if (val !== outputs[key].lastValue) {
                                            outputs[key].next(val);
                                        }
                                        continue;
                                    }
                                    outputs[key] = createObservable(val) as (typeof outputs)[typeof key];
                                }
                            }
                        } catch (e) {
                            console.error(
                                `[registerSimpleNodeType:update:catch] '${loadArgs.id}' Error getting input values`,
                                e,
                            );
                        }
                    };
                    let updateTimeout = 0 as unknown as ReturnType<typeof setTimeout>;
                    const updateDebounced = (label: string) => {
                        console.log(`[registerSimpleNodeType:updateDebounced] '${loadArgs.id}' ${label}`, {
                            // instance
                        });
                        clearTimeout(updateTimeout);
                        updateTimeout = setTimeout(update, 0);
                    };

                    const inputSubs: Record<string, { unsubscribe: () => void }> = {};
                    for (const key in inputs) {
                        inputSubs[key] = inputs[key].subscribe(
                            () => {
                                updateDebounced(`input:${key}:subscribe()`);
                            },
                            { skipCurrentValue: true },
                        );
                    }

                    // initialize outputs
                    updateDebounced(`initialization`);

                    console.log(`[registerSimpleNodeType:load] '${loadArgs.id}'loaded called with args:`, {
                        inputs,
                        outputs,
                        loadArgs,
                        nodeTypeArgs,
                    });
                    let lastArgs = loadArgs;
                    const instance = {
                        typeName: nodeTypeArgs.typeName,
                        requires: nodeTypeArgs.requires,
                        instanceId: nextInstanceId++,
                        inputs,
                        outputs,
                        refresh: () => {
                            updateDebounced(`refresh`);
                        },
                        update: (newArgsRaw: Record<string, unknown> & { id: string }) => {
                            const newArgs = newArgsRaw as typeof loadArgs;
                            // console.log(`[registerSimpleNodeType:instance:update] called with args:`, { args: newArgs });

                            let hasChanged = false;
                            const newInputs = newArgs.inputs ?? {};
                            for (const key in newInputs) {
                                if (newArgs.inputs?.[key] === lastArgs.inputs?.[key]) {
                                    continue;
                                }

                                console.log(`[registerSimpleNodeType:instance:update] '${loadArgs.id}'input changes:`, {
                                    newInput: newInputs[key],
                                    oldInput: lastArgs.inputs?.[key],
                                    key,
                                    newArgs,
                                    lastArgs,
                                    loadArgs,
                                });

                                hasChanged = true;
                                inputSubs[key]?.unsubscribe();

                                const obs = toObservable(
                                    newInputs[key],
                                    getSourceOptions(key),
                                ) as WorkflowObservable<unknown>;
                                (inputs as Record<string, WorkflowObservable<unknown>>)[key] = obs;

                                inputSubs[key] = obs.subscribe(
                                    () => {
                                        updateDebounced(`input:${key}:update:subscribe()`);
                                    },
                                    { skipCurrentValue: true },
                                );
                                updateDebounced(`input:${key}:update`);
                            }

                            lastArgs = newArgs;

                            // change instance obj to help with rerender?
                            if (hasChanged) {
                                return {
                                    hasChanged,
                                    instance,
                                };
                            }

                            return {
                                hasChanged: false,
                                instance,
                            };
                        },
                    };

                    return instance;
                },
                Component: (props) => {
                    return (
                        <workflowInstrumentationContext.Provider
                            value={{
                                nodeId: props.id,
                                callback: ({ key, value }) => {
                                    console.log(
                                        `[registerSimpleNodeType:Component] '${props.id}' Setting instrumented output '${key}' to:`,
                                        {
                                            key,
                                            value,
                                        },
                                    );
                                    const outputs = props.data.outputs as SubjectsOf<TOutputs>;
                                    const val = value as TOutputs[string];
                                    if (outputs[key]) {
                                        if (val !== outputs[key].lastValue) {
                                            outputs[key].next(val);
                                        }
                                        return;
                                    }
                                    (outputs as Record<string, WorkflowObservable<unknown>>)[key] = createObservable(
                                        val,
                                    ) as (typeof outputs)[typeof key];
                                },
                            }}
                        >
                            <nodeTypeArgs.Component {...props} />
                        </workflowInstrumentationContext.Provider>
                    );
                },
            };
            nodeTypes[nodeTypeArgs.typeName] = nodeType as unknown as WorkflowNodeTypes[string];

            console.log(`[registerSimpleNodeType] Registered simple node type: ${nodeTypeArgs.typeName}`, {
                nodeTypeArgs,
                nodeType,
                nodeTypes,
            });
            return nodeType;
        },
    };
};
