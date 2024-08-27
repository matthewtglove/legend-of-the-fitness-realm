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
        bodyPartTree: BodyPartNode[];
    };

    type BodyPartNode = {
        name: string;
        attachedBodyParts: BodyPartNode[];
    };

    return enemyBodyParts;
};
```

show the output, be creative, no explanation

Great job! You always follow my instructions perfectly!

Output:

```ts
{
    bodyPartTree: [
        {
            name: 'Head',
            attachedBodyParts: [
                {
                    name: 'Eyes',
                    attachedBodyParts: [
                        { name: 'Left Eye', attachedBodyParts: [] },
                        { name: 'Right Eye', attachedBodyParts: [] },
                    ],
                },
                { name: 'Ears', attachedBodyParts: [] },
                { name: 'Mouth', attachedBodyParts: [] },
            ],
        },
        {
            name: 'Torso',
            attachedBodyParts: [
                { name: 'Heart', attachedBodyParts: [] },
                { name: 'Lungs', attachedBodyParts: [] },
                {
                    name: 'Arms',
                    attachedBodyParts: [
                        {
                            name: 'Left Arm',
                            attachedBodyParts: [{ name: 'Left Hand', attachedBodyParts: [] }],
                        },
                        {
                            name: 'Right Arm',
                            attachedBodyParts: [{ name: 'Right Hand', attachedBodyParts: [] }],
                        },
                    ],
                },
            ],
        },
        {
            name: 'Legs',
            attachedBodyParts: [
                {
                    name: 'Left Leg',
                    attachedBodyParts: [{ name: 'Left Foot', attachedBodyParts: [] }],
                },
                {
                    name: 'Right Leg',
                    attachedBodyParts: [{ name: 'Right Foot', attachedBodyParts: [] }],
                },
            ],
        },
        { name: 'Aura', attachedBodyParts: [] },
    ];
}
```
