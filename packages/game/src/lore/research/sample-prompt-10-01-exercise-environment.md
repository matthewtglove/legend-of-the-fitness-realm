What would this output:

```typescript
export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
    const analysis = loreGenerator.generateEnvironmentActionsLikeUserExercise({
        exercise: `push-ups`,
        reps: 12,
        durationSeconds: 30,
        playerCharacter: {
            race: `Dwarf`,
            class: `Ranger`,
        },
        count: 15,
    }) satisfies EnvironmentActionAnalysis;

    type MuscleGroup = 'core' | 'back' | 'chest' | 'shoulders' | 'arms' | 'legs' | 'glutes';

    type EnvironmentActionAnalysis = {
        usedMuscleGroups: MuscleGroup[];
        environmentActions: {
            name: string;
            targetEnvironmentObjectClass: undefined | string;
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
  environmentActions: [
    {
      name: "Mountain Forge Press",
      targetEnvironmentObjectClass: "DwarvenAnvil",
      requiredSkillClass: "Smithing"
    },
    {
      name: "Boulder Hoist",
      targetEnvironmentObjectClass: "CavernRock",
      requiredSkillClass: undefined
    },
    {
      name: "Bow String Tension",
      targetEnvironmentObjectClass: "RangerLongbow",
      requiredSkillClass: "Archery"
    },
    {
      name: "Mineshaft Climb",
      targetEnvironmentObjectClass: "UndergroundLadder",
      requiredSkillClass: "Athletics"
    },
    {
      name: "Crystal Push",
      targetEnvironmentObjectClass: "GlowingCrystal",
      requiredSkillClass: "Geomancy"
    },
    {
      name: "Stalactite Dodge",
      targetEnvironmentObjectClass: undefined,
      requiredSkillClass: "Acrobatics"
    },
    {
      name: "Gem Polishing",
      targetEnvironmentObjectClass: "RoughGemstone",
      requiredSkillClass: "Jewelcrafting"
    },
    {
      name: "Tunnel Support",
      targetEnvironmentObjectClass: "UnstablePassage",
      requiredSkillClass: "Engineering"
    },
    {
      name: "Mushroom Harvest Squat",
      targetEnvironmentObjectClass: "GlowingFungus",
      requiredSkillClass: "Herbalism"
    },
    {
      name: "Ore Vein Excavation",
      targetEnvironmentObjectClass: "MineralDeposit",
      requiredSkillClass: "Mining"
    },
    {
      name: "Stone Carving",
      targetEnvironmentObjectClass: "RawStoneBlock",
      requiredSkillClass: "Masonry"
    },
    {
      name: "Subterranean Wrestling",
      targetEnvironmentObjectClass: undefined,
      requiredSkillClass: "Grappling"
    },
    {
      name: "Echo Location Training",
      targetEnvironmentObjectClass: undefined,
      requiredSkillClass: "Perception"
    },
    {
      name: "Rune Etching",
      targetEnvironmentObjectClass: "EnchantedStone",
      requiredSkillClass: "Runecrafting"
    },
    {
      name: "Crystal Lamp Lighting",
      targetEnvironmentObjectClass: "UnlitCrystalLamp",
      requiredSkillClass: "Illumination"
    }
  ]
}

```
