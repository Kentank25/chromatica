import type { Perk } from '../engine/perksManager';

export interface GroupedPerk {
    perk: Perk;
    count: number;
    initials: string;
}

/**
 * Aggregates raw perk IDs into an uncoupled, deduplicated UI format with layout tokens.
 */
export const groupActivePerks = (perkIds: string[], perkPool: Perk[]): GroupedPerk[] => {
    const counts = perkIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([id, count]) => {
        const perk = perkPool.find(p => p.id === id);
        if (!perk) throw new Error(`Alchemical Engine Error: Stale Perk ID reference [${id}]`);

        // Compute high-visibility 2-letter uppercase initials
        const initials = perk.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

        return { perk, count, initials };
    });
};
