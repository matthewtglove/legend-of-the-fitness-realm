import * as LoreTypes from './lore/lore-types';

// MARK: GameState
export type GameState = {
    players: GamePlayer[];
    characters: GameCharacter[];
    locations: GameLocation[];
    keyItems: GameKeyItem[];
    items: GameItem[];
    campaigns: GameCampaign[];
    quests: GameQuest[];
    _nextId: number;
};

// MARK: GameLoreProvider
export type GameLoreProvider = {
    getExerciseInfo: (exerciseName: string) => undefined | LoreTypes.ExerciseInfo;
    generateAttack: (props: { state: GameState; player: GamePlayer; muscleGroupsUsed: LoreTypes.MuscleGroup[] }) => {
        attackName: string;
        attackKind: `melee` | `ranged` | `magic`;
        attackWeapon?: string;
    };
    generatePlayerInfo: (props: { state: GameState }) => { id: GamePlayerId };
    generateEnemyInfo(props: {
        state: GameState;
        playerLevels: number[];
        locationId: GameLocationId;
        enemyDifficulty: GameEnemyDifficulty;
        campaignId?: GameCampaignId;
        questId?: GameQuestId;
    }): {
        id: GameCharacterId;
        name: string;
        role: {
            race: string;
            class: string;
            enemyDifficulty: GameEnemyDifficulty;
        };
    };
    generateCampaignInfo: (props: {
        state: GameState;
        playerLevels: number[];
        locationId?: GameLocationId;
        previousCampaignIds: GameCampaignId[];
    }) => { id: GameCampaignId; name: string };
    generateQuestInfo: (props: {
        state: GameState;
        playerLevels: number[];
        locationId?: GameLocationId;
        campaignId?: GameCampaignId;
        previousQuestIds: GameQuestId[];
        maxObjectiveCount: number;
    }) => {
        id: GameQuestId;
        name: string;
        objectives: {
            name: string;
            completionKeyItem: {
                id: GameKeyItemId;
                name: string;
                isVisible: boolean;
                placement: `enemy` | `location`;
            };
        }[];
    };
    generateLocationInfo: (props: {
        state: GameState;
        campaignId?: GameCampaignId;
        questId?: GameQuestId;
        nearbyLocationIds: GameLocationId[];
    }) => {
        id: GameLocationId;
        name: string;
        entrances: string[];
    };
};

// MARK: GameBattleProvider
export type GameBattleProvider = {
    generatePlayerStats: (props: { state: GameState; playerLevel: number; race: string; class: string }) => {
        stats: GameCharacter[`stats`];
    };
    generateEnemyStats: (props: {
        state: GameState;
        playerLevels: number[];
        race: string;
        class: string;
        enemyDifficulty: GameEnemyDifficulty;
    }) => {
        stats: GameCharacter[`stats`];
    };
};

// MARK: GameCampaign
export type GameCampaignId = string & { __type: `GameCampaignId` };
export type GameCampaign = {
    id: GameCampaignId;
    name: string;
    quests: GameQuestId[];
    isComplete?: boolean;
};

// MARK: GameQuest
export type GameQuestId = string & { __type: `GameQuestId` };
export type GameQuest = {
    id: GameQuestId;
    name: string;
    objectives: GameQuestObjective[];
    isComplete?: boolean;
};

export type GameQuestObjective = {
    name: string;
    completionKeyItem: GameKeyItemId;
};

// MARK: GameLocation
export type GameLocationId = string & { __type: `GameLocationId` };
export type GameLocation = {
    id: GameLocationId;
    name: string;
    connections: {
        location: GameLocationId;
        name?: string;
        isDiscovered?: boolean;
        /** connected rooms are blocked until the key item is obtained */
        requiredKeyItem?: GameKeyItemId;
    }[];
    /** have the players reached this location yet */
    isDiscovered?: boolean;
    /** rooms can have a key item that can be discovered by searching the room */
    keyItem?: GameKeyItemId;
};

