import { useEffect, useState } from "react";
import { WorkflowObservable } from "./types";

export const useObservable = <T>(value: WorkflowObservable<T>): T => {
    const [state, setState] = useState(value.lastValue);

    useEffect(() => {
        const subscription = value.subscribe((data: T) => {
            setState(data);
        });
        return () => {
            subscription?.unsubscribe();
        };
    }, [value]);

    return state;
}