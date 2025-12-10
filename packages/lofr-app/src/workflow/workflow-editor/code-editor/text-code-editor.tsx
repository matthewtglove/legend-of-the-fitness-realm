import * as monaco from 'monaco-editor';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatCodeWithPrettier } from './text-code-editor-formatting';
import debounce from './debounce';
import './text-code-editor-deps';

export const languages = [`none`, `markdown`, `json`, `typescript`, `glsl`] as const;
export type CodeLanguage = (typeof languages)[number];

export const CodeLanguageSelector = ({
    value,
    onChange,
}: {
    value: undefined | CodeLanguage;
    onChange: (value: undefined | CodeLanguage) => void;
}) => {
    const changeLanguage = (value: CodeLanguage) => {
        if (value === `none`) {
            onChange(undefined);
        } else {
            onChange(value);
        }
    };
    return (
        <>
            <select
                value={value}
                onChange={(e) => changeLanguage(e.target.value as CodeLanguage)}
                className="p-1 bg-gray-200 border border-gray-300 rounded focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
                {languages.map((lang) => (
                    <option key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)} {}
                    </option>
                ))}
            </select>
        </>
    );
};

export type EditorScrollState = {
    scrollTop: number;
    scrollLeft: number;
};

export type EditorSelectionState = {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
} | null;

export type EditorState = {
    scroll: EditorScrollState;
    selection: EditorSelectionState;
};

