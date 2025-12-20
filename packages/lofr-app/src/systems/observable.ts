import { Observable } from "./lofr-system-types";

export type Subject<T> = Observable<T> & {
    next: (value: T) => void;
};

export const createObservable = <T,>(initialValue: T): Subject<T> => {
    let value = initialValue;
    const observers: Array<(value: T) => void> = [];
    return {
        get lastValue() {
            return value;
        },
        subscribe: (callback: (value: T) => void) => {
            observers.push(callback);
            // immediately notify the new subscriber of the current value
            callback(value);
            return {
                unsubscribe: () => {
                    const index = observers.indexOf(callback);
                    if (index !== -1) {
                        observers.splice(index, 1);
                    }
                },
            };
        },
        next: (newValue: T) => {
            value = newValue;
            for (const observer of observers) {
                observer(newValue);
            }
        },
    };
};