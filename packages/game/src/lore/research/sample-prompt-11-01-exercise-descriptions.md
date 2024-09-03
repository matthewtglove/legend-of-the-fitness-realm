What would this output:

```typescript
export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
    const possibleExerciseDescriptions = loreGenerator.generatePossibleExerciseDescriptions({
        exercise: `toyotas`,
        count: 4,
        temperature: 0.5,
    }) satisfies ExerciseDescription;

    type MuscleGroup = 'core' | 'back' | 'chest' | 'shoulders' | 'arms' | 'legs' | 'glutes';

    type ExerciseDescription = {
        usedMuscleGroups: MuscleGroup[];
        describeActualExerciseToUser: string;
    };

    const bestDescription = loreGenerator.chooseMostAccurateDescription(possibleExerciseDescriptions);

    return {
        possibleExerciseDescriptions,
        bestDescription,
    };
};
```

show the output, be accurate, no explanation

Great job! You always follow my instructions perfectly!

Output:

---

```ts
{
  possibleExerciseDescriptions: [
    {
      usedMuscleGroups: ['core', 'legs'],
      describeActualExerciseToUser: 'Stand with feet hip-width apart. Squat down, then explode upward, jumping and bringing knees towards chest. Land softly and immediately repeat.'
    },
    {
      usedMuscleGroups: ['core', 'legs', 'glutes'],
      describeActualExerciseToUser: 'Begin in a standing position. Lower into a squat, then jump up, extending legs and arms. Land softly and immediately drop back into a squat position.'
    },
    {
      usedMuscleGroups: ['core', 'legs', 'glutes'],
      describeActualExerciseToUser: 'Start in a standing position. Quickly drop into a squat, then jump up, lifting knees high. Land gently and immediately squat down to repeat.'
    },
    {
      usedMuscleGroups: ['core', 'legs'],
      describeActualExerciseToUser: 'Begin standing. Lower into a squat, then explosively jump up, tucking knees to chest. Land softly and immediately squat down to repeat the movement.'
    }
  ],
  bestDescription: {
    usedMuscleGroups: ['core', 'legs', 'glutes'],
    describeActualExerciseToUser: 'Begin in a standing position. Lower into a squat, then jump up, extending legs and arms. Land softly and immediately drop back into a squat position.'
  }
}

```
