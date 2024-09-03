export const sendOpenRouterAiRequest = async (
    systemPrompt: string,
    prompt: string,
    { model = `gryphe/mythomax-l2-13b`, maxTokens = 1000 } = {},
) => {
    // use openrouter.ai (temporarily key - exposed for testing purposes)
    const OPENROUTER_API_KEY = `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`;
    const YOUR_SITE_URL = `http://www.lofr.app/`;
    const YOUR_SITE_NAME = `Lofr - Legend of the Fitness Realm`;

    console.log(`sendOpenRouterAiRequest: START`, { systemPrompt, prompt, model });

    const response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
        method: `POST`,
        headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': `${YOUR_SITE_URL}`, // Optional, for including your app on openrouter.ai rankings.
            'X-Title': `${YOUR_SITE_NAME}`, // Optional. Shows in rankings on openrouter.ai.
            'Content-Type': `application/json`,
        },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            messages: [
                {
                    role: `system`,
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

    console.log(`sendOpenRouterAiRequest: END`, { message, systemPrompt, prompt, model });
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
    object: `chat.completion` | `chat.completion.chunk`;

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
    type: `function`;
    function: FunctionCall;
};
