What would this output? Output the exact output object only and no description with all values listed.

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
            race: `Treent`,
            class: `Druid`,
            ranking: `normal`,
            surname: `Oakheart`,
            firstName: `Mossbeard`,
            aliases: [`The Ancient One`, `The Elder Tree`],
            bodyParts: [
                'Trunk',
                'Root System',
                'Main Branches',
                'Leafy Canopy',
                'Heartwood',
                'Bark',
                'Moss Beard',
                'Druidic Focus (Embedded Crystals)',
                'Hollow Knot (Weak Point)',
                'Thick Lower Branches',
            ],
        },
        approximateCount: 12,
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

Output:

```json
{
    "attacks": [
        {
            "title": "Branch Swipe",
            "strength": "normal",
            "requiredBodyParts": ["Main Branches", "Thick Lower Branches"]
        },
        {
            "title": "Root Entangle",
            "strength": "strong",
            "requiredBodyParts": ["Root System"]
        },
        {
            "title": "Leaf Storm",
            "strength": "weak",
            "requiredBodyParts": ["Leafy Canopy"]
        },
        {
            "title": "Bark Slam",
            "strength": "strong",
            "requiredBodyParts": ["Trunk", "Bark"]
        },
        {
            "title": "Crystal Shard Burst",
            "strength": "normal",
            "requiredBodyParts": ["Druidic Focus (Embedded Crystals)"]
        }
    ],
    "abilities": [
        {
            "title": "Nature's Embrace",
            "effect": "Heals and fortifies nearby plant life",
            "requiredBodyParts": ["Heartwood", "Root System"]
        },
        {
            "title": "Whispering Winds",
            "effect": "Confuses and disorients enemies",
            "requiredBodyParts": ["Leafy Canopy", "Moss Beard"]
        },
        {
            "title": "Ancient Wisdom",
            "effect": "Enhances magical abilities",
            "requiredBodyParts": ["Heartwood", "Druidic Focus (Embedded Crystals)"]
        },
        {
            "title": "Forest Camouflage",
            "effect": "Blends with surroundings, becoming nearly invisible",
            "requiredBodyParts": ["Bark", "Moss Beard"]
        },
        {
            "title": "Regenerative Sap",
            "effect": "Slowly heals damage over time",
            "requiredBodyParts": ["Trunk", "Heartwood"]
        }
    ]
}
```
