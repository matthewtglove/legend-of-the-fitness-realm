/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoreDictionary } from '../../lore-dictionary';

const loreDictionary: LoreDictionary = {
    worlds: [
        {
            title: `Eldoria`,
            genre: `High Fantasy`,
            locations: [
                {
                    title: `Whispering Woods`,
                    biome: `Enchanted Forest`,
                    campaigns: [
                        {
                            title: `The Corrupted Heart`,
                            quests: [
                                {
                                    title: `Cleanse the Ancient Tree`,
                                    importance: `main`,
                                    objectives: [
                                        {
                                            kind: `keyItem`,
                                            keyItemName: `Purification Crystal`,
                                            title: `Obtain the Purification Crystal`,
                                        },
                                        {
                                            kind: `hiddenPassageway`,
                                            hiddenPassagewayName: `Root Cavern`,
                                            title: `Discover the Root Cavern`,
                                        },
                                        {
                                            kind: `keyItem`,
                                            keyItemName: `Heart Seed`,
                                            title: `Retrieve the Heart Seed`,
                                        },
                                    ],
                                },
                            ],
                            enemies: [
                                {
                                    race: `Treant`,
                                    class: `Corrupted Guardian`,
                                    ranking: `major-boss`,
                                    surname: `Rootblight`,
                                    firstName: `Oakenthorne`,
                                    aliases: [`The Twisted One`, `Blight of the Woods`],
                                    weapons: [`Thorn Whips`, `Root Spikes`],
                                    armor: [`Bark Hide`],
                                    attacks: [`Thorn Lash`, `Root Entangle`, `Poison Spore Cloud`, `Branch Slam`],
                                    bodyParts: [
                                        {
                                            name: `Core`,
                                            protection: `strong`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Poison Spore Cloud`],
                                                weakensOtherBodyParts: [`Branches`],
                                            },
                                        },
                                        {
                                            name: `Roots`,
                                            protection: `normal`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Root Entangle`],
                                                weakensOtherBodyParts: [],
                                            },
                                        },
                                        {
                                            name: `Branches`,
                                            protection: `weak`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Branch Slam`, `Thorn Lash`],
                                                weakensOtherBodyParts: [],
                                            },
                                        },
                                        {
                                            name: `Trunk`,
                                            protection: `strong`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [],
                                                weakensOtherBodyParts: [`Roots`],
                                            },
                                        },
                                        {
                                            name: `Canopy`,
                                            protection: `normal`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Poison Spore Cloud`],
                                                weakensOtherBodyParts: [],
                                            },
                                        },
                                    ],
                                    loot: [
                                        {
                                            name: `Heartwood Staff`,
                                            kind: `weapon`,
                                            rarity: `rare`,
                                            effects: [`+2 Nature Damage`],
                                        },
                                        {
                                            name: `Bark Shield`,
                                            kind: `armor`,
                                            rarity: `uncommon`,
                                            effects: [`+1 Defense`],
                                        },
                                        {
                                            name: `Essence of Nature`,
                                            kind: `consumable`,
                                            rarity: `epic`,
                                            effects: [`+5 Health`],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    title: `Frostpeak Mountains`,
                    biome: `Alpine Tundra`,
                    campaigns: [
                        {
                            title: `The Frozen Throne`,
                            quests: [
                                {
                                    title: `Ascend the Icy Spire`,
                                    importance: `main`,
                                    objectives: [
                                        {
                                            kind: `hiddenPassageway`,
                                            hiddenPassagewayName: `Ice Cavern`,
                                            title: `Find the hidden Ice Cavern`,
                                        },
                                        {
                                            kind: `keyItem`,
                                            keyItemName: `Frostforge Key`,
                                            title: `Acquire the Frostforge Key`,
                                        },
                                        {
                                            kind: `keyItem`,
                                            keyItemName: `Warmth Stone`,
                                            title: `Obtain the Warmth Stone`,
                                        },
                                        {
                                            kind: `hiddenPassageway`,
                                            hiddenPassagewayName: `Throne Room`,
                                            title: `Unlock the Throne Room`,
                                        },
                                        {
                                            kind: `keyItem`,
                                            keyItemName: `Crown of Winter`,
                                            title: `Claim the Crown of Winter`,
                                        },
                                    ],
                                },
                            ],
                            enemies: [
                                {
                                    race: `Frost Giant`,
                                    class: `Ice Monarch`,
                                    ranking: `final-boss`,
                                    surname: `Frostwhisper`,
                                    firstName: `Grimjaw`,
                                    aliases: [`The Frozen King`, `Lord of Eternal Winter`],
                                    weapons: [`Ice Scepter`, `Glacial Fists`],
                                    armor: [`Permafrost Plates`],
                                    attacks: [
                                        `Blizzard Blast`,
                                        `Icicle Barrage`,
                                        `Frost Nova`,
                                        `Avalanche Summon`,
                                        `Deep Freeze`,
                                    ],
                                    bodyParts: [
                                        {
                                            name: `Head`,
                                            protection: `strong`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Blizzard Blast`],
                                                weakensOtherBodyParts: [`Arms`],
                                            },
                                        },
                                        {
                                            name: `Chest`,
                                            protection: `strong`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Frost Nova`],
                                                weakensOtherBodyParts: [`Legs`],
                                            },
                                        },
                                        {
                                            name: `Arms`,
                                            protection: `normal`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Icicle Barrage`, `Deep Freeze`],
                                                weakensOtherBodyParts: [],
                                            },
                                        },
                                        {
                                            name: `Legs`,
                                            protection: `normal`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Avalanche Summon`],
                                                weakensOtherBodyParts: [],
                                            },
                                        },
                                        {
                                            name: `Crown`,
                                            protection: `weak`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Blizzard Blast`, `Frost Nova`],
                                                weakensOtherBodyParts: [`Head`, `Chest`],
                                            },
                                        },
                                    ],
                                    loot: [
                                        {
                                            name: `Frostwhisper's Scepter`,
                                            kind: `weapon`,
                                            rarity: `epic`,
                                            effects: [`+5 Ice Damage`],
                                        },
                                        {
                                            name: `Permafrost Armor`,
                                            kind: `armor`,
                                            rarity: `rare`,
                                            effects: [`+3 Defense`],
                                        },
                                        {
                                            name: `Essence of Winter`,
                                            kind: `consumable`,
                                            rarity: `epic`,
                                            effects: [`+5 Health`],
                                        },
                                        {
                                            name: `Crown of Eternal Frost`,
                                            kind: `armor`,
                                            rarity: `epic`,
                                            effects: [`+5 Defense`],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};
