export type LofrQuestBase<TKind extends string> = {
    /** Unique id for the quest */
    id: string;

    /** Optional parent quest id */
    parentId?: string;

    /** Human-readable title for the quest */
    title: string;

    /** The kind of quest */
    kind: TKind;

    /** When the quest will become available (if it has a valid time range) */
    timeAvailableStart?: Date;

    /** When the quest will expire (if it has a valid time range) */
    timeAvailableEnd?: Date;

    /** When the quest was activated */
    timeStarted?: Date;

    /** When the quest was completed (shows a positive icon in quest log) */
    timeCompleted?: Date;

    /** When the quest was failed (shows a negative icon in quest log) */
    timeFailed?: Date;

    /** Additional data related to the quest kind */
    data: Record<string, never>;
};

export const calculateQuestStatus = (quest: LofrQuestBase<string>, now: Date = new Date()): `future` | `available` | `active` | `expired` | `completed` | `failed` => {
    if (quest.timeFailed) {
        return `failed`;
    }
    if (quest.timeCompleted) {
        return `completed`;
    }
    if (quest.timeStarted) {
        return `active`;
    }
    if (quest.timeAvailableEnd && now > quest.timeAvailableEnd) {
        return `expired`;
    }
    if (quest.timeAvailableStart && now < quest.timeAvailableStart) {
        return `future`;
    }

    return `available`;
}

export type LofrQuestProvider<TKind extends string> = {
    kind: TKind;

    /** Calls this when app starts for any active quest, and when a quest becomes active, and when any game event occurs */
    handleQuestEvent: (event: {
        kind: string,
        summary: string,
        data: Record<string, unknown>,
    }, quest: LofrQuestBase<TKind>) => void;

    /** Should it render the component, called when? */
    shouldShowAppViewForQuest: (quest: LofrQuestBase<TKind>) => boolean;

    /** Render the app */
    ActiveQuestAppViewComponent: (quest: LofrQuestBase<TKind>) => JSX.Element;
}

export type LofrQuestRegistry = {
    registerQuestImplementation: (implementation: LofrQuestProvider<string>) => void;
    getImplementations: () => LofrQuestProvider<string>[];
    getImplementation: (kind: string) => LofrQuestProvider<string> | undefined;
};

export type LofrQuest_NightPrep = LofrQuestBase<`night-prep`> & {
    data: {
        sleepCycleTargetCount?: number;
        sleepinessLevel?: `high` | `medium` | `low`;
        energyLevelToday?: `high` | `medium` | `low`;
        notes?: string;
    };
};

export type LofrQuest_MorningCheckin = LofrQuestBase<`morning-checkin`> & {
    data: {
        sleepCycleCount?: number;
        wakeUpTime?: Date;
        sleepStartTime?: Date;
        sleepQuality?: `good` | `average` | `poor`;
        energyLevel?: `high` | `medium` | `low`;
        notes?: string;
    };
};

export type LofrQuest_WorkoutSession = LofrQuestBase<`workout-session`> & {
    data: {
        workoutDurationMinutes?: number;
        energyLevelBefore?: `high` | `medium` | `low`;
        energyLevelAfter?: `high` | `medium` | `low`;
        notes?: string;
        workoutData?: unknown;
    };
};

export type DayOfWeek = `sunday` | `monday` | `tuesday` | `wednesday` | `thursday` | `friday` | `saturday`;
export type HourMinuteTime = string & { __format: `HH:mm` };
export const createHourMinuteTime = (hour: number, minute: number): HourMinuteTime => {
    const hh = hour.toString().padStart(2, `0`);
    const mm = minute.toString().padStart(2, `0`);
    return `${hh}:${mm}` as HourMinuteTime;
}
export type LofrQuest_WorkoutCampaign = LofrQuestBase<`workout-campaign`> & {
    data: {
        targetWeeksLength?: number;
        targetWorkoutTimes?: {
            dayOfWeek: DayOfWeek;
            timeOfDay: HourMinuteTime;
        }[];
        notes?: string;
        workoutCampaignData?: unknown;
    };
}
