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
-   Head
    -   Eyes
        -   Irises
            -   Pupils
    -   Ears
        -   Pointed tips
    -   Mouth
        -   Tongue
-   Torso
    -   Chest
        -   Heart
            -   Ventricles
    -   Back
        -   Spine
            -   Vertebrae
-   Arms
    -   Shoulders
        -   Shoulder blades
    -   Elbows
        -   Joints
    -   Hands
        -   Fingers
            -   Fingernails
-   Legs
    -   Thighs
        -   Muscles
    -   Knees
        -   Kneecaps
    -   Feet
        -   Toes
            -   Toenails
```
