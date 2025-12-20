import { useEffect, useState } from 'react';
import { LofrDirectorState, LofrMiniGame, LofrNarrativeService, LofrUserStateBase } from '../systems/lofr-system-types';

export const MiniGameView = (props: {
    path: string;
    exportName?: string;
    userState: LofrUserStateBase;
    directorState: LofrDirectorState;
    narrativeService: LofrNarrativeService;
    onDone: () => void;
}) => {
    const [miniGameModule, setMiniGameModule] = useState(undefined as undefined | LofrMiniGame);
    const [MiniGameComponent, setMiniGameComponent] = useState(
        undefined as undefined | Awaited<ReturnType<LofrMiniGame[`load`]>>,
    );
    useEffect(() => {
        (async () => {
            const miniGame = (await import(/* @vite-ignore */ props.path).then((mod) => ({
                default: mod[props.exportName ?? `default`] ?? mod.default,
            }))) as LofrMiniGame;
            setMiniGameModule(miniGame);

            const comp = await miniGame.load();
            setMiniGameComponent(() => comp);
        })();
    }, [props.path, props.exportName]);

    return (
        <>
            <div className="flex flex-col w-full h-full gap-1">
                <div className="text-xs">Title: {miniGameModule?.title}</div>
                {MiniGameComponent && <MiniGameComponent.GameComponent {...props} />}
            </div>
        </>
    );
};
