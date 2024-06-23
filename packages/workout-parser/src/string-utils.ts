export const splitWithRegex = (
    text: string,
    regex: RegExp,
): { part: string; matchBefore?: string; matchAfter?: string }[] => {
    const parts: string[] = [];
    const matchParts: string[] = [];
    let remaining = text;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const match = remaining.match(regex);
        if (!match) {
            parts.push(remaining);
            break;
        }
        const [part, ...rest] = remaining.split(match[0]);
        if (!part) {
            throw new Error(`part should exist: ${text}`);
        }
        parts.push(part);
        matchParts.push(match[0]);
        remaining = rest.join(match[0]);
    }

    return parts.map((part, index) => {
        // return {
        //     part,
        //     matchBefore: index === 0 ? undefined : matchParts[index - 1],
        //     matchAfter: index === matchParts.length ? undefined : matchParts[index],
        // };
        return {
            part,
            matchBefore: matchParts[index - 1] ?? undefined,
            matchAfter: matchParts[index] ?? undefined,
        };
    });
};
