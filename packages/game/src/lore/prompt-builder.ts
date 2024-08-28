import { LoreBuilderDependencies } from './lore-types';

type PromptPair = { systemPrompt: string; prompt: string };
export const definePrompt = <TInput, TOutput extends Record<string, unknown>>(props: {
    getPrompt: (input: TInput, attempt: number) => PromptPair;
    parsePromptResponse: (input: TInput) => PromptResponseParser<TOutput>;
    maxPromptResponseLength?: number;
}) => {
    return {
        run: (dependencies: LoreBuilderDependencies, promptName: string) => async (input: TInput) => {
            let attempt = 0;
            while (attempt <= 3) {
                console.log(`definePrompt: run '${promptName}'`, { attempt, input });

                const { systemPrompt, prompt } = props.getPrompt(input, attempt);
                const response = await dependencies.aiProvider.sendPrompt(systemPrompt, prompt, {
                    maxPromptResponseLength: props.maxPromptResponseLength,
                });
                const parsed = props.parsePromptResponse(input).parse(response ?? ``);
                if (parsed) {
                    return parsed;
                }
                attempt++;
            }

            // failed
            return undefined;
        },
    };
};

export type PromptResponseParser<TOutput extends Record<string, unknown>> = {
    parse: (prompt: string) => undefined | TOutput;
};

export const promptResponseParser_findJson = <
    TOutput extends Record<string, unknown>,
    TResult extends Record<string, unknown>,
>(
    fieldName: string,
    fieldAfterName: string,
    transform: (value: TResult) => undefined | TOutput,
): PromptResponseParser<TOutput> => {
    return {
        parse: (text: string) => {
            try {
                const iFieldStart = text.indexOf(`${fieldName}`);
                const iValueStart = text.indexOf(`:`, iFieldStart);
                const iValueEnd = text.indexOf(`${fieldAfterName}`, iValueStart);
                const valueWithExtras = text.slice(iValueStart + 1, iValueEnd).trim();
                const value = valueWithExtras
                    .trim()
                    .replace(/^['"`]|['"`]$/g, ``)
                    .trim()
                    .replace(/,$/g, ``);

                console.log(`promptResponseParser_findJson: parsing`, { value, text });
                const result = JSON.parse(value) as TResult;
                return transform(result);
            } catch (err) {
                console.error(`promptResponseParser_findJson: parse - failed to parse`, { text, err });
                return undefined;
            }
        },
    };
};
