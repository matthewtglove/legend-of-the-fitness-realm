Give me a list of interactions that a player can do in an adventure game with the environment, output as a typescript type: type PlayerEnvironmentInteraction = `open` | ...

---

```ts
type PlayerEnvironmentInteraction =
    | 'open'
    | 'close'
    | 'push'
    | 'pull'
    | 'lift'
    | 'examine'
    | 'use'
    | 'take'
    | 'drop'
    | 'climb'
    | 'jump'
    | 'swim'
    | 'dive'
    | 'dig'
    | 'cut'
    | 'break'
    | 'burn'
    | 'freeze'
    | 'melt'
    | 'combine'
    | 'separate'
    | 'read'
    | 'write'
    | 'speak'
    | 'listen'
    | 'smell'
    | 'taste'
    | 'unlock'
    | 'lock'
    | 'activate'
    | 'deactivate'
    | 'repair'
    | 'destroy'
    | 'hide'
    | 'reveal'
    | 'plant'
    | 'harvest'
    | 'feed'
    | 'tame'
    | 'craft'
    | 'cook'
    | 'eat'
    | 'drink'
    | 'fill'
    | 'empty'
    | 'pour'
    | 'light'
    | 'extinguish'
    | 'charge'
    | 'discharge';
```

---

Reduce this list to eliminate similar actions

---

```ts
type PlayerEnvironmentInteraction =
    | 'open'
    | 'push'
    | 'examine'
    | 'use'
    | 'take'
    | 'drop'
    | 'climb'
    | 'jump'
    | 'swim'
    | 'dig'
    | 'cut'
    | 'break'
    | 'combine'
    | 'read'
    | 'speak'
    | 'smell'
    | 'unlock'
    | 'activate'
    | 'repair'
    | 'hide'
    | 'craft'
    | 'eat'
    | 'fill'
    | 'light';
```

---

Reduce this list to eliminate similar actions

---

```ts
type PlayerEnvironmentInteraction =
    | 'open'
    | 'push'
    | 'examine'
    | 'use'
    | 'take'
    | 'drop'
    | 'climb'
    | 'jump'
    | 'swim'
    | 'dig'
    | 'cut'
    | 'break'
    | 'combine'
    | 'read'
    | 'talk'
    | 'smell'
    | 'unlock'
    | 'activate'
    | 'fix'
    | 'hide'
    | 'craft'
    | 'eat'
    | 'fill'
    | 'light';
```

---

organize the list

---

```ts
type PlayerEnvironmentInteraction =
    // Basic interactions
    | 'examine'
    | 'use'
    | 'take'
    | 'drop'

    // Physical interactions
    | 'open'
    | 'push'
    | 'climb'
    | 'jump'
    | 'swim'
    | 'dig'

    // Manipulation
    | 'cut'
    | 'break'
    | 'combine'
    | 'craft'
    | 'fix'

    // Sensory actions
    | 'read'
    | 'talk'
    | 'smell'

    // State changes
    | 'unlock'
    | 'activate'
    | 'hide'
    | 'light'

    // Survival actions
    | 'eat'
    | 'fill';
```

---

Restart the list more organized

---

```ts
type PlayerEnvironmentInteraction =
    // Core interactions
    | 'examine'
    | 'use'
    | 'take'
    | 'drop'

    // Movement
    | 'walk'
    | 'run'
    | 'jump'
    | 'climb'
    | 'swim'

    // Object manipulation
    | 'open'
    | 'close'
    | 'push'
    | 'pull'
    | 'lift'

    // Advanced interactions
    | 'talk'
    | 'read'
    | 'write'
    | 'craft'
    | 'combine'

    // Environmental actions
    | 'dig'
    | 'cut'
    | 'break'
    | 'light'
    | 'extinguish'

    // State changes
    | 'activate'
    | 'deactivate'
    | 'lock'
    | 'unlock'

    // Survival actions
    | 'eat'
    | 'drink'
    | 'sleep';
```

---

Give me a list of interactions that a player can do in an adventure game with an object in the environment, output as a typescript type: type PlayerEnvironmentObjectInteraction = `open` | ...

