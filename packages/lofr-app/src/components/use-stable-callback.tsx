import { useRef } from 'react';

/** Ensure the item is always the last rendered value */
export const useStable = <T,>(stable: T) => {
    const ref = useRef(stable);
    ref.current = stable;
    return ref;
};

/** Ensure the callback is always the last rendered callback, so it has reference to the last state
 *
 * No need for dependencies, this will simply have access to the values that existed in the render
 * when it was created during the last render.
 */
export const useStableCallback = <TArgs extends unknown[], TReturn>(stable: (...args: TArgs) => TReturn) => {
    const ref = useRef(stable);
    ref.current = stable;
    const callback = useRef((...args: TArgs) => ref.current(...args));
    return callback.current;
};
