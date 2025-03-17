// src/lib/stores/auth.js
import { writable } from 'svelte/store'
import {doc, onSnapshot} from "firebase/firestore";
import {db} from "$lib";

export const authUser = writable({
    isLoggedIn: false,
    isAdmin: false,
    user: null
})

let unsubscribeUser;

export function login(user) {
    return new Promise((resolve) => {
        const userRef = doc(db, "users", user.uid);
        unsubscribeUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                user = docSnap.data();
                authUser.set({
                    isLoggedIn: true,
                    isAdmin: user.isAdmin,
                    user
                })
                resolve()
            } else {
                resolve()
            }

        });
    })
}

export function logout() {
    unsubscribeUser()
    authUser.set({
        isLoggedIn: false,
        isAdmin: false,
        user: null
    })
}