// MARK: GamePlayer
export type GamePlayerId = string & { __type: `GamePlayerId` };
export type GamePlayer = {
    id: GamePlayerId;
    name: string;
    location: GameLocationId;
    role: {
        race: string;
        class: string;
    };
    stats: GameCharacterStats;
    equipment: {
        weapon?: GameItemId;
        armor?: GameItemId;
    };
    inventory: {
        item: GameItemId;
        quantity: number;
    }[];
    pendingActions?: GamePendingActionEvent[];
};

// MARK: GameCharacter
export type GameCharacterId = string & { __type: `GameCharacterId` };
export type GameCharacter = {
    id: GameCharacterId;
    name: string;
    location: GameLocationId;
    /** Have the players encountered this character yet */
    isDiscovered?: boolean;
    /** characters can hold a key item that can be obtained after defeating evil enemy or by earning via a friendly interaction: puzzle, trade, etc */
    keyItem?: GameKeyItemId;
    role: {
        race: string;
        class: string;
        alignment: `friend` | `enemy`;
        enemyDifficulty?: GameEnemyDifficulty;
    };
    stats: GameCharacterStats;
    isDefeated?: boolean;
};

export type GameEnemyDifficulty = `normal` | `minor-boss` | `major-boss` | `final-boss`;
export type GameCharacterStats = {
    level: number;

    health: number;
    healthMax: number;
    mana: number;
    manaMax: number;

    strength: number;
    endurance: number;
    agility: number;
    intelligence: number;
};

// MARK: GameKeyItem
export type GameKeyItemId = string & { __type: `GameKeyItemId` };
export type GameKeyItem = {
    id: GameKeyItemId;
    name: string;
    isVisible: boolean;
    isObtained?: boolean;
};

// MARK: GameItem
export type GameItemId = string & { __type: `GameItemId` };
export type GameItem = {
    id: GameItemId;
    name: string;
    weapon?: {
        attack: number;
    };
    armor?: {
        defense: number;
    };
};

// MARK: GameRuntime
export type GameRuntime = {
    state: GameState;

    /** Recap and offer player decision */
    triggerSessionStart: (options: { context: GameRuntimeContext }) => GameEventResponse;
    /** Provide cliffhanger for next session */
    triggerSessionEnd: (options: { context: GameRuntimeContext }) => GameEventResponse;
    /** For long work periods provide periodic game events */
    triggerWorkPeriod: (options: { context: GameRuntimeContext }) => GameEventResponse;
    /** Provide game event and for long rest periods offer player decision */
    triggerRestPeriod: (options: {
        context: GameRuntimeContext;

        /** This assumes work results are entered immediately, but it might take time:
         *
         * - [yes] Should this only be called after all local players enter their results?
         *   - Yes, the game can't continue without the results (or assuming success)
         *   - The UI can give a short time to allow for entering results and then call this after a timeout with assumed success
         * - [no] Should this be called immediately and have a short response while players enter their results?
         *   - [no] Is the game logic able to do anything without the results?
         */
        workResults: GamePlayerWorkResult[];
    }) => GameEventResponse;

    /** Add new player */
    createPlayer: (options: {
        characterName: string;
        characterRace: string;
        characterClass: string;
        level: number;
    }) => GameEventResponse;

    /** Handle player decision */
    enterPlayerDecision: (options: { decisionId: GameDecisionId; context: GameRuntimeContext }) => GameEventResponse;

    /** Allow remote player success data to collect asynchonously, this will likely be silent but used later in future events
     *
     * This can happen at any time as the session timing is different for a remote player:
     *
     * Remote players may be following a different workout program and have different work periods, etc.
     */
    enterRemotePlayersWorkResult: (options: {
        remoteSessionPeriods: GameSessionPeriod[];
        workResults: GamePlayerWorkResult[];
    }) => GameEventResponse;
};

export type GamePlayerWorkResult = {
    player: GamePlayerId;
    sessionPeriodIndex: number;
    /** The player's success level for the work period:
     *
     * Is this measured or self-reported?
     *
     * - weak: the player feels weak (bad attitude: give up, not trying, tired, complaining, etc)
     * - normal: the player feels normal (good attitude: ok, good, fine)
     * - strong: the player feels strong (great attitude: great, excellent, amazing)
     */
    successKind: `weak` | `normal` | `strong`;
};

