import { exec } from 'child_process';
import { readdir, readFile } from 'fs/promises';
import { resolve } from 'path';

export const run_watchAll = async () => {
    const packages = await readdir(resolve(`../packages`));
    for (const packageName of packages) {
        const packagePath = resolve(`../packages`, packageName);
        if (!(await packageJsonHasScript(packagePath, `watch`))) {
            continue;
        }

        console.log(`watching: ${packagePath}`);
        const subProcess = exec(`npm run watch`, { cwd: packagePath });
        // subProcess.stdout?.pipe(process.stdout);
        // subProcess.stderr?.pipe(process.stderr);

        // pipe stdout, stderr with prefix
        subProcess.stdout?.on(`data`, (data) => {
            const dataString = data.toString();
            // replace word error with red color
            const dataStringHighlighted = dataString.replace(/error /gi, `\x1b[31m$&\x1b[0m`);
            console.log(`[${packageName}] ${dataStringHighlighted}`);
        });
        subProcess.stderr?.on(`data`, (data) => {
            console.error(`[${packageName}] ${data}`);
        });
    }
};

const loadPackageJson = async (packagePath: string) => {
    const packageJsonContents = await readFile(resolve(packagePath, `package.json`), { encoding: `utf8` });
    const packageJson = JSON.parse(packageJsonContents) as { scripts?: Record<string, string> };
    return packageJson;
};

const packageJsonHasScript = async (packagePath: string, scriptName: string) => {
    const packageJson = await loadPackageJson(packagePath);
    return packageJson.scripts && packageJson.scripts[scriptName];
};

run_watchAll()
    .catch((err) => console.error(err))
    .then(() => console.log(`done`));
