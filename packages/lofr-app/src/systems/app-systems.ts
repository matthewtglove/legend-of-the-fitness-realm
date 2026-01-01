import { createDirectorStateDebug } from "./director-state.debug";
import { createNarrativeServiceDebug } from "./narrative-service.debug";
import { createUserStateDebug } from "./user-state.debug";


export const createAppSystems = () => {
    const { userState } = createUserStateDebug();
    const { narrativeService } = createNarrativeServiceDebug();
    const { directorState } = createDirectorStateDebug();

    return {
        userState,
        narrativeService,
        directorState,

        // TODO: load state from storage
    };
};

export type AppSystems = ReturnType<typeof createAppSystems>;