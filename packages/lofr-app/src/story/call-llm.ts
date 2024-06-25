export const sendOpenRouterAiRequest = async (
    systemPrompt: string,
    prompt: string,
    model = `gryphe/mythomax-l2-13b`,
) => {
    // use openrouter.ai (temporarily key - exposed for testing purposes)
    const OPENROUTER_API_KEY = `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`;
    const YOUR_SITE_URL = `http://www.lofr.app/`;
    const YOUR_SITE_NAME = `Lofr - Legend of the Fitness Realm`;

    console.log(`sendOpenRouterAiRequest: systemPrompt=${systemPrompt}, prompt=${prompt}, model=${model}`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': `${YOUR_SITE_URL}`, // Optional, for including your app on openrouter.ai rankings.
            'X-Title': `${YOUR_SITE_NAME}`, // Optional. Shows in rankings on openrouter.ai.
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: `user`,
                    content: prompt,
                },
            ],
        }),
    });

    const result: Response = await response.json();
    const message = (result.choices[0] as NonStreamingChoice)?.message.content ?? undefined;
    return message;
};

// Definitions of subtypes are below

type Response = {
    id: string;
    // Depending on whether you set "stream" to "true" and
    // whether you passed in "messages" or a "prompt", you
    // will get a different output shape
    choices: (NonStreamingChoice | StreamingChoice | NonChatChoice)[];
    created: number; // Unix timestamp
    model: string;
    object: 'chat.completion' | 'chat.completion.chunk';

    system_fingerprint?: string; // Only present if the provider supports it

    // Usage data is always returned for non-streaming.
    // When streaming, you will get one usage object at
    // the end accompanied by an empty choices array.
    usage?: ResponseUsage;
};

// If the provider returns usage, we pass it down
// as-is. Otherwise, we count using the GPT-4 tokenizer.

type ResponseUsage = {
    /** Including images and tools if any */
    prompt_tokens: number;
    /** The tokens generated */
    completion_tokens: number;
    /** Sum of the above two fields */
    total_tokens: number;
};

// Subtypes:
type NonChatChoice = { finish_reason: string | null; text: string; error?: Error };

type NonStreamingChoice = {
    finish_reason: string | null; // Depends on the model. Ex: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'function_call'
    message: {
        content: string | null;
        role: string;
        tool_calls?: ToolCall[];
        // Deprecated, replaced by tool_calls
        function_call?: FunctionCall;
    };
    error?: Error;
};

type StreamingChoice = {
    finish_reason: string | null;
    delta: {
        content: string | null;
        role?: string;
        tool_calls?: ToolCall[];
        // Deprecated, replaced by tool_calls
        function_call?: FunctionCall;
    };
    error?: Error;
};

type Error = {
    code: number; // See "Error Handling" section
    message: string;
};

type FunctionCall = {
    name: string;
    arguments: string; // JSON format arguments
};

type ToolCall = {
    id: string;
    type: 'function';
    function: FunctionCall;
};
