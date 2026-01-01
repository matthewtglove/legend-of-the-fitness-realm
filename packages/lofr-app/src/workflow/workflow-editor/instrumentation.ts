import { useMemo } from "react";

export const workflowInstrumentationGlobalState = [] as { name: string, state: Record<string, unknown> }[];

export const createWorkflowInstrumentationContext = (name: string) => {
    const state = {} as Record<string, unknown>;
    workflowInstrumentationGlobalState.push({ name, state });
    return {
        name,
        state,
        W: new Proxy({
            add: (obj: Record<string, unknown>) => {
                for (const key of Object.keys(obj)) {
                    state[key] = obj[key];
                }
            }
        } as Record<string, unknown> & { add: (obj: Record<string, unknown>) => void }, {
            set(target, prop, value) {
                target[String(prop)] = value;
                state[String(prop)] = value;
                return true;
            }
        }),
    };
}
// const w = createWorkflowInstrumentationContext(`global`);
// const test = w.W.myNum = 42;
// const test2 = test;
// console.log({ test2 });

export const useWorkflowInstrumentation = (name: string) => {
    // only use initial name
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => createWorkflowInstrumentationContext(name), []).W;
};