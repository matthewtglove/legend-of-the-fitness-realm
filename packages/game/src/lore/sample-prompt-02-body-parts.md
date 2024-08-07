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
};
```

Output:

```ts
{
    bodyParts: [
        {
            name: 'Head',
            defense: 'normal',
            protectsOtherBodyParts: ['Eyes', 'Ears'],
        },
        {
            name: 'Eyes',
            defense: 'weak',
            parentBodyPart: 'Head',
            protectsOtherBodyParts: [],
        },
        {
            name: 'Torso',
            defense: 'strong',
            protectsOtherBodyParts: ['Heart', 'Lungs'],
        },
        {
            name: 'Left Arm',
            defense: 'normal',
            protectsOtherBodyParts: ['Left Hand'],
        },
        {
            name: 'Left Hand',
            defense: 'weak',
            parentBodyPart: 'Left Arm',
            protectsOtherBodyParts: [],
        },
        {
            name: 'Right Arm',
            defense: 'normal',
            protectsOtherBodyParts: ['Right Hand'],
        },
        {
            name: 'Right Hand',
            defense: 'weak',
            parentBodyPart: 'Right Arm',
            protectsOtherBodyParts: [],
        },
        {
            name: 'Legs',
            defense: 'strong',
            protectsOtherBodyParts: ['Feet'],
        },
        {
            name: 'Feet',
            defense: 'normal',
            parentBodyPart: 'Legs',
            protectsOtherBodyParts: [],
        },
        {
            name: 'Heart',
            defense: 'weak',
            parentBodyPart: 'Torso',
            protectsOtherBodyParts: [],
        },
    ];
}
```
