export const cloneDeep = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};

export const equalsDeep = <T>(a: T, b: T): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
};

export type DiffDeep<T> =
    | undefined
    | null
    | {
          [P in keyof T]?: DiffDeep<T[P]>;
      };

export const diffDeep = <T>(a: T, b: T): undefined | null | DiffDeep<T> => {
    if (a === b) {
        // undefined => no change
        return undefined;
    }

    if (b == null) {
        // null => removed
        return null;
    }

    if (a == null) {
        // new value
        return b;
    }

    if (typeof a !== `object` || typeof b !== `object`) {
        // new value
        return b;
    }

    let hasChangedField = false;
    const diff: DiffDeep<T> = {
        ...(`id` in b ? { id: b[`id`] } : {}),
    };
    for (const k in a) {
        if (!(k in b)) {
            // removed field
            diff[k] = null;
            hasChangedField = true;
        }

        const fieldValue = diffDeep(a[k], b[k]);
        if (fieldValue !== undefined) {
            hasChangedField = true;
            diff[k] = fieldValue;
        }
    }
    for (const k in b) {
        if (k in a) {
            continue;
        }

        // new field
        diff[k] = b[k];
        hasChangedField = true;
    }

    if (!hasChangedField) {
        return undefined;
    }

    return diff;
};
