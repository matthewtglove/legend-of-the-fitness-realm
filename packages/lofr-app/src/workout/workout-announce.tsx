const voiceState = {
    storyVoice: undefined as undefined | null | SpeechSynthesisVoice,
};

export const speakText = async (
    text: string,
    options?: {
        voice?: `workout` | `story`;
    },
): Promise<void> => {
    return new Promise((resolve) => {
        speakTextSync(text, {
            ...options,
            onDone: resolve,
        });
    });
};

const speakTextSync = (
    text: string,
    options?: {
        voice?: `workout` | `story`;
        onDone?: () => void;
    },
) => {
    console.log(`speakText`, { text, options });

    const utterance = new SpeechSynthesisUtterance(text);

    if (options?.voice === `story` && voiceState.storyVoice === undefined) {
        const voices = speechSynthesis.getVoices();
        const voicesSorted = voices
            .filter((x) => x.lang.startsWith(`en-`))
            .map((x) => ({
                voice: x,
                priority:
                    // prefer local
                    (x.localService ? 1000 : 0) +
                    // prefer South Africa (has the best voice on iOS)
                    (x.lang.startsWith(`en-ZA`) ? 200 : 0) +
                    // prefer British
                    (x.lang.startsWith(`en-GB`) ? 100 : 0) +
                    // avoid default voice
                    (x.default ? -1 : 0),
            }))
            .sort((a, b) => -(a.priority - b.priority));
        voiceState.storyVoice = voicesSorted[0]?.voice ?? null;
        console.log(`speakText voices`, { storyVoice: voiceState.storyVoice, voicesSorted, voices, text, options });
    }

    utterance.voice = options?.voice === `story` ? voiceState.storyVoice ?? null : null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let activeSentence = ``;
    utterance.onboundary = (e) => {
        if (e.name === `sentence`) {
            const iSentenceStart = e.charIndex;
            const lenSentence = (text.substring(iSentenceStart).match(/[.!?$]/)?.index ?? -1) + 1;
            const sentence = text.substring(iSentenceStart, iSentenceStart + lenSentence);
            activeSentence = sentence;
            console.log(`sentence '${sentence}'`, { sentence, iSentenceStart, lenSentence });
        }

        // console.log(`"${text.substring(e.charIndex, e.charIndex + e.charLength)}" ${e.name}`, {
        //     activeSentence,
        //     before: text.substring(0, e.charIndex),
        //     after: text.substring(e.charIndex + e.charLength),
        //     event: `${e.name} boundary reached after ${e.elapsedTime} seconds.`,
        // });
    };

    utterance.onend = () => {
        options?.onDone?.();
    };

    const retryTimeoutId = setTimeout(() => {
        if (options?.voice === `story`) return;

        console.error(`speakText retry`, { text });
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    }, 1000);
    const failTimeoutId = setTimeout(() => {
        if (options?.voice === `story`) return;

        console.error(`speakText *fail*`, { text });
        speechSynthesis.cancel();
        options?.onDone?.();
    }, 3000);
    utterance.onstart = () => {
        clearTimeout(retryTimeoutId);
        clearTimeout(failTimeoutId);
    };

    utterance.onerror = (e) => {
        console.error(`speakText error`, { text, e });
        options?.onDone?.();
    };

    speechSynthesis.speak(utterance);

    return {
        stop: () => {
            speechSynthesis.cancel();
        },
    };
};
