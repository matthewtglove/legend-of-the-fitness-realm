import { useEffect, useState } from 'react';
import { LofrDirectorState, LofrMiniGame, LofrNarrativeService, LofrUserStateBase } from '../systems/lofr-system-types';
import { miniGameList } from './games/_list';

export const MiniGameView = (props: {
    miniGameTitle?: string;
    userState: LofrUserStateBase;
    directorState: LofrDirectorState;
    narrativeService: LofrNarrativeService;
    onDone?: () => void;
}) => {
    const [miniGameTitle, setMiniGameTitle] = useState(props.miniGameTitle);
    useEffect(() => {
        setMiniGameTitle(props.miniGameTitle);
    }, [props.miniGameTitle]);

    const [MiniGameComponent, setMiniGameComponent] = useState(
        undefined as undefined | Awaited<ReturnType<LofrMiniGame[`load`]>>,
    );
    useEffect(() => {
        (async () => {
            try {
                const miniGame = miniGameList.find((x) => x.title === miniGameTitle);
                if (!miniGame) {
                    console.warn(`Mini game not found: ${miniGameTitle}`);
                    setMiniGameComponent(undefined);
                    return;
                }

                const comp = await miniGame.load();
                setMiniGameComponent(() => comp);
            } catch (e) {
                console.error(`Failed to load mini-game from path: ${miniGameTitle}`, {
                    props,
                    e,
                });
                setMiniGameComponent(undefined);
            }
        })();
    }, [miniGameTitle]);
    const hasDeps = props.userState && props.directorState && props.narrativeService;

    return (
        <>
            <div className="flex flex-col w-full h-full gap-1">
                {!hasDeps && (
                    <>
                        <div className="text-red-600">
                            Missing required dependencies!
                            {!props.userState && <div>- userState</div>}
                            {!props.directorState && <div>- directorState</div>}
                            {!props.narrativeService && <div>- narrativeService</div>}
                            {/* {!props.onDone && <div>- onDone</div>} */}
                        </div>
                    </>
                )}
                <select
                    className="p-1 text-black rounded bg-slate-100"
                    value={miniGameTitle}
                    onChange={(e) => setMiniGameTitle(e.target.value)}
                >
                    <option value={``} className="text-gray-600">
                        -- Select Mini Game --
                    </option>
                    {miniGameList.map((x) => (
                        <option key={x.title} value={x.title}>
                            {x.title}
                        </option>
                    ))}
                </select>

                <div className="text-xs">Mini Game: {miniGameTitle}</div>
                {MiniGameComponent && hasDeps && (
                    <div className="flex-1">
                        <MiniGameComponent.GameComponent
                            {...props}
                            debug={true}
                            onDone={
                                props.onDone ??
                                (() => {
                                    //ignore
                                })
                            }
                        />
                    </div>
                )}
            </div>
        </>
    );
};
