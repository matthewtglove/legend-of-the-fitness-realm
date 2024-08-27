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
            race: `Treent`,
            class: `Druid`,
            ranking: `normal`,
            surname: `Oakheart`,
            firstName: `Mossbeard`,
            aliases: [`The Ancient One`, `The Elder Tree`],
        },
        targetDepth: 3,
        targetBreadth: 5,
    }) satisfies {
        /** body parts that can be targetted by the player
         *
         * This should be a markdown outline of all the body parts to the target depth
         *
         * Example:
         *
         * - trunk
         *   - root
         *   - branches
         *     - limbs
         *       - leaves
         * etc.
         */
        bodyPartTree: string;
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

```md
-   Trunk
    -   Heartwood Core
        -   Sap Conduits
        -   Growth Rings
        -   Magical Leylines
    -   Bark Armor
        -   Runic Engravings
        -   Mossy Patches
        -   Symbiotic Fungi
    -   Root System
        -   Nutrient Tendrils
        -   Earthen Anchors
        -   Hidden Caches
    -   Crown
        -   Ancient Branches
            -   Whispering Leaves
            -   Fruit of Knowledge
            -   Nest of Prophecy
        -   Living Vines
            -   Thorny Lashes
            -   Ensnaring Tendrils
            -   Flowering Sensors
```
