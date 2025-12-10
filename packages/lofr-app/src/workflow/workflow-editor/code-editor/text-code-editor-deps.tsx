// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === `json`) {
            return new jsonWorker();
        }
        if (label === `css` || label === `scss` || label === `less`) {
            return new cssWorker();
        }
        if (label === `html` || label === `handlebars` || label === `razor`) {
            return new htmlWorker();
        }
        if (label === `typescript` || label === `javascript`) {
            return new tsWorker();
        }
        return new editorWorker();
    },
};

// self.MonacoEnvironment = {
//     getWorker: function (_workerId, label) {
//         const getWorkerModule = (moduleUrl: string, label: string) => {
//             const getWorkerUrlObj = self.MonacoEnvironment as unknown as {
//                 getWorkerUrl: (moduleUrl: string) => string;
//             };

//             if (!getWorkerUrlObj?.getWorkerUrl) {
//                 console.error(
//                     `[MonacoEnvironment.getWorkerUrl] is not defined! Cannot create worker for label:`,
//                     label,
//                 );
//                 throw new Error(`MonacoEnvironment.getWorkerUrl is not defined!`);
//             }
//             console.log(`[MonacoEnvironment.getWorkerUrl] ok!`, {
//                 label,
//                 moduleUrl,
//                 workerUrl: getWorkerUrlObj.getWorkerUrl(moduleUrl),
//             });

//             return new Worker(getWorkerUrlObj.getWorkerUrl(moduleUrl), {
//                 name: label,
//                 type: `module`,
//             });
//         };

//         switch (label) {
//             case `json`:
//                 return getWorkerModule(`/monaco-editor/esm/vs/language/json/json.worker?worker`, label);
//             case `css`:
//             case `scss`:
//             case `less`:
//                 return getWorkerModule(`/monaco-editor/esm/vs/language/css/css.worker?worker`, label);
//             case `html`:
//             case `handlebars`:
//             case `razor`:
//                 return getWorkerModule(`/monaco-editor/esm/vs/language/html/html.worker?worker`, label);
//             case `typescript`:
//             case `javascript`:
//                 return getWorkerModule(`/monaco-editor/esm/vs/language/typescript/ts.worker?worker`, label);
//             default:
//                 return getWorkerModule(`/monaco-editor/esm/vs/editor/editor.worker?worker`, label);
//         }
//     },
// };
