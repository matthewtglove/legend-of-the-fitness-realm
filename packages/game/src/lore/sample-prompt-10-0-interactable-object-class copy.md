Give me a list of interactable environment object classes for an rpg game, output as a typescript type: type InteractableObjectClass = ...

---

Here's a TypeScript type definition for interactable environment object classes in an RPG game:

```typescript
type InteractableObjectClass =
    | 'Chest'
    | 'Door'
    | 'Lever'
    | 'Switch'
    | 'Bookshelf'
    | 'Barrel'
    | 'Crate'
    | 'Sign'
    | 'Altar'
    | 'Campfire'
    | 'Well'
    | 'Forge'
    | 'Alchemy Table'
    | 'Enchanting Table'
    | 'Crafting Bench'
    | 'Bed'
    | 'Torch'
    | 'Gravestone'
    | 'Statue'
    | 'Painting'
    | 'Portal'
    | 'Trap'
    | 'Treasure Map'
    | 'Scroll'
    | 'Crystal'
    | 'Rune Stone'
    | 'Teleporter'
    | 'Workbench'
    | 'Weapon Rack'
    | 'Armor Stand'
    | 'Loom'
    | 'Anvil'
    | 'Cauldron'
    | 'Shrine'
    | 'Fountain'
    | 'Magical Orb'
    | 'Treasure Pile'
    | 'Secret Passage'
    | 'Puzzle Box'
    | 'Control Panel'
    | 'Hologram Projector'
    | 'Computer Terminal';
```

---

```ts
type InteractableObjectClass =
    | 'Chest'
    | 'Door'
    | 'Lever'
    | 'NPC'
    | 'Sign'
    | 'Bookshelf'
    | 'Campfire'
    | 'Crafting_Table'
    | 'Shrine'
    | 'Portal'
    | 'Trap'
    | 'Puzzle'
    | 'Collectible'
    | 'Merchant_Stall'
    | 'Bed'
    | 'Workbench'
    | 'Forge'
    | 'Alchemy_Station'
    | 'Training_Dummy'
    | 'Treasure_Map'
    | 'Magical_Artifact'
    | 'Bulletin_Board'
    | 'Fountain'
    | 'Gravestone'
    | 'Barrel'
    | 'Crate'
    | 'Torch'
    | 'Switch'
    | 'Teleporter'
    | 'Hidden_Cache'
    | 'Fishing_Spot'
    | 'Mining_Node'
    | 'Harvesting_Plant'
    | 'Quest_Giver'
    | 'Enchanting_Table'
    | 'Altar'
    | 'Magical_Mirror'
    | 'Treasure_Chest';
```

---

Give me a list of interactable environment object classes for an rpg game, output as a typescript type: type InteractableObjectClass = ...

I need generic interactable classses that each have a distinct ability or skill or way to interact with it physically.

---

```ts
type InteractableObjectClass =
    | 'Chest'
    | 'Door'
    | 'Lever'
    | 'Campfire'
    | 'NPC'
    | 'Bookshelf'
    | 'Fountain'
    | 'Portal'
    | 'Altar'
    | 'CrystalNode'
    | 'Forge'
    | 'Workbench'
    | 'PressurePlate'
    | 'MagicMirror'
    | 'TalkingStatue'
    | 'EnchantingTable'
    | 'AlchemyLab'
    | 'Telescope'
    | 'TrainingDummy'
    | 'WishingWell'
    | 'HealingShrine'
    | 'TreasureMap'
    | 'PuzzleBox'
    | 'MusicBox'
    | 'WardrobeCloset'
    | 'SummoningCircle'
    | 'GraveSite'
    | 'QuestBoard'
    | 'MysteriousRune';
```
