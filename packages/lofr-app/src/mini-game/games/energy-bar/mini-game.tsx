import { LofrMiniGame } from '../../../systems/lofr-system-types';
import { useObservable } from '../../../systems/observable';
import { AnimationView } from '../../animation-view';

export const MiniGame_EnergyBar: LofrMiniGame = {
    title: `Energy Bar`,
    defaultTheme: {
        assets: [],
    },
    load: async () => {
        const { energyBarAnimation } = await import(`./energy-bar`);
        return {
            GameComponent: (props) => {
                const { newData: userStateData } = useObservable(props.userState.observe()) ?? {};
                const gamePaused = useObservable(props.directorState.observeGamePaused()) ?? {};
                const sleepCyclesCompleted = (userStateData?.sleepCyclesCompleted ?? 0) as number;
                const endCharge = sleepCyclesCompleted * 20;

                return (
                    <AnimationView
                        animation={energyBarAnimation}
                        animationArgs={{
                            speed: 100,
                            startCharge: 0,
                            endCharge,
                        }}
                        isPaused={gamePaused}
                    />
                );
            },
        };
    },
};
