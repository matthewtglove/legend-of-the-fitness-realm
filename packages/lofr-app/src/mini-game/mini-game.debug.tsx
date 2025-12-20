import { useEffect, useState } from 'react';
import { LofrDirectorState, LofrMiniGame, LofrNarrativeService, LofrUserStateBase } from '../systems/lofr-system-types';

export const MiniGameView = (props: {
    miniGamePath: string;
    miniGameExportName?: string;
    userState: LofrUserStateBase;
    directorState: LofrDirectorState;
    narrativeService: LofrNarrativeService;
    onDone?: () => void;
}) => {
    const [miniGameModule, setMiniGameModule] = useState(undefined as undefined | LofrMiniGame);
    const [MiniGameComponent, setMiniGameComponent] = useState(
        undefined as undefined | Awaited<ReturnType<LofrMiniGame[`load`]>>,
    );
    useEffect(() => {
        (async () => {
            try {
                const miniGameCodeModule = await import(/* @vite-ignore */ props.miniGamePath);
                const miniGame =
                    miniGameCodeModule[props.miniGameExportName ?? `default`] ??
                    (miniGameCodeModule.default as LofrMiniGame);
                setMiniGameModule(miniGame);

                const comp = await miniGame.load();
                setMiniGameComponent(() => comp);
            } catch (e) {
                console.error(
                    `Failed to load mini-game from path: ${props.miniGamePath}[${props.miniGameExportName}]`,
                    {
                        props,
                        e,
                    },
                );
            }
        })();
    }, [props.miniGamePath, props.miniGameExportName]);

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
                {/* <div className="text-xs">Def: {JSON.stringify(miniGameModule)}</div> */}
                <div className="text-xs">
                    MiniGame: {props.miniGamePath}[{props.miniGameExportName}]
                </div>
                <div className="text-xs">Title: {miniGameModule?.title}</div>
                {MiniGameComponent && hasDeps && (
                    <MiniGameComponent.GameComponent
                        {...props}
                        onDone={
                            props.onDone ??
                            (() => {
                                //ignore
                            })
                        }
                    />
                )}
            </div>
        </>
    );
};
