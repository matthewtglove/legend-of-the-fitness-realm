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