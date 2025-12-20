import { LofrUserState, LofrUserStateBase } from './lofr-system-types';
import { createObservable } from './observable';

type SimpleUserState = {
    name: string;
};
export const createUserState = (initial: SimpleUserState): LofrUserState<SimpleUserState> => {
    const data = createObservable<{ newData: SimpleUserState; changed: Partial<SimpleUserState> }>({
        newData: initial,
        changed: {},
    });
    return {
        get data() {
            return data.lastValue!.newData;
        },
        update: (changed: Partial<SimpleUserState>) => {
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
export const createUserState_debug = () => {
    return {
        userState: createUserState({
            name: `Debug User`,
        }),
    };
};

export const UserStateDebugView = ({ userState }: { userState: LofrUserStateBase }) => {
    return (
        <>
            <div className="p-2 bg-white border border-gray-400 rounded">
                <div className="mb-2 font-bold">User State Debug View</div>
                <div className="mb-2">
                    <div className="font-bold">Data:</div>
                    <pre className="p-2 mt-1 overflow-auto text-xs bg-gray-100 border border-gray-300 rounded max-h-64">
                        {JSON.stringify(userState.data, null, 2)}
                    </pre>
                </div>
            </div>
        </>
    );
};
