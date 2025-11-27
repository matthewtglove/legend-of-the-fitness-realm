export type LofrQuestBase<T extends string> = {
    /** Unique id for the quest */
    id: string;

    /** Optional parent quest id */
    parentId?: string;

    /** Human-readable title for the quest */
    title: string;

    /** The kind of quest */
    kind: T;

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

export type LoftQuestProvider<T extends string> = {
    kind: T;
}

export type LofrQuestRegistry = {
    registerQuestImplementation: (implementation: LoftQuestProvider<string>) => void;
    getImplementations: () => LoftQuestProvider<string>[];
    getImplementation: (kind: string) => LoftQuestProvider<string> | undefined;
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
export type LofrQuest_WorkoutCampaign = LofrQuestBase<`workout-campaign`> & {
    data: {
        targetWeeksLength?: number;
        targetDaysOfWeek?: DayOfWeek[];
        notes?: string;
        workoutCampaignData?: unknown;
    };
}
