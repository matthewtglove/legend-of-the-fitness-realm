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
-   it is possible that the narrative campaign could also provide some override ui for the main app experience and other quest experiences
    -   this might be as simple as changing the background pixel art for a scene

### Narrative Engine (App Skins / Mods / Games)

-   a narrative campaign could be open (no established plotline) or pre-scripted (with an established plotline)
-   a narrative engine could be story based (focused on narrative) or mechanical (with a game engine focused on the battle and game rules)
-   a narrative engine can take full control over the ui providing a fully custom ui (like maps, and other experiences beyond the default)
-   non-narrative game based ideas:
    -   idle / incremental
    -   bullet hell / survivor

### Primary Game Mode Revisit

-   instead of trying to have story control everything, separate battle mode and story mode like any rpg video game
-   this allows the workout session and other mini-games to happen without requiring they integrate closely into the story
-   the workout session could instead be any type of auto play game that uses your effort as input:
    -   rpg random battles (like final fantasy)
    -   incremental survivor game (like vampire survivor)
    -   idle battle game
-   the story could still inject short minor elements into a workout session (especially like before a boss fight)
-   however, the primary story telling experience would be like cut scenes (which could occur during warmup and cooldown stretches)
-   the story can also provide 'skins/themes' for a game to make the game match the story theme
-   skinnable workout games

---

# Systems

-   WorkoutBuilder: A workout builder experience that allows controlling your workout program
    -   supports a custom workout languange for defining a workout as a text document
    -   game like ui for defining the workout program
-   WorkoutTimer: The workout timer logic and state that runs through a single workout session and exposes information for the ui
    -   intended to provide ui data for any workout game:
        -   workout overall time
        -   current exercise or rest display info
        -   current step time remaining
        -   next exercise (during rest)
-   WorkoutGame: An auto-play game that can run during a workout session
    -   uses the workout timer to display workout ui information
    -   knows the workout session plan
    -   can react to workout signals
        -   the user is beginning set of 1 of 12 for 90 seconds
        -   the user finished a set with great performance and will begin a rest for 30 seconds
        -   the user is beginning set 9 of 12
    -   can handle voice commands to control workout
    -   can allow playlist as background music
    -   settings to allow volume control over sound effects and trainer voice
    -   skinnable to match narrative
    -   can have placeholders to inject short narrative story telling
        -   alternatively could be a fully voiced experience
            -   to fit in a narrative plotline, the narrative context would need to explain "daily trianing" or a "daily battle" somehow in a way that helps explain why is does not fit in the normal plotline
-   MiniGame: A short game for non-workout activity
    -   Example opportunities for mini games:
        -   Night Prep: Sleep planning, Wakeup alarm commitement, Morning Prep
        -   Morning Checkin: Charge energy, morning stretch, encouragement
        -   Workout Warm Up
        -   Workout Cool Down
    -   skinnable to match narrative
    -   intended to allow a longer story telling session
-   Narrative Engine: The narrative generator which provides a plotline and world consistency
    -   primary narration occurs during cut-scenes told during:
        -   workout warm-up stretch
        -   workout cool-down stretch
        -   morning stretch (possibly only on non-workout days)
        -   night planning (every night for sleep cycle planning and workout prep)
    -   short narrative injections might occur during a workout (like a boss fight)
    -   plotlines
        -   can be a purely llm controlled narrative (no plotline generation, history only llm prompting)
        -   can be an open narrative without a predefined plotline (using jit plotline generation and world building)
        -   can be a linear narrative with a predetermined plotline
    -   can provide skins for the WorkoutGame and other MiniGames
