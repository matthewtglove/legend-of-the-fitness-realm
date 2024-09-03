What would this output:

```typescript
export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
    const enemyAbilities = loreGenerator.generateEnemyAbilities({
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
            race: `Elf`,
            class: `Ranger`,
            ranking: `normal`,
            surname: `Shadowleaf`,
            firstName: `Silent`,
            aliases: [`The Silent Hunter`, `The Shadow of the Woods`],
            bodyParts: [
                `Head`,
                `Eyes`,
                `Torso`,
                `Left Arm`,
                `Left Hand`,
                `Right Arm`,
                `Right Hand`,
                `Left Leg`,
                `Right Leg`,
            ],
        },
        attackCount: 20,
        abilityCount: 5,
    }) satisfies {
        attacks: {
            title: string;
            strength: `weak` | `normal` | `strong`;
            requiredBodyParts: string[];
        }[];
        abilities: {
            title: string;
            effect: string;
            requiredBodyParts: string[];
        }[];
    };

    return enemyAbilities;
};
```
