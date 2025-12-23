import { MiniGame_EnergyBar } from "./energy-bar/mini-game";
import { MiniGame_MistWiper } from "./mist-wiper/mini-game";

export const miniGameList = [
    MiniGame_EnergyBar,
    MiniGame_MistWiper,
];

export const getMiniGameTitles = () => {
    return { titles: miniGameList.map(x => x.title) };
}