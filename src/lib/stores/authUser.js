// src/lib/stores/auth.js
import { writable } from 'svelte/store'

export const authUser = writable({
    isLoggedIn: false,
    isAdmin: false,
    user: null
})

export function login(user) {
    console.log(user)
    authUser.set({
        isLoggedIn: true,
        isAdmin: user.isAdmin,
        user
    })
}

export function logout() {
    authUser.set({
        isLoggedIn: false,
        isAdmin: false,
        user: null
    })
}
