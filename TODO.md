-   [ ] Parse workout file
    -   [x] Define
    -   [ ] Support all workout types
    -   [ ] Post-process workout file
        -   [ ] Seperate segment and session ranges into their own object
-   [ ] Workout timer
    -   [x] Load workout session
        -   [x] Run workout session
    -   [x] Display current step
    -   [x] Timer controls
        -   [x] pause/resume
        -   [x] skip: skips to next step (exercise/rest)
        -   [x] **Workout**
        -   [ ] ? next: go to next set in the step
        -   [ ] ? prev: prev set
    -   [ ] Convert all times to render as `10m 30s` format
-   [ ] Workout program navigator (list)
-   [ ] Workout tracking
    -   [ ] Reps input
        -   [ ] Touch
        -   [ ] Voice input
    -   [ ] Recording data
        -   [ ] Exporting
    -   [ ] Reports

---

# Fun

-   [ ] Make the exercise fun
    -   [ ] Randomize the next exercise
    -   [ ] Add random challenges to the exercise to push the user to the next level
-   [ ] Make the personal progress fun
    -   [ ] Visualize progress charts in fun ways
        -   [ ] Individual exercise progress (reps)
        -   [ ] Exercise Goals / Fitness Standards
    -   [ ] Visualize personal health in fun ways
        -   [ ] AI character image
-   [ ] Make the game fun

---

# Lofr Quest System

-   [x] Prep Prototypes
    -   [x] Night before (plan game - set alarm clock, sleep cycles)
    -   [x] Wake up (energize animation)
-   [ ] Quest System
    -   [ ] Regular Quests: Prep, Wakeup, Workout
    -   [ ] Special Quests:
        -   [ ] Weigh In
        -   [ ] Max / Challenge
        -   [ ]
    -   [ ] Quest State
        -   [ ] Store/load quest state
        -   [ ] Cloud state storage
        -   [ ] Quest Logic
            -   [ ] Require interaction at specific time
                -   [ ] Night before to plan sleep cycles
                -   [ ] Morning to track wake time
                -   [ ] At workout

## Quest Ideas:

-   should the quest types be defined with their implementation with some kind of registerQuestType function?
    -   quest plugin system
-   what can the system do with the base quest data alone?
    -   the quests can be listed (title), in a tree structure (parentId)
    -   the quest status can be displayed (and filtered by status)
    -   quests can be sorted
        -   scheduled for today on top (active/future today)
        -   unscheduled next
        -   scheduled after today next
    -   active quests can query the implementation for priority?
-   how will quests be created?
    -   the root game can generate new quests (if it knows their type)
    -   a quest can generate new quests
    -   it must be possible for the quest type registry to have some way to generate quests of a new kind
-   how are quests triggered?
    -   what quest events can occur?
        -   start?
        -   stop/cancel/fail?
