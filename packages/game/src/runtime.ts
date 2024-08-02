/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    GameRuntimeContext,
    GameBattleProvider,
    GameCampaignId,
    GameCharacter,
    GameCharacterId,
    GameKeyItemId,
    GameLocation,
    GameLocationId,
    GameLoreProvider,
    GamePlayer,
    GamePlayerId,
    GameQuestId,
    GameRuntime,
    GameState,
    GameCampaign,
    GameEvent,
    GameEventResponse,
} from './types';

export const createEmptyGameState = (): GameState => {
    const gameState: GameState = {
        players: [],
        characters: [],
        locations: [],
        campaigns: [],
        quests: [],
        keyItems: [],
        items: [],
        _nextId: 1,
    };
    return gameState;
};

export const createGameRuntime = (
    initialGameState: GameState,
    lore: GameLoreProvider,
    battle: GameBattleProvider,
): GameRuntime => {
    const state: GameState = JSON.parse(JSON.stringify(initialGameState));

    const getSessionPlayers = ({ context }: { context: GameRuntimeContext }) => {
        return state.players.filter((x) => context.sessionPlayers.some((p) => p.player === x.id));
    };
    const getLocation = ({ context }: { context: GameRuntimeContext }): GameLocation => {
        const locationId = getSessionPlayers({ context })[0]?.location;
        const location = state.locations.findLast((x) => x.id === locationId);
        if (location) {
            return location;
        }

        if (state.locations[0]) {
            return state.locations[0];
        }

        // Create initial location
        const { id, name } = lore.generateLocationInfo({
            state,
            campaignId: undefined,
            questId: undefined,
            nearbyLocationIds: [],
        });
        const newLocation = {
            id,
            name,
            connections: [],
        };
        state.locations.push({ ...newLocation, connections: [] });
        return newLocation;
    };
    const getLocationsNearby = ({
        locationId,
        distance,
        visited = new Set<GameLocationId>(),
    }: {
        locationId: GameLocationId;
        distance: number;
        visited?: Set<GameLocationId>;
    }): GameLocation[] => {
        if (visited.has(locationId)) {
            return [];
        }
        visited.add(locationId);
        const location = state.locations.findLast((x) => x.id === locationId);
        if (!location) {
            return [];
        }
        const connectedLocations = state.locations.filter((x) => location.connections.some((c) => c.location === x.id));
        return [
            location,
            ...connectedLocations.flatMap((x) =>
                getLocationsNearby({ locationId: x.id, distance: distance - 1, visited }),
            ),
        ];
    };
    const addLocation = ({
        location,
        campaignId,
        questId,
        distance,
    }: {
        location: GameLocation;
        campaignId?: GameCampaignId;
        questId?: GameQuestId;
        distance: number;
    }) => {
        const nearbyLocations = getLocationsNearby({ locationId: location.id, distance: 3 });
        const { id, name } = lore.generateLocationInfo({
            state,
            campaignId: campaignId,
            questId: questId,
            nearbyLocationIds: nearbyLocations.map((x) => x.id),
        });
        const newLocation: GameLocation = {
            id,
            name,
            connections: [{ location: location.id }],
        };
        location.connections.push({ location: newLocation.id });
        state.locations.push(newLocation);

        if (distance > 1) {
            addLocation({ location: newLocation, campaignId, questId, distance: distance - 1 });
        }
    };

    const ensureLocationsExits = ({
        location,
        distance,
        isAcceptableLocation,
        campaignId,
        questId,
    }: {
        location: GameLocation;
        distance: number;
        isAcceptableLocation: (location: GameLocation) => boolean;
        campaignId?: GameCampaignId;
        questId?: GameQuestId;
    }) => {
        const nearbyLocations = getLocationsNearby({ locationId: location.id, distance: 3 });
        const acceptableLocations = nearbyLocations.filter(isAcceptableLocation);
        if (acceptableLocations.length) {
            return { nearbyLocations, acceptableLocations };
        }

        // add locations
        addLocation({
            location,
            campaignId,
            questId,
            distance,
        });

        return ensureLocationsExits({
            location,
            distance: distance,
            isAcceptableLocation,
            campaignId,
            questId,
        });
    };

    const getKeyItemsAtLocation = ({ locationId }: { locationId: GameLocationId }): GameKeyItemId[] => {
        const location = state.locations.findLast((x) => x.id === locationId);
        if (!location) {
            return [];
        }

        return [
            location.keyItem,
            ...state.characters
                .filter((x) => x.location === locationId && x.role.alignment === `enemy`)
                .map((x) => x.keyItem),
        ]
            .filter((x) => x)
            .map((x) => x!);
    };

    const getPathToLocation = ({
        startLocationId,
        endLocationId,
        obtainedKeyItemIds: obtainedKeyItemIds_init,
    }: {
        startLocationId: GameLocationId;
        endLocationId: GameLocationId;
        obtainedKeyItemIds: GameKeyItemId[];
    }): undefined | GameLocationId[] => {
        const startLocation = state.locations.findLast((x) => x.id === startLocationId);
        if (!startLocation) {
            return undefined;
        }

        const obtainedKeyItemIdsSet = new Set(obtainedKeyItemIds_init);
        const visitedLocations = new Set<GameLocationId>();
        const queue = [{ location: startLocation, path: [] as GameLocationId[] }];
        while (queue.length) {
            const { location, path } = queue.shift()!;
            if (location.id === endLocationId) {
                return path;
            }

            visitedLocations.add(location.id);

            const keyItems = getKeyItemsAtLocation({ locationId: location.id });
            keyItems.forEach((keyItem) => obtainedKeyItemIdsSet.add(keyItem));

            for (const connection of location.connections) {
                if (connection.requiredKeyItem && !obtainedKeyItemIdsSet.has(connection.requiredKeyItem)) {
                    continue;
                }

                const connectedLocation = state.locations.findLast((x) => x.id === connection.location);
                if (!connectedLocation || visitedLocations.has(connectedLocation.id)) {
                    continue;
                }

                queue.push({ location: connectedLocation, path: [...path, connectedLocation.id] });
            }
        }

        return undefined;
    };

    const getCampaignFromQuest = ({ questId }: { questId: GameQuestId }) => {
        return state.campaigns.findLast((x) => x.quests.some((q) => q === questId));
    };

    const ensureCampaignExists = ({ context }: { context: GameRuntimeContext }): GameCampaign => {
        const currentCampaign = state.campaigns.findLast((x) => !x.isComplete);
        if (currentCampaign) {
            return currentCampaign;
        }

        const { id, name } = lore.generateCampaignInfo({
            state,
            playerLevels: getSessionPlayers({ context }).map((x) => x.stats.level),
            locationId: getLocation({ context })?.id,
            previousCampaignIds: state.campaigns.map((x) => x.id),
        });
        const newCampaign = {
            id,
            name,
            quests: [],
        };
        state.campaigns.push(newCampaign);
        return newCampaign;
    };

    const ensureQuestExists = ({ context }: { context: GameRuntimeContext }) => {
        const nextIncompleteQuest = state.quests.findLast((x) => !x.isComplete);
        if (nextIncompleteQuest) {
            return nextIncompleteQuest;
        }

        const campaign = ensureCampaignExists({ context });
        const maxDistance = context.campaignSessionsRemaining <= 0 ? context.sessionPeriodsRemaining.length : 9;
        const newQuestInfo = lore.generateQuestInfo({
            state,
            playerLevels: getSessionPlayers({ context }).map((x) => x.stats.level),
            locationId: getLocation({ context }).id,
            campaignId: campaign?.id,
            previousQuestIds: state.quests.map((x) => x.id),
            maxObjectiveCount: maxDistance,
        });
        const newQuest = {
            id: newQuestInfo.id,
            name: newQuestInfo.name,
            objectives: newQuestInfo.objectives.map((x) => ({
                name: x.name,
                completionKeyItem: x.completionKeyItem.id,
            })),
        };
        state.quests.push(newQuest);
        campaign.quests.push(newQuest.id);

        const keyItems = newQuestInfo.objectives.map((x) => x.completionKeyItem);
        state.keyItems.push(...keyItems);

        // Place key items in a location or on a enemy character

        const location = getLocation({ context });
        const reachedLocationIdsSet = new Set(state.locations.filter((x) => x.isDiscovered).map((x) => x.id));
        const obtainedKeyItemIdsSet = new Set(state.keyItems.filter((x) => x.isObtained).map((x) => x.id));
        let remainingDistance = maxDistance;

        for (const keyItem of keyItems) {
            // place key item in a nearby location (or enemy in location)

            // choose unreached nearby location
            const { acceptableLocations: unreachedLocations } = ensureLocationsExits({
                location,
                distance: Math.min(3, remainingDistance),
                isAcceptableLocation: (x) =>
                    !reachedLocationIdsSet.has(x.id) && (keyItem.placement !== `location` || !x.keyItem),
                campaignId: campaign.id,
                questId: newQuest.id,
            });

            // Randomly select location
            const unreachedLocation = unreachedLocations[Math.floor(Math.random() * unreachedLocations.length)]!;

            // Update obtained state for path to location
            const pathToLocation = getPathToLocation({
                startLocationId: location.id,
                endLocationId: unreachedLocation.id,
                obtainedKeyItemIds: [...obtainedKeyItemIdsSet],
            });
            if (!pathToLocation) {
                // this is bad, we should have been able to find a path to the location
                throw new Error(`Unable to find path to location that I just made, somebody broke the code!`);
            }

            remainingDistance -= pathToLocation.length;
            pathToLocation.forEach((locationId) => {
                reachedLocationIdsSet.add(locationId);
                const keyItems = getKeyItemsAtLocation({ locationId });
                keyItems.forEach((keyItem) => obtainedKeyItemIdsSet.add(keyItem));
            });

            if (keyItem.placement === `location`) {
                // place key item at location
                unreachedLocation.keyItem = keyItem.id;
                obtainedKeyItemIdsSet.add(keyItem.id);
                continue;
            }

            // add new enemy at location holding the key item
            const playerLevels = getSessionPlayers({ context }).map((x) => x.stats.level);
            const newEnemyInfo = lore.generateEnemyInfo({
                state,
                playerLevels,
                locationId: unreachedLocation.id,
                enemyDifficulty: `normal`,
                campaignId: campaign.id,
                questId: newQuest.id,
            });
            const newEnemyStats = battle.generateEnemyStats({
                state,
                playerLevels,
                race: newEnemyInfo.role.race,
                class: newEnemyInfo.role.class,
                enemyDifficulty: newEnemyInfo.role.enemyDifficulty,
            });
            const newEnemy: GameCharacter = {
                id: newEnemyInfo.id,
                name: newEnemyInfo.name,
                role: { ...newEnemyInfo.role, alignment: `enemy` },
                stats: { ...newEnemyStats.stats },
                location: unreachedLocation.id,
                keyItem: keyItem.id,
            };
            state.characters.push(newEnemy);
        }

        return newQuest;
    };

    const response = (...events: (false | undefined | GameEvent)[]): GameEventResponse => {
        return {
            events: events.filter((x) => !!x).map((x) => x!),
        };
    };

    return {
        state,
        createPlayer: ({ characterName, characterRace, characterClass, level }) => {
            if (!state.locations.length) {
                // create initial location
                state.locations.push({
                    ...lore.generateLocationInfo({
                        state,
                        nearbyLocationIds: [],
                    }),
                    connections: [],
                });
            }

            const newPlayer: GamePlayer = {
                ...lore.generatePlayerInfo({
                    state,
                }),
                name: characterName,
                role: {
                    race: characterRace,
                    class: characterClass,
                },
                ...battle.generatePlayerStats({
                    state,
                    playerLevel: level,
                    race: characterRace,
                    class: characterClass,
                }),
                equipment: {},
                inventory: [],
                location: state.locations[0]!.id,
            };
            state.players.push(newPlayer);
            return {
                events: [],
            };
        },
        triggerSessionStart: ({ context }) => {
            const quest = ensureQuestExists({ context });
            const campaign = getCampaignFromQuest({ questId: quest.id });
            // Ensure all players are in the same location
            const currentPlayers = getSessionPlayers({ context });
            const location = getLocation({ context });
            currentPlayers.forEach((player) => {
                player.location = location.id;
            });

            const nextObjective = quest.objectives.find(
                (x) => !state.keyItems.find((k) => k.id === x.completionKeyItem)?.isObtained,
            );

            if (!nextObjective) {
                console.error(`No next objective found`, { quest, state });
            }

            return response(
                {
                    kind: `story-review`,
                    campaign: campaign?.name,
                    quest: quest.name,
                    location: location.name,
                    playerNames: currentPlayers.map((x) => x.name),
                },
                nextObjective && {
                    kind: `quest-objective`,
                    campaign: campaign?.name,
                    quest: quest.name,
                    objective: nextObjective.name,
                },
            );
        },
        triggerSessionEnd: ({ context }) => {
            throw new Error(`Not implemented`);
        },
        triggerWorkPeriod: ({ context }) => {
            throw new Error(`Not implemented`);
        },
        triggerRestPeriod: ({ context }) => {
            throw new Error(`Not implemented`);
        },
        enterPlayerDecision: ({ context }) => {
            throw new Error(`Not implemented`);
        },
        enterRemotePlayersWorkResult: (options) => {
            throw new Error(`Not implemented`);
        },
    };
};