Remember only list physical actions that the player should do with part of the environment (not loot, inventory, etc).

Keep it simple and common. Organize the list.

---

```ts
type PlayerEnvironmentObjectInteraction =
    // Basic interactions
    | 'open'
    | 'close'
    | 'push'
    | 'pull'
    | 'lift'
    | 'drop'
    | 'throw'
    | 'catch'

    // Manipulation
    | 'turn'
    | 'twist'
    | 'flip'
    | 'slide'
    | 'rotate'

    // Forceful actions
    | 'break'
    | 'smash'
    | 'kick'
    | 'punch'

    // Careful actions
    | 'examine'
    | 'touch'
    | 'tap'
    | 'poke'

    // Utility actions
    | 'use'
    | 'activate'
    | 'deactivate'
    | 'combine'
    | 'separate'

    // Movement-related
    | 'climb'
    | 'jump'
    | 'crawl'

    // Environment-specific
    | 'dig'
    | 'swim'
    | 'dive';
```

---

This is good, are there any simple common actions that we should add to any section?

---

```typescript
type PlayerEnvironmentObjectInteraction =
    // Basic interactions
    | 'open'
    | 'close'
    | 'push'
    | 'pull'
    | 'lift'
    | 'drop'
    | 'throw'
    | 'catch'
    | 'pick up' // Added

    // Manipulation
    | 'turn'
    | 'twist'
    | 'flip'
    | 'slide'
    | 'rotate'
    | 'shake' // Added

    // Forceful actions
    | 'break'
    | 'smash'
    | 'kick'
    | 'punch'
    | 'cut' // Added

    // Careful actions
    | 'examine'
    | 'touch'
    | 'tap'
    | 'poke'
    | 'read' // Added

    // Utility actions
    | 'use'
    | 'activate'
    | 'deactivate'
    | 'combine'
    | 'separate'
    | 'insert' // Added
    | 'remove' // Added

    // Movement-related
    | 'climb'
    | 'jump'
    | 'crawl'
    | 'duck' // Added

    // Environment-specific
    | 'dig'
    | 'swim'
    | 'dive'
    | 'light' // Added
    | 'extinguish'; // Added
```

---

Can you separate these into types

---

```typescript
type BasicInteraction = 'open' | 'close' | 'push' | 'pull' | 'lift' | 'drop' | 'throw' | 'catch' | 'pick up';

type Manipulation = 'turn' | 'twist' | 'flip' | 'slide' | 'rotate' | 'shake';

type ForcefulAction = 'break' | 'smash' | 'kick' | 'punch' | 'cut';

type CarefulAction = 'examine' | 'touch' | 'tap' | 'poke' | 'read';

type UtilityAction = 'use' | 'activate' | 'deactivate' | 'combine' | 'separate' | 'insert' | 'remove';

type MovementRelatedAction = 'climb' | 'jump' | 'crawl' | 'duck';

type EnvironmentSpecificAction = 'dig' | 'swim' | 'dive' | 'light' | 'extinguish';

type PlayerEnvironmentObjectInteraction =
    | BasicInteraction
    | Manipulation
    | ForcefulAction
    | CarefulAction
    | UtilityAction
    | MovementRelatedAction
    | EnvironmentSpecificAction;
```

---

Can you start over and simplify these to remove duplicates and have the same level of detail.

---

```typescript
type PlayerEnvironmentObjectInteraction =
    // Basic interactions
    | 'open'
    | 'close'
    | 'push'
    | 'pull'
    | 'lift'
    | 'drop'
    | 'throw'
    | 'grab'

    // Manipulation
    | 'turn'
    | 'flip'
    | 'slide'
    | 'rotate'
    | 'shake'

    // Forceful actions
    | 'break'
    | 'hit'

    // Careful actions
    | 'examine'
    | 'touch'
    | 'read'

    // Utility actions
    | 'use'
    | 'activate'
    | 'deactivate'
    | 'combine'
    | 'separate'

    // Movement-related
    | 'climb'
    | 'jump'
    | 'crawl'

    // Environment-specific
    | 'dig'
    | 'swim';
```
