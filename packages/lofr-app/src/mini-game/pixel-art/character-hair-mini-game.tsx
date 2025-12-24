import { LofrMiniGame } from '../../systems/lofr-system-types';
import { useObservable } from '../../systems/observable';
import { AnimationView } from '../animation-view';

export const MiniGame_CharacterHair: LofrMiniGame = {
    title: `Character Hair`,
    defaultTheme: {
        assets: [],
    },
    load: async () => {
        const { characterHairAnimation } = await import(`./character-hair-animation`);
        return {
            GameComponent: (props) => {
                const { newData: userStateData } = useObservable(props.userState.observe()) ?? {};
                const gamePaused = useObservable(props.directorState.observeGamePaused()) ?? {};
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const sleepCyclesCompleted = (userStateData?.sleepCyclesCompleted ?? 0) as number;

                return (
                    <AnimationView
                        animation={characterHairAnimation}
                        animationArgs={
                            {
                                // empty
                            }
                        }
                        isPaused={gamePaused}
                        debug={props.debug}
                    />
                );
            },
        };
    },
};
