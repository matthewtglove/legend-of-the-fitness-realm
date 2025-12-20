import { useState } from 'react';
import { LofrUserStateBase } from './lofr-system-types';
import { useObservable } from './observable';
import { createUserState } from './user-state';

export const createUserStateDebug = () => {
    return {
        userState: createUserState({
            name: `Rock Smasher`,
            race: `Dwarf`,
            fighterClass: `Warrior`,
            level: 1,
            experience: 0,
        }),
    };
};

export const UserStateDebugView = ({ userState }: { userState: LofrUserStateBase }) => {
    const userStateData = useObservable(userState.observe());

    const [newDataText, setNewDataText] = useState(JSON.stringify(userStateData?.newData ?? {}, null, 2));

    const updateData = () => {
        const newData = JSON.parse(newDataText);
        const changed: Partial<typeof newData> = {};
        for (const key of [...Object.keys(newData), ...Object.keys(userState.data)]) {
            if (userState.data[key] !== newData[key]) {
                changed[key] = newData[key] ?? null;
            }
        }
        userState.update(changed);
    };

    return (
        <>
            <div className="flex flex-col w-full h-full p-2 bg-white border border-gray-400 rounded">
                <div className="font-bold">Data:</div>
                <pre className="p-2 mt-1 overflow-auto text-xs bg-gray-100 border border-gray-300 rounded max-h-64">
                    {JSON.stringify(userStateData, null, 2)}
                </pre>
                <textarea
                    className="flex-1 w-full h-8 p-1 mt-2 text-xs border border-gray-400 rounded resize-none"
                    placeholder="Edit user data"
                    value={newDataText}
                    onChange={(e) => setNewDataText(e.target.value)}
                    onBlur={updateData}
                    onKeyDown={(e) => {
                        if (e.key === `Enter` && (e.ctrlKey || e.metaKey)) {
                            updateData();
                        }
                    }}
                    spellCheck={false}
                />
            </div>
        </>
    );
};
