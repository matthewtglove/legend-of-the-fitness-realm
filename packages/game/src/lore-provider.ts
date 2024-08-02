/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    GameCampaignId,
    GameCharacterId,
    GameKeyItemId,
    GameLocationId,
    GameLoreProvider,
    GamePlayerId,
    GameQuestId,
    GameState,
} from './types';

export const createGameLoreProvider = (): GameLoreProvider => {
    const getNextId = (state: GameState) => {
        const id = state._nextId;
        state._nextId++;
        return id;
    };

    return {
        generatePlayerInfo: ({ state }) => {
            // Generate a random fantasy enemy name and role.
            return {
                id: `player-${getNextId(state)}` as GamePlayerId,
            };
        },
        generateEnemyInfo: ({ state, playerLevels, locationId, enemyDifficulty, campaignId, questId }) => {
            // Generate a random fantasy enemy name and role.
            return {
                id: `enemy-orc-grishnákh-${getNextId(state)}` as GameCharacterId,
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
                id: `campaign-journey-of-the-one-true-ring-${getNextId(state)}` as GameCampaignId,
                name: `The Journey of the One True Ring`,
            };
        },
        generateQuestInfo: ({ state, playerLevels, locationId, campaignId, previousQuestIds, maxObjectiveCount }) => {
            // Generate a random quest name and objectives.
            return {
                id: `quest-destroy-the-one-true-ring-${getNextId(state)}` as GameQuestId,
                name: `Destroy the One True Ring`,
                objectives: [
                    {
                        name: `Aquire the One True Ring`,
                        completionKeyItem: {
                            id: `key-one-true-ring-${getNextId(state)}` as GameKeyItemId,
                            name: `One True Ring`,
                            isVisible: true,
                            placement: `enemy`,
                        },
                    },
                    {
                        name: `Go to Mount Doom`,
                        completionKeyItem: {
                            id: `key-lava-river-${getNextId(state)}` as GameKeyItemId,
                            name: `Lava River`,
                            isVisible: false,
                            placement: `location`,
                        },
                    },
                    {
                        name: `Defeat Sauron`,
                        completionKeyItem: {
                            id: `key-saurons-eye-${getNextId(state)}` as GameKeyItemId,
                            name: `Sauron's Eye`,
                            isVisible: true,
                            placement: `location`,
                        },
                    },
                ],
            };
        },
        generateLocationInfo: ({ state, campaignId, questId, nearbyLocationIds }) => {
            if (!questId) {
                return {
                    id: `location-shire-${getNextId(state)}` as GameLocationId,
                    name: `The Shire`,
                };
            }
            return {
                id: `location-mount-doom-${getNextId(state)}` as GameLocationId,
                name: `Mount Doom`,
            };
        },
    };
};
