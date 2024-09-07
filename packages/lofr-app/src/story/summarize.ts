import { formatGameEventMessage, GameEventResponse, GamePendingActionEvent, GameState } from '@lofr/game';

export const summarizeGameEventResponse = (event: GameEventResponse | undefined) => {
    if (!event) {
        return `No event`;
    }

    if (!event.events.length) {
        return `⭕ No events`;
    }

    return `Events:\n${event.events.map((e) => `\n- ${e.kind} \n\n    ${formatGameEventMessage(e)}\n`).join(``)}`;
};

export const summarizePendingAction = (a: GamePendingActionEvent) => {
    return a.kind === `move-location`
        ? `🚗${a.kind} ➡ '${a.locationId}'`
        : a.kind === `attack-enemy`
        ? `⚔${a.kind} ➡ ${a.enemies.map((e) => `'${e.id}'`).join(`,`)}`
        : ``;
};

export const summarizeGameState = (state: GameState) => {
    const summarizeLocation = (locationId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${` `.repeat(indent * 2)}`;

        if (visited.has(locationId)) {
            return `${nl}- 🔙Location '${locationId}'`;
        }
        visited.add(locationId);

        const l = state.locations.find((l) => l.id === locationId);
        if (!l) {
            return `${nl}- ! Location '${locationId}' not found`;
        }

        return `${nl}- [${!l.isDiscovered ? `` : `👁`}] Location: '${l.id}'${state.characters
            .filter((c) => c.location === l.id)
            .map((c) => summarizeCharacter(c.id, indent + 1, visited))
            .join(``)}${state.keyItems
            .filter((c) => l.keyItem === c.id)
            .map((c) => summarizeKeyItem(c.id, indent + 1, visited))
            .join(``)}${l.connections
            .map((c) =>
                visited.has(c.location)
                    ? // ? `${nl}  - ~Connection => '${c.location}' ${!c.isDiscovered ? `` : `👁`}`
                      ``
                    : `${nl}  - [${!c.isDiscovered ? `` : `👁`}${
                          c.requiredKeyItem ? `🔒'${c.requiredKeyItem}'` : ``
                      }] Connection => '${c.location}'${summarizeLocation(c.location, indent + 2, visited)}`,
            )
            .join(``)}`;
    };

    const summarizeCharacter = (characterId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${` `.repeat(indent * 2)}`;

        if (visited.has(characterId)) {
            return `${nl}- 🔙Character '${characterId}'`;
        }
        visited.add(characterId);

        const c = state.characters.find((c) => c.id === characterId);
        if (!c) {
            return `${nl}- ! Character '${characterId}' not found`;
        }

        return `${nl}- [${!c.isDiscovered ? `` : `👁`}${c.isDefeated ? `💀` : ``}] Character: '${c.id}' ${
            c.role.enemyDifficulty ?? ``
        } ${c.stats.health}/${c.stats.healthMax}hp ${
            c.keyItem ? `${summarizeKeyItem(c.keyItem, indent + 1, visited)}` : ``
        }`;
    };

    const summarizePlayer = (playerId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${` `.repeat(indent * 2)}`;

        if (visited.has(playerId)) {
            return `${nl}- 🔙Player '${playerId}'`;
        }
        visited.add(playerId);

        const p = state.players.find((p) => p.id === playerId);
        if (!p) {
            return `${nl}- ! Player '${playerId}' not found`;
        }

        return `${nl}- [] Player: '${p.name}'${
            p.pendingActions ? `🕒${p.pendingActions.map((a) => `${nl}  - ${summarizePendingAction(a)}`)}` : ``
        }${summarizeLocation(p.location, indent + 1, visited)}`;
    };

    const summarizeKeyItem = (keyItemId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${` `.repeat(indent * 2)}`;

        if (visited.has(keyItemId)) {
            return `${nl}- 🔙🔑KeyItem '${keyItemId}'`;
        }
        visited.add(keyItemId);

        const k = state.keyItems.find((k) => k.id === keyItemId);
        if (!k) {
            return `${nl}- ! KeyItem '${keyItemId}' not found`;
        }

        return `${nl}- [${k.isObtained ? `👁` : ``}${k.isVisible ? `` : ``}] 🔑KeyItem: '${k.id}'`;
    };

    const summarizeCampaign = (campaignId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${` `.repeat(indent * 2)}`;

        if (visited.has(campaignId)) {
            return `${nl}- 🔙Campaign '${campaignId}'`;
        }
        visited.add(campaignId);

        const c = state.campaigns.find((c) => c.id === campaignId);
        if (!c) {
            return `${nl}- ! Campaign '${campaignId}' not found`;
        }

        const currentCampaign = state.campaigns.findLast((x) => !x.isComplete);
        const isCurrent = currentCampaign?.id === c.id;

        return `${nl}- [${c.isComplete ? `🏁` : ``}${isCurrent ? `🟢` : ``}] Campaign: '${c.id}'${c.quests
            .map((q) => summarizeQuest(q, indent + 1, visited))
            .join(``)}`;
    };

    const summarizeQuest = (questId: string, indent: number, visited: Set<string>): string => {
        const nl = `\n${` `.repeat(indent * 2)}`;

        if (visited.has(questId)) {
            return `${nl}- 🔙Quest '${questId}'`;
        }
        visited.add(questId);

        const q = state.quests.find((q) => q.id === questId);
        if (!q) {
            return `${nl}- ! Quest '${questId}' not found`;
        }

        const currentQuest = state.quests.findLast((x) => !x.isComplete);
        const currentObjective = currentQuest?.objectives.find(
            (x) => !state.keyItems.find((k) => k.id === x.completionKeyItem)?.isObtained,
        );

        return `${nl}- [${q.isComplete ? `🏁` : ``}${currentQuest?.id === q.id ? `🟢` : ``}] Quest: '${
            q.id
        }'${q.objectives
            .map(
                (o) =>
                    `${nl}  - [${state.keyItems.find((k) => k.id === o.completionKeyItem)?.isObtained ? `🏁` : ``}${
                        currentObjective === o ? `🟢` : ``
                    }] ${o.name} ${summarizeKeyItem(o.completionKeyItem, indent + 2, visited)}`,
            )
            .join(``)}`;
    };

    const visited = new Set<string>();
    return `
${state.locations.map((l) => summarizeLocation(l.id, 0, visited)).join(``)}
${state.players.map((l) => summarizePlayer(l.id, 0, visited)).join(``)}
${state.characters.map((l) => summarizeCharacter(l.id, 0, visited)).join(``)}
${state.keyItems.map((l) => summarizeKeyItem(l.id, 0, visited)).join(``)}
${state.campaigns.map((l) => summarizeCampaign(l.id, 0, visited)).join(``)}
`;
};