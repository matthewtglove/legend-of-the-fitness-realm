import { AnimationView } from '../../mini-game/animation-view';
import { energyBarAnimation, EnergyBarArgs } from '../../mini-game/games/energy-bar/energy-bar';

export const MiniGame_EnergyBar = (props: EnergyBarArgs & { isPaused: boolean }) => {
    return <AnimationView animation={energyBarAnimation} animationArgs={props} isPaused={props.isPaused} />;
};
