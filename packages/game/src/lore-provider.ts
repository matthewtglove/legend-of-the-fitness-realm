/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoreBuilder } from './lore/lore-builder';
import {
    GameCampaignId,
    GameCharacterId,
    GameKeyItemId,
    GameLocationId,
    GameLoreProvider,
    GamePlayerId,
    GameQuest,
    GameQuestId,
    GameState,
} from './types';

export const createGameLoreProvider = (loreBuilder: LoreBuilder): GameLoreProvider => {
    const getNextId = (state: GameState) => {
        const id = state._nextId;
        state._nextId++;
        return id;
    };

    return {
        getExerciseInfo: (exerciseName: string) => {
            return loreBuilder.getExerciseInfo_cached(exerciseName);
        },
        generatePlayerInfo: ({ state }) => {
            // Generate a random fantasy enemy name and role.
            return {
                id: `player-${getNextId(state)}` as GamePlayerId,
            };
        },
        generateEnemyInfo: ({ state, playerLevels, locationId, enemyDifficulty, campaignId, questId }) => {
            // Generate a random fantasy enemy name and role.
            const enemies = [
                { name: `Grimfang`, race: `Orc`, battleClass: `Warrior` },
                { name: `Bloodaxe`, race: `Orc`, battleClass: `Warrior` },
                { name: `Shadowreaper`, race: `Undead`, battleClass: `Rogue` },
                { name: `Inferno`, race: `Demon`, battleClass: `Mage` },
                { name: `Venomweaver`, race: `Spider`, battleClass: `Hunter` },
                { name: `Scorchwing`, race: `Dragon`, battleClass: `Dragonkin` },
                { name: `Mindbender`, race: `Human`, battleClass: `Mage` },
                { name: `Dreadlord`, race: `Maia`, battleClass: `Warlock` },
                { name: `Nightshade`, race: `Undead`, battleClass: `Rogue` },
                { name: `Skullcrusher`, race: `Orc`, battleClass: `Warrior` },
                { name: `Shadowstalker`, race: `Orc`, battleClass: `Rogue` },
                { name: `Bloodthirst`, race: `Orc`, battleClass: `Warrior` },
                { name: `Doomhammer`, race: `Orc`, battleClass: `Warrior` },
                { name: `Whisperwind`, race: `Gnome`, battleClass: `Mage` },
                { name: `Moonshadow`, race: `Elf`, battleClass: `Ranger` },
                { name: `Stormcaller`, race: `Orc`, battleClass: `Shaman` },
                { name: `Shadowfang`, race: `Vampire`, battleClass: `Rogue` },
                { name: `Ironbeard`, race: `Dwarf`, battleClass: `Warrior` },
                { name: `Starleaf`, race: `Elf`, battleClass: `Druid` },
                { name: `Firestorm`, race: `Human`, battleClass: `Mage` },
                { name: `Bloodclaw`, race: `Werewolf`, battleClass: `Warrior` },
                { name: `Necroshade`, race: `Undead`, battleClass: `Warlock` },
                { name: `Mistwhisper`, race: `Fairy`, battleClass: `Mage` },
                { name: `Ironheart`, race: `Dwarf`, battleClass: `Warrior` },
                { name: `Silversong`, race: `Elf`, battleClass: `Bard` },
                { name: `Dreadshadow`, race: `Demon`, battleClass: `Warlock` },
                { name: `Blazefury`, race: `Fire Elemental`, battleClass: `Elementalist` },
                { name: `Frostbite`, race: `Ice Elemental`, battleClass: `Elementalist` },
                { name: `Stormcaller`, race: `Air Elemental`, battleClass: `Elementalist` },
                { name: `Earthshaker`, race: `Earth Elemental`, battleClass: `Elementalist` },
                { name: `Shadowthief`, race: `Shadow Elemental`, battleClass: `Elementalist` },
                { name: `Sunstrike`, race: `Light Elemental`, battleClass: `Elementalist` },
                { name: `Voidwalker`, race: `Void Elemental`, battleClass: `Elementalist` },
                { name: `Dreamweaver`, race: `Dream Elemental`, battleClass: `Elementalist` },
                { name: `Bloodmoon`, race: `Lycanthrope`, battleClass: `Warrior` },
                { name: `Stargazer`, race: `Celestial Being`, battleClass: `Cleric` },
                { name: `Soulbinder`, race: `Spirit`, battleClass: `Warlock` },
                { name: `Doombringer`, race: `Death Knight`, battleClass: `Warrior` },
                { name: `Mistwalker`, race: `Ghost`, battleClass: `Rogue` },
                { name: `Serpentstrike`, race: `Naga`, battleClass: `Hunter` },
                { name: `Thunderhoof`, race: `Centaur`, battleClass: `Warrior` },
                { name: `Shadowclaw`, race: `Wraith`, battleClass: `Rogue` },
                { name: `Flameheart`, race: `Fire Spirit`, battleClass: `Mage` },
                { name: `Frostwhisper`, race: `Ice Spirit`, battleClass: `Mage` },
                { name: `Stormwing`, race: `Air Spirit`, battleClass: `Mage` },
                { name: `Earthguardian`, race: `Earth Spirit`, battleClass: `Mage` },
                { name: `Shadowdancer`, race: `Shadow Spirit`, battleClass: `Mage` },
                { name: `Sunseeker`, race: `Light Spirit`, battleClass: `Mage` },
                { name: `Voidseer`, race: `Void Spirit`, battleClass: `Mage` },
                { name: `Dreamweaver`, race: `Dream Spirit`, battleClass: `Mage` },
                { name: `Bloodborn`, race: `Werewolf`, battleClass: `Warrior` },
                { name: `Starcaller`, race: `Celestial Being`, battleClass: `Cleric` },
                { name: `Soulrender`, race: `Soul Eater`, battleClass: `Warlock` },
                { name: `Doomhowl`, race: `Death Knight`, battleClass: `Warrior` },
                { name: `Mistweaver`, race: `Ghost`, battleClass: `Rogue` },
                { name: `Serpentscale`, race: `Naga`, battleClass: `Hunter` },
                { name: `Thunderstrike`, race: `Centaur`, battleClass: `Warrior` },
                { name: `Shadowfang`, race: `Wraith`, battleClass: `Rogue` },
                { name: `Flameborn`, race: `Fire Spirit`, battleClass: `Mage` },
                { name: `Frostborn`, race: `Ice Spirit`, battleClass: `Mage` },
                { name: `Stormborn`, race: `Air Spirit`, battleClass: `Mage` },
                { name: `Earthborn`, race: `Earth Spirit`, battleClass: `Mage` },
                { name: `Shadowborn`, race: `Shadow Spirit`, battleClass: `Mage` },
                { name: `Sunborn`, race: `Light Spirit`, battleClass: `Mage` },
                { name: `Voidborn`, race: `Void Spirit`, battleClass: `Mage` },
                { name: `Dreamborn`, race: `Dream Spirit`, battleClass: `Mage` },
                { name: `Gorefang`, race: `Orc`, battleClass: `Warrior` },
                { name: `Venomfang`, race: `Reptilian`, battleClass: `Hunter` },
                { name: `Bonecrusher`, race: `Undead`, battleClass: `Warrior` },
                { name: `Rotclaw`, race: `Undead`, battleClass: `Rogue` },
                { name: `Nightshade`, race: `Demon`, battleClass: `Warlock` },
                { name: `Bloodsiren`, race: `Bird`, battleClass: `Mage` },
                { name: `Sludge`, race: `Amorphous`, battleClass: `Mage` },
                { name: `Ratfang`, race: `Rodent`, battleClass: `Rogue` },
                { name: `Webweaver`, race: `Spider`, battleClass: `Hunter` },
                { name: `Nightwing`, race: `Mammal`, battleClass: `Rogue` },
                { name: `Gorehowl`, race: `Hyena`, battleClass: `Warrior` },
                { name: `Skullcrusher`, race: `Giant`, battleClass: `Warrior` },
                { name: `Trollbane`, race: `Giant`, battleClass: `Warrior` },
                { name: `Hobgoblin`, race: `Goblinoid`, battleClass: `Rogue` },
                { name: `Shadowwraith`, race: `Undead`, battleClass: `Rogue` },
                { name: `Succubus`, race: `Demon`, battleClass: `Warlock` },
                { name: `Banshee`, race: `Undead`, battleClass: `Mage` },
                { name: `Gargoyle`, race: `Stone`, battleClass: `Warrior` },
                { name: `Ratfang`, race: `Lycanthrope`, battleClass: `Warrior` },
                { name: `Venomclaw`, race: `Insect`, battleClass: `Hunter` },
            ];
            const enemy = enemies[Math.floor(Math.random() * enemies.length)] ?? enemies[0]!;
            return {
                id: `enemy-${enemy.name.toLocaleLowerCase()}-${getNextId(state)}` as GameCharacterId,
                name: enemy.name,
                role: {
                    race: enemy.race,
                    class: enemy.battleClass,
                    enemyDifficulty,
                },
            };
        },
        generateCampaignInfo: ({ state, playerLevels, locationId, previousCampaignIds }) => {
            // Generate a random campaign name.
            return {
                id: `campaign-journey-of-the-one-true-ring-${getNextId(state)}` as GameCampaignId,
                name: `The Journey of the One True Ring`,
            };
        },
        generateQuestInfo: ({ state, playerLevels, locationId, campaignId, previousQuestIds, maxObjectiveCount }) => {
            // Generate a random quest name and objectives.
            const quests = [
                {
                    name: `Find the One True Ring`,
                    objectives: [
                        {
                            name: `Enter the Orc Caves`,
                            completionKeyItemName: `Orc Caves Key`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Find the Lake Cavern`,
                            completionKeyItemName: `Lake Cavern Key`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Discover the Ring`,
                            completionKeyItemName: `One True Ring`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Solve the Riddle`,
                            completionKeyItemName: `Riddle Solution`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Escape the Caves`,
                            completionKeyItemName: `Escape Route Map`,
                            canKeyItemBeHeld: true,
                        },
                    ],
                },
                {
                    name: `Escape the Wraith Riders`,
                    objectives: [
                        {
                            name: `Flee the Riders`,
                            completionKeyItemName: `Wraith Riders Map`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Cross the River`,
                            completionKeyItemName: `River Crossing Guide`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Find the Forest Path`,
                            completionKeyItemName: `Forest Path Map`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Lose the Pursuit`,
                            completionKeyItemName: `Pursuit Evasion Manual`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Reach the Elven City`,
                            completionKeyItemName: `Elven City Map`,
                            canKeyItemBeHeld: true,
                        },
                    ],
                },
                {
                    name: `Pass through the Mines of Moria`,
                    objectives: [
                        {
                            name: `Find the Hidden Entrance`,
                            completionKeyItemName: `Hidden Entrance Map`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Solve the Riddle`,
                            completionKeyItemName: `Riddle Solution`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Navigate the Mines`,
                            completionKeyItemName: `Mine Navigation Guide`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Avoid the Balrog`,
                            completionKeyItemName: `Balrog Avoidance Manual`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Discover the Exit`,
                            completionKeyItemName: `Exit Discovery Map`,
                            canKeyItemBeHeld: true,
                        },
                        {
                            name: `Escape the Mines`,
                            completionKeyItemName: `Mine Escape Route`,
                            canKeyItemBeHeld: true,
                        },
                    ],
                },
            ];

            const quest = quests[Math.floor(Math.random() * quests.length)] ?? quests[0]!;

            return {
                id: `quest-${quest.name.toLocaleLowerCase().replace(` `, `-`)}-${getNextId(state)}` as GameQuestId,
                name: quest.name,
                objectives: [
                    ...quest.objectives.map((x) => ({
                        name: x.name,
                        completionKeyItem: {
                            id: `key-${x.completionKeyItemName.toLocaleLowerCase()}-${getNextId(
                                state,
                            )}` as GameKeyItemId,
                            name: x.completionKeyItemName,
                            isVisible: x.canKeyItemBeHeld,
                            placement:
                                x.canKeyItemBeHeld && Math.random() > 0.25 ? (`enemy` as const) : (`location` as const),
                        },
                    })),
                ],
            };
        },
        generateLocationInfo: ({ state, campaignId, questId, nearbyLocationIds }) => {
            // prettier-ignore
            const locations = [
                { name: `Rivendell`, nearby: [`The Shire`, `Moria`, `Lothlórien`] },
                { name: `Moria`, nearby: [`Rivendell`, `Lothlórien`, `Isengard`] },
                { name: `Lothlórien`, nearby: [`Rivendell`, `Moria`, `Isengard`] },
                { name: `Isengard`, nearby: [`Moria`, `Lothlórien`, `Mount Doom`] },
                { name: `Mount Doom`, nearby: [`Isengard`] },
                { name: `Mirkwood`, nearby: [`Rivendell`, `Moria`, `Lothlórien`] },
                { name: `Gondor`, nearby: [`Minas Tirith`, `Rohan`, `Mordor`] },
                { name: `Minas Tirith`, nearby: [`Gondor`, `Rohan`, `Mordor`] },
                { name: `Rohan`, nearby: [`Gondor`, `Minas Tirith`, `Mordor`] },
                { name: `Mordor`, nearby: [`Gondor`, `Minas Tirith`, `Rohan`] },
                { name: `Hobbiton`, nearby: [`The Shire`, `Bree`, `Rivendell`] },
                { name: `Bree`, nearby: [`Hobbiton`, `Rivendell`, `Moria`] },
                { name: `Rivendell`, nearby: [`Hobbiton`, `Bree`, `Moria`] },
                { name: `Moria`, nearby: [`Bree`, `Rivendell`, `Lothlórien`] },
                { name: `Lothlórien`, nearby: [`Bree`, `Moria`, `Rivendell`] },
                { name: `Isengard`, nearby: [`Moria`, `Lothlórien`, `Mount Doom`] },
                { name: `Mount Doom`, nearby: [`Isengard`] },
                { name: `Rivendell`, nearby: [`Mirkwood`, `Moria`, `Lothlórien`] },
                { name: `Moria`, nearby: [`Rivendell`, `Mirkwood`, `Lothlórien`] },
                { name: `Lothlórien`, nearby: [`Rivendell`, `Mirkwood`, `Moria`] },
                { name: `Gondolin`, nearby: [`Doriath`, `Nargothrond`, `Angband`] },
                { name: `Doriath`, nearby: [`Gondolin`, `Nargothrond`, `Angband`] },
                { name: `Nargothrond`, nearby: [`Gondolin`, `Doriath`, `Angband`] },
                { name: `Angband`, nearby: [`Gondolin`, `Doriath`, `Nargothrond`] },
                { name: `Rivendell`, nearby: [`Gondolin`, `Doriath`, `Nargothrond`] },
            ];
            if (!campaignId && !questId) {
                const location = locations[Math.floor(Math.random() * locations.length)] ?? locations[0]!;
                return {
                    id: `location-${location.name.toLocaleLowerCase()}-${getNextId(state)}` as GameLocationId,
                    name: location.name,
                    entrances: location.nearby,
                };
            }

            // prettier-ignore
            const rooms = [
                { name: `Throne Room`, passageways: [`Golden Corridor`, `Royal Staircase`, `Grand Entrance`] },
                { name: `Dining Hall`, passageways: [`Gourmet Passage`, `Banquet Hallway`, `Feast Path`] },
                { name: `Treasure Chamber`, passageways: [`Jewel Passage`, `Gold Vault`, `Gemstone Corridor`] },
                { name: `Hall of Shadows`, passageways: [`Shadowy Path`, `Dark Passage`, `Gloomy Corridor`] },
                { name: `Chamber of Secrets`, passageways: [`Mysterious Path`, `Enigmatic Passage`, `Secret Corridor`] },
                { name: `Crypt of the Ancients`, passageways: [`Ancient Passage`, `Eternal Corridor`, `Lost Path`] },
                { name: `Labyrinth of Despair`, passageways: [`Desolate Path`, `Hopeless Passage`, `Endless Corridor`] },
                { name: `Torture Chamber`, passageways: [`Painful Path`, `Agonizing Passage`, `Torment Corridor`] },
                { name: `Hall of Mirrors`, passageways: [`Reflective Path`, `Illusory Passage`, `Mirror Corridor`] },
                { name: `Chamber of Illusions`, passageways: [`Illusive Path`, `Deceptive Passage`, `Trickery Corridor`] },
                { name: `Garden of Thorns`, passageways: [`Thorny Path`, `Blooming Passage`, `Floral Corridor`] },
                { name: `Library of Lost Knowledge`, passageways: [`Forgotten Path`, `Ancient Passage`, `Mystic Corridor`] },
                { name: `Forge of Fire`, passageways: [`Blazing Path`, `Fiery Passage`, `Inferno Corridor`] },
                { name: `Chamber of Ice`, passageways: [`Frozen Path`, `Icy Passage`, `Frost Corridor`] },
                { name: `Hall of Echoes`, passageways: [`Echoing Path`, `Resonant Passage`, `Sound Corridor`] },
                { name: `Cavern of Whispers`, passageways: [`Whispering Path`, `Silent Passage`, `Hushed Corridor`] },
                { name: `Chamber of Enigma`, passageways: [`Enigmatic Path`, `Puzzling Passage`, `Mysterious Corridor`] },
                { name: `Treacherous Tunnels`, passageways: [`Dangerous Path`, `Perilous Passage`, `Risky Corridor`] },
                { name: `Hall of Illusion`, passageways: [`Illusory Path`, `Deceptive Passage`, `Trickery Corridor`] },
                { name: `Chamber of Chaos`, passageways: [`Chaotic Path`, `Disorderly Passage`, `Turbulent Corridor`] },
                { name: `Hall of Heroes`, passageways: [`Heroic Path`, `Valiant Passage`, `Glorious Corridor`] },
                { name: `Forbidden Crypt`, passageways: [`Forbidden Path`, `Cursed Passage`, `Dreadful Corridor`] },
                { name: `Mystic Chamber`, passageways: [`Mystical Path`, `Enchanted Passage`, `Magic Corridor`] },
                { name: `Chamber of Shadows`, passageways: [`Shadowy Path`, `Dark Passage`, `Gloomy Corridor`] },
                { name: `Hall of Legends`, passageways: [`Legendary Path`, `Mythical Passage`, `Epic Corridor`] },
                { name: `Enchanted Garden`, passageways: [`Enchanted Path`, `Magical Passage`, `Whimsical Corridor`] },
                { name: `Chamber of Reflection`, passageways: [`Reflective Path`, `Contemplative Passage`, `Thoughtful Corridor`] },
                { name: `Lost Catacombs`, passageways: [`Forgotten Path`, `Abandoned Passage`, `Ruined Corridor`] },
                { name: `Hall of Whispers`, passageways: [`Whispering Path`, `Silent Passage`, `Hushed Corridor`] },
                { name: `Chamber of Secrets`, passageways: [`Mysterious Path`, `Enigmatic Passage`, `Secret Corridor`] },
                { name: `Treasure Vault`, passageways: [`Valuable Path`, `Precious Passage`, `Rich Corridor`] },
                { name: `Hall of Fire`, passageways: [`Fiery Path`, `Blazing Passage`, `Flame Corridor`] },
                { name: `Chamber of Dreams`, passageways: [`Dreamy Path`, `Fantasy Passage`, `Imaginary Corridor`] },
                { name: `Mystical Maze`, passageways: [`Mysterious Path`, `Enigmatic Passage`, `Puzzling Corridor`] },
                { name: `Hall of Thunder`, passageways: [`Thunderous Path`, `Electric Passage`, `Stormy Corridor`] },
                { name: `Chamber of Serenity`, passageways: [`Serene Path`, `Tranquil Passage`, `Peaceful Corridor`] },
                { name: `Secret Passageway`, passageways: [`Hidden Path`, `Covert Passage`, `Concealed Corridor`] },
                { name: `Hall of Ruins`, passageways: [`Ruined Path`, `Decayed Passage`, `Desolate Corridor`] },
                { name: `Chamber of Sorcery`, passageways: [`Sorcerous Path`, `Magical Passage`, `Enchanted Corridor`] },
                { name: `Mysterious Laboratory`, passageways: [`Mysterious Path`, `Experimental Passage`, `Scientific Corridor`] },
                { name: `Hall of Illusions`, passageways: [`Illusory Path`, `Deceptive Passage`, `Trickery Corridor`] },
                { name: `Chamber of Echoes`, passageways: [`Echoing Path`, `Resonant Passage`, `Sound Corridor`] },
                { name: `Ancient Library`, passageways: [`Ancient Path`, `Historic Passage`, `Antique Corridor`] },
                { name: `Hall of Shadows`, passageways: [`Shadowy Path`, `Dark Passage`, `Gloomy Corridor`] },
                { name: `Chamber of Enchantment`, passageways: [`Enchanted Path`, `Magical Passage`, `Whimsical Corridor`] },
                { name: `Hidden Sanctuary`, passageways: [`Secret Path`, `Concealed Passage`, `Protected Corridor`] },
                { name: `Hall of Secrets`, passageways: [`Secretive Path`, `Mysterious Passage`, `Cryptic Corridor`] },
                { name: `Chamber of Destiny`, passageways: [`Destined Path`, `Fateful Passage`, `Prophetic Corridor`] },
                { name: `Ethereal Hall`, passageways: [`Ethereal Path`, `Transcendent Passage`, `Celestial Corridor`] },
                { name: `Chamber of Whispers`, passageways: [`Whispering Path`, `Silent Passage`, `Hushed Corridor`] },
                { name: `Hall of Mystery`, passageways: [`Mysterious Path`, `Enigmatic Passage`, `Puzzling Corridor`] },
                { name: `Chamber of Legends`, passageways: [`Legendary Path`, `Mythical Passage`, `Epic Corridor`] },
                { name: `Forbidden Chamber`, passageways: [`Forbidden Path`, `Cursed Passage`, `Dreadful Corridor`] },
                { name: `Hall of Echoes`, passageways: [`Echoing Path`, `Resonant Passage`, `Sound Corridor`] },
                { name: `Chamber of Illusions`, passageways: [`Illusory Path`, `Deceptive Passage`, `Trickery Corridor`] },
                { name: `Mystical Garden`, passageways: [`Mystical Path`, `Enchanted Passage`, `Magic Corridor`] },
                { name: `Hall of Shadows`, passageways: [`Shadowy Path`, `Dark Passage`, `Gloomy Corridor`] },
                { name: `Chamber of Secrets`, passageways: [`Mysterious Path`, `Enigmatic Passage`, `Secret Corridor`] },
                { name: `Enchanted Library`, passageways: [`Enchanted Path`, `Magical Passage`, `Whimsical Corridor`] },
                { name: `Hall of Whispers`, passageways: [`Whispering Path`, `Silent Passage`, `Hushed Corridor`] },
                { name: `Chamber of Sorcery`, passageways: [`Sorcerous Path`, `Magical Passage`, `Enchanted Corridor`] },
            ];

            // const location = locations[Math.floor(Math.random() * locations.length)] ?? locations[0]!;
            const room = rooms[Math.floor(Math.random() * rooms.length)] ?? rooms[0]!;
            return {
                id: `location-${room.name.toLocaleLowerCase().replace(` `, `-`)}-${getNextId(state)}` as GameLocationId,
                name: room.name,
                entrances: room.passageways,
            };
        },
    };
};
