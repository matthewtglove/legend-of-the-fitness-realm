import { lofrSystemTypesDummy } from "../../systems/lofr-system-types";
// import { exampleFun02 } from "./example-fun.ts";

// const moduleMap = {
//     [`./example-fun.ts`]: () => import(`./example-fun.ts`)
// }

const modules = import.meta.glob(`../../**/*.(ts|tsx)`);

export const _includeInHmr = () => {
    console.log(`[_includeInHmr] Included in HMR`, {
        lofrSystemTypesDummy,
        // exampleFun02,
        // moduleMap,
        modules
    });
}