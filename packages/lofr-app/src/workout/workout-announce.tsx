export const speakText = (
    text: string,
    options?: {
        voice?: `workout` | `story`;
        onDone?: () => void;
    },
) => {
    const utterance = new SpeechSynthesisUtterance(text);

    const voiceIndex = options?.voice === `workout` ? 1 : 0;
    utterance.voice = speechSynthesis.getVoices()[voiceIndex] ?? null;

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
