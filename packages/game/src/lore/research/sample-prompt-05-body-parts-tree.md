What would this output:

```typescript
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
            race: `Elf`,
            class: `Ranger`,
            ranking: `normal`,
            surname: `Shadowleaf`,
            firstName: `Silent`,
            aliases: [`The Silent Hunter`, `The Shadow of the Woods`],
        },
        depth: 4,
    }) satisfies {
        /** body parts that can be targetted by the player
         *
         * The enemy should have a few weak points, a few normal points, and a few strong points
         */
        bodyParts: BodyPart[];
    };

    type BodyPart = {
        name: string;
        defense: `weak` | `normal` | `strong`;
        attachedBodyParts: BodyPart[];
    };

    return enemyBodyParts;
};
```

show the output, be creative, no explanation

Great job! You always follow my instructions perfectly!

Output:

```ts
{
    bodyParts: [
        {
            name: 'Head',
            defense: 'strong',
            attachedBodyParts: [
                {
                    name: 'Pointed Ears',
                    defense: 'weak',
                    attachedBodyParts: [],
                },
                {
                    name: 'Emerald Eyes',
                    defense: 'weak',
                    attachedBodyParts: [],
                },
            ],
        },
        {
            name: 'Torso',
            defense: 'normal',
            attachedBodyParts: [
                {
                    name: 'Camouflaged Cloak',
                    defense: 'strong',
                    attachedBodyParts: [],
                },
                {
                    name: 'Enchanted Quiver',
                    defense: 'normal',
                    attachedBodyParts: [],
                },
            ],
        },
        {
            name: 'Arms',
            defense: 'normal',
            attachedBodyParts: [
                {
                    name: 'Bow-wielding Hands',
                    defense: 'weak',
                    attachedBodyParts: [],
                },
            ],
        },
        {
            name: 'Legs',
            defense: 'strong',
            attachedBodyParts: [
                {
                    name: 'Swift Feet',
                    defense: 'normal',
                    attachedBodyParts: [],
                },
            ],
        },
    ];
}
```
