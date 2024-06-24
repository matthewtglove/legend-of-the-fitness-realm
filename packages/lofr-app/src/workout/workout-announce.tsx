export const speakText = (
    text: string,
    options?: {
        onDone?: () => void;
    },
) => {
    const utterance = new SpeechSynthesisUtterance(text);
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
