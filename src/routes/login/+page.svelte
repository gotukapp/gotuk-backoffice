<script lang="ts">
    import { signInWithEmailAndPassword } from 'firebase/auth';
    import { goto } from '$app/navigation';
    import { auth } from '$lib';
    import { login, authUser } from '$lib/stores/authUser.js';
    import { Button, Input, Label } from 'flowbite-svelte';

    let email = '';
    let password = '';

    const handlePasswordLogin = async (event) => {
        event.preventDefault();
        signInWithEmailAndPassword(auth, email, password)
            .then(async () => {
                await login(auth.currentUser);
                if ($authUser.isAdmin) {
                    goto('/dashboard');
                } else {
                    goto('/organizations');
                }
            })
            .catch((error) => {
                alert("Erro: " + error.message);
            });
    };
</script>

<style>
    .login-wrapper {
        @apply flex items-center justify-center min-h-screen bg-gray-100;
    }
    .form-container {
        @apply bg-white p-8 rounded-lg shadow-lg;
    }
</style>

<div class="login-wrapper">
    <div class="form-container w-96 text-center">
        <!-- Logo -->
        <img src="/applogo.png" alt="GoTuk Logo" class="mx-auto h-16 mb-4" />

        <form class="space-y-6" on:submit={handlePasswordLogin}>
            <h3 class="text-xl font-medium text-gray-900">GoTuk - Empresas</h3>
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
            <Button type="submit" class="w-full bg-[#E51D45] text-white">Entrar</Button>
            <p class="text-sm text-gray-500">
                Não tem uma conta? <a href="/account" class="text-[#E51D45] hover:underline">Criar Conta</a>
            </p>
        </form>
    </div>
</div>