export type GameSessionPeriod = {
    kind: `work` | `rest`;
    durationSec: number;
    /** The exercise names will provide the body parts involved */
    exercises: { exerciseName: string }[];
};

// MARK: GameRuntimeContext
export type GameRuntimeContext = {
    sessionPlayers: {
        player: GamePlayerId;
        /** Local players should report success at beginning of rest period */
        isLocal: boolean;
    }[];
    currentSessionPeriod: {
        index: number;
        remainingSec: number;
    };
    sessionPeriods: GameSessionPeriod[];
    sessionPeriodsRemaining: GameSessionPeriod[];
    campaignSessionsTotal: number;
    campaignSessionsRemaining: number;
};

export type GameEventResponse = {
    events: GameEvent[];
};

// MARK: GameEvent
/** A game event is something that should be communicated to the player
 *
 * It can be read directly as a message or used to prompt an AI message
 *
 * Examples:
 *
 * - move to a new location
 * - defeat an enemy
 * - talk to an npc
 * - level up
 * - equip a new weapon
 */
export type GameEvent =
    | StoryReviewEvent
    | QuestObjectiveEvent
    | MoveLocationEvent
    | DescribeLocationEvent
    | SearchLocationKeyItemEvent
    | LootEnemyKeyItemEvent
    | RevealEnemyEvent
    | AttackEnemyEvent
    | AttackEnemyOutcomeEvent
    | TalkToNPCEvent
    | LevelUpEvent
    | EquipWeaponEvent;

export type GamePendingActionEvent = AttackEnemyEvent | MoveLocationEvent;

export type GameCharacterHealthStatus = `ok` | `hurt` | `wounded` | `bleeding` | `defeated`;

type StoryReviewEvent = {
    kind: `story-review`;
    campaign?: string;
    quest: string;
    location: string;
    playerNames: string[];
};

type QuestObjectiveEvent = {
    kind: `quest-objective`;
    campaign?: string;
    quest: string;
    objective: string;
};

type MoveLocationEvent = {
    kind: `move-location`;
    playerNames: string[];
    location: string;
    locationId: GameLocationId;
    connection?: string;
};

type DescribeLocationEvent = {
    kind: `describe-location`;
    location: string;
};

type SearchLocationKeyItemEvent = {
    kind: `search-location-key-item`;
    location: string;
    keyItem: string;
};

type LootEnemyKeyItemEvent = {
    kind: `loot-enemy-key-item`;
    player: string;
    enemy: string;
    keyItem: string;
};

type RevealEnemyEvent = {
    kind: `reveal-enemy`;
    enemies: {
        name: string;
        race: string;
        class: string;
        healthStatus: GameCharacterHealthStatus;
    }[];
};

type AttackEnemyEvent = {
    kind: `attack-enemy`;
    player: string;
    muscleGroupsUsed: LoreTypes.MuscleGroup[];
    enemies: {
        id: GameCharacterId;
        name: string;
        health?: number;
        healthMax?: number;
        healthStatus: GameCharacterHealthStatus;
        attackKind: `melee` | `ranged` | `magic`;
        attackWeapon?: string;
        attackName: string;
    }[];
};

export type AttackEnemyOutcomeEvent = {
    kind: `attack-enemy-outcome`;
    player: string;
    muscleGroupsUsed: LoreTypes.MuscleGroup[];
    enemies: {
        id: GameCharacterId;
        name: string;
        health?: number;
        healthMax?: number;
        healthStatus: GameCharacterHealthStatus;
        attackKind: `melee` | `ranged` | `magic`;
        attackWeapon?: string;
        attackName: string;
        damageSeverity: `light` | `moderate` | `severe`;
        damage: number;
        isDefeated: boolean;
    }[];
};

// TODO: define other events

type TalkToNPCEvent = {
    kind: `talk-to-npc`;
    npc: GameCharacterId;
};

type LevelUpEvent = {
    kind: `level-up`;
    character: GameCharacterId;
};

type EquipWeaponEvent = {
    kind: `equip-weapon`;
    character: GameCharacterId;
    weapon: GameItemId;
};

export type GameDecisionId = string & { __type: `GameDecisionId` };
