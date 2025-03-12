<script>
    import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
    import { getFirestore, doc, setDoc } from "firebase/firestore";
    import { goto } from "$app/navigation";
    import { auth } from '$lib'
    import { Register, Section } from "flowbite-svelte-blocks";
    import { Button, Input, Label } from "flowbite-svelte";

    let name = "";
    let email = "";
    let password = "";
    let message = "";

    async function handleRegister(event) {
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
                isAdmin: false, // You can add more fields here
            });
            message = "Account created successfully!";
            goto("/guides");
        } catch (error) {
            message = `Error: ${error.message}`;
        }
    }
</script>

<div class="flex items-center justify-center md:h-screen pt:mt-0 dark:bg-gray-900">
    <Section name="register">
        <Register href="/">
            <svelte:fragment slot="top">
                <!--img class="w-8 h-8 mr-2" src="/images/logo.svg" alt="logo" /-->
            </svelte:fragment>
            <div class="p-6 space-y-4 md:space-y-6 sm:p-8 w-96">
                <form class="flex flex-col space-y-6" on:submit={handleRegister}>
                    <h3 class="text-xl font-medium text-gray-900 dark:text-white p-0">Create an Account</h3>
                    <Label class="space-y-2">
                        <span>Name</span>
                        <Input bind:value={name} name="name" placeholder="name" required />
                    </Label>
                    <Label class="space-y-2">
                        <span>Your email</span>
                        <Input type="email" bind:value={email} name="email" placeholder="name@gotuk.com" required />
                    </Label>
                    <Label class="space-y-2">
                        <span>Your password</span>
                        <Input type="password" bind:value={password} name="password" placeholder="•••••" required />
                    </Label>
                    <Button type="submit" class="w-full">Sign Up</Button>
                    <p class="text-sm font-light text-gray-500 dark:text-gray-400">
                        Already have an account?
                        <a href="/login" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Sign in</a>
                    </p>
                    {#if message}
                        <p class="text-sm font-medium text-red-500">{message}</p>
                    {/if}
                </form>
            </div>
        </Register>
    </Section>
</div>
