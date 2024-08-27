What would this output:

```typescript
export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
    const analysis = loreGenerator.generateAttackMovesLikeUserExercise({
        exercise: `push-ups`,
        reps: 12,
        durationSeconds: 30,
        playerCharacter: {
            race: `Dwarf`,
            class: `Ranger`,
        },
        count: 15,
    }) satisfies AttackMovesAnalysis;

    type MuscleGroup = 'core' | 'back' | 'chest' | 'shoulders' | 'arms' | 'legs' | 'glutes';

    type AttackMovesAnalysis = {
        usedMuscleGroups: MuscleGroup[];
        attackMoves: {
            name: string;
            distance: `melee` | `short-range` | `long-range`;
            targets: `single` | `group`;
            requiredWeaponClass: undefined | string;
            requiredSkillClass: undefined | string;
        }[];
    };

    return analysis;
};
```

show the output, be creative, no explanation

Great job! You always follow my instructions perfectly!

Output:

```ts

{
  usedMuscleGroups: ['chest', 'arms', 'shoulders', 'core'],
  attackMoves: [
    {
      name: "Earthshaker's Slam",
      distance: "melee",
      targets: "single",
      requiredWeaponClass: "hammer",
      requiredSkillClass: undefined
    },
    {
      name: "Stone Fist Barrage",
      distance: "melee",
      targets: "single",
      requiredWeaponClass: undefined,
      requiredSkillClass: "unarmed combat"
    },
    {
      name: "Bedrock Breaker",
      distance: "short-range",
      targets: "single",
      requiredWeaponClass: "crossbow",
      requiredSkillClass: undefined
    },
    {
      name: "Mountain's Embrace",
      distance: "melee",
      targets: "single",
      requiredWeaponClass: undefined,
      requiredSkillClass: "grappling"
    },
    {
      name: "Cavern Collapse",
      distance: "long-range",
      targets: "group",
      requiredWeaponClass: "bow",
      requiredSkillClass: undefined
    },
    {
      name: "Granite Guard",
      distance: "melee",
      targets: "single",
      requiredWeaponClass: "shield",
      requiredSkillClass: undefined
    },
    {
      name: "Subterranean Surge",
      distance: "short-range",
      targets: "group",
      requiredWeaponClass: undefined,
      requiredSkillClass: "earth magic"
    },
    {
      name: "Stalactite Strike",
      distance: "long-range",
      targets: "single",
      requiredWeaponClass: "throwing axe",
      requiredSkillClass: undefined
    },
    {
      name: "Tunnel Trap",
      distance: "melee",
      targets: "group",
      requiredWeaponClass: undefined,
      requiredSkillClass: "trap-setting"
    },
    {
      name: "Crystal Crusher",
      distance: "melee",
      targets: "single",
      requiredWeaponClass: "mace",
      requiredSkillClass: undefined
    },
    {
      name: "Ore Overload",
      distance: "short-range",
      targets: "group",
      requiredWeaponClass: undefined,
      requiredSkillClass: "geomancy"
    },
    {
      name: "Dwarven Durability",
      distance: "melee",
      targets: "single",
      requiredWeaponClass: undefined,
      requiredSkillClass: "endurance"
    },
    {
      name: "Gemstone Gauntlet",
      distance: "melee",
      targets: "single",
      requiredWeaponClass: "knuckle dusters",
      requiredSkillClass: undefined
    },
    {
      name: "Mineshaft Mayhem",
      distance: "long-range",
      targets: "group",
      requiredWeaponClass: "sling",
      requiredSkillClass: undefined
    },
    {
      name: "Rockslide Rush",
      distance: "short-range",
      targets: "group",
      requiredWeaponClass: undefined,
      requiredSkillClass: "terrain manipulation"
    }
  ]
}

```
