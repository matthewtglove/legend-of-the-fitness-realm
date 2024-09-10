/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoreDictionaryGenerator } from '../lore-dictionary';

export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
    const enemyBodyParts = loreGenerator.generateEnemyBodyParts({
        world: {
            title: `Eldoria`,
            genre: `High Fantasy`,
        },
        location: {
            title: `Whispering Woods`,
            biome: `Enchanted Forest`,
        },
        campaign: {
            title: `The Corrupted Heart`,
        },
        enemy: {
            race: `Treent`,
            class: `Druid`,
            ranking: `normal`,
            surname: `Oakheart`,
            firstName: `Mossbeard`,
            aliases: [`The Ancient One`, `The Elder Tree`],
        },
        count: 10,
    }) satisfies {
        /** body parts that can be targetted by the player
         *
         * The enemy should have a few weak points, a few normal points, and a few strong points
         */
        bodyParts: {
            name: string;
            defense: `weak` | `normal` | `strong`;
            attachedToBodyPart?: string;
        }[];
    };

    return enemyBodyParts;
};

// MARK: Output:
