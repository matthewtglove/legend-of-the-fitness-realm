import { useMemo } from 'react';
import { createAppSystems } from './app-systems';
import { useObservable } from './observable';
import { useWorkflowInstrumentation } from '../workflow/workflow-editor/instrumentation';

export const AppMain = () => {
    const W = useWorkflowInstrumentation(`AppMain`);
    const systems = useMemo(() => createAppSystems(), []);
    W.add({
        ...systems,
    });

    const gameActivity = useObservable(systems.directorState.observeGameActivity());

    if (gameActivity === `mini-game`) {
        // TODO: display mini-game
    }

    return (
        <>
            <div>Empty</div>
        </>
    );
};
