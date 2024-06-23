import fs from 'fs/promises';
import { parseWorkoutDocument } from '../src/parser';

export const parseExample = async () => {
    const text = await fs.readFile(`./data/example-00.md`, `utf-8`);

    const result = parseWorkoutDocument(text);
    console.log(`Parsed workout: `, result);
    console.log(`Segment 0, Session 0: `, result.segments[0]?.sessions[0]);
    console.log(`Segment 0, Session 0, Step 0: `, result.segments[0]?.sessions[0]?.steps[0]);
};

parseExample();
