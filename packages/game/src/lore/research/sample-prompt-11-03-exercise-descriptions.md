What would this output:

```typescript
export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
    const possibleExerciseDescriptions = loreGenerator.generatePossibleExerciseDescriptions({
        exercise: `toyotas`,
        count: 4,
        temperature: 0.5,
    }) satisfies ExerciseDescription;

    type MuscleGroup = 'core' | 'back' | 'chest' | 'shoulders' | 'arms' | 'legs' | 'glutes';
    type MotionSpeed = 'slow' | 'normal' | 'fast' | 'explosive';

    type ExerciseDescription = {
        usedMuscleGroups: MuscleGroup[];
        motionSpeed: MotionSpeed;
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
      motionSpeed: 'normal',
      describeActualExerciseToUser: 'Stand with feet shoulder-width apart. Lower into a squat, then jump up, swinging arms overhead. Land softly and immediately lower into the next squat.'
    },
    {
      usedMuscleGroups: ['core', 'legs', 'glutes'],
      motionSpeed: 'explosive',
      describeActualExerciseToUser: 'Start in a low squat position. Explosively jump up, bringing knees towards chest. Land softly and immediately drop back into squat position.'
    },
    {
      usedMuscleGroups: ['legs', 'glutes'],
      motionSpeed: 'slow',
      describeActualExerciseToUser: 'Stand with feet hip-width apart. Step forward into a lunge, lowering back knee towards the ground. Push back to starting position and repeat on the other leg.'
    },
    {
      usedMuscleGroups: ['core', 'legs', 'arms'],
      motionSpeed: 'fast',
      describeActualExerciseToUser: 'Start in a standing position. Quickly drop into a squat, place hands on the ground. Kick legs back into a plank, then immediately return to squat and stand up.'
    }
  ],
  bestDescription: {
    usedMuscleGroups: ['core', 'legs'],
    motionSpeed: 'normal',
    describeActualExerciseToUser: 'Stand with feet shoulder-width apart. Lower into a squat, then jump up, swinging arms overhead. Land softly and immediately lower into the next squat.'
  }
}

```
