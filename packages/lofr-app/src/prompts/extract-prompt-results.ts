export const extractMarkdownList = (responseText: string): undefined | string[] => {
    // skip text until a markdown list
    const listLines = responseText
        .split(`\n`)
        .map((line) => line.trim())
        .filter((line) => line.startsWith(`- `) || line.startsWith(`* `) || line.match(/^\d/));

    // trim list marker
    return listLines.map((line) => line.replace(/^(\-|\*|\d+\.?) /, ``).trim());
};
