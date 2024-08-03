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
    GamePlayerWorkResult,
    GamePendingActionEvent,
    GameCharacterHealthStatus,
    GameQuest,
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

    const ensureQuestExists = ({ context }: { context: GameRuntimeContext }): GameQuest => {
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

    const ensureQuestObjectiveExists = ({ context }: { context: GameRuntimeContext }) => {
        const quest = ensureQuestExists({ context });
        const objective = quest.objectives.find(
            (x) => !state.keyItems.find((k) => k.id === x.completionKeyItem)?.isObtained,
        );
        if (!objective) {
            quest.isComplete = true;
            return ensureQuestObjectiveExists({ context });
        }
        return objective;
    };

    const calculateHealthState = (stats: { health: number; healthMax: number }): GameCharacterHealthStatus => {
        const healthPercent = stats.health / stats.healthMax;
        if (healthPercent <= 0) {
            return `defeated`;
        }
        if (healthPercent <= 0.25) {
            return `critical`;
        }
        if (healthPercent <= 0.5) {
            return `wounded`;
        }
        if (healthPercent <= 0.75) {
            return `hurt`;
        }
        return `ok`;
    };

    const response = (...events: (false | undefined | GameEvent)[]): GameEventResponse => {
        return {
            events: events.filter((x) => !!x).map((x) => x!),
        };
    };

    const playerAction_attackEnemy = ({
        context,
        estimateRemainingSec,
        revealedEnemies,
    }: {
        context: GameRuntimeContext;
        estimateRemainingSec: number;
        revealedEnemies: GameCharacter[];
    }) => {
        const sessionPlayers = getSessionPlayers({ context });

        const events: GameEvent[] = [];
        estimateRemainingSec = 0;

        // each player attacks an enemy
        sessionPlayers.forEach((player) => {
            // randomly select enemy
            const targetEnemy =
                revealedEnemies[Math.floor(Math.random() * revealedEnemies.length)] ?? revealedEnemies[0]!;
            const attackEnemy = {
                kind: `attack-enemy`,
                player: player.name,
                enemies: [
                    {
                        id: targetEnemy.id,
                        name: targetEnemy.name,
                        attackKind: `melee`,
                        healthStatus: calculateHealthState(targetEnemy.stats),
                    },
                ],
            } satisfies GamePendingActionEvent;
            events.push(attackEnemy);
            player.pendingActions = [attackEnemy];
        });

        return {
            events,
            estimateRemainingSec,
            canCompleteImmediately: false,
        };
    };

    const playerAction_revealEnemies = ({
        context,
        estimateRemainingSec,
        enemiesAtlocation,
    }: {
        context: GameRuntimeContext;
        estimateRemainingSec: number;
        enemiesAtlocation: GameCharacter[];
    }) => {
        const events: GameEvent[] = [];

        // reveal random number of enemies
        const TIME_TO_REVEAL_ENEMY = 10;
        const revealCount = Math.floor(
            Math.max(
                1,
                Math.min(estimateRemainingSec / TIME_TO_REVEAL_ENEMY, Math.random() * enemiesAtlocation.length),
            ),
        );
        const revealedEnemies = enemiesAtlocation.slice(0, revealCount);
        revealedEnemies.forEach((x) => {
            estimateRemainingSec -= TIME_TO_REVEAL_ENEMY;
            x.isDiscovered = true;
        });

        events.push({
            kind: `reveal-enemy`,
            enemies: revealedEnemies.map((x) => ({
                name: x.name,
                race: x.role.race,
                class: x.role.class,
                healthStatus: calculateHealthState(x.stats),
            })),
        });

        return {
            events,
            estimateRemainingSec,
            canCompleteImmediately: false,
            revealedEnemies,
        };
    };

    const playerAction_searchLocation = ({
        context,
        estimateRemainingSec,
    }: {
        context: GameRuntimeContext;
        estimateRemainingSec: number;
    }) => {
        const events: GameEvent[] = [];
        const location = getLocation({ context });

        if (!location.keyItem) {
            return {
                events,
                estimateRemainingSec,
                canCompleteImmediately: true,
            };
        }

        const keyItem = state.keyItems.find((x) => x.id === location.keyItem);
        if (!keyItem) {
            throw new Error(`Key item not found`);
        }
        keyItem.isObtained = true;
        estimateRemainingSec -= 20;

        events.push({
            kind: `search-location-key-item`,
            location: location.name,
            keyItem: keyItem.name,
        });

        return {
            events,
            estimateRemainingSec,
            canCompleteImmediately: false,
        };
    };

    const startPlayerAction = ({
        context,
        estimateRemainingSec,
    }: {
        context: GameRuntimeContext;
        estimateRemainingSec: number;
    }): { events: GameEvent[] } => {
        if (estimateRemainingSec <= 15) {
            // skip start action
            return {
                events: [],
            };
        }

        const location = getLocation({ context });
        const enemiesAtlocation = state.characters.filter(
            (c) => c.location === location.id && c.role.alignment === `enemy` && !c.isDefeated,
        );

        // if revealed enemy in location, attack enemy
        const revealedEnemies = enemiesAtlocation.filter((x) => x.isDiscovered);
        if (revealedEnemies.length) {
            // already in battle
            return playerAction_attackEnemy({ context, estimateRemainingSec, revealedEnemies });
        }

        // if undiscovered enemy present, start battle
        if (enemiesAtlocation.length) {
            const revealResult = playerAction_revealEnemies({ context, estimateRemainingSec, enemiesAtlocation });
            if (!revealResult.canCompleteImmediately || revealResult.estimateRemainingSec < 15) {
                return revealResult;
            }

            const attackResult = playerAction_attackEnemy({
                context,
                estimateRemainingSec: revealResult.estimateRemainingSec,
                revealedEnemies: revealResult.revealedEnemies,
            });

            return {
                events: [...revealResult.events, ...attackResult.events],
            };
        }

        const events: GameEvent[] = [];

        // if unsearched location, search location
        if (location.keyItem) {
            // key item found
            const searchResult = playerAction_searchLocation({ context, estimateRemainingSec });
            estimateRemainingSec = searchResult.estimateRemainingSec;
            events.push(...searchResult.events);

            if (estimateRemainingSec < 15) {
                return {
                    events,
                };
            }

            // continue to next action
        }

        // move to next location (where next key item is)
        const objective = ensureQuestObjectiveExists({ context });
        const targetLocation = state.locations.findLast((x) =>
            getKeyItemsAtLocation({ locationId: x.id }).some((y) => y === objective.completionKeyItem),
        );
        if (!targetLocation) {
            throw new Error(`Unable to find target location for key item`);
        }

        const pathToLocation = getPathToLocation({
            startLocationId: location.id,
            endLocationId: targetLocation.id,
            obtainedKeyItemIds: state.keyItems.filter((x) => x.isObtained).map((x) => x.id),
        });
        if (!pathToLocation) {
            throw new Error(`Unable to find path to location`);
        }
        const nextLocation = state.locations.findLast((x) => x.id === pathToLocation[0]);
        if (!nextLocation) {
            throw new Error(`Unable to find next location`);
        }

        events.push({
            kind: `move-location`,
            location: nextLocation.name,
            connection: location.connections.find((x) => x.location === nextLocation.id)?.name,
        });

        return {
            events,
        };
    };
    const resolvePlayerAction = ({
        context,
        workResults,
        estimateRemainingSec,
    }: {
        context: GameRuntimeContext;
        workResults: GamePlayerWorkResult[];
        estimateRemainingSec: number;
    }): { events: GameEvent[] } => {
        if (estimateRemainingSec <= 15) {
            // short response
            return {
                events: [],
            };
        }
        // if attack enemy, attack outcome (damage, death, etc)
        // - if battle victory, loot key item
        // - continue if time allows
        // if undiscovered enemy present, start battle
        // if unsearched location, search location
        // - if key item, obtain key item

        // handle pending player actions
        // if()

        // const location = getLocation({ context });
        // const enemiesAtlocation = state.characters.filter(
        //     (c) => c.location === location.id && c.role.alignment === `enemy` && !c.isDefeated,
        // );

        // const revealedEnemies = enemiesAtlocation.filter((x) => x.isDiscovered);
        // if (revealedEnemies.length) {
        //     // already in battle
        //     return playerAction_attackEnemy({ context, estimateRemainingSec, revealedEnemies });
        // }

        // if (enemiesAtlocation.length) {
        //     const revealResult = playerAction_revealEnemies({ context, estimateRemainingSec, enemiesAtlocation });
        //     if (!revealResult.canCompleteImmediately || revealResult.estimateRemainingSec < 15) {
        //         return revealResult;
        //     }

        //     const attackResult = playerAction_attackEnemy({
        //         context,
        //         estimateRemainingSec: revealResult.estimateRemainingSec,
        //         revealedEnemies: revealResult.revealedEnemies,
        //     });

        //     return {
        //         events: [...revealResult.events, ...attackResult.events],
        //     };
        // }

        console.error(`resolvePlayerAction - NO EVENTS`, { context, estimateRemainingSec, workResults });
        return {
            events: [],
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
            return response(
                ...startPlayerAction({ context, estimateRemainingSec: context.currentSessionPeriod.remainingSec })
                    .events,
            );
        },
        triggerRestPeriod: ({ context, workResults }) => {
            return response(
                ...resolvePlayerAction({
                    context,
                    workResults,
                    estimateRemainingSec: context.currentSessionPeriod.remainingSec,
                }).events,
            );
        },
        enterPlayerDecision: ({ context }) => {
            throw new Error(`Not implemented`);
        },
        enterRemotePlayersWorkResult: (options) => {
            throw new Error(`Not implemented`);
        },
    };
};