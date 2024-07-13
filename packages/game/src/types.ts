export type GameState = {
    players: GameCharacter[];
    locations: GameLocation[];
    characters: GameCharacter[];
    keyItems: GameKeyItem[];
    items: GameItem[];
};

export type GameLocationId = string & { __type: `GameLocationId` };
export type GameLocation = {
    id: GameLocationId;
    name: string;
    connections: GameLocationId[];
    /** connected rooms are blocked until the key item is obtained */
    requiredKeyItem?: GameKeyItemId;
    /** rooms can have a key item that can be discovered by searching the room */
    keyItem?: GameKeyItemId;
};

export type GameCharacterId = string & { __type: `GameCharacterId` };
export type GameCharacter = {
    id: GameCharacterId;
    name: string;
    location: GameLocationId;
    /** characters can hold a key item that can be obtained after defeating evil enemy or by earning via a friendly interaction: puzzle, trade, etc */
    keyItem?: GameKeyItemId;
    role: {
        race: string;
        class: string;
        alignment: `good` | `evil`;
    };
    stats: {
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
    equipment: {
        weapon: GameItemId;
        armor: GameItemId;
    };
    inventory: {
        item: GameItemId;
        quantity: number;
    }[];
};

export type GameKeyItemId = string & { __type: `GameKeyItemId` };
export type GameKeyItem = {
    id: GameKeyItemId;
    name: string;
    obtained: boolean;
};

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

export type GameRuntime = {
    state: GameState;

    /** Recap and offer player decision */
    triggerSessionStart: (options: { context: CampaignContext }) => GameEventResponse;
    /** Provide cliffhanger for next session */
    triggerSessionEnd: (options: { context: CampaignContext }) => GameEventResponse;
    /** For long work periods provide periodic game events */
    triggerWorkPeriod: (options: { durationSec: number; context: CampaignContext }) => GameEventResponse;
    /** Provide game event and for long rest periods offer player decision */
    triggerRestPeriod: (options: {
        durationSec: number;
        successRatio: number;
        context: CampaignContext;
    }) => GameEventResponse;
    /** Handle player decision */
    enterPlayerDecision: (options: { decisionId: GameDecisionId; context: CampaignContext }) => GameEventResponse;
};

type CampaignContext = {
    sessionPeriodsRemaining: { kind: `work` | `rest`; durationSec: number }[];
    sessionPeriodsTotal: { kind: `work` | `rest`; durationSec: number }[];
    campaignSessionsRemaining: number;
    campaignSessionsTotal: number;
};

export type GameEventResponse = {
    events: GameEvent[];
};

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
export type GameEvent = MoveEvent | AttackEnemyEvent | TalkToNPCEvent | LevelUpEvent | EquipWeaponEvent;

type MoveEvent = {
    kind: `move`;
    location: GameLocationId;
};

type AttackEnemyEvent = {
    kind: `attack-enemy`;
    enemies: {
        enemy: GameCharacterId;
        health?: number;
        healthMax?: number;
        healthStatus: `ok` | `hurt` | `wounded` | `critical` | `defeated`;
        attackKind: `melee` | `ranged` | `magic`;
        attackWeapon?: GameItemId;
        damageSeverity: `miss` | `graze` | `hit` | `critical`;
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
