import { useEffect, useRef, useState } from 'react';

export type ErrorData = {
    message: string;
    severity?: `error` | `warning` | `info`;
    error?: unknown;
    retryCallback?: () => void;
};

// Helpers
function sameArrayContents<T>(a: null | undefined | T[], b?: null | undefined | T[]) {
    if (a === b) {
        return true;
    }
    if (a == null && b == null) {
        return true;
    }
    if (a == null || b == null) {
        return false;
    }
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

type TDoWork = (doWorkInner: (stopIfObsolete: () => void) => Promise<void>, getContext?: () => unknown[]) => void;

export function useMounted() {
    const mounted = useRef(true);
    useEffect(
        () => {
            // remount
            mounted.current = true;

            // Unmount on unsub
            return () => {
                mounted.current = false;
            };
        },
        [
            /* Init Only */
        ],
    );
    return { mounted };
}

/** Automatically handle loading and error objects with asyncronous calls
 * @return The { loading, error, doWork } values
 * @example
 *
 *      const { loading, error, doWork } = ChatHooks.useAutoLoadingError();
 *      ...
 *          doWork(async (stopIfObsolete) => {
 *              ...
 *              const result = async DoAsyncWork());
 *              stopIfObsolete(); // Stop work if component has been unmounted, or if contextValues have changed since beginning of doWork
 *              ...
 *              setResult(result);
 *          }, () => [ contextValueA, contextValueB ]); // Optional context values to stop work if changed
 *
 */
export function useAsyncWorker() {
    const { mounted } = useMounted();
    const [loadingError, setLoadingError] = useState({
        loading: false,
        error: null as null | ErrorData,
    });

    const UNMOUNTED = `unmounted`;
    const CHANGED_CONTEXT = `changedContext`;

    const doWork: TDoWork = (
        doWorkInner: (stopIfObsolete: () => void) => Promise<void>,
        getContext?: () => unknown[],
    ) => {
        let contextInit = undefined as undefined | unknown[];

        const stopIfObsolete = () => {
            if (!mounted.current) {
                // eslint-disable-next-line @typescript-eslint/no-throw-literal
                console.log(`stopIfObsolete UNMOUNTED`);
                throw UNMOUNTED;
            }
            const c = getContext?.();

            if (!sameArrayContents(contextInit, c)) {
                // eslint-disable-next-line @typescript-eslint/no-throw-literal
                console.log(`stopIfObsolete CHANGED_CONTEXT`);
                throw CHANGED_CONTEXT;
            }
        };

        const doCall = async () => {
            contextInit = getContext?.();
            setLoadingError({ loading: true, error: null });

            try {
                try {
                    await doWorkInner(stopIfObsolete);
                    stopIfObsolete();
                    setLoadingError({ loading: false, error: null });
                } catch (error) {
                    // Ignore unmounted or changed context
                    if (error !== UNMOUNTED && error !== CHANGED_CONTEXT) {
                        throw error;
                    }
                }
            } catch (errorRaw) {
                const error = errorRaw as ErrorData;
                // console.log(`doWork catch`, { err: error });

                if (!mounted.current) {
                    // console.warn(`doWork Error when not Mounted`, { err: error });
                    return;
                }

                setLoadingError({
                    loading: false,
                    error: {
                        message: error.message ?? `Unknown Error in doWork`,
                        severity: error.severity,
                        error,
                        retryCallback: doCall,
                    },
                });
            }
        };

        // Start Async
        (async () => await doCall())();
    };

    return { loading: loadingError.loading, error: loadingError.error, doWork };
}
