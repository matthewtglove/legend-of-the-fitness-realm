import { useEffect, useState } from "react";
import { WorkflowObservable } from "./types";

type MaybeLike<T> = T extends undefined ? undefined | T : NonNullable<T>;
export const useObservable = <T>(value: undefined | WorkflowObservable<T>): MaybeLike<T> => {
    const [state, setState] = useState({ value: value?.lastValue });

    useEffect(() => {
        const subscription = value?.subscribe((data: T) => {
            setState({ value: data });
        });
        return () => {
            subscription?.unsubscribe();
        };
    }, [value]);

    return state.value as MaybeLike<T>;
}

type ObservableOf<T> = {
    [K in keyof T]: T[K] extends WorkflowObservable<infer U> ? WorkflowObservable<U> : T[K] extends PromiseLike<infer U> ? WorkflowObservable<U> : WorkflowObservable<T[K]>;
};
export const useObservableRecord = <TRecord extends Record<string, unknown>>(value: undefined | ObservableOf<TRecord>): TRecord => {
    const [state, setState] = useState({
        value: (() => {
            const init = {} as Record<string, unknown>;
            Object.entries(value ?? {}).forEach(([key, obs]) => {
                init[key] = obs?.lastValue;
            });
            return init
        })() as undefined | Record<string, unknown>
    });

    useEffect(() => {
        const subs = [] as ({ unsubscribe: () => void })[];
        Object.entries(value ?? {}).forEach(([key, obs]) => {
            const subscription = obs?.subscribe((data: unknown) => {
                setState((s) => ({ value: { ...(s.value ?? {}), [key]: data } }));
            });
            if (subscription) {
                subs.push(subscription);
            }
        });
        return () => {
            subs.forEach((s) => s.unsubscribe());
        };
    }, [value, ...Object.values(value ?? {})]);

    return state.value as TRecord;
}