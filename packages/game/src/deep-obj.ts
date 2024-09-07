export const cloneDeep = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};

export type DeepDiff<T> =
    | undefined
    | null
    | {
          [P in keyof T]?: DeepDiff<T[P]>;
      };

export const deepDiff = <T>(a: T, b: T): undefined | null | DeepDiff<T> => {
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
    const diff: DeepDiff<T> = {};
    for (const k in a) {
        if (!(k in b)) {
            // removed field
            diff[k] = null;
            hasChangedField = true;
        }

        const fieldValue = deepDiff(a[k], b[k]);
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

    if (`id` in b) {
        // show id if fields have changed
        (diff as Record<string, unknown>)[`id`] = b[`id`];
    }

    return diff;
};
