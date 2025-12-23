import { MiniGame_Constellation } from "./constellation/mini-game";
import { MiniGame_EnergyBar } from "./energy-bar/mini-game";
import { MiniGame_MistWiper } from "./mist-wiper/mini-game";
import { MiniGame_MomentumWheelGame } from "./momentum-wheel/mini-game";

export const miniGameList = [
    MiniGame_EnergyBar,
    MiniGame_MistWiper,
    MiniGame_Constellation,
    MiniGame_MomentumWheelGame
];

export const getMiniGameTitles = () => {
    return { titles: miniGameList.map(x => x.title) };
}