What would this output?

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
            race: `Treent`,
            class: `Druid`,
            ranking: `normal`,
            surname: `Oakheart`,
            firstName: `Mossbeard`,
            aliases: [`The Ancient One`, `The Elder Tree`],
        },
        approximateCount: 12,
    }) satisfies {
        /** body parts that can be targetted by the player
         *
         * The enemy should have a few weak points, a few normal points, and a few strong points
         */
        bodyParts: {
            name: string;
            defense: `weak` | `normal` | `strong`;
            attachedToBodyPart: string | `CORE`;
        }[];
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
            name: 'Trunk',
            defense: 'strong',
        },
        {
            name: 'Root System',
            defense: 'normal',
            attachedToBodyPart: 'Trunk',
        },
        {
            name: 'Main Branches',
            defense: 'normal',
            attachedToBodyPart: 'Trunk',
        },
        {
            name: 'Leafy Canopy',
            defense: 'weak',
            attachedToBodyPart: 'Main Branches',
        },
        {
            name: 'Heartwood',
            defense: 'strong',
            attachedToBodyPart: 'Trunk',
        },
        {
            name: 'Bark',
            defense: 'normal',
            attachedToBodyPart: 'Trunk',
        },
        {
            name: 'Moss Beard',
            defense: 'weak',
            attachedToBodyPart: 'Trunk',
        },
        {
            name: 'Druidic Focus (Embedded Crystals)',
            defense: 'weak',
            attachedToBodyPart: 'Trunk',
        },
        {
            name: 'Hollow Knot (Weak Point)',
            defense: 'weak',
            attachedToBodyPart: 'Trunk',
        },
        {
            name: 'Thick Lower Branches',
            defense: 'strong',
            attachedToBodyPart: 'Trunk',
        },
    ];
}
```
