import { useRef, useState } from 'react';
import { extractMarkdownList } from './extract-prompt-results';
import { prompt_questEventList } from './prompts/quest-prompts';
import { sendOpenRouterAiRequest } from './call-llm';
import { ExpandableView } from '../components/expandable-view';
import { QuestContext } from './story-types';

export const QuestEditor = () => {
    const [questContext, setQuestContext] = useState<QuestContext & { instanceId: number }>({
        instanceId: 0,
        characterNames: [`Rick the Rock Breaker`, `Matthew the Musical`],
        questName: `Defeat the Spider Queen in the Infested Mine`,
        questProgress: 0,
        currentEnvironment: `In the dark forest outside the Infested Mine`,
        questLog: [`Rick found a rotting tree stump`],
        remainingEvents: {
            minor: [],
            major: [],
            main: [],
        },
    });

    const updateQuestContext = (newContext: Partial<QuestContext>) => {
        setQuestContext((s) => ({ ...s, ...newContext, instanceId: s.instanceId + 1 }));
    };

    return (
        <>
            <ExpandableView title="Quest Editor">
                <QuestContextEditor key={questContext.instanceId} value={questContext} onChange={updateQuestContext} />
                <QuestEventLoader questContext={questContext} onQuestContextChange={updateQuestContext} />
            </ExpandableView>
        </>
    );
};

const QuestContextEditor = ({ value, onChange }: { value: QuestContext; onChange: (value: QuestContext) => void }) => {
    const [characterNames, setCharacterNames] = useState(value.characterNames);
    const [questName, setQuestName] = useState(value.questName);
    const [questProgress, setQuestProgress] = useState(value.questProgress);
    const [currentEnvironment, setCurrentEnvironment] = useState(value.currentEnvironment);
    const [questLog, setQuestLog] = useState(value.questLog);
    const [remainingMinorEvents, setRemainingMinorEvents] = useState(value.remainingEvents.minor);
    const [remainingMajorEvents, setRemainingMajorEvents] = useState(value.remainingEvents.major);
    const [remainingMainEvents, setRemainingMainEvents] = useState(value.remainingEvents.main);

    const update = () => {
        onChange({
            characterNames,
            questName,
            questProgress,
            currentEnvironment,
            questLog,
            remainingEvents: {
                minor: remainingMinorEvents,
                major: remainingMajorEvents,
                main: remainingMainEvents,
            },
        });
    };

    return (
        <div className="flex flex-col p-6">
            <label>Character Names</label>
            <textarea
                className="p-1 border-2"
                value={characterNames.join(`\n`)}
                onChange={(e) => setCharacterNames(e.target.value.split(`\n`))}
            />
            <label>Quest Name</label>
            <textarea className="p-1 border-2" value={questName} onChange={(e) => setQuestName(e.target.value)} />
            <label>Quest Progress</label>
            <input
                type="number"
                className="p-1 border-2"
                value={questProgress}
                onChange={(e) => setQuestProgress(e.target.valueAsNumber)}
            />
            <label>Current Environment</label>
            <textarea
                className="p-1 border-2"
                value={currentEnvironment}
                onChange={(e) => setCurrentEnvironment(e.target.value)}
            />
            <label>Quest Log</label>
            <textarea
                className="p-1 border-2"
                value={questLog.join(`\n`)}
                onChange={(e) => setQuestLog(e.target.value.split(`\n`))}
            />
            <label>Remaining Minor Events</label>
            <textarea
                className="p-1 border-2"
                value={remainingMinorEvents.join(`\n`)}
                onChange={(e) => setRemainingMinorEvents(e.target.value.split(`\n`))}
            />
            <label>Remaining Major Events</label>
            <textarea
                className="p-1 border-2"
                value={remainingMajorEvents.join(`\n`)}
                onChange={(e) => setRemainingMajorEvents(e.target.value.split(`\n`))}
            />
            <label>Remaining Main Events</label>
            <textarea
                className="p-1 border-2"
                value={remainingMainEvents.join(`\n`)}
                onChange={(e) => setRemainingMainEvents(e.target.value.split(`\n`))}
            />

            <button className="p-2 m-6 text-white bg-blue-500" onClick={update}>
                Update Context
            </button>
        </div>
    );
};

export const QuestEventLoader = ({
    questContext,
    onQuestContextChange,
}: {
    questContext: QuestContext;
    onQuestContextChange: (value: QuestContext) => void;
}) => {
    const [eventSeverity, setEventSeverity] = useState(`minor` as `minor` | `major` | `main`);
    const [responseTextRaw, setResponseTextRaw] = useState(undefined as undefined | string);
    const [responseText, setResponseText] = useState(undefined as undefined | string);

    const sendPrompt = async () => {
        const prompt = prompt_questEventList({ ...questContext, eventSeverity });
        const result = await sendOpenRouterAiRequest(prompt.systemPrompt, prompt.userPrompt);
        const eventNames = prompt.extractResult(result ?? ``) ?? [];
        setResponseTextRaw(result);
        setResponseText(eventNames.join(`\n`));

        // Update the quest context with the new events
        const newContext = {
            ...questContext,
            remainingEvents: {
                ...questContext.remainingEvents,
                [eventSeverity]: eventNames,
            },
        };

        onQuestContextChange(newContext);
    };

    return (
        <div className="flex flex-col p-6">
            <h1 className="m-6 text-2xl">Quest Event Loader</h1>
            <label>Event Severity</label>
            <select
                className="p-1 border-2"
                value={eventSeverity}
                onChange={(e) => setEventSeverity(e.target.value as `minor` | `major` | `main`)}
            >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="main">Main</option>
            </select>
            <div>
                <button className="p-2 text-white bg-blue-500" onClick={sendPrompt}>
                    Send Prompt
                </button>
            </div>
            <ExpandableView title="Response">
                <div>
                    <label>Response</label>
                    <div className="p-2 whitespace-pre-wrap border-2">{responseText}</div>
                </div>
                <div>
                    <label>Response Raw</label>
                    <div className="p-2 whitespace-pre-wrap border-2">{responseTextRaw}</div>
                </div>
            </ExpandableView>
        </div>
    );
};
