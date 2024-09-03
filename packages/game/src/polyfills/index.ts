export {};

declare global {
    interface Array<T> {
        findLast(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: unknown): undefined | T;
        findLastIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: unknown): number;
    }
}

if (!Array.prototype.findLast) {
    Array.prototype.findLast = function (callback) {
        for (let i = this.length - 1; i >= 0; i--) {
            const value = this[i];
            if (callback(value, i, this)) {
                return value;
            }
        }
        return undefined;
    };

    Array.prototype.findLastIndex = function (callback) {
        for (let i = this.length - 1; i >= 0; i--) {
            const value = this[i];
            if (callback(value, i, this)) {
                return i;
            }
        }
        return -1;
    };
}
