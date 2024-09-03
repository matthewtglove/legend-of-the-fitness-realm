/* eslint-disable @typescript-eslint/no-unused-vars */
import { GameBattleProvider } from './types';

export const createGameBattleProvider = (): GameBattleProvider => {
    return {
        generatePlayerStats: (options) => {
            // Generate random player stats
            const level = Math.floor(Math.random() * 10) + 1;
            const healthMax = level * 10;
            const health = healthMax;
            const manaMax = level * 5;
            const mana = manaMax;
            const strength = 5 + Math.floor(Math.random() * 10) + 1;
            const endurance = Math.floor(Math.random() * 10) + 1;
            const agility = Math.floor(Math.random() * 10) + 1;
            const intelligence = Math.floor(Math.random() * 10) + 1;

            return {
                stats: {
                    level,
                    health,
                    healthMax,
                    mana,
                    manaMax,
                    strength,
                    endurance,
                    agility,
                    intelligence,
                },
            };
        },
        generateEnemyStats: (options) => {
            // Generate enemy stats
            const level = Math.floor(Math.random() * 5) + 1;
            const healthMax = level * 10;
            const health = healthMax;
            const manaMax = level * 5;
            const mana = manaMax;
            const strength = Math.floor(Math.random() * 10) + 1;
            const endurance = Math.floor(Math.random() * 10) + 1;
            const agility = Math.floor(Math.random() * 10) + 1;
            const intelligence = Math.floor(Math.random() * 10) + 1;

            return {
                stats: {
                    level,
                    health,
                    healthMax,
                    mana,
                    manaMax,
                    strength,
                    endurance,
                    agility,
                    intelligence,
                },
            };
        },
    };
};
