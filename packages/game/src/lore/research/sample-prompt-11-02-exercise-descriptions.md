What would this output:

```typescript
export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
    const possibleExerciseDescriptions = loreGenerator.generatePossibleExerciseDescriptions({
        exercise: `let-me-ins`,
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
      usedMuscleGroups: ['core', 'arms'],
      describeActualExerciseToUser: "Lie on your back, bend your knees, and place your hands behind your head. Lift your shoulders off the ground while simultaneously raising your legs, bringing your elbows towards your knees. Lower back down and repeat."
    },
    {
      usedMuscleGroups: ['core', 'arms', 'shoulders'],
      describeActualExerciseToUser: "Start in a plank position. Lower your body by bending your elbows, then push back up while simultaneously lifting your hips high into the air, forming an inverted V-shape. Return to the starting position and repeat."
    },
    {
      usedMuscleGroups: ['core', 'chest', 'arms'],
      describeActualExerciseToUser: "Begin in a push-up position. Lower your chest to the ground, then explosively push up, allowing your hands to leave the ground. As you lift off, quickly tuck your knees towards your chest before extending your legs back out to land in the starting position."
    },
    {
      usedMuscleGroups: ['core', 'back', 'arms'],
      describeActualExerciseToUser: "Hang from a pull-up bar with an overhand grip. Engage your core and lift your legs straight out in front of you until they're parallel to the ground. Slowly lower them back down and repeat."
    }
  ],
  bestDescription: {
    usedMuscleGroups: ['core', 'arms'],
    describeActualExerciseToUser: "Lie on your back, bend your knees, and place your hands behind your head. Lift your shoulders off the ground while simultaneously raising your legs, bringing your elbows towards your knees. Lower back down and repeat."
  }
}

```
