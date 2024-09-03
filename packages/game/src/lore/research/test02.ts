/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoreDictionary } from '../../lore-dictionary';

const loreDictionary: LoreDictionary = {
    worlds: [
        {
            title: `Aethoria`,
            genre: `Science Fantasy`,
            locations: [
                {
                    title: `Neon Jungle`,
                    biome: `Bioluminescent Rainforest`,
                    campaigns: [
                        {
                            title: `The Luminous Artifact`,
                            quests: [
                                {
                                    title: `Retrieve the Prismatic Core`,
                                    importance: `main`,
                                    objectives: [
                                        {
                                            kind: `hiddenPassageway`,
                                            hiddenPassagewayName: `Glow Moth Cavern`,
                                            title: `Discover the Glow Moth Cavern`,
                                        },
                                        {
                                            kind: `keyItem`,
                                            keyItemName: `Bioluminescent Key`,
                                            title: `Obtain the Bioluminescent Key`,
                                        },
                                        {
                                            kind: `hiddenPassageway`,
                                            hiddenPassagewayName: `Ancient Tech Lab`,
                                            title: `Unlock the Ancient Tech Lab`,
                                        },
                                        {
                                            kind: `keyItem`,
                                            keyItemName: `Prismatic Core`,
                                            title: `Secure the Prismatic Core`,
                                        },
                                    ],
                                },
                            ],
                            enemies: [
                                {
                                    race: `Synthetic Organism`,
                                    class: `Techno-Shaman`,
                                    ranking: `major-boss`,
                                    surname: `Lumina`,
                                    firstName: `Zyx`,
                                    aliases: [`The Neon Prophet`, `Keeper of the Core`],
                                    weapons: [`Photon Staff`, `Nano-Dart Launcher`],
                                    armor: [`Bioluminescent Exoskeleton`],
                                    attacks: [`Chromatic Blast`, `Neural Hack`, `Photon Storm`, `Nano Swarm`],
                                    bodyParts: [
                                        {
                                            name: `Neural Core`,
                                            protection: `strong`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Neural Hack`],
                                                weakensOtherBodyParts: [`Optic Sensors`, `Nano-Emitters`],
                                            },
                                        },
                                        {
                                            name: `Photon Reactor`,
                                            protection: `normal`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Chromatic Blast`, `Photon Storm`],
                                                weakensOtherBodyParts: [`Exoskeleton`],
                                            },
                                        },
                                        {
                                            name: `Nano-Emitters`,
                                            protection: `weak`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Nano Swarm`],
                                                weakensOtherBodyParts: [],
                                            },
                                        },
                                        {
                                            name: `Exoskeleton`,
                                            protection: `strong`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [],
                                                weakensOtherBodyParts: [`Limb Servos`],
                                            },
                                        },
                                        {
                                            name: `Optic Sensors`,
                                            protection: `weak`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Chromatic Blast`],
                                                weakensOtherBodyParts: [],
                                            },
                                        },
                                    ],
                                    loot: [
                                        {
                                            name: `Photon Staff`,
                                            kind: `weapon`,
                                            rarity: `rare`,
                                            effects: [`Emits blinding light`, `Channels photon energy`],
                                        },
                                        {
                                            name: `Bioluminescent Exoskeleton Fragment`,
                                            kind: `armor`,
                                            rarity: `epic`,
                                            effects: [`Adaptive camouflage`, `Enhanced energy absorption`],
                                        },
                                        {
                                            name: `Nano-Vial`,
                                            kind: `consumable`,
                                            rarity: `uncommon`,
                                            effects: [`Rapid healing`, `Temporary enhanced reflexes`],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    title: `Quantum Wastes`,
                    biome: `Reality-Warped Desert`,
                    campaigns: [
                        {
                            title: `Echoes of Probability`,
                            quests: [
                                {
                                    title: `Stabilize the Reality Anchor`,
                                    importance: `main`,
                                    objectives: [
                                        {
                                            kind: `keyItem`,
                                            keyItemName: `Quantum Shard`,
                                            title: `Collect Quantum Shards`,
                                        },
                                        {
                                            kind: `hiddenPassageway`,
                                            hiddenPassagewayName: `Probability Nexus`,
                                            title: `Locate the Probability Nexus`,
                                        },
                                        {
                                            kind: `keyItem`,
                                            keyItemName: `Reality Anchor`,
                                            title: `Activate the Reality Anchor`,
                                        },
                                    ],
                                },
                            ],
                            enemies: [
                                {
                                    race: `Quantum Entity`,
                                    class: `Probability Manipulator`,
                                    ranking: `minor-boss`,
                                    surname: `the Uncertain`,
                                    firstName: `Schrödinger`,
                                    aliases: [`The Wavefront`, `Master of Maybe`],
                                    weapons: [`Probability Scepter`, `Entanglement Whip`],
                                    armor: [`Superposition Cloak`],
                                    attacks: [
                                        `Quantum Shift`,
                                        `Probability Wave`,
                                        `Entanglement Snare`,
                                        `Uncertainty Blast`,
                                    ],
                                    bodyParts: [
                                        {
                                            name: `Quantum Core`,
                                            protection: `strong`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Quantum Shift`],
                                                weakensOtherBodyParts: [`Probability Field`, `Entanglement Nodes`],
                                            },
                                        },
                                        {
                                            name: `Probability Field`,
                                            protection: `normal`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Probability Wave`],
                                                weakensOtherBodyParts: [`Superposition Cloak`],
                                            },
                                        },
                                        {
                                            name: `Entanglement Nodes`,
                                            protection: `weak`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Entanglement Snare`],
                                                weakensOtherBodyParts: [],
                                            },
                                        },
                                        {
                                            name: `Wavefront Projector`,
                                            protection: `normal`,
                                            effectWhenDamaged: {
                                                disablesAttacks: [`Uncertainty Blast`],
                                                weakensOtherBodyParts: [],
                                            },
                                        },
                                    ],
                                    loot: [
                                        {
                                            name: `Probability Scepter`,
                                            kind: `weapon`,
                                            rarity: `epic`,
                                            effects: [
                                                `Alters probability in user's favor`,
                                                `Creates localized reality distortions`,
                                            ],
                                        },
                                        {
                                            name: `Superposition Cloak Fragment`,
                                            kind: `armor`,
                                            rarity: `rare`,
                                            effects: [`Partial invisibility`, `Quantum state flux`],
                                        },
                                        {
                                            name: `Quantum Stabilizer`,
                                            kind: `consumable`,
                                            rarity: `uncommon`,
                                            effects: [`Temporary immunity to reality distortions`, `Enhanced focus`],
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
