// export const createStoryPrompt = (options: {
//     kind: `intro` | `next-set`;
//     characterName: string;
//     questName: string;
//     questProgress: number;
//     context: string;
//     lastStory: string;
//     workoutSessionProgress: number;
//     nextEvent?: string;
//     nextWorkoutSet?: string;
// }) => {
//     if (options.kind === `intro`) {
//         return `
// CharacterName: ${options.characterName}
// Quest: ${options.questName}
// QuestProgress: ${options.questProgress}%
// Context: ${options.context}
// LastStory: ${options.lastStory}
// WorkoutSessionProgress: ${options.workoutSessionProgress}%
// Instructions: In a short phrase give an intro for today's context.`;
//     }

//     if (options.kind === `event`) {
//         return `
// CharacterName: ${options.characterName}
// Quest: ${options.questName}
// QuestProgress: ${options.questProgress}%
// Context: ${options.context}
// LastStory: ${options.lastStory}
// WorkoutSessionProgress: ${options.workoutSessionProgress}%
// NextEvent: Attack a Level 3 Goblin with an axe
// NextSet: 12 reps Push-Ups
// Instructions: In a single sentance add a vivid story to explain that Rick's character will attack a "Level 3 Goblin" in story while he will do "12 reps Push-Ups" in real life. (Only say what Rick plans to do, not the results.)

// Instructions: In a short phrase give an intro for today's context.`;
//     }

//     const prompt = `

//     `;
// };
