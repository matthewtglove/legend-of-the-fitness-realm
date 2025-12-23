import { LofrMiniGame } from '../../../systems/lofr-system-types';
import { useObservable } from '../../../systems/observable';
import { AnimationView } from '../../animation-view';

export const MiniGame_MistWiper: LofrMiniGame = {
    title: `Mist Wiper`,
    defaultTheme: {
        assets: [],
    },
    load: async () => {
        const { MistWiperGame } = await import(`./animation`);
        return {
            GameComponent: (props) => {
                const { newData: userStateData } = useObservable(props.userState.observe()) ?? {};
                const gamePaused = useObservable(props.directorState.observeGamePaused()) ?? {};
                const sleepCyclesCompleted = (userStateData?.sleepCyclesCompleted ?? 0) as number;

                return (
                    <AnimationView
                        animation={MistWiperGame}
                        animationArgs={{
                            difficulty: `easy`,
                            brushSize: sleepCyclesCompleted * 10,
                        }}
                        isPaused={gamePaused}
                        debug={props.debug}
                    />
                );
            },
        };
    },
};
