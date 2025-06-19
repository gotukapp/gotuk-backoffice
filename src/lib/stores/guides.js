import {get, writable} from 'svelte/store';
import { getDoc } from 'firebase/firestore';

const guideMap = writable(new Map());

/**
 * Returns guide name from cache or loads it if missing.
 * @param {DocumentReference} guideRef - Firestore guide reference
 */
export async function getGuide(guideRef) {
    if (!guideRef?.id) return 'Unknown';

    const current = new Map(get(guideMap));
    const existing = current.get(guideRef.id);

    if (existing) {
        return existing;
    }

    try {
        const snap = await getDoc(guideRef);
        const guide = snap.exists() ? snap.data() : 'Unknown Guide';
        current.set(guideRef.id, guide);
        guideMap.set(current);
        return guide;
    } catch (e) {
        console.error('Error loading guide:', e);
        current.set(guideRef.id, 'Error');
        guideMap.set(current);
        return 'Error';
    }
}

export { guideMap };
