/* eslint-disable @typescript-eslint/no-unused-vars */
import { GameCampaignId, GameCharacterId, GameKeyItemId, GameLocationId, GameLoreProvider, GameQuestId } from './types';

export const createGameLoreProvider = (): GameLoreProvider => {
    return {
        generateEnemyInfo: ({ state, playerLevels, locationId, enemyDifficulty, campaignId, questId }) => {
            // Generate a random fantasy enemy name and role.
            return {
                id: `enemy-orc-grishnákh-${Math.random()}` as GameCharacterId,
                name: `Grishnákh`,
                role: {
                    race: `Orc`,
                    class: `Warrior`,
                    enemyDifficulty,
                },
            };
        },
        generateCampaignInfo: ({ state, playerLevels, locationId, previousCampaignIds }) => {
            // Generate a random campaign name.
            return {
                id: `campaign-journey-of-the-one-true-ring-${Math.random()}` as GameCampaignId,
                name: `The Journey of the One True Ring`,
            };
        },
        generateQuestInfo: ({ state, playerLevels, locationId, campaignId, previousQuestIds, maxObjectiveCount }) => {
            // Generate a random quest name and objectives.
            return {
                id: `quest-destroy-the-one-true-ring-${Math.random()}` as GameQuestId,
                name: `Destroy the One True Ring`,
                objectives: [
                    {
                        name: `Aquire the One True Ring`,
                        completionKeyItem: {
                            id: `key-one-true-ring-${Math.random()}` as GameKeyItemId,
                            name: `One True Ring`,
                            isVisible: true,
                            placement: `enemy`,
                        },
                    },
                    {
                        name: `Go to Mount Doom`,
                        completionKeyItem: {
                            id: `key-lava-river-${Math.random()}` as GameKeyItemId,
                            name: `Lava River`,
                            isVisible: false,
                            placement: `location`,
                        },
                    },
                    {
                        name: `Defeat Sauron`,
                        completionKeyItem: {
                            id: `key-saurons-eye-${Math.random()}` as GameKeyItemId,
                            name: `Sauron's Eye`,
                            isVisible: true,
                            placement: `location`,
                        },
                    },
                ],
            };
        },
        generateLocationInfo: ({ state, campaignId, questId, nearbyLocationIds }) => {
            // Generate a random location name.
            return {
                id: `location-mount-doom-${Math.random()}` as GameLocationId,
                name: `Mount Doom`,
            };
        },
    };
};
