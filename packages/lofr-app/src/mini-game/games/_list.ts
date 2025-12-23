import { MiniGame_EnergyBar } from "./energy-bar/mini-game";

export const miniGameList = [
    MiniGame_EnergyBar
];

export const getMiniGameTitles = () => {
    return { titles: miniGameList.map(x => x.title) };
}