import tickSoundUrl from '../assets/wooden-click.mp3';
import { GameEventResponse } from '@lofr/game';

const parseAudioDirectory = (directory: string, filenames: string) => {
    return filenames
        .split(`\n`)
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => `${directory}/${url}`);
};

export const createSoundManager = () => {
    const state = {
        enabled: true,
        enabledGameSounds: true,
        tickSound: new Audio(tickSoundUrl),
        gameAudioSet: new Map<string, HTMLAudioElement>(),
        // ambientSounds
        ambientSoundUrls: [
            `/sounds/step.mp3`,
            ...parseAudioDirectory(
                `/sounds/RPGSounds_Kenney`,
                `
beltHandle1.ogg
beltHandle2.ogg
bookClose.ogg
bookFlip1.ogg
bookFlip2.ogg
bookFlip3.ogg
bookOpen.ogg
bookPlace1.ogg
bookPlace2.ogg
bookPlace3.ogg
chop.ogg
cloth1.ogg
cloth2.ogg
cloth3.ogg
cloth4.ogg
clothBelt.ogg
clothBelt2.ogg
creak1.ogg
creak2.ogg
creak3.ogg
doorClose_1.ogg
doorClose_2.ogg
doorClose_3.ogg
doorClose_4.ogg
doorOpen_1.ogg
doorOpen_2.ogg
drawKnife1.ogg
drawKnife2.ogg
drawKnife3.ogg
dropLeather.ogg
footstep00.ogg
footstep01.ogg
footstep02.ogg
footstep03.ogg
footstep04.ogg
footstep05.ogg
footstep06.ogg
footstep07.ogg
footstep08.ogg
footstep09.ogg
handleCoins.ogg
handleCoins2.ogg
handleSmallLeather.ogg
handleSmallLeather2.ogg
knifeSlice.ogg
knifeSlice2.ogg
license.txt
metalClick.ogg
metalLatch.ogg
metalPot1.ogg
metalPot2.ogg
metalPot3.ogg`,
            ),
        ],
        defeatEnemySoundUrls: [
            ...parseAudioDirectory(
                `/sounds/monster-death`,
                `
deathb.wav
deathd.wav
deathe.wav
deathr.wav
deaths.wav
grunt1.wav
grunt2.wav
painb.wav
paind.wav
paine.wav
painp.wav
painr.wav
pains.wav
piggrunt1.wav
piggrunt2.wav`,
            ),
        ],
        attackEnemySoundUrls: [
            ...parseAudioDirectory(
                `/sounds/battle`,
                `
Bow.wav
swish_2.wav
swish_3.wav
swish_4.wav`,
            ),
        ],
        battleStartSoundUrls: [
            ...[...new Array(17)].map((_, i) => `/sounds/monster-sfx-pack-2/monster-${i + 1}.wav`),
            ...[...new Array(18)].map((_, i) => `/sounds/monsters/monster-${i + 1}.wav`),
        ],
        keyItemSoundUrls: [
            ...parseAudioDirectory(
                `/sounds/8-Bit-Sounds`,
                `
Climb_Rope_Loop_00.mp3
Collect_Point_00.mp3
Collect_Point_01.mp3
Collect_Point_02.mp3
Craft_00.mp3
Explosion_00.mp3
Explosion_01.mp3
Explosion_02.mp3
Explosion_03.mp3
Explosion_04.mp3
Hero_Death_00.mp3
Hit_00.mp3
Hit_01.mp3
Hit_02.mp3
Hit_03.mp3
Jingle_Achievement_00.mp3
Jingle_Achievement_01.mp3
Jingle_Lose_00.mp3
Jingle_Lose_01.mp3
Jingle_Win_00.mp3
Jingle_Win_01.mp3
Jump_00.mp3
Jump_01.mp3
Jump_02.mp3
Jump_03.mp3
Menu_Navigate_00.mp3
Menu_Navigate_01.mp3
Menu_Navigate_02.mp3
Menu_Navigate_03.mp3
Open_00.mp3
Open_01.mp3
Pickup_00.mp3
Pickup_01.mp3
Pickup_02.mp3
Pickup_03.mp3
Pickup_04.mp3
Shoot_00.mp3
Shoot_01.mp3
Shoot_02.mp3
Shoot_03.mp3
                `,
            ),
        ],
        questStartSoundUrls: [
            ...parseAudioDirectory(
                `/sounds/Start_Sounds_II_BY_jalastram`,
                `
Start_Sounds_011.wav
Start_Sounds_012.wav
Start_Sounds_013.wav
Start_Sounds_014.wav
Start_Sounds_015.wav
Start_Sounds_016.wav
Start_Sounds_017.wav
Start_Sounds_018.wav
Start_Sounds_019.wav
Start_Sounds_020.wav
Start_Sounds_N2.mp3
                `,
            ),
        ],
    };

    return {
        toggleSound: () => {
            state.enabled = !state.enabled;
            // console.log(`toggleSound`, state.enabled);
            return state.enabled;
        },
        playTickSound: () => {
            if (!state.enabled) {
                return;
            }

            state.tickSound.play().catch((e) => console.error(`Failed to play sound:`, e));
        },
        playAmbientSound: () => {
            if (!state.enabled) {
                return;
            }
            playRandomSoundUrl(state.gameAudioSet, state.ambientSoundUrls);
        },
        playGameEventSound: (gameEvents: GameEventResponse) => {
            if (!state.enabledGameSounds) {
                return;
            }

            if (
                gameEvents.events.some((e) => e.kind === `loot-enemy-key-item` || e.kind === `search-location-key-item`)
            ) {
                playRandomSoundUrl(state.gameAudioSet, state.keyItemSoundUrls);
                return;
            }

            if (
                gameEvents.events.some((e) => e.kind === `attack-enemy-outcome` && e.enemies.some((e) => e.isDefeated))
            ) {
                playRandomSoundUrl(state.gameAudioSet, state.defeatEnemySoundUrls);
                return;
            }

            if (gameEvents.events.some((e) => e.kind === `attack-enemy-outcome`)) {
                playRandomSoundUrl(state.gameAudioSet, state.attackEnemySoundUrls);
                return;
            }

            if (gameEvents.events.some((e) => e.kind === `attack-enemy`)) {
                playRandomSoundUrl(state.gameAudioSet, state.attackEnemySoundUrls);
                return;
            }

            if (gameEvents.events.some((e) => e.kind === `reveal-enemy`)) {
                playRandomSoundUrl(state.gameAudioSet, state.battleStartSoundUrls);
                return;
            }
            if (gameEvents.events.some((e) => e.kind === `quest-objective`)) {
                playRandomSoundUrl(state.gameAudioSet, state.questStartSoundUrls);
                return;
            }

            // playRandomSound(state.defeatEnemySoundUrls);
        },
    };
};

const randomItem = <T>(items: T[]): undefined | T => items[Math.floor(Math.random() * items.length)];
const playRandomSoundUrl = (audioSet: Map<string, HTMLAudioElement>, items: string[]) => {
    const item = randomItem(items);
    if (!item) {
        return;
    }

    const audio = audioSet.has(item) ? audioSet.get(item) : new Audio(item);
    audio?.play().catch((err: unknown) => console.error(`Failed to play sound`, err));
};

export type SoundManager = ReturnType<typeof createSoundManager>;