export const CodeEditor = ({
    value,
    onChange,
    language,
    disabled,
    onEditorStateChange,
    initialEditorState,
}: {
    value: undefined | string;
    onChange: (value: string) => void;
    language: string;
    disabled: boolean;
    onEditorStateChange?: (state: EditorState) => void;
    initialEditorState?: EditorState;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const debouncedOnChange = debounce((value: string) => {
        onChangeRef.current(value);
    }, 1000);

    const [isFormatting, setIsFormatting] = useState(false);

    const handleFormatCode = useCallback(async () => {
        if (!editorRef.current || isFormatting || disabled || !language || language === `none`) {
            return;
        }

        setIsFormatting(true);

        const unformattedCode = editorRef.current.getValue();

        const result = await formatCodeWithPrettier({
            code: unformattedCode,
            language: language,
        });

        if (result.formattedCode && editorRef.current) {
            const currentPosition = editorRef.current.getPosition();
            editorRef.current.setValue(result.formattedCode);
            if (currentPosition) {
                editorRef.current.setPosition(currentPosition);
            }
            onChangeRef.current(result.formattedCode);
        } else if (result.error) {
            console.warn(`Formatting error:`, result.error);
        }

        setIsFormatting(false);
    }, [language, isFormatting, disabled]);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        if (editorRef.current) {
            editorRef.current.dispose();
        }

        editorRef.current = monaco.editor.create(containerRef.current, {
            value,
            language,
            theme: `vs-dark`,
            readOnly: disabled,
            wordWrap: `on`,
        });

        if (initialEditorState) {
            editorRef.current.setScrollPosition(initialEditorState.scroll);
            if (initialEditorState.selection) {
                editorRef.current.setSelection(initialEditorState.selection);
            }
        }

        editorRef.current.focus();

        const changeListener = editorRef.current.onDidChangeModelContent(() => {
            const currentValue = editorRef.current?.getValue();
            if (currentValue !== undefined) {
                debouncedOnChange(currentValue);
            }
        });

        const scrollListener = editorRef.current.onDidScrollChange((e) => {
            if (onEditorStateChange) {
                const currentSelection = editorRef.current?.getSelection();
                onEditorStateChange({
                    scroll: { scrollTop: e.scrollTop, scrollLeft: e.scrollLeft },
                    selection: currentSelection
                        ? {
                              startLineNumber: currentSelection.startLineNumber,
                              startColumn: currentSelection.startColumn,
                              endLineNumber: currentSelection.endLineNumber,
                              endColumn: currentSelection.endColumn,
                          }
                        : null,
                });
            }
        });

        const selectionListener = editorRef.current.onDidChangeCursorSelection((e) => {
            const editor = editorRef.current;
            if (!editor) return;
            if (onEditorStateChange) {
                onEditorStateChange({
                    scroll: {
                        scrollTop: editor.getScrollTop(),
                        scrollLeft: editor.getScrollLeft(),
                    },
                    selection: e.selection
                        ? {
                              startLineNumber: e.selection.startLineNumber,
                              startColumn: e.selection.startColumn,
                              endLineNumber: e.selection.endLineNumber,
                              endColumn: e.selection.endColumn,
                          }
                        : null,
                });
            }
        });

        const keybindingRulesDisposable = monaco.editor.addKeybindingRules(
            customKeybindingsFromVSCode.map((kb) => ({
                keybinding: getMonacoKeybinding(kb.key),
                command: kb.command,
                when: kb.when,
            })),
        );

        editorRef.current.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            () => {
                handleFormatCode();
            },
            `!editorReadonly`,
        );

        return () => {
            if (editorRef.current) {
                if (onEditorStateChange) {
                    const scrollPosition = {
                        scrollTop: editorRef.current.getScrollTop(),
                        scrollLeft: editorRef.current.getScrollLeft(),
                    };
                    const selection = editorRef.current.getSelection();
                    onEditorStateChange({
                        scroll: { scrollTop: scrollPosition.scrollTop, scrollLeft: scrollPosition.scrollLeft },
                        selection: selection
                            ? {
                                  startLineNumber: selection.startLineNumber,
                                  startColumn: selection.startColumn,
                                  endLineNumber: selection.endLineNumber,
                                  endColumn: selection.endColumn,
                              }
                            : null,
                    });
                }
                keybindingRulesDisposable.dispose();
                changeListener.dispose();
                scrollListener.dispose();
                selectionListener.dispose();
                editorRef.current.dispose();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    useEffect(() => {
        if (!editorRef.current) {
            return;
        }
        const editorValue = editorRef.current.getValue();
        if (editorValue !== (value || ``)) {
            editorRef.current.setValue(value || ``);
        }
    }, [value]);

    useEffect(() => {
        if (!editorRef.current) {
            return;
        }
        editorRef.current.updateOptions({ readOnly: disabled });
    }, [disabled]);

    return <div ref={containerRef} className="w-full h-full" />;
};

const getMonacoKeybinding = (keyString: string): number => {
    let monacoKey = 0;
    const parts = keyString.toLowerCase().split(`+`);

    parts.forEach((part) => {
        switch (part) {
            case `ctrl`:
                monacoKey |= monaco.KeyMod.CtrlCmd;
                break;
            case `shift`:
                monacoKey |= monaco.KeyMod.Shift;
                break;
            case `alt`:
                monacoKey |= monaco.KeyMod.Alt;
                break;
            case `meta`:
                monacoKey |= monaco.KeyMod.WinCtrl;

                break;

            case `down`:
                monacoKey |= monaco.KeyCode.DownArrow;
                break;
            case `up`:
                monacoKey |= monaco.KeyCode.UpArrow;
                break;
            case `k`:
                monacoKey |= monaco.KeyCode.KeyK;
                break;

            default:
                console.warn(`Unmapped key part: ${part} in keyString: ${keyString}`);
        }
    });
    return monacoKey;
};

const customKeybindingsFromVSCode = [
    {
        key: `alt+down`,
        command: `editor.action.insertCursorBelow`,
        when: `editorTextFocus`,
    },
    {
        key: `alt+up`,
        command: `editor.action.insertCursorAbove`,
        when: `editorTextFocus`,
    },
    {
        key: `ctrl+k ctrl+d`,
        command: `editor.action.formatDocument`,
        when: `editorTextFocus`,
    },
    {
        key: `shift+alt+down`,
        command: `cursorColumnSelectDown`,
        when: `editorTextFocus`,
    },
    {
        key: `shift+alt+left`,
        command: `cursorColumnSelectLeft`,
        when: `editorTextFocus`,
    },
    {
        key: `shift+alt+pagedown`,
        command: `cursorColumnSelectPageDown`,
        when: `editorTextFocus`,
    },
    {
        key: `shift+alt+pageup`,
        command: `cursorColumnSelectPageUp`,
        when: `editorTextFocus`,
    },
    {
        key: `shift+alt+right`,
        command: `cursorColumnSelectRight`,
        when: `editorTextFocus`,
    },
    {
        key: `shift+alt+up`,
        command: `cursorColumnSelectUp`,
        when: `editorTextFocus`,
    },
    {
        key: `ctrl+right`,
        command: `cursorWordStartRight`,
        when: `editorTextFocus`,
    },
    {
        key: `ctrl+shift+right`,
        command: `cursorWordStartRightSelect`,
        when: `editorTextFocus`,
    },
    {
        key: `ctrl+backspace`,
        command: `deleteWordStartLeft`,
        when: `editorTextFocus`,
    },
    {
        key: `ctrl+delete`,
        command: `deleteWordStartRight`,
        when: `editorTextFocus`,
    },
    {
        key: `tab`,
        command: `acceptSelectedSuggestionOnEnter`,
        when: `acceptSuggestionOnEnter && editorTextFocus && suggestWidgetVisible`,
    },
    {
        key: `ctrl+shift+f`,
        command: `tslint.fixAllProblems`,
    },
    {
        key: `ctrl+shift+alt+right`,
        command: `editor.action.smartSelect.expand`,
        when: `editorTextFocus`,
    },
    {
        key: `shift+alt+right`,
        command: `-editor.action.smartSelect.expand`,
        when: `editorTextFocus`,
    },
    {
        key: `ctrl+shift+alt+left`,
        command: `editor.action.smartSelect.shrink`,
        when: `editorTextFocus`,
    },
    {
        key: `shift+alt+left`,
        command: `-editor.action.smartSelect.shrink`,
        when: `editorTextFocus`,
    },
    {
        key: `ctrl+shift+v`,
        command: `extension.pasteImage`,
        when: `editorTextFocus`,
    },
    {
        key: `ctrl+alt+v`,
        command: `-extension.pasteImage`,
        when: `editorTextFocus`,
    },
    {
        key: `ctrl+alt+k ctrl+alt+i`,
        command: `editor.action.showDefinitionPreviewHover`,
    },
    {
        key: `ctrl+up`,
        command: `cursorMove`,
        args: {
            to: `prevBlankLine`,
        },
        when: `editorTextFocus`,
    },
    {
        key: `ctrl+down`,
        command: `cursorMove`,
        args: {
            to: `nextBlankLine`,
        },
        when: `editorTextFocus`,
    },
    {
        key: `alt+z`,
        command: `cursorUndo`,
        when: `textInputFocus`,
    },
    {
        key: `ctrl+u`,
        command: `-cursorUndo`,
        when: `textInputFocus`,
    },
    {
        key: `ctrl+k ctrl+r`,
        command: `docsView.documentation.focus`,
    },
    {
        key: `ctrl+k e`,
        command: `workbench.files.action.focusOpenEditorsView`,
        when: `workbench.explorer.openEditorsView.active`,
    },
    {
        key: `ctrl+k e`,
        command: `-workbench.files.action.focusOpenEditorsView`,
        when: `workbench.explorer.openEditorsView.active`,
    },
    {
        key: `ctrl+k ctrl+e`,
        command: `workbench.action.focusActiveEditorGroup`,
    },
];
