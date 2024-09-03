/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoreDictionaryGenerator } from '../../lore-dictionary';

export const generateOutput = (loreGenerator: LoreDictionaryGenerator) => {
    const enemyAbilities = loreGenerator.generateEnemyAbilities({
        world: {
            title: `Eldoria`,
            genre: `High Fantasy`,
        },
        location: {
            title: `Whispering Woods`,
            biome: `Enchanted Forest`,
        },
        campaign: {
            title: `The Corrupted Heart`,
        },
        enemy: {
            race: `Elf`,
            class: `Ranger`,
            ranking: `normal`,
            surname: `Shadowleaf`,
            firstName: `Silent`,
            aliases: [`The Silent Hunter`, `The Shadow of the Woods`],
            bodyParts: [
                `Head`,
                `Eyes`,
                `Torso`,
                `Left Arm`,
                `Left Hand`,
                `Right Arm`,
                `Right Hand`,
                `Left Leg`,
                `Right Leg`,
            ],
        },
        attackCount: 20,
        abilityCount: 5,
    }) satisfies {
        attacks: {
            title: string;
            strength: `weak` | `normal` | `strong`;
            requiredBodyParts: string[];
        }[];
        abilities: {
            title: string;
            effect: string;
            requiredBodyParts: string[];
        }[];
    };

    return enemyAbilities;
};

// MARK: Output:

const sampleOutput = {
    attacks: [
        { title: `Precise Arrow Shot`, strength: `strong`, requiredBodyParts: [`Right Hand`, `Eyes`] },
        { title: `Quick Dagger Slash`, strength: `normal`, requiredBodyParts: [`Left Hand`] },
        { title: `Spinning Kick`, strength: `normal`, requiredBodyParts: [`Right Leg`, `Left Leg`] },
        { title: `Elbow Strike`, strength: `weak`, requiredBodyParts: [`Right Arm`] },
        { title: `Poison Dart Throw`, strength: `weak`, requiredBodyParts: [`Left Hand`, `Eyes`] },
        { title: `Double Arrow Shot`, strength: `strong`, requiredBodyParts: [`Right Hand`, `Left Hand`, `Eyes`] },
        { title: `Swift Punch`, strength: `weak`, requiredBodyParts: [`Right Hand`] },
        { title: `Knee Strike`, strength: `normal`, requiredBodyParts: [`Left Leg`] },
        { title: `Choking Vine Throw`, strength: `normal`, requiredBodyParts: [`Right Arm`, `Right Hand`] },
        { title: `Silent Backstab`, strength: `strong`, requiredBodyParts: [`Right Hand`, `Left Hand`] },
        { title: `Leafblade Throw`, strength: `normal`, requiredBodyParts: [`Left Hand`, `Eyes`] },
        { title: `Forest Root Trip`, strength: `weak`, requiredBodyParts: [`Left Leg`, `Right Leg`] },
        { title: `Blinding Powder Toss`, strength: `weak`, requiredBodyParts: [`Right Hand`, `Eyes`] },
        { title: `Dual Dagger Dance`, strength: `strong`, requiredBodyParts: [`Left Hand`, `Right Hand`] },
        { title: `Whispering Wind Slash`, strength: `normal`, requiredBodyParts: [`Right Arm`, `Right Hand`] },
        { title: `Shadow Step Strike`, strength: `strong`, requiredBodyParts: [`Right Leg`, `Left Leg`] },
        { title: `Venomous Arrow`, strength: `strong`, requiredBodyParts: [`Left Hand`, `Eyes`] },
        { title: `Branch Swing Kick`, strength: `normal`, requiredBodyParts: [`Left Leg`, `Right Leg`] },
        { title: `Silent Throat Jab`, strength: `weak`, requiredBodyParts: [`Left Hand`] },
        { title: `Nature's Wrath Volley`, strength: `strong`, requiredBodyParts: [`Right Hand`, `Left Hand`, `Eyes`] },
    ],
    abilities: [
        {
            title: `Forest Camouflage`,
            effect: `Blends into forest surroundings, becoming nearly invisible`,
            requiredBodyParts: [`Torso`],
        },
        {
            title: `Eagle-Eyed Precision`,
            effect: `Greatly increases accuracy of ranged attacks for a short duration`,
            requiredBodyParts: [`Eyes`],
        },
        {
            title: `Nature's Whisper`,
            effect: `Can communicate with forest creatures to gather information`,
            requiredBodyParts: [`Head`],
        },
        {
            title: `Swift as the Wind`,
            effect: `Temporarily increases movement and attack speed`,
            requiredBodyParts: [`Left Leg`, `Right Leg`],
        },
        {
            title: `Venom Infusion`,
            effect: `Coats weapons with a potent poison, adding damage over time to attacks`,
            requiredBodyParts: [`Left Hand`, `Right Hand`],
        },
    ],
};
