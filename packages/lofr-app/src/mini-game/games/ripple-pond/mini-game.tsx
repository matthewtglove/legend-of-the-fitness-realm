import { LofrMiniGame } from '../../../systems/lofr-system-types';
import { useObservable } from '../../../systems/observable';
import { AnimationView } from '../../animation-view';

export const MiniGame_RipplePondGame: LofrMiniGame = {
    title: `Ripple Pond`,
    defaultTheme: {
        assets: [],
    },
    load: async () => {
        const { RipplePondGame } = await import(`./animation`);
        return {
            GameComponent: (props) => {
                const { newData: userStateData } = useObservable(props.userState.observe()) ?? {};
                const gamePaused = useObservable(props.directorState.observeGamePaused()) ?? {};
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const sleepCyclesCompleted = (userStateData?.sleepCyclesCompleted ?? 0) as number;

                return (
                    <AnimationView
                        animation={RipplePondGame}
                        animationArgs={{
                            leafCount: 15,
                            rippleSpeed: 15,
                            maxRippleRadius: 250,
                        }}
                        isPaused={gamePaused}
                        debug={props.debug}
                    />
                );
            },
        };
    },
};
