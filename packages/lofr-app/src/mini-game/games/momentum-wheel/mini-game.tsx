import { LofrMiniGame } from '../../../systems/lofr-system-types';
import { useObservable } from '../../../systems/observable';
import { AnimationView } from '../../animation-view';

export const MiniGame_MomentumWheelGame: LofrMiniGame = {
    title: `Momentum Wheel`,
    defaultTheme: {
        assets: [],
    },
    load: async () => {
        const { MomentumWheelGame } = await import(`./animation`);
        return {
            GameComponent: (props) => {
                const { newData: userStateData } = useObservable(props.userState.observe()) ?? {};
                const gamePaused = useObservable(props.directorState.observeGamePaused()) ?? {};
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const sleepCyclesCompleted = (userStateData?.sleepCyclesCompleted ?? 0) as number;

                return (
                    <AnimationView
                        animation={MomentumWheelGame}
                        animationArgs={{
                            targetSpeed: Math.max(0.1, Math.min(2.5, sleepCyclesCompleted * 0.25)),
                        }}
                        isPaused={gamePaused}
                        debug={props.debug}
                    />
                );
            },
        };
    },
};
