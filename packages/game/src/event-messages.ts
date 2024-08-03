import { GameEvent } from './types';

const formatNameList = (names: string[]) => {
    if (names.length <= 0) {
        return `no one`;
    }
    if (names.length === 1) {
        return names[0];
    }
    if (names.length === 2) {
        return `${names[0]} and ${names[1]}`;
    }
    return `${names.slice(0, -1).join(`, `)}, and ${names[names.length - 1]}`;
};

const formatPlural = (countOrItems: number | string[], wordPlural: string, wordSingular?: string) => {
    const count = typeof countOrItems === `number` ? countOrItems : countOrItems.length;
    return count === 1 ? wordSingular ?? `${wordPlural}s` : wordPlural;
};

// const formatIs = (countOrItems: number | string[]) => {
//     return formatPlural(countOrItems, `are`, `is`);
// };

export const formatGameEventMessage = (event: GameEvent) => {
    if (event.kind === `story-review`) {
        const {
            //
            campaign,
            quest,
            location,
            playerNames,
        } = event;
        if (!campaign) {
            return `In ${location}, ${formatNameList(playerNames)} ${formatPlural(
                playerNames,
                `continue`,
            )} their quest to "${quest}".`;
        }
        return `In ${location}, ${formatNameList(playerNames.map((x) => `"${x}"`))} ${formatPlural(
            playerNames,
            `continue`,
        )} their quest to "${quest}" as part of their campaign: "${campaign}".`;
    }
    if (event.kind === `quest-objective`) {
        const { objective } = event;
        return `The party must "${objective}".`;
    }
    if (event.kind === `reveal-enemy`) {
        const { enemies } = event;
        return `You are surprised by ${formatNameList(enemies.map((x) => `${x.name} the ${x.race} ${x.class}`))}.`;
    }
    if (event.kind === `attack-enemy`) {
        const { player, enemies } = event;

        return `${player} attacks ${formatNameList(
            enemies.map((x) => `${x.healthStatus === `ok` ? `` : `${x.healthStatus}`} ${x.name}`),
        )}.`;
    }
    if (event.kind === `attack-enemy-outcome`) {
        const { player, enemies } = event;
        const defeatedEnemies = enemies.filter((x) => x.healthStatus === `defeated`);
        return `${player} hits ${formatNameList(enemies.map((x) => `${x.name} for ${x.damageSeverity} damage`))} ${
            !defeatedEnemies.length ? `` : ` and defeats ${formatNameList(defeatedEnemies.map((x) => x.name))}`
        }.`;
    }
    if (event.kind === `search-location-key-item`) {
        const { location, keyItem } = event;
        return `You search ${location} and find a ${keyItem}.`;
    }
    if (event.kind === `loot-enemy-key-item`) {
        const { player, enemy, keyItem } = event;
        return `${player} searches ${enemy} and finds a ${keyItem}.`;
    }
    if (event.kind === `move-location`) {
        const { playerNames, location, connection } = event;
        return `${formatNameList(playerNames)} ${
            !connection
                ? ` ${formatPlural(playerNames, `go`, `goes`)} `
                : `${formatPlural(playerNames, `enter`)} ${connection}`
        } to ${location}.`;
    }
    if (event.kind === `describe-location`) {
        const { location } = event;

        // random adjectives
        const getRandomAdjective = () => {
            const adjectives = [
                `spooky`,
                `dark`,
                `dank`,
                `mysterious`,
                `foggy`,
                `enchanted`,
                `haunted`,
                `creepy`,
                `eerie`,
                `gloomy`,
                `grim`,
                `horrible`,
                `macabre`,
                `morbid`,
                `shadowy`,
                `sinister`,
                `weird`,
                `abandoned`,
                `ancient`,
                `broken`,
                `crumbling`,
                `decayed`,
                `desolate`,
                `forgotten`,
                `ruined`,
                `shattered`,
                `silent`,
                `empty`,
                `hollow`,
                `lifeless`,
                `quiet`,
                `still`,
                `calm`,
                `peaceful`,
                `serene`,
                `tranquil`,
                `unspoiled`,
                `beautiful`,
                `charming`,
                `delightful`,
                `enchanting`,
                `exquisite`,
                `gorgeous`,
                `lovely`,
                `picturesque`,
                `scenic`,
                `splendid`,
                `attractive`,
                `elegant`,
                `fashionable`,
                `glamorous`,
                `handsome`,
                `luxurious`,
                `opulent`,
                `refined`,
                `stylish`,
                `trendy`,
                `comfortable`,
                `cozy`,
                `homely`,
                `intimate`,
                `relaxed`,
                `warm`,
                `welcoming`,
                `clean`,
                `fresh`,
                `neat`,
            ];
            return adjectives[Math.floor(Math.random() * adjectives.length)] ?? `dark`;
        };

        const adjectives = [
            ...new Set(
                [getRandomAdjective(), getRandomAdjective(), getRandomAdjective()].slice(
                    0,
                    Math.floor(Math.random() * 3) + 1,
                ),
            ),
        ];
        return `${location} is ${formatNameList(adjectives)}.`;
    }

    return `I don't know what's going on. I'm just a simple function. I don't know what to do. To-do: Add the other event messages.`;
};
