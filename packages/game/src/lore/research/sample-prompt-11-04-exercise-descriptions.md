What would this output:

```typescript
export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
    const possibleExerciseDescriptions = loreGenerator.generatePossibleExerciseDescriptions({
        exercise: `one leg romanian dead lift`,
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
      usedMuscleGroups: ['legs', 'glutes', 'core', 'back'],
      motionSpeed: 'slow',
      describeActualExerciseToUser: 'Stand on one leg, hinge at the hips while keeping your back straight, and lower your torso parallel to the ground. Keep the other leg extended behind you for balance. Slowly return to the starting position.'
    },
    {
      usedMuscleGroups: ['legs', 'glutes', 'core'],
      motionSpeed: 'normal',
      describeActualExerciseToUser: 'Balance on one leg, bend forward at the waist while lifting your other leg behind you. Lower your upper body until it's parallel to the floor, then return to the starting position.'
    },
    {
      usedMuscleGroups: ['legs', 'glutes', 'back'],
      motionSpeed: 'slow',
      describeActualExerciseToUser: 'Stand on one leg, keep your back straight and lean forward, lifting the other leg behind you. Lower your upper body until it's parallel to the ground, then slowly rise back up.'
    },
    {
      usedMuscleGroups: ['legs', 'glutes', 'core', 'back'],
      motionSpeed: 'normal',
      describeActualExerciseToUser: 'Balance on one foot, hinge at the hips and lower your torso while raising your free leg behind you. Keep your back straight and return to the starting position in a controlled manner.'
    }
  ],
  bestDescription: {
    usedMuscleGroups: ['legs', 'glutes', 'core', 'back'],
    motionSpeed: 'slow',
    describeActualExerciseToUser: 'Stand on one leg, hinge at the hips while keeping your back straight, and lower your torso parallel to the ground. Keep the other leg extended behind you for balance. Slowly return to the starting position.'
  }
}

```
