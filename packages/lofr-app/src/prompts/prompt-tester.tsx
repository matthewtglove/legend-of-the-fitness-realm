import { useRef, useState } from 'react';
import { extractMarkdownList } from './extract-prompt-results';
import { prompt_questEventList } from './quest-prompts';
import { sendOpenRouterAiRequest } from './call-llm';

export const PromptTester = () => {
    return <PromptTester_QuestEventList />;
};

export const PromptTester_QuestEventList = () => {
    const [responseTextRaw, setResponseTextRaw] = useState(undefined as undefined | string);
    const [responseText, setResponseText] = useState(undefined as undefined | string);
    const optionsRef = useRef({
        characterName: `Rick`,
        questName: `Save the Princess`,
        questProgress: 50,
        context: `In the dark forest`,
        lastStory: `Rick found a rotting tree stump`,
    });

    const sendPrompt = async () => {
        const prompt = prompt_questEventList({ ...optionsRef.current, eventSeverity: `minor` });
        const result = await sendOpenRouterAiRequest(prompt.systemPrompt, prompt.userPrompt);
        setResponseTextRaw(result);
        setResponseText(prompt.extractResult(result ?? ``)?.join(`\n`));
    };

    return (
        <div>
            <h1 className="m-6 text-2xl">Prompt Tester</h1>
            <div>
                <label className="m-6">Response Text</label>
                <textarea
                    className="p-1 m-2 border-2"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                />
            </div>
            <div>
                <button className="p-2 m-6 text-white bg-blue-500" onClick={sendPrompt}>
                    Send Prompt
                </button>
            </div>
            <div>
                <h2>Response</h2>
                <pre className="m-6">{responseText}</pre>
            </div>
            <div>
                <h2>Response Raw</h2>
                <pre className="m-6">{responseTextRaw}</pre>
            </div>
        </div>
    );
};
