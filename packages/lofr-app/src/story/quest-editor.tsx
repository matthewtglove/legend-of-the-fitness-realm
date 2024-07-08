import { useRef, useState } from 'react';
import { extractMarkdownList } from './extract-prompt-results';
import { prompt_questEventList } from './prompts/quest-prompts';
import { sendOpenRouterAiRequest } from './call-llm';
import { defaultQuestContext } from './story-runtime';
import { ExpandableView } from '../components/expandable-view';
import { QuestContext } from './story-types';
import { QuestEventStorySuccessLevel, prompt_questEventStory, WorkoutStoryKind } from './prompts/story-prompt';

export const QuestEditor = ({ value, onChange }: { value?: QuestContext; onChange: (value: QuestContext) => void }) => {
    const [questContext, setQuestContext] = useState<QuestContext & { instanceId: number }>(
        value
            ? { ...value, instanceId: 0 }
            : {
                  instanceId: 0,
                  ...defaultQuestContext,
              },
    );
    const questContextRef = useRef(questContext);
    questContextRef.current = questContext;

    const updateQuestContext = (newContext: Partial<QuestContext>) => {
        questContextRef.current = {
            ...questContextRef.current,
            ...newContext,
            instanceId: questContextRef.current.instanceId + 1,
        };
        setQuestContext(questContextRef.current);
        onChange(questContextRef.current);
    };

    return (
        <>
            <ExpandableView title="Quest Editor">
                <QuestContextEditor key={questContext.instanceId} value={questContext} onChange={updateQuestContext} />
                <QuestEventLoader questContext={questContext} onQuestContextChange={updateQuestContext} />
                <StoryTester questContext={questContext} />
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
    const [currentEvent, setCurrentEvent] = useState(value.currentEvent);
    const [currentAction, setCurrentAction] = useState(value.currentAction);
    const [remainingActionEvents, setRemainingActionEvents] = useState(value.remainingEvents.action);
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
            currentEvent,
            currentAction,
            remainingEvents: {
                action: remainingActionEvents,
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

            <label>Current Event</label>
            <textarea className="p-1 border-2" value={currentEvent} onChange={(e) => setCurrentEvent(e.target.value)} />

            <label>Current Action</label>
            <textarea
                className="p-1 border-2"
                value={currentAction}
                onChange={(e) => setCurrentAction(e.target.value)}
            />

            <label>Remaining Actions</label>
            <textarea
                className="p-1 border-2"
                value={remainingActionEvents.join(`\n`)}
                onChange={(e) => setRemainingActionEvents(e.target.value.split(`\n`))}
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

            <button
                className="p-2 m-6 text-white bg-blue-500 rounded hover:opacity-90 active:opacity-80"
                onClick={update}
            >
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
    const [eventSeverity, setEventSeverity] = useState(`minor` as `action` | `minor` | `major` | `main`);
    const [responseTextRaw, setResponseTextRaw] = useState(undefined as undefined | string);
    const [responseText, setResponseText] = useState(undefined as undefined | string);

    const sendPrompt = async () => {
        const prompt = prompt_questEventList({ questContext, eventSeverity });
        const result = await sendOpenRouterAiRequest(prompt.systemPrompt, prompt.userPrompt);
        const eventNames = prompt.extractResult(result ?? ``) ?? ``;
        setResponseTextRaw(result);
        setResponseText(eventNames);

        // Update the quest context with the new events
        const newContext: QuestContext = {
            ...questContext,
            remainingEvents: {
                ...questContext.remainingEvents,
                [eventSeverity]: eventNames.split(`\n`),
            },
        };
        // Choose the next event
        newContext.currentEvent = newContext.remainingEvents[eventSeverity]?.shift() ?? ``;

        onQuestContextChange(newContext);
    };

    return (
        <div className="flex flex-col p-6">
            <h1 className="m-6 text-2xl">Quest Event Loader</h1>
            <label>Event Severity</label>
            <select
                className="p-1 border-2"
                value={eventSeverity}
                onChange={(e) => setEventSeverity(e.target.value as `action` | `minor` | `major` | `main`)}
            >
                <option value="action">Action</option>
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="main">Main</option>
            </select>
            <div>
                <button
                    className="p-2 text-white bg-blue-500 rounded hover:opacity-90 active:opacity-80"
                    onClick={sendPrompt}
                >
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

const StoryTester = ({ questContext }: { questContext: QuestContext }) => {
    const [storyKind, setStoryKind] = useState(`intro` as WorkoutStoryKind);
    const [nextSet, setNextSet] = useState(``);
    const [workoutSessionProgress, setWorkoutSessionProgress] = useState(0);
    const [responseText, setResponseText] = useState(undefined as undefined | string);
    const [lastActionText, setLastActionText] = useState(``);
    const [successLevel, setSuccessLevel] = useState(`success` as QuestEventStorySuccessLevel);

    const sendPrompt = async () => {
        const prompt = prompt_questEventStory({
            questContext,
            kind: storyKind,
            nextSet,
            workoutSessionProgress,
            lastActionText,
            successLevel,
        });
        const result = await sendOpenRouterAiRequest(prompt.systemPrompt, prompt.userPrompt);
        setResponseText(prompt.extractResult(result ?? ``));
    };

    return (
        <div className="flex flex-col p-6">
            <h1 className="m-6 text-2xl">Story Tester</h1>

            <label>Story Kind</label>
            <select
                className="p-1 border-2"
                value={storyKind}
                onChange={(e) => setStoryKind(e.target.value as WorkoutStoryKind)}
            >
                <option value="intro">Intro</option>
                <option value="next-set">Next Set</option>
                <option value="set-result">Set Result</option>
            </select>

            <label>Next Set</label>
            <textarea className="p-1 border-2" value={nextSet} onChange={(e) => setNextSet(e.target.value)} />

            <label>Workout Session Progress</label>
            <input
                type="number"
                className="p-1 border-2"
                value={workoutSessionProgress}
                onChange={(e) => setWorkoutSessionProgress(e.target.valueAsNumber)}
            />

            <label>Last Action Text</label>
            <textarea
                className="p-1 border-2"
                value={lastActionText}
                onChange={(e) => setLastActionText(e.target.value)}
            />

            <label>Success Level</label>
            <select
                className="p-1 border-2"
                value={successLevel}
                onChange={(e) => setSuccessLevel(e.target.value as QuestEventStorySuccessLevel)}
            >
                <option value="failure">Failure</option>
                <option value="mild-sucess">Mild Success</option>
                <option value="success">Success</option>
                <option value="amazing-success">Amazing Success</option>
            </select>

            <div>
                <button
                    className="p-2 text-white bg-blue-500 rounded hover:opacity-90 active:opacity-80"
                    onClick={sendPrompt}
                >
                    Send Prompt
                </button>
            </div>

            <ExpandableView title="Response">
                <div>
                    <label>Response</label>
                    <div className="p-2 whitespace-pre-wrap border-2">{responseText}</div>
                </div>
            </ExpandableView>
        </div>
    );
};
