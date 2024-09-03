What would this output:

```typescript
export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
    const analysis = loreGenerator.generateEnvironmentActionsLikeUserExercise({
        exercise: `toyotas`,
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
  usedMuscleGroups: ['legs', 'core', 'arms'],
  environmentActions: [
    {
      name: 'Hoist Dwarven Ale Barrel',
      targetEnvironmentObjectClass: 'Tavern',
      requiredSkillClass: 'Strength'
    },
    {
      name: 'Climb Giant Mushroom',
      targetEnvironmentObjectClass: 'UndergroundForest',
      requiredSkillClass: 'Acrobatics'
    },
    {
      name: 'Dodge Rolling Gemstones',
      targetEnvironmentObjectClass: 'MineCave',
      requiredSkillClass: 'Agility'
    },
    {
      name: 'Wrestle Stone Golem',
      targetEnvironmentObjectClass: 'AncientRuins',
      requiredSkillClass: 'Athletics'
    },
    {
      name: 'Forge Mythril Armor',
      targetEnvironmentObjectClass: 'Smithy',
      requiredSkillClass: 'Crafting'
    },
    {
      name: 'Tame Mountain Lion',
      targetEnvironmentObjectClass: 'AlpinePeaks',
      requiredSkillClass: 'AnimalHandling'
    },
    {
      name: 'Carve Rune-Covered Totem',
      targetEnvironmentObjectClass: 'SacredGrove',
      requiredSkillClass: 'Woodworking'
    },
    {
      name: 'Navigate Treacherous Ravine',
      targetEnvironmentObjectClass: 'CanyonLands',
      requiredSkillClass: 'Survival'
    },
    {
      name: 'Arm Dwarven Ballista',
      targetEnvironmentObjectClass: 'Battlement',
      requiredSkillClass: 'Engineering'
    },
    {
      name: 'Paddle Underground River',
      targetEnvironmentObjectClass: 'SubterraneanWaterway',
      requiredSkillClass: 'Rowing'
    },
    {
      name: 'Push Massive Stone Door',
      targetEnvironmentObjectClass: 'AncientTemple',
      requiredSkillClass: 'Might'
    },
    {
      name: 'Carry Injured Comrade',
      targetEnvironmentObjectClass: undefined,
      requiredSkillClass: 'Endurance'
    },
    {
      name: 'Scale Icy Cliff Face',
      targetEnvironmentObjectClass: 'FrozenWasteland',
      requiredSkillClass: 'Climbing'
    },
    {
      name: 'Chop Petrified Wood',
      targetEnvironmentObjectClass: 'EnchantedForest',
      requiredSkillClass: 'Lumberjacking'
    },
    {
      name: 'Outrun Lava Flow',
      targetEnvironmentObjectClass: 'VolcanicCavern',
      requiredSkillClass: 'Speed'
    }
  ]
}

```
