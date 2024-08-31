import { exec, execSync } from 'child_process';
import { readFileSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import nodemon from 'nodemon';
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

export const run_singleNodemon = async () => {
    const root = resolve(`../`);
    const watch = [
        // watch packages
        resolve(`../packages/`),
        // resolve(`../packages/**/*.ts`),
        // resolve(`../packages/**/*.tsx`),
    ];
    console.log(`watching: `, watch);

    nodemon({
        watch,
        ignoreRoot: [`**/node_modules`, `**/dist`],
        script: `empty.js`,
        ext: `js json ts tsx css scss md`,
    })
        .on(`start`, function () {
            console.log(`dev started`);
        })
        .on(`quit`, function () {
            console.log(`dev has quit`);
            process.exit();
        })
        .on(`restart`, function (files) {
            console.log(`dev restarted due to: `, files);

            const fileNames = Array.isArray(files) ? (files as unknown as string[]) : undefined;
            if (!fileNames) {
                return;
            }

            const packagePathsAll = fileNames.map((x) => {
                x = x.replace(/\\/g, `/`);
                const iPackage = x.indexOf(`packages/`, root.length);
                const iPackageEnd = x.indexOf(`/`, iPackage + `packages/`.length);
                const packageName = x.substring(iPackage + `packages/`.length, iPackageEnd);
                const packagePath = x.substring(0, iPackageEnd);
                return { packageName, packagePath };
            });
            const packagePaths = [...new Map(packagePathsAll.map((x) => [x.packagePath, x])).values()];

            // console.log(`packagePaths: `, { packagePaths, packagePathsAll });

            // run dev scripts
            const scriptNames = [`build:types`];

            for (const { packagePath, packageName } of packagePaths) {
                const packageJsonPath = resolve(packagePath, `package.json`);
                try {
                    const packageJsonContents = readFileSync(packageJsonPath, { encoding: `utf8` });
                    const packageJson = JSON.parse(packageJsonContents) as { scripts?: Record<string, string> };

                    for (const scriptName of scriptNames) {
                        if (packageJson.scripts && packageJson.scripts[scriptName]) {
                            console.log(`${packageName}: ${scriptName}`);
                            execSync(`npm run ${scriptName}`, { cwd: packagePath, stdio: `inherit` });
                        }
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        });

    // return `Hello, World!`;
};

run_watchAll()
    .catch((err) => console.error(err))
    .then(() => console.log(`done`));
