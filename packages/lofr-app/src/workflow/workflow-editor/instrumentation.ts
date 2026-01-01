import { createContext, useContext, useEffect, useMemo } from "react";
import { createObservable } from "../../systems/observable";

export const workflowInstrumentationGlobalState = [] as { name: string, nodeId?: string, state: Record<string, unknown> }[];

export const createWorkflowInstrumentationContext = (name: string, nodeId?: string) => {
    const state = {} as Record<string, unknown>;
    const sub = createObservable(undefined as undefined | { key: string, value: unknown });
    workflowInstrumentationGlobalState.push({ name, nodeId, state });
    return {
        name,
        state,
        observe: sub,
        W: new Proxy({
            add: (obj: Record<string, unknown>) => {
                for (const key of Object.keys(obj)) {
                    console.log(`[createWorkflowInstrumentationContext:add] add`, { key, value: obj[key] });
                    state[key] = obj[key];
                    sub.next({ key, value: obj[key] });
                }
            }
        } as Record<string, unknown> & { add: (obj: Record<string, unknown>) => void }, {
            set(target, prop, value) {
                console.log(`[createWorkflowInstrumentationContext:set] set`, { key: String(prop), value });
                target[String(prop)] = value;
                state[String(prop)] = value;
                sub.next({ key: String(prop), value });
                return true;
            }
        }),
    };
}
// const w = createWorkflowInstrumentationContext(`global`);
// const test = w.W.myNum = 42;
// const test2 = test;
// console.log({ test2 });

export const workflowInstrumentationContext = createContext({ nodeId: undefined as undefined | string, callback: undefined as undefined | ((args: { key: string, value: unknown }) => void) });

export const useWorkflowInstrumentation = (name: string) => {
    const { nodeId, callback } = useContext(workflowInstrumentationContext);
    // only use initial name
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const context = useMemo(() => createWorkflowInstrumentationContext(name, nodeId), []);

    useEffect(() => {
        const sub = context.observe.subscribe((x) => {
            if (!x) return;
            const { key, value } = x;
            console.log(`[WorkflowInstrumentation:${context.name}] '${key}' changed to:`, value);
            if (callback) {
                callback({ key, value });
            }
        });
        return () => sub.unsubscribe();
    }, [nodeId, callback, context]);

    return context.W;
};