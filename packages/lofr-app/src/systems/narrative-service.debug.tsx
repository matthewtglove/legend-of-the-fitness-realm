import { LofrNarrativeIntent, LofrNarrativeService } from './lofr-system-types';
import { createObservable } from './observable';

export const createNarrativeServiceDebug = () => {
    const state = createObservable<LofrNarrativeIntent>({
        key: `narrative.debug.intro`,
        defaultDialog: `Welcome to the Legend of the Fitness Realm! Your adventure begins now.`,
        data: {},
    });

    const service: LofrNarrativeService = {
        say: (intent: LofrNarrativeIntent) => state.next(intent),
        observe: () => state,
    };

    return { narrativeService: service };
};
