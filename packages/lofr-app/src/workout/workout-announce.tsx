export const speakText = (
    text: string,
    options?: {
        voice?: `workout` | `story`;
        onDone?: () => void;
    },
) => {
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.voice =
        options?.voice === `story` ? speechSynthesis.getVoices().find((x) => x.lang.startsWith(`en-`)) ?? null : null;

    console.log(`speakText voices`, { voices: speechSynthesis.getVoices() });

    utterance.onend = () => {
        options?.onDone?.();
    };
    speechSynthesis.speak(utterance);

    return {
        stop: () => {
            speechSynthesis.cancel();
        },
    };
};
