import { useMemo } from 'react';
import { createAppSystems } from './app-systems';
import { useObservable } from './observable';
import { useWorkflowInstrumentation } from '../workflow/workflow-editor/instrumentation';
import { MiniGameView } from '../mini-game/mini-game.debug';

export const AppMain = () => {
    const W = useWorkflowInstrumentation(`AppMain`);
    const systems = useMemo(() => createAppSystems(), []);
    W.add({
        ...systems,
    });

    const gameActivity = useObservable(systems.directorState.observeGameActivity());

    if (gameActivity === `mini-game`) {
        return (
            <MiniGameView
                directorState={systems.directorState}
                narrativeService={systems.narrativeService}
                userState={systems.userState}
            />
        );
    }

    return (
        <>
            <div>Empty</div>
        </>
    );
};
