import { MiniGame_CharacterHair } from "../pixel-art/character-hair-mini-game";
import { MiniGame_Constellation } from "./constellation/mini-game";
import { MiniGame_EnergyBar } from "./energy-bar/mini-game";
import { MiniGame_GymBagTetrisGame } from "./gym-bag-tetris/mini-game";
import { MiniGame_MistWiper } from "./mist-wiper/mini-game";
import { MiniGame_MomentumWheelGame } from "./momentum-wheel/mini-game";
import { MiniGame_PatternSprintGame } from "./pattern-sprint/mini-game";
import { MiniGame_RipplePondGame } from "./ripple-pond/mini-game";
import { MiniGame_RhythmRunGame } from "./rythym-run/mini-game";

export const miniGameList = [
    MiniGame_EnergyBar,
    MiniGame_MistWiper,
    MiniGame_Constellation,
    MiniGame_MomentumWheelGame,
    MiniGame_RipplePondGame,
    MiniGame_PatternSprintGame,
    MiniGame_GymBagTetrisGame,
    MiniGame_RhythmRunGame,
    MiniGame_CharacterHair,
];

export const getMiniGameTitles = () => {
    return { titles: miniGameList.map(x => x.title) };
}