import { useEffect, useRef, useState } from 'react';
import { CodeEditor, CodeLanguage, CodeLanguageSelector, EditorState } from './text-code-editor';

export const TextCodeEditorComponent = ({
    value: valueRaw,
    onChange,
    onSave,
    isSelected,
    disabled = false,
}: {
    value: string;
    onChange: (value: string) => void;
    onSave: (value: string) => void;
    isSelected: boolean;
    disabled?: boolean;
    // TODO: language
}) => {
    const [text, setText] = useState(valueRaw);
    const [editorState, setEditorState] = useState<EditorState | undefined>(undefined);

    const hasChangedRef = useRef(false);

    useEffect(() => {
        if (text === valueRaw) {
            hasChangedRef.current = false;
            return;
        }

        if (hasChangedRef.current) {
            return;
        }
        setText(valueRaw);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valueRaw]);

    const changeValue = (value: string) => {
        hasChangedRef.current = true;
        setText(value);
        onChange(value);
    };

    const [language, setLanguage] = useState(`typescript` as undefined | CodeLanguage);
    const changeLanguage = (value: undefined | CodeLanguage) => {
        hasChangedRef.current = true;
        setLanguage(value);
        // onInputManualValues({ language: value });
    };

    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        console.log(`[textNodeComponentDefinition:textarea:useEffect] START`);

        const el = textAreaRef.current;
        if (!el) {
            return;
        }

        if (editorState?.scroll) {
            el.scrollTo({
                top: editorState.scroll.scrollTop,
                left: editorState.scroll.scrollLeft,
                behavior: `instant`,
            });
        }
        if (editorState?.selection) {
            const selection = editorState.selection;
            const lines = (text || valueRaw || ``).split(`\n`);
            let startOffset = 0;
            let endOffset = 0;
            try {
                for (let i = 0; i < selection.startLineNumber - 1; i++) {
                    startOffset += (lines[i]?.length || 0) + 1; // +1 for newline character
                }
                startOffset += selection.startColumn - 1;

                for (let i = 0; i < selection.endLineNumber - 1; i++) {
                    endOffset += (lines[i]?.length || 0) + 1;
                }
                endOffset += selection.endColumn - 1;

                // Ensure offsets are within bounds
                const textLength = (text || valueRaw || ``).length;
                startOffset = Math.max(0, Math.min(startOffset, textLength));
                endOffset = Math.max(0, Math.min(endOffset, textLength));

                el.setSelectionRange(startOffset, endOffset);
            } catch (error) {
                console.error(`Error setting textarea selection range:`, error, {
                    selection,
                    lines,
                    startOffset,
                    endOffset,
                    textLength: (text || valueRaw || ``).length,
                });
            }
        }
    }, [textAreaRef.current]);

    return (
        <>
            <div className="relative z-0 w-full h-full">
                <div className="z-0 w-full h-full">
                    {isSelected && !!language && (
                        <div className="z-0 w-full h-full">
                            <CodeEditor
                                language={language}
                                disabled={disabled}
                                value={text || valueRaw}
                                onChange={changeValue}
                                onSave={(x) => {
                                    changeValue(x);
                                    onSave(x);
                                }}
                                onEditorStateChange={setEditorState}
                                initialEditorState={editorState}
                            />
                        </div>
                    )}
                    {(!isSelected || !language) && (
                        <textarea
                            ref={textAreaRef}
                            className={`h-full w-full resize-none ${disabled ? `opacity-70` : ``} ${
                                //
                                !language
                                    ? `bg-white p-1 pb-8`
                                    : `scrollbar-thin scrollbar-thumb-[#555555] scrollbar-track-[#2a2a2a] hover:scrollbar-thumb-[#6a6a6a] h-full w-full resize-none overflow-auto bg-[#1e1e1e] pr-[102px] pb-8 pl-[64px] font-mono text-[14px] leading-[19px] tracking-[0px] text-[#d4d4d4] outline-none`
                            } `}
                            value={text || valueRaw}
                            disabled={disabled}
                            onChange={(e) => {
                                changeValue(e.target.value);
                            }}
                            onScroll={(e) => {
                                const textarea = e.currentTarget;
                                if (!textarea) {
                                    return;
                                }
                                setEditorState((prevState) => ({
                                    ...(prevState || { scroll: { scrollTop: 0, scrollLeft: 0 }, selection: null }),
                                    scroll: {
                                        scrollTop: textarea.scrollTop,
                                        scrollLeft: textarea.scrollLeft,
                                    },
                                }));
                            }}
                            onSelect={(e) => {
                                const textarea = e.currentTarget;
                                const value = textarea.value;
                                const selectionStart = textarea.selectionStart;
                                const selectionEnd = textarea.selectionEnd;

                                let startLineNumber = 1;
                                let startColumn = 1;
                                for (let i = 0; i < selectionStart; i++) {
                                    if (value[i] === `\n`) {
                                        startLineNumber++;
                                        startColumn = 1;
                                    } else {
                                        startColumn++;
                                    }
                                }

                                let endLineNumber = 1;
                                let endColumn = 1;
                                for (let i = 0; i < selectionEnd; i++) {
                                    if (value[i] === `\n`) {
                                        endLineNumber++;
                                        endColumn = 1;
                                    } else {
                                        endColumn++;
                                    }
                                }

                                setEditorState((prevState) => ({
                                    ...(prevState || { scroll: { scrollTop: 0, scrollLeft: 0 }, selection: null }),
                                    selection: {
                                        startLineNumber,
                                        startColumn,
                                        endLineNumber,
                                        endColumn,
                                    },
                                }));
                            }}
                            spellCheck={!language}
                        />
                    )}
                </div>
                <div className="absolute flex flex-row justify-start gap-1 bottom-3 left-3 z-1">
                    <CodeLanguageSelector value={language} onChange={changeLanguage} />
                </div>
            </div>
        </>
    );
};
