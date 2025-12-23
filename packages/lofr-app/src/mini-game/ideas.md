### User story

#### Night Prep

The user should open the app at night and play a short mini-game to commit to sleeping on time and having everything ready to exercise in the morning.

#### Morning Rise

The user should open the app in the morning and play a short mini-game to wake up and celebrate getting up on time and commit to the daily exercise.

### Types

```ts
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

export type Animation<TArgs extends Record<string, unknown>, TResult extends Record<string, unknown>> = {
    setup: (canvas: HTMLCanvasElement) => {
        start: (args: TArgs) => void;
        stop: () => void;
        pause: (isPaused: boolean) => void;
        done: Observable<{kind: `completed` | `stopped`, result: TResult}}>;
    };
};
```

### Minigame Ideas
