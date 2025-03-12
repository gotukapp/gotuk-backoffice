import {auth, db} from '$lib';
import { onAuthStateChanged } from 'firebase/auth';
import {doc, getDoc} from "firebase/firestore";

export async function load({ url }) {
    function getAuthUser() {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, (user) => resolve(user ? user : false));
        });
    }

    async function isAdmin() {
        const user = await getFirebaseUser()
        return user.isAdmin
    }

    async function getFirebaseUser() {
        const user = await getAuthUser()
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        return docSnap.data();
    }

    return {
        getAuthUser,
        isAdmin,
        getFirebaseUser,
        url: url.pathname
    };
}
