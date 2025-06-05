<script lang="ts">
    import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
    import { getFirestore, doc, setDoc } from "firebase/firestore";
    import { goto } from "$app/navigation";
    import { auth } from '$lib';
    import {Button, Input, Label, Spinner} from 'flowbite-svelte';
    import {login} from '$lib/stores/authUser.js'

    let name = "";
    let email = "";
    let password = "";
    let message = "";
    let creatingAccount = false;

    async function handleRegister(event) {
        creatingAccount = true;
        const db = getFirestore();
        event.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: name
            });
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: email,
                name: name,
                isAdmin: false,
                backoffice: true
            });
            await login(auth.currentUser);
            message = "Account created successfully!";
            goto("/organizations/create");
        } catch (error) {
            message = `Error: ${error.message}`;
        }
        creatingAccount = false;
    }
</script>

<style>
    .login-wrapper {
        @apply flex items-center justify-center min-h-screen bg-gray-100;
    }
    .form-container {
        @apply bg-white p-8 rounded-lg shadow-lg;
    }
    .input {
        @apply block w-full p-2 border border-gray-300 rounded-md;
    }
</style>

<div class="login-wrapper">
    <div class="form-container w-96 text-center">
        <!-- Logo -->
        <img src="/applogo.png" alt="GoTuk Logo" class="mx-auto h-16 mb-4" />

        <form class="space-y-6" on:submit={handleRegister}>
            <h3 class="text-xl font-medium text-gray-900">Criar Conta</h3>
            <div>
                <Label class="block text-left text-gray-700 font-medium mb-2">
                    Nome
                </Label>
                <Input class="input" bind:value={name} name="name" placeholder="Nome do utilizador" required />
            </div>
            <div>
                <Label class="block text-left text-gray-700 font-medium mb-2">
                    Email
                </Label>
                <Input class="input" type="email" bind:value={email} name="email" placeholder="name@gotuk.com" required />
            </div>
            <div>
                <Label class="block text-left text-gray-700 font-medium mb-2">
                    Senha
                </Label>
                <Input class="input" type="password" bind:value={password} name="password" placeholder="•••••" required />
            </div>
            {#if !creatingAccount}
                <Button type="submit" class="w-full bg-[#E51D45] text-white">Criar Conta</Button>
            {/if}
            {#if creatingAccount}
                <Spinner />
            {/if}
            <p class="text-sm text-gray-500">
                Já tem uma conta? <a href="/login" class="text-[#E51D45] hover:underline">Entrar</a>
            </p>
            {#if message}
                <p class="text-sm font-medium text-red-500">{message}</p>
            {/if}
        </form>
    </div>
</div>
