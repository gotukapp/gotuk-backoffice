<script lang="ts">import { Section, Register } from "flowbite-svelte-blocks";
import { Button, Checkbox, Label, Input } from "flowbite-svelte";
import {signInWithEmailAndPassword} from 'firebase/auth'
import {auth} from '$lib'
import {goto} from "$app/navigation";

let email = $state('')
let password = $state('')

const handlePasswordLogin = async (event) => {
    event.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            goto('/main')
        })
        .catch((error) => {
            alert(error.code + ' ' +error.message)
        });
}

</script>
<div class="flex items-center justify-center md:h-screen pt:mt-0 dark:bg-gray-900">
<Section name="login" >
    <Register href="/">
        <svelte:fragment slot="top">
            <!--img class="w-8 h-8 mr-2" src="/images/logo.svg" alt="logo" /-->
        </svelte:fragment>
        <div class="p-6 space-y-4 md:space-y-6 sm:p-8 w-96">
            <form class="flex flex-col space-y-6" onsubmit={handlePasswordLogin}>
                <h3 class="text-xl font-medium text-gray-900 dark:text-white p-0">Entrar</h3>
                <Label class="space-y-2">
                    <span>Your email</span>
                    <Input type="email" bind:value="{email}" name="email" placeholder="name@gotuk.com" required />
                </Label>
                <Label class="space-y-2">
                    <span>Your password</span>
                    <Input type="password" bind:value="{password}" name="password" placeholder="•••••" required />
                </Label>
                <div class="flex items-start">
                    <Checkbox>Remember me</Checkbox>
                    <a href="/" class="ml-auto text-sm text-blue-700 hover:underline dark:text-blue-500">Forgot password?</a>
                </div>
                <Button type="submit" class="w-full1">Sign in</Button>
                <p class="text-sm font-light text-gray-500 dark:text-gray-400">
                    Don’t have an account yet? <a href="/" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Sign up</a>
                </p>
            </form>
        </div>
    </Register>
</Section>
</div>

