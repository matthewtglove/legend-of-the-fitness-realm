export const randomizeOrder = <T>(array: T[]): T[] => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // random swap
        [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
    }
    return copy;
};
