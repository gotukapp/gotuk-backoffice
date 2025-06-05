import {get, writable} from 'svelte/store';
import { getDoc } from 'firebase/firestore';

const orgMap = writable(new Map());

/**
 * Returns org name from cache or loads it if missing.
 * @param {DocumentReference} orgRef - Firestore organization reference
 */
export async function getOrg(orgRef) {
    if (!orgRef?.id) return 'Unknown';

    const current = new Map(get(orgMap));
    const existing = current.get(orgRef.id);

    if (existing) {
        console.log("Organization Cache")
        return existing;
    }

    try {
        const snap = await getDoc(orgRef);
        const org = snap.exists() ? snap.data() : 'Unknown Org';
        current.set(orgRef.id, org);
        orgMap.set(current); // 🔁 Trigger reactivity
        return org;
    } catch (e) {
        console.error('Error loading org:', e);
        current.set(orgRef.id, 'Error');
        orgMap.set(current);
        return 'Error';
    }
}

export { orgMap };
