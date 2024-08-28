import './polyfills';
export type * from './types';
export { createGameRuntime, createEmptyGameState } from './runtime';
export { createGameLoreProvider } from './lore-provider';
export { createGameBattleProvider } from './battle-provider';
export { formatGameEventMessage } from './event-messages';
export { createLoreBuilder, type LoreBuilder } from './lore/lore-builder';
export * from './lore/lore-builder-types';
export * from './lore/prompts/exercise-info';
