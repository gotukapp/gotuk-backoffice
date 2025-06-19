import {get, writable} from 'svelte/store';
import { getDoc } from 'firebase/firestore';

const toursMap = writable(new Map());

/**
 * Returns tour from cache or loads it if missing.
 * @param {DocumentReference} tourRef - Firestore tour reference
 */
export async function getTour(tourRef) {
    if (!tourRef?.id) return 'Unknown';

    const current = new Map(get(toursMap));
    const existing = current.get(tourRef.id);

    if (existing) {
        return existing;
    }

    try {
        const snap = await getDoc(tourRef);
        const tour = snap.exists() ? snap.data() : 'Unknown Tour';
        current.set(tourRef.id, tour);
        toursMap.set(current);
        return tour;
    } catch (e) {
        console.error('Error loading tour:', e);
        current.set(tourRef.id, 'Error');
        toursMap.set(current);
        return 'Error';
    }
}

export { toursMap };
