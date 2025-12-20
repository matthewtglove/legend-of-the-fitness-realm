import { LofrMiniGame } from '../../../systems/lofr-system-types';
import { useObservable } from '../../../systems/observable';

export const MiniGame_EnergyBar: LofrMiniGame = {
    title: `Energy Bar`,
    defaultTheme: {
        assets: [],
    },
    load: async () => {
        const { EnergyBarView } = await import(`./energy-bar-view`);
        return {
            GameComponent: (props) => {
                const { newData: userStateData } = useObservable(props.userState.observe()) ?? {};
                const sleepCyclesCompleted = (userStateData?.sleepCyclesCompleted ?? 0) as number;
                const endCharge = sleepCyclesCompleted * 20;

                return <EnergyBarView speed={100} startCharge={0} endCharge={endCharge} />;
            },
        };
    },
};
