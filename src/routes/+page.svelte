<script lang="ts">
    import { Section, Register } from "flowbite-svelte-blocks";
    import { goto } from "$app/navigation";
    import { auth } from "$lib";
    import { login, authUser } from "$lib/stores/authUser.js";
    import { onAuthStateChanged } from "firebase/auth";
    import { onMount } from "svelte";

    onMount(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await login(auth.currentUser);
                if ($authUser.isAdmin) {
                    goto('/dashboard');
                } else {
                    goto('/organizations');
                }
            } else {
                goto('/login');
            }
        });

        return () => unsubscribe();
    });
</script>
<div class="flex items-center justify-center md:h-screen pt:mt-0 dark:bg-gray-900">
    <Section name="login" >
        <Register href="/">
            <svelte:fragment slot="top">
                <!--img class="w-8 h-8 mr-2" src="/images/logo.svg" alt="logo" /-->
            </svelte:fragment>
            <div class="p-6 space-y-4 md:space-y-6 sm:p-8 w-96">
                <h3 class="text-xl font-medium text-gray-900 dark:text-white p-0">GoTuk</h3>
            </div>
        </Register>
    </Section>
</div>
