export type LofrQuestBase<T extends string> = {
    /** Unique id for the quest */
    id: string;

    /** Optional parent quest id */
    parentId?: string;

    /** Human-readable title for the quest */
    title: string;

    /** The kind of quest */
    kind: T;

    /** When the quest will become active (if it has a valid time range) */
    timeStart?: Date;

    /** When the quest will expire (if it has a valid time range) */
    timeEnd?: Date;

    /** When the quest was completed */
    timeCompleted?: Date;

    /** When the quest was failed */
    timeFailed?: Date;

    /** Additional data related to the quest kind */
    data: Record<string, never>;
};

export const calculateQuestStatus = (quest: LofrQuestBase<string>, now: Date = new Date()): `future` | `active` | `expired` | `completed` | `failed` => {
    if (quest.timeFailed) {
        return `failed`;
    }
    if (quest.timeCompleted) {
        return `completed`;
    }
    if (quest.timeEnd && now > quest.timeEnd) {
        return `expired`;
    }
    if (quest.timeStart && now < quest.timeStart) {
        return `future`;
    }

    return `active`;
}

export type LoftQuestImplementation<T extends string> = {
    kind: T;
}

export type LofrQuestRegistry = {
    registerQuestImplementation: (implementation: LoftQuestImplementation<string>) => void;
    getImplementations: () => LoftQuestImplementation<string>[];
    getImplementation: (kind: string) => LoftQuestImplementation<string> | undefined;
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
