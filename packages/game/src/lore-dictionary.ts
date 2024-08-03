export type LoreDictionary = {
    worlds: {
        title: string;
        genre: string;
        locations: {
            title: string;
            biome: string;
            campaigns: {
                title: string;
                quests: {
                    title: string;
                    importance: `side` | `main`;
                    /** 1-5 objectives for a quest depending on importance
                     *
                     * Each objective should be satisfied by:
                     * - defeating the enemy that holds the key item
                     * - or searching a room to find the hidden passageway
                     */
                    objectives: {
                        kind: `keyItem` | `hiddenPassageway`;
                        hiddenPassagewayName?: string;
                        keyItemName?: string;
                        title: string;
                    }[];
                }[];
                enemies: {
                    race: string;
                    class: string;
                    ranking: `normal` | `minor-boss` | `major-boss` | `final-boss`;
                    surname: string;
                    firstName?: string;
                    aliases: string[];
                    weapons: string[];
                    armor: string[];
                    attacks: string[];
                    /** 3-7 body parts that can be targetted during an attack
                     *
                     * The enemy should have a few weak points, a few normal points, and a few strong points
                     */
                    bodyParts: {
                        name: string;
                        protection: `weak` | `normal` | `strong`;
                        effectWhenDamaged: {
                            disablesAttacks: string[];
                            weakensOtherBodyParts: string[];
                        };
                    }[];
                    /** Possible loot drops */
                    loot: {
                        name: string;
                        kind: `weapon` | `armor` | `consumable`;
                        rarity: `common` | `uncommon` | `rare` | `epic`;
                        effects: string[];
                    }[];
                }[];
            }[];
        }[];
    }[];
};

export type LoreDictionaryGenerator = {
    generateWorlds: (options: {
        otherWorlds: {
            name: string;
            genre: string;
        }[];
        count: number;
    }) => {
        title: string;
        genre: string;
    }[];
    generateLocations: (options: {
        world: {
            title: string;
            genre: string;
        };
        otherLocations: {
            title: string;
            biome: string;
        }[];
        count: number;
    }) => {
        title: string;
        biome: string;
    }[];
    generateCampaigns: (options: {
        world: {
            title: string;
            genre: string;
        };
        location: {
            title: string;
            biome: string;
        };
        otherCampaigns: {
            title: string;
        }[];
        count: number;
    }) => {
        title: string;
    }[];
    generateMainQuests: (options: {
        world: {
            title: string;
            genre: string;
        };
        location: {
            title: string;
            biome: string;
        };
        campaign: {
            title: string;
        };
        previousMainQuests: {
            title: string;
        }[];
        count: number;
    }) => {
        title: string;
    }[];
    generateSideQuests: (options: {
        world: {
            title: string;
            genre: string;
        };
        location: {
            title: string;
            biome: string;
        };
        campaign: {
            title: string;
        };
        previousMainQuests: {
            title: string;
        }[];
        otherSideQuests: {
            title: string;
        }[];
        count: number;
    }) => {
        title: string;
    }[];
    generateQuestObjectives: (options: {
        world: {
            title: string;
            genre: string;
        };
        location: {
            title: string;
            biome: string;
        };
        campaign: {
            title: string;
        };
        quest: {
            title: string;
            importance: `side` | `main`;
        };
        previousObjectives: {
            title: string;
        }[];
        count: number;
    }) => {
        title: string;
        kind: `keyItem` | `hiddenPassageway`;
        hiddenPassagewayName?: string;
        keyItemName?: string;
    }[];
    generateEnemies: (options: {
        world: {
            title: string;
            genre: string;
        };
        location: {
            title: string;
            biome: string;
        };
        campaign: {
            title: string;
        };
        count: number;
    }) => {
        race: string;
        class: string;
        ranking: `normal` | `minor-boss` | `major-boss` | `final-boss`;
        surname: string;
        firstName?: string;
        aliases: string[];
    }[];
    generateEnemyBodyParts: (options: {
        world: {
            title: string;
            genre: string;
        };
        location: {
            title: string;
            biome: string;
        };
        campaign: {
            title: string;
        };
        enemy: {
            race: string;
            class: string;
            ranking: `normal` | `minor-boss` | `major-boss` | `final-boss`;
            surname: string;
            firstName?: string;
            aliases: string[];
        };
        count: number;
    }) => {
        /** 3-7 body parts that can be targetted by the player
         *
         * The enemy should have a few weak points, a few normal points, and a few strong points
         */
        bodyParts: {
            name: string;
            defense: `weak` | `normal` | `strong`;
            parentBodyPart?: string;
            protectsOtherBodyParts: string[];
        }[];
    }[];
    generateEnemyEquipment: (options: {
        world: {
            title: string;
            genre: string;
        };
        location: {
            title: string;
            biome: string;
        };
        campaign: {
            title: string;
        };
        enemy: {
            race: string;
            class: string;
            ranking: `normal` | `minor-boss` | `major-boss` | `final-boss`;
            surname: string;
            firstName?: string;
            aliases: string[];
            bodyParts: string[];
        };
        weaponCount: number;
        armorCount: number;
    }) => {
        /** 0-3 weapons */
        weapons: {
            title: string;
            requiredBodyParts: string[];
        }[];
        /** 0-3 armor equipment */
        armor: {
            title: string;
            requiredBodyParts: string[];
        }[];
    };
    generateEnemyAbilities: (options: {
        world: {
            title: string;
            genre: string;
        };
        location: {
            title: string;
            biome: string;
        };
        campaign: {
            title: string;
        };
        enemy: {
            race: string;
            class: string;
            ranking: `normal` | `minor-boss` | `major-boss` | `final-boss`;
            surname: string;
            firstName?: string;
            aliases: string[];
            bodyParts: string[];
        };
        attackCount: number;
        abilityCount: number;
    }) => {
        /** 10-30 attack moves */
        attacks: {
            title: string;
            strength: `weak` | `normal` | `strong`;
            requiredBodyParts: string[];
        }[];
        /** 3-5 ability moves */
        abilities: {
            title: string;
            effect: string;
            requiredBodyParts: string[];
        }[];
    };
};
