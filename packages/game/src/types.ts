export type GameState = {
    players: GameCharacter[];
    locations: GameLocation[];
    characters: GameCharacter[];
    keyItems: GameKeyItem[];
};

export type GameLocationId = string & { __type: 'GameLocationId' };
export type GameLocation = {
    id: GameLocationId;
    name: string;
    connections: GameLocationId[];
    /** connected rooms are blocked until the key item is obtained */
    requiredKeyItem?: GameKeyItemId;
    /** rooms can have a key item that can be discovered by searching the room */
    keyItem?: GameKeyItemId;
};

export type GameCharacterId = string & { __type: 'GameCharacterId' };
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

export type GameKeyItemId = string & { __type: 'GameKeyItemId' };
export type GameKeyItem = {
    id: GameKeyItemId;
    name: string;
    obtained: boolean;
};

export type GameItemId = string & { __type: 'GameItemId' };
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

    triggerSessionStart: () => GameEvent;
    triggerSessionEnd: () => GameEvent;
    triggerWorkPeriod: (options: { durationSec: number }) => GameEvent;
    triggerRestPeriod: (options: { durationSec: number; successRatio: number }) => GameEvent;
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
export type GameEvent = {};
