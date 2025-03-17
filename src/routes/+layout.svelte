<script>
	import '../app.css';
    import {onMount} from "svelte";
    import {goto} from "$app/navigation";
    import {auth} from '$lib'
    import {login, authUser} from '$lib/stores/authUser.js'

	let { children, data } = $props();
    onMount(async () => {
        const user = await data.getAuthUser();
        const loggedIn = !!user && user?.emailVerified;
        if (!loggedIn && auth.currentUser === null) {
            await goto('/login');
        } else {
            login(await data.getFirebaseUser())
            if ($authUser.isAdmin) {
                await goto('/dashboard');
            } else {
                await goto('/guides')
            }
        }
    });
</script>
<div class="bg-gray-100">
    {@render children()}
</div>
