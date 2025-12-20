import { LofrUserState } from './lofr-system-types';
import { createObservable } from './observable';

type UserStateData = {
    name: string;
    race: string;
    fighterClass: string;
    level: number;
    experience: number;
    sleepCyclesCompleted: number;
};
export const createUserState = (initial: UserStateData): LofrUserState<UserStateData> => {
    const data = createObservable<{ newData: UserStateData; changed: Partial<UserStateData> }>({
        newData: initial,
        changed: {},
    });
    return {
        get data() {
            return data.lastValue!.newData;
        },
        update: (changed: Partial<UserStateData>) => {
            data.next({
                newData: {
                    ...data.lastValue!.newData,
                    ...changed,
                },
                changed,
            });
        },
        observe: () => data,
    };
};
