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

---

## User Stories

### First Time User

pixel art playful sequence to introduce the concept and get the user started

-   black screen
-   you feel trapped inside a box and feel a wood panel in front of you, quick push the box open
-   do push-ups for the next 30 seconds (or wall push ups) to escape
-   it turns out you fell asleep on your couch and your mighty attempts to escape were simply a great effort to push yourself up
-   scene changes to a top down pixel art room with an old trainer talking to you
-   wake up lofr, when I am done with you, I will transform you from a lofr to a legend

### First Workout Campaign

-   the trainer says, let's get started with a short 2 week workout campaign to get you moving again
-   the workout builder opens with the following defaults:
    -   2 weeks
    -   workout 3 days a week (monday, wednesday, friday)
    -   7:00 AM
    -   basic program
    -   plus daily sleep tracking and morning strech
-   the user can change any of these parameters and customize their initial workout, but defaults are chosen for an average overweight person
-   until the first monday, the daily routine helps the user establish a healthy sleep schedule and morning stretch
-   while the default lofr narrative is running, the trainer is giving you encouragement and progress updates during a workout and coaching you like a personal trianer
-   you can customize your character for the lofr narrative, changing your name and avatar

### Narrative Campaign

-   In the app main experience (outside a workout), you can select a narrative
-   The lofr personal trainer will occasionally suggest choosing a narrative
-   Once selecting a narrative, the game events will be given to the narrative engine to translate to suitable narrative fitting into the narrative plotline
    -   during a workout, exercise instructions will weave into the narrative
    -   trianier encourage and progress updates will also be provided to the narrative engine to put these into a narrative context
    -   the goal is to maintain narrative emersion rather than sounding like a personal trainer, so the narrative engine should prioritize the plotline
-   It is possible to pause or change to a different narrative in the app main experience
    -   The lofr narrative would be the default if no other narrative is active

### The App Main Experience

-   the app will have a main experience when not in an active workout
-   this main experience will allow changing settings like the narrative campaign
-   this will also allow you to access your quests and quest log
-   this will host other quest experiences like the night plan session and morning wakeup routine and any other quest
-   the main app exerience will essentially delegate the ui when a quest experience is running (like a workout session or the wakeup routine)
